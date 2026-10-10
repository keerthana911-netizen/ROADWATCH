import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { analytics } from "@/lib/analytics";
import { contractorStats, previousRepair } from "@/lib/repeat";
import { prepareSearch, requestVerdict, decideSuggestion } from "@/lib/actions";
import { aiEnabled } from "@/lib/ai";
export const dynamic = "force-dynamic";
export default async function Analytics({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await searchParams;
  const d = await loadData(p.view);
  const a = analytics(d);
  const contractors = contractorStats(d.incidents, d.jobs);
  return (
    <Shell d={d} active="analytics">
      <div className="heading">
        <div>
          <span className="eyebrow">ACCOUNTABILITY, MADE VISIBLE</span>
          <h1>Insights & governance</h1>
          <p>
            Deterministic numbers. Traceable human decisions. A complete repair
            memory.
          </p>
        </div>
      </div>
      <div className="stats">
        {[
          ["Accepted incidents", a.total],
          ["Extra reports grouped", a.merged],
          [
            "Average time to close",
            a.averageClose === null ? "—" : `${a.averageClose.toFixed(1)} days`,
          ],
          [
            "AI acceptance rate",
            a.acceptance === null ? "—" : `${Math.round(a.acceptance * 100)}%`,
          ],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span className="stat-top">{label}</span>
            <strong>{value}</strong>
            <small>
              {label === "AI acceptance rate"
                ? `${a.decided} human decisions · accepted + edited / decided`
                : "Calculated from visible records"}
            </small>
          </div>
        ))}
      </div>
      <section className="panel">
        <h2>Post-repair recurrences by segment</h2>
        {d.roads
          .map((r) => ({
            r,
            count: d.incidents.filter(
              (i) =>
                i.road_segment_id === r.id &&
                previousRepair(i, d.incidents, d.jobs),
            ).length,
          }))
          .filter((x) => x.count)
          .map(({ r, count }) => (
            <div className="risk-row" key={r.id}>
              <div className="risk-top">
                <b>{r.name}</b>
                <span className="badge orange">
                  {count} post-repair recurrences
                </span>
              </div>
            </div>
          ))}
      </section>
      <section className="panel">
        <div className="panel-title">
          <h2>Contractor scorecard</h2>
          {d.role === "officer" && (
            <form action={prepareSearch}>
              <button
                className="button secondary small"
                disabled={d.demo || !aiEnabled()}
              >
                Prepare demo semantic search
              </button>
            </form>
          )}
        </div>
        {(d.demo || !aiEnabled()) && (
          <p className="notice">
            AI search and verdict drafts are unavailable here: they require a
            live Supabase workspace and an enabled AI provider. The scorecard
            and audit snapshots below remain inspectable.
          </p>
        )}
        <p>
          Numbers come from recorded repairs and later incidents. Each repair
          counts as at most one warranty failure.
        </p>
        <div className="audit-wrap">
          <table className="audit">
            <thead>
              <tr>
                <th>Contractor</th>
                <th>Recorded repairs</th>
                <th>Failures in warranty</th>
                <th>Failure rate</th>
                <th>Average days to failure</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((c) => (
                <tr key={c.name}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td>{c.jobs}</td>
                  <td>{c.failures}</td>
                  <td>{Math.round(c.rate * 100)}%</td>
                  <td>{c.avgDays === null ? "—" : c.avgDays.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d.role !== "citizen" &&
          contractors.map((c) => (
            <div className="risk-row" key={c.name}>
              <form action={requestVerdict}>
                <input type="hidden" name="contractor" value={c.name} />
                <button
                  className="button secondary small"
                  disabled={d.demo || !aiEnabled()}
                >
                  ✧ Draft a verdict for {c.name}
                </button>
              </form>
            </div>
          ))}
      </section>
      <section className="panel">
        <div className="panel-title">
          <h2>AI suggestion audit</h2>
          <span className="badge purple">ai_suggestions</span>
        </div>
        <p>
          AI never changes status, severity, grouping, or closure. Accepting a
          suggestion records a human decision; confirming facts and repairs is a
          separate officer action.
        </p>
        <div className="audit-wrap">
          <table className="audit">
            <thead>
              <tr>
                <th>Entity / kind</th>
                <th>Model & version</th>
                <th>Confidence</th>
                <th>Decision</th>
                <th>Decided by / at</th>
                <th>Input & output</th>
              </tr>
            </thead>
            <tbody>
              {d.suggestions.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.entity_type} · {s.entity_id.slice(-4)}
                    <br />
                    <b>{s.kind}</b>
                  </td>
                  <td>
                    {s.model}
                    <br />
                    {s.model_version}
                  </td>
                  <td>{Math.round(s.confidence * 100)}%</td>
                  <td>
                    <span
                      className={`badge ${s.decision === "pending" ? "orange" : "green"}`}
                    >
                      {s.decision}
                    </span>
                  </td>
                  <td>
                    {s.decided_by ?? "Awaiting human"}
                    <br />
                    {s.decided_at
                      ? new Date(s.decided_at).toLocaleString("en-IN")
                      : "—"}
                  </td>
                  <td>
                    <details>
                      <summary>Inspect snapshot</summary>
                      <pre style={{ whiteSpace: "pre-wrap", maxWidth: 350 }}>
                        {JSON.stringify(
                          { input: s.input_snapshot, output: s.output },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                    {s.decision === "pending" &&
                      s.kind === "contractor_verdict" &&
                      !d.demo &&
                      d.role !== "citizen" && (
                        <form action={decideSuggestion}>
                          <input type="hidden" name="id" value={s.id} />
                          <div className="actions">
                            <button
                              name="decision"
                              value="accepted"
                              className="button small"
                            >
                              Accept narrative
                            </button>
                            <button
                              name="decision"
                              value="rejected"
                              className="button secondary small"
                            >
                              Reject
                            </button>
                          </div>
                        </form>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.suggestions.length === 0 && (
            <p className="empty">
              No suggestions logged. Optional AI may be disabled; all core
              workflows remain available.
            </p>
          )}
        </div>
      </section>
    </Shell>
  );
}
