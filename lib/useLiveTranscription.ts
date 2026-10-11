"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TranscriptionState = "idle" | "connecting" | "listening" | "stopping";

const REALTIME_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const SUPPORTED_RATES = [8000, 16000, 22050, 24000, 44100, 48000];
// After the user stops, how long to wait for the final committed segment.
const FINAL_COMMIT_TIMEOUT_MS = 2500;

// Runs on the audio thread: converts mic samples to 16-bit PCM and posts ~100 ms chunks.
const WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = Math.round(sampleRate / 10);
    this.buf = new Int16Array(this.size);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        const s = Math.max(-1, Math.min(1, ch[i]));
        this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.n === this.size) {
          this.port.postMessage(this.buf.buffer, [this.buf.buffer]);
          this.buf = new Int16Array(this.size);
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

type Session = {
  ws: WebSocket;
  stream: MediaStream;
  audio: AudioContext;
  sampleRate: number;
  finalTimer?: ReturnType<typeof setTimeout>;
};

// Live dictation via ElevenLabs realtime speech-to-text. `onTranscript` receives the full
// transcript so far (finished segments plus the in-progress one) every time it changes.
export function useLiveTranscription(onTranscript: (text: string) => void) {
  const [state, setState] = useState<TranscriptionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const stopWaitersRef = useRef<(() => void)[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const releaseAudio = useCallback((session: Session) => {
    session.stream.getTracks().forEach((t) => t.stop());
    session.audio.close().catch(() => {});
  }, []);

  const end = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    sessionRef.current = null;
    clearTimeout(session.finalTimer);
    releaseAudio(session);
    if (session.ws.readyState <= WebSocket.OPEN) session.ws.close();
    setState("idle");
    stopWaitersRef.current.splice(0).forEach((resolve) => resolve());
  }, [releaseAudio]);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setError(null);
    setState("connecting");

    let stream: MediaStream | null = null;
    let audio: AudioContext | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const res = await fetch("/api/scribe-token", { method: "POST" });
      if (!res.ok) throw new Error("token");
      const { token } = await res.json();

      audio = new AudioContext();
      if (!SUPPORTED_RATES.includes(audio.sampleRate)) {
        await audio.close();
        audio = new AudioContext({ sampleRate: 16000 });
      }
      const sampleRate = audio.sampleRate;
      const workletUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "text/javascript" }));
      await audio.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const params = new URLSearchParams({
        model_id: "scribe_v2_realtime",
        token,
        audio_format: `pcm_${sampleRate}`,
        // Finalize a segment at each natural pause; the in-progress one streams as partials.
        commit_strategy: "vad",
      });
      const ws = new WebSocket(`${REALTIME_URL}?${params}`);
      const session: Session = { ws, stream, audio, sampleRate };
      sessionRef.current = session;

      let committed = "";
      let partial = "";
      const emit = () => onTranscriptRef.current([committed, partial].filter(Boolean).join(" "));

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.message_type === "partial_transcript") {
          partial = msg.text.trim();
          emit();
        } else if (msg.message_type === "committed_transcript") {
          const text = msg.text.trim();
          if (text) committed = committed ? `${committed} ${text}` : text;
          partial = "";
          emit();
          if (sessionRef.current === session && session.finalTimer) end();
        } else if (msg.message_type === "insufficient_audio_activity") {
          // Nothing more was said before stopping; not worth surfacing.
          if (session.finalTimer) end();
        } else if (typeof msg.error === "string") {
          setError(msg.error);
          end();
        }
      };
      ws.onerror = () => {
        setError("Lost connection to the transcription service.");
        end();
      };
      ws.onclose = () => {
        if (sessionRef.current === session) end();
      };

      await new Promise<void>((resolve, reject) => {
        ws.addEventListener("open", () => resolve(), { once: true });
        ws.addEventListener("close", () => reject(new Error("closed")), { once: true });
      });

      const source = audio.createMediaStreamSource(stream);
      const capture = new AudioWorkletNode(audio, "pcm-capture");
      capture.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (ws.readyState !== WebSocket.OPEN || session.finalTimer) return;
        ws.send(
          JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64: toBase64(event.data),
            commit: false,
            sample_rate: sampleRate,
          }),
        );
      };
      source.connect(capture);
      // The processor outputs silence; connecting it keeps the browser pulling audio through it.
      capture.connect(audio.destination);
      setState("listening");
    } catch (err) {
      if (sessionRef.current) {
        end();
      } else {
        stream?.getTracks().forEach((t) => t.stop());
        audio?.close().catch(() => {});
        setState("idle");
      }
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was blocked."
          : "Couldn't start voice input.",
      );
    }
  }, [end]);

  // Stop listening and flush the last segment. Resolves once the final text has arrived.
  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return Promise.resolve();
    const done = new Promise<void>((resolve) => stopWaitersRef.current.push(resolve));
    if (session.finalTimer) return done;
    releaseAudio(session);
    if (session.ws.readyState !== WebSocket.OPEN) {
      end();
      return done;
    }
    setState("stopping");
    // A short silent chunk with commit=true finalizes whatever is still in progress.
    const silence = new Int16Array(Math.round(session.sampleRate / 10));
    session.ws.send(
      JSON.stringify({
        message_type: "input_audio_chunk",
        audio_base_64: toBase64(silence.buffer),
        commit: true,
        sample_rate: session.sampleRate,
      }),
    );
    session.finalTimer = setTimeout(end, FINAL_COMMIT_TIMEOUT_MS);
    return done;
  }, [end, releaseAudio]);

  useEffect(() => end, [end]);

  return { state, error, start, stop };
}
