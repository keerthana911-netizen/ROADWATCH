"use client";
import { useEffect, useState } from "react";

/** Keep the download target alive while it is visible, including slow browsers. */
export function FileExport({
  text,
  filename,
  mime,
  label,
  disabled = false,
}: {
  text: string;
  filename: string;
  mime: string;
  label: string;
  disabled?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setMessage("");
    try {
      const target = URL.createObjectURL(new Blob([text], { type: mime }));
      setUrl(target);
      return () => URL.revokeObjectURL(target);
    } catch {
      setUrl("");
      setMessage(
        "Download is unavailable in this browser. Copy the preview instead.",
      );
    }
  }, [text, mime]);
  return (
    <>
      <div className="actions">
        {url && !disabled ? (
          <a
            className="button secondary small"
            href={url}
            download={filename}
            onClick={() =>
              setMessage(
                "Download requested. If your browser blocks it, use Copy export or select the preview.",
              )
            }
          >
            {label}
          </a>
        ) : (
          <button type="button" className="button secondary small" disabled>
            {label}
          </button>
        )}
        <button
          type="button"
          className="button secondary small"
          disabled={disabled}
          onClick={async () => {
            setMessage("Copying export…");
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
              await Promise.race([
                navigator.clipboard.writeText(text),
                new Promise<never>((_, reject) => {
                  timer = setTimeout(
                    () => reject(new Error("Clipboard timed out")),
                    3000,
                  );
                }),
              ]);
              setMessage("Export copied. Paste it into a file to save it.");
            } catch {
              setMessage(
                "Clipboard is unavailable. Select and copy the export preview below.",
              );
            } finally {
              if (timer) clearTimeout(timer);
            }
          }}
        >
          Copy export
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      <textarea
        aria-label={`${label} preview`}
        readOnly
        value={text}
        rows={5}
      />
    </>
  );
}
