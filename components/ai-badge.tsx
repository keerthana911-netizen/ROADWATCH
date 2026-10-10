import { decideSuggestion } from "@/lib/actions";
import type { Suggestion } from "@/lib/types";
export function AiBadge({
  suggestion: a,
  live = false,
}: {
  suggestion: Suggestion;
  live?: boolean;
}) {
  const output = a.output as {
    severity_estimate?: number;
    sensitive_hint?: string;
    reasoning?: string;
  };
  return (
    <div className="ai-box">
      <span className="badge purple">✧ AI SUGGESTION</span>
      <p>
        AI suggests:{" "}
        {(output.severity_estimate ?? 0) >= 0.7 ? "severe" : "moderate"} ·{" "}
        {output.sensitive_hint === "none"
          ? "no sensitive location identified"
          : `near ${output.sensitive_hint}`}{" "}
        · {Math.round(a.confidence * 100)}%
      </p>
      <p>{output.reasoning}</p>
      {a.decision === "pending" && live ? (
        <>
          <form action={decideSuggestion} className="actions">
            <input type="hidden" name="id" value={a.id} />
            <button className="button small" name="decision" value="accepted">
              Accept for confirmation
            </button>
            <button
              className="button secondary small"
              name="decision"
              value="rejected"
            >
              Reject
            </button>
          </form>
          <details>
            <summary style={{ marginTop: 12, cursor: "pointer" }}>
              Edit suggestion
            </summary>
            <form action={decideSuggestion}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="decision" value="edited" />
              <label>
                Severity estimate
                <input
                  name="severity"
                  type="number"
                  min="0"
                  max="1"
                  step=".01"
                  defaultValue={output.severity_estimate}
                />
              </label>
              <label>
                Location hint
                <select
                  name="sensitive_hint"
                  defaultValue={output.sensitive_hint}
                >
                  <option value="none">None</option>
                  <option value="school">School</option>
                  <option value="hospital">Hospital</option>
                </select>
              </label>
              <label>
                Correction reason
                <input name="reason" required minLength={5} maxLength={300} />
              </label>
              <button className="button small">Save human edit</button>
            </form>
          </details>
        </>
      ) : (
        <small>
          {a.decision === "pending"
            ? "Demo suggestion · decisions available after Supabase setup"
            : `${a.decision} · human decision recorded`}
        </small>
      )}
      <p className="breakdown">
        A suggestion only. Assignment still requires officer confirmation.
      </p>
    </div>
  );
}
