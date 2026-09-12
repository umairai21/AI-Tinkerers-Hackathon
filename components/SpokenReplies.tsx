"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";

// Silent 1-sample WAV, used to "unlock" audio playback on the first user gesture
// so later programmatic .play() calls (triggered async, well after any click)
// aren't blocked by the browser's autoplay policy.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .trim();
}

// Speaks every assistant reply aloud (via ElevenLabs TTS), regardless of whether
// the customer typed or used push-to-talk. CopilotKit's built-in push-to-talk
// only speaks replies to voice-initiated messages, so this widens it to every turn.
//
// Note: neither useCopilotChat()'s `visibleMessages` nor useCopilotMessagesContext()
// reflect this app's actual chat state in the installed @copilotkit/react-core
// version — both are empty/undefined. The real message store lives on the AG-UI
// `agent` object, reached via useAgent() from the /v2 subpath (same underlying
// registry as the v1 <CopilotKit> provider we use elsewhere in the app).
export function SpokenReplies() {
  const { agent } = useAgent({ agentId: "default" });
  const isLoading = Boolean(agent?.isRunning);
  const lastSpokenIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasLoadingRef = useRef(false);
  const unlockedRef = useRef(false);

  // Unlock audio playback on the first click/keypress anywhere in the panel,
  // so the later async .play() call (after the LLM finishes responding) isn't
  // silently blocked by the browser's autoplay policy.
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      const primer = new Audio(SILENT_WAV);
      primer.play().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const justFinished = wasLoadingRef.current && !isLoading;
    const messages = agent?.messages ?? [];
    console.log("[SpokenReplies] effect run", { isLoading, justFinished, count: messages.length });
    wasLoadingRef.current = isLoading;
    if (!justFinished) return;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      console.log("[SpokenReplies] checking message", i, message);
      if (message.role !== "assistant") break;
      if (message.id === lastSpokenIdRef.current) break;
      const content = typeof message.content === "string" ? message.content : "";
      const text = stripMarkdown(content);
      if (!text) break;

      console.log("[SpokenReplies] speaking:", text.slice(0, 80));
      lastSpokenIdRef.current = message.id;
      audioRef.current?.pause();
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
      audioRef.current = audio;
      audio
        .play()
        .then(() => console.log("[SpokenReplies] playback started"))
        .catch((err) => console.error("[SpokenReplies] playback failed:", err));
      break;
    }
  }, [isLoading, agent?.messages]);

  return null;
}
