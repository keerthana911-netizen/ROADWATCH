import Link from "next/link";
import { notFound } from "next/navigation";
import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { Timeline } from "@/components/timeline";
import { priority } from "@/lib/priority";
import { previousRepair, warrantyMessage } from "@/lib/repeat";
import { riskScore } from "@/lib/risk";
import {
  assignRepair,
  markRepaired,
  verifyRepair,
  briefIncident,
  decideSuggestion,
} from "@/lib/actions";
import { aiEnabled } from "@/lib/ai";
import { AiBadge } from "@/components/ai-badge";
import { ReportPhoto } from "@/components/report-photo";
export const dynamic = "force-dynamic";
export default async function IncidentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const p = await searchParams;
  const d = await loadData(p.view, { type: "incident", id });
  const view = d.demo && d.role !== "officer" ? `?view=${d.role}` : "";
  const i = d.incidents.find((i) => i.id === id);
  if (!i) notFound();
  const road = d.roads.find((r) => r.id === i.road_segment_id);
  const job = d.jobs.find((j) => j.incident_id === id);
  const prior = previousRepair(i, d.incidents, d.jobs);
  const score = priority(i.severity, i.sensitive_location, i.opened_at);
  const reports = d.reports.filter((r) => r.incident_id === id);
  const proposals =
    d.demo || aiEnabled()
      ? d.suggestions.filter(
          (a) =>
            reports.some((r) => r.id === a.entity_id) &&
            a.kind === "photo_triage",
        )
      : [];
  const accepted = proposals.find((a) =>
    ["accepted", "edited"].includes(a.decision),
  );
  const brief = d.suggestions.find(
    (a) => a.entity_id === id && a.kind === "incident_brief",
  );
  const risk = riskScore(i.road_segment_id, d.incidents, d.jobs);
  return (
    <Shell d={d}>
      <Link href={`/${view}`} className="mini-link">
        ← Repair queue
      </Link>
      <div className="heading" style={{ marginTop: 20 }}>
        <div>
          <span className="eyebrow">REPAIR JOB · {id.slice(-4)}</span>
          <h1>{road?.name}</h1>
          <p>
            {reports.length} linked reports · opened{" "}
            {new Date(i.opened_at).toLocaleDateString("en-IN")}
          </p>
        </div>
        <span className="badge orange">
          {i.status.replaceAll("_", " ").toUpperCase()}
        </span>
      </div>
      {prior && (
        <div className="warranty">
          <b>Repair memory · inspection flag</b>
          <br />
          {warrantyMessage(i, prior) ??
            "A new incident was recorded after an earlier repair."}
        </div>
      )}
      <div className="grid-main">
        <div>
          <section className="panel">
            <div className="panel-title">
              <h2>Grouped citizen reports</h2>
              <span className="badge">PERMANENT TICKETS</span>
            </div>
            {reports.map((r) => (
              <article className="report-card" key={r.id}>
                <Link href={`/tickets/${r.id}`} className="mini-link">
                  {r.ticket_id} →
                </Link>
                <p>{r.note}</p>
                {r.photo_url && <ReportPhoto id={r.id} url={r.photo_url} />}
                <small>
                  {new Date(r.created_at).toLocaleDateString("en-IN")} ·{" "}
                  {r.location_source}
                </small>
                {proposals
                  .filter((a) => a.entity_id === r.id)
                  .map((a) => (
                    <AiBadge
                      key={a.id}
                      suggestion={a}
                      live={!d.demo && d.role === "officer"}
                    />
                  ))}
              </article>
            ))}
          </section>
          {d.role !== "citizen" && (
            <section className="panel">
              <div className="panel-title">
                <h2>Incident brief</h2>
                <form action={briefIncident}>
                  <input type="hidden" name="id" value={id} />
                  <button
                    className="button secondary small"
                    disabled={d.demo || !aiEnabled()}
                  >
                    ✧ Brief me
                  </button>
                </form>
              </div>
              {brief ? (
                <div className="ai-box">
                  <b>AI draft · {brief.decision}</b>
                  <ul>
                    {(brief.output.bullets as string[]).map((b, n) => (
                      <li key={n} style={{ marginBottom: 10 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                  {brief.decision === "pending" && !d.demo && (
                    <form action={decideSuggestion}>
                      <input type="hidden" name="id" value={brief.id} />
                      <div className="actions">
                        <button
                          name="decision"
                          value="accepted"
                          className="button small"
                        >
                          Accept brief
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
                </div>
              ) : (
                <p style={{ fontSize: 12 }}>
                  An on-demand, three-bullet summary of reports, status history,
                  and earlier repairs.{" "}
                  {aiEnabled()
                    ? "Generate when needed."
                    : "Optional AI is currently unavailable."}
                </p>
              )}
            </section>
          )}
          <section className="panel">
            <h2>Repair job</h2>
            {d.demo && (
              <div className="notice">
                Shared demo records are read only. Assignment, repair uploads
                and reviewer decisions require a live account.
                <br />
                <Link href="/try" className="mini-link">
                  Practice all repair actions →
                </Link>
              </div>
            )}
            {job ? (
              <>
                <div className="row-meta">
                  <span>
                    Owner:{" "}
                    {d.officers.find((o) => o.id === job.owner)?.name ??
                      "Ward officer"}
                  </span>
                  <span>Due: {job.due_date}</span>
                </div>
                <p>
                  {job.contractor_name ?? "Municipal team"} ·{" "}
                  {job.warranty_days}-day warranty
                </p>
                {job.photo_url && (
                  <figure className="evidence-photo">
                    <img
                      src={job.photo_url}
                      alt="Repair after-photo"
                      className="photo"
                    />
                    {job.photo_url === "/demo-repair.png" && (
                      <figcaption>
                        <b>Demo repair illustration</b>
                        <span>This is not a verified repair photograph.</span>
                      </figcaption>
                    )}
                  </figure>
                )}
                {job.repaired_at && (
                  <p>
                    Repaired{" "}
                    {new Date(job.repaired_at).toLocaleDateString("en-IN")} ·{" "}
                    {job.verified_at
                      ? "reviewer verified"
                      : "awaiting verification"}
                  </p>
                )}
              </>
            ) : (
              <p>No repair job assigned yet.</p>
            )}
            {d.role === "officer" &&
              ["open", "assigned"].includes(i.status) && (
                <>
                  <h3>Confirm facts & assign</h3>
                  {accepted && (
                    <p className="ai-box">
                      A human accepted or edited a suggestion. Fields are
                      prefilled below; confirm them with your own written
                      reason.
                    </p>
                  )}
                  <form action={assignRepair}>
                    <input type="hidden" name="id" value={id} />
                    <div className="form-grid">
                      <label>
                        Confirmed severity (0–1)
                        <input
                          name="severity"
                          type="number"
                          min="0"
                          max="1"
                          step=".01"
                          required
                          defaultValue={Number(
                            accepted?.output.severity_estimate ?? i.severity,
                          )}
                        />
                      </label>
                      <label>
                        Owner
                        <select
                          name="owner"
                          required
                          defaultValue={job?.owner ?? d.userId}
                        >
                          {d.officers.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      <input
                        name="sensitive"
                        type="checkbox"
                        defaultChecked={
                          accepted
                            ? accepted.output.sensitive_hint !== "none"
                            : i.sensitive_location
                        }
                      />
                      Confirmed sensitive location (school or hospital)
                    </label>
                    <div className="form-grid">
                      <label>
                        Due date
                        <input
                          type="date"
                          name="due"
                          defaultValue={job?.due_date}
                          required
                        />
                      </label>
                      <label>
                        Warranty (days)
                        <input
                          type="number"
                          name="warranty"
                          min="1"
                          max="3650"
                          defaultValue={job?.warranty_days ?? 90}
                          required
                        />
                      </label>
                    </div>
                    <label>
                      Contractor name
                      <input
                        name="contractor"
                        maxLength={200}
                        defaultValue={job?.contractor_name ?? ""}
                      />
                    </label>
                    <label>
                      Confirmation / override reason
                      <textarea
                        name="reason"
                        required
                        minLength={5}
                        maxLength={2000}
                        placeholder="Explain confirmed severity, sensitive location, and any override of the defaults."
                      />
                    </label>
                    <button className="button" disabled={d.demo}>
                      Confirm & assign repair
                    </button>
                  </form>
                </>
              )}
            {d.role === "officer" && i.status === "assigned" && (
              <form action={markRepaired} style={{ marginTop: 25 }}>
                <h3>Record completed repair</h3>
                <input type="hidden" name="id" value={id} />
                <label>
                  Required after-photo
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    required
                  />
                </label>
                <label>
                  Repair note
                  <textarea
                    name="reason"
                    required
                    minLength={5}
                    maxLength={2000}
                  />
                </label>
                <button className="button" disabled={d.demo}>
                  Send for reviewer verification
                </button>
              </form>
            )}
            {d.role === "reviewer" &&
              i.status === "repaired_pending_review" && (
                <form action={verifyRepair}>
                  <input type="hidden" name="id" value={id} />
                  <label>
                    Verification findings
                    <textarea
                      name="reason"
                      minLength={5}
                      maxLength={2000}
                      required
                    />
                  </label>
                  <div className="actions">
                    <button
                      className="button"
                      name="approved"
                      value="yes"
                      disabled={d.demo || !job?.photo_url}
                    >
                      Verify & close
                    </button>
                    <button
                      className="button secondary"
                      name="approved"
                      value="no"
                      disabled={d.demo}
                    >
                      Return to officer
                    </button>
                  </div>
                  <p className="section-note">
                    Closure is blocked without an uploaded after-photo and
                    reviewer verification, in both the Server Action and
                    database.
                  </p>
                </form>
              )}
          </section>
          <section className="panel">
            <h2>Status history</h2>
            <div style={{ marginTop: 22 }}>
              <Timeline
                events={d.events.filter(
                  (e) => e.entity_type === "incident" && e.entity_id === id,
                )}
              />
            </div>
          </section>
        </div>
        <aside>
          <section className="panel">
            <h2>Priority audit</h2>
            <strong
              style={{ fontSize: 44, display: "block", margin: "15px 0" }}
            >
              {score.score}
            </strong>
            <p>
              Severity: 50 × {i.severity} ={" "}
              {score.components.severity.toFixed(1)}
              <br />
              Sensitive location: {score.components.sensitive}
              <br />
              Waiting: {score.days.toFixed(1)} days →{" "}
              {score.components.waiting.toFixed(1)}
            </p>
            <p className="section-note">
              Sum rounded to the nearest integer. Report volume never changes
              this score.
            </p>
          </section>
          <section className="panel">
            <h2>Road history</h2>
            {d.incidents
              .filter((x) => x.road_segment_id === i.road_segment_id)
              .sort((a, b) => Date.parse(b.opened_at) - Date.parse(a.opened_at))
              .map((x) => (
                <div className="risk-row" key={x.id}>
                  <Link
                    href={`/incidents/${x.id}${view}`}
                    className="mini-link"
                  >
                    {new Date(x.opened_at).toLocaleDateString("en-IN")} →
                  </Link>
                  <p style={{ fontSize: 12, margin: "5px 0" }}>
                    {x.status.replaceAll("_", " ")}
                  </p>
                  {d.jobs
                    .filter((j) => j.incident_id === x.id)
                    .map((j) => (
                      <small key={j.id}>
                        {j.contractor_name ?? "Municipal team"} ·{" "}
                        {j.warranty_days}-day warranty
                      </small>
                    ))}
                </div>
              ))}
          </section>
          <section className="panel">
            <h2>30-day risk outlook</h2>
            <p>
              <span className="badge orange">
                {risk.label} · {risk.score}
              </span>
            </p>
            <p className="breakdown">
              {risk.model}. Not a calibrated probability.
            </p>
            {risk.contributions.map((c) => (
              <div className="risk-row" key={c.feature}>
                <b style={{ fontSize: 11 }}>{c.feature}</b>
                <p style={{ fontSize: 11, margin: 4 }}>
                  {c.value} · contribution {c.contribution.toFixed(3)}
                </p>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </Shell>
  );
}
