"use client";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const updated =
    /dynamically imported module|loading chunk|chunkloaderror/i.test(
      error.message,
    );
  return (
    <main className="main wide">
      <div className="panel">
        <h1>
          {updated
            ? "A site update is ready."
            : "That action couldn’t be completed."}
        </h1>
        <p>
          {updated
            ? "This tab is using an earlier version. Reload to get the current site; saved practice tickets stay in this browser."
            : "Check your connection, session, required photos and reasons, then try again. If the problem continues, return to the overview."}
        </p>
        <div className="actions">
          <button
            className="button"
            onClick={() => (updated ? window.location.reload() : reset())}
          >
            {updated ? "Reload updated site" : "Try again"}
          </button>
          <a href="/" className="button secondary">
            Return to overview
          </a>
        </div>
      </div>
    </main>
  );
}
