"use client";
import { useState, useTransition } from "react";
import { voiceParse, voiceDecision } from "@/lib/voice-actions";
type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
};
export function VoiceNote() {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<{
    id: string;
    note: string;
    landmark: string;
    severity_hint: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  function speak() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Constructor) {
      setMessage(
        "Speech recognition is unavailable in this browser. Type your note below.",
      );
      return;
    }
    const recognition = new Constructor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setNote(transcript);
      setMessage("Transcribed. Review the text before submitting.");
      startTransition(async () => {
        const result = await voiceParse(transcript);
        if (result) setProposal(result);
      });
    };
    recognition.onerror = (e) =>
      setMessage(`Speech unavailable (${e.error}). You can type your note.`);
    recognition.start();
    setMessage("Listening…");
  }
  return (
    <>
      <label>
        Tell us what you noticed
        <textarea
          name="note"
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For example: deep pothole outside the college gate…"
        />
      </label>
      <button
        type="button"
        className="button secondary small"
        onClick={speak}
        disabled={pending}
      >
        ♩ Speak your note
      </button>
      <p className="breakdown">
        Browser speech recognition may use your browser provider’s transcription
        service.
      </p>
      {message && <p role="status">{message}</p>}
      {proposal && (
        <div className="ai-box">
          <b>AI parsed note · review before use</b>
          <p>{proposal.note}</p>
          <p>
            Landmark: {proposal.landmark || "not specified"} · hint:{" "}
            {proposal.severity_hint}
          </p>
          <div className="actions">
            <button
              type="button"
              className="button small"
              onClick={() =>
                startTransition(async () => {
                  await voiceDecision(proposal.id, "accepted", proposal.note);
                  setNote(proposal.note);
                  setProposal(null);
                })
              }
            >
              Use this note
            </button>
            <button
              type="button"
              className="button secondary small"
              onClick={() =>
                startTransition(async () => {
                  await voiceDecision(proposal.id, "rejected", proposal.note);
                  setProposal(null);
                })
              }
            >
              Keep my words
            </button>
          </div>
        </div>
      )}
    </>
  );
}
