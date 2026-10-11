"use client";

import { useEffect, useRef, useState } from "react";
import { useChatContext, type InputProps } from "@copilotkit/react-ui";
import { useLiveTranscription } from "@/lib/useLiveTranscription";

const MAX_ROWS = 6;

// Replaces CopilotKit's default chat input to add live dictation: while the mic is on,
// the transcript streams into the text box. Nothing is sent until the user presses Enter
// (or the send button), so they can review or edit what was heard first.
export function ChatInput({ inProgress, onSend, chatReady = false, onStop, onUpload, hideStopButton = false }: InputProps) {
  const context = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setTextState] = useState("");
  // Mirrors `text` so a send that waits for dictation to finish reads the final transcript.
  const textRef = useRef("");
  const setText = (value: string) => {
    textRef.current = value;
    setTextState(value);
  };
  const [isComposing, setIsComposing] = useState(false);
  // Text typed before the mic was switched on; the transcript is appended after it.
  const prefixRef = useRef("");

  const mic = useLiveTranscription((transcript) => setText(prefixRef.current + transcript));
  const dictating = mic.state !== "idle";

  const canSend = !inProgress && chatReady && (text.trim().length > 0 || mic.state === "listening");
  const canStop = inProgress && !hideStopButton;

  // Enter or the send button. Mid-dictation, it finishes transcribing first, then sends.
  const submit = async () => {
    if (inProgress || !chatReady || mic.state === "connecting" || mic.state === "stopping") return;
    if (mic.state === "listening") await mic.stop();
    const message = textRef.current;
    if (!message.trim()) return;
    onSend(message);
    setText("");
    textareaRef.current?.focus();
  };

  const toggleMic = () => {
    if (mic.state === "idle") {
      prefixRef.current = text.trim() ? `${text.trim()} ` : "";
      mic.start();
    } else {
      mic.stop();
    }
  };

  // Grow with the content up to MAX_ROWS, then scroll.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    textarea.style.height = `${Math.min(textarea.scrollHeight, lineHeight * MAX_ROWS)}px`;
  }, [text]);

  const micLabel =
    mic.state === "connecting" ? "Starting microphone" : dictating ? "Stop voice input" : "Start voice input";

  return (
    <div className="copilotKitInputContainer">
      {(dictating || mic.error) && (
        <p className={`px-4 pb-1 text-xs ${mic.error ? "text-red-600" : "text-slate-500"}`}>
          {mic.error ??
            (mic.state === "connecting"
              ? "Starting microphone..."
              : mic.state === "stopping"
                ? "Finishing..."
                : "Listening... press Enter to send, or click the mic to stop and edit.")}
        </p>
      )}
      <div
        className="copilotKitInput"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest("button") && target.tagName !== "TEXTAREA") textareaRef.current?.focus();
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          readOnly={dictating}
          placeholder={dictating ? "Speak now..." : context.labels.placeholder}
          data-testid="copilot-chat-textarea"
          style={{ overflow: "auto", resize: "none" }}
          onChange={(e) => setText(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || isComposing) return;
            e.preventDefault();
            submit();
          }}
        />
        <div className="copilotKitInputControls">
          {onUpload && (
            <button onClick={onUpload} className="copilotKitInputControlButton" aria-label="Attach a photo">
              {context.icons.uploadIcon}
            </button>
          )}
          <div style={{ flexGrow: 1 }} />
          {!inProgress && (
            <button
              onClick={toggleMic}
              disabled={mic.state === "connecting" || mic.state === "stopping"}
              aria-label={micLabel}
              aria-pressed={dictating}
              title={micLabel}
              className={
                mic.state === "listening"
                  ? "copilotKitInputControlButton copilotKitPushToTalkRecording"
                  : "copilotKitInputControlButton"
              }
            >
              {context.icons.pushToTalkIcon}
            </button>
          )}
          <button
            disabled={!canSend && !canStop}
            onClick={canStop ? onStop : submit}
            data-testid="copilot-send-button"
            className="copilotKitInputControlButton"
            aria-label={!chatReady ? "Loading" : canStop ? "Stop" : "Send"}
          >
            {!chatReady ? context.icons.spinnerIcon : canStop ? context.icons.stopIcon : context.icons.sendIcon}
          </button>
        </div>
      </div>
    </div>
  );
}
