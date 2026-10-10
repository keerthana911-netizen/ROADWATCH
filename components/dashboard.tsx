import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  GitMerge,
  ShieldCheck,
  History,
  Plus,
  MapPin,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { Dataset, Incident } from "@/lib/types";
import { priority, overdue } from "@/lib/priority";
import { repeatSegments, previousRepair, warrantyMessage } from "@/lib/repeat";
import { riskScore } from "@/lib/risk";
import { analytics } from "@/lib/analytics";
import { mergeCandidate, distanceMeters } from "@/lib/merge";
import { groupReport, findDuplicates, confirmDuplicate } from "@/lib/actions";
import { AiBadge } from "./ai-badge";
import { IncidentMap } from "./incident-map";
import { JudgeTour } from "./judge-tour";
import roadNetwork from "@/data/chennai-roads.json";
import { operationSummary, repairQueue } from "@/lib/operations";
import { OperationsPulse } from "./operations-pulse";
import { QueueExport } from "./queue-export";
export function Dashboard({
  d,
  filter = "all",
  ai = false,
  q = "",
  sort = "priority",
  status = "all",
}: {
  d: Dataset;
  filter?: string;
  ai?: boolean;
  q?: string;
  sort?: string;
  status?: string;
}) {
  const now = new Date();
  const repeats = repeatSegments(d.incidents, d.jobs, now);
  const metrics = analytics(d);
  const open = d.incidents.filter((i) => i.status !== "closed");
  const overdueCount = open.filter((i) => {
    const j = d.jobs.find((j) => j.incident_id === i.id);
    return j && overdue(j.due_date, i.status, now);
  }).length;
  const queue = repairQueue(d, { filter, q, sort, status }, now);
  const operations = operationSummary(d, now);
  const memory = open.find((i) => repeats.includes(i.road_segment_id));
  const prior = memory ? previousRepair(memory, d.incidents, d.jobs) : null;
  const road = (id: string) =>
    d.roads.find((r) => r.id === id)?.name ?? "Road segment";
  const suffix = d.demo && d.role !== "officer" ? `&view=${d.role}` : "";
  const risks = d.roads
    .map((r) => ({ road: r, risk: riskScore(r.id, d.incidents, d.jobs, now) }))
    .sort((a, b) => b.risk.score - a.risk.score);
  const suggestions = d.demo || ai ? d.suggestions : [];
  const groupedIncident = d.incidents.find(
    (i) => d.reports.filter((r) => r.incident_id === i.id).length >= 5,
  );
  return (
    <>
      <div className="heading dashboard-heading">
        <div>
          <span className="eyebrow">ROADWATCH / CITY OPERATIONS</span>
          <h1>
            {d.role === "citizen"
              ? "Your voice. Better roads."
              : d.role === "reviewer"
                ? "Verify the work. Keep the memory."
                : "Fix roads. Keep promises."}
          </h1>
          <p>
            {d.role === "officer"
              ? "Prioritize the right repairs. Keep every citizen in the loop."
              : "From the first report to verified repair, every step stays visible."}
          </p>
        </div>
        {d.role === "citizen" ? (
          <Link className="button" href="/report">
            <Plus size={16} />
            Report a pothole
          </Link>
        ) : (
          <Link className="button" href={`/?filter=review${suffix}`}>
            <ShieldCheck size={15} />
            Review repairs <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
      {d.demo && (
        <div className="practice-invite">
          <div>
            <b>Try a repair from start to finish.</b>
            <p>
              Create a practice ticket, assign the work, add evidence and verify
              closure. Saved on your device.
            </p>
          </div>
          <Link href="/try" className="button">
            Try the complete flow →
          </Link>
        </div>
      )}
      <section
        className="mission-banner"
        aria-label="Repair memory and demo walkthrough"
      >
        <div className="mission-copy">
          <span className="eyebrow">THE ROAD REMEMBERS</span>
          <h2>
            A complaint ends.
            <br />
            Accountability doesn’t.
          </h2>
          <p>
            One repair job. Every citizen’s ticket. A history that catches the
            next failure.
          </p>
          <div className="actions">
            <JudgeTour
              groupedHref={
                groupedIncident
                  ? `/incidents/${groupedIncident.id}`
                  : "/tickets"
              }
              memoryHref={
                memory ? `/incidents/${memory.id}` : "/?filter=repeat"
              }
            />
            <Link href="/roads" className="mission-source">
              Explore {roadNetwork.ways.length} real road segments{" "}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="mission-visual" aria-hidden="true">
          <svg viewBox="0 0 360 190" fill="none">
            <path
              d="M0 150h110q30 0 30-30V65q0-30 30-30h190M0 165h110q45 0 45-45V65q0-15 15-15h190"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M0 110h90q30 0 30-30V0M210 190V85q0-20 20-20h130M0 25h75q20 0 20 20v145"
              stroke="currentColor"
              strokeOpacity=".25"
              strokeWidth="2"
            />
            <circle cx="139" cy="117" r="22" fill="#163e42" stroke="#98f4c3" />
            <path d="m131 117 6 6 12-12" stroke="#98f4c3" strokeWidth="3" />
            <circle cx="266" cy="43" r="9" fill="#f4a24c" />
            <circle
              cx="266"
              cy="43"
              r="19"
              stroke="#f4a24c"
              strokeOpacity=".4"
            />
            <path d="M157 107h62" stroke="#98f4c3" strokeDasharray="4 5" />
          </svg>
          <span className="mission-proof">
            <ShieldCheck size={14} />
            Human verified. Always.
          </span>
        </div>
      </section>
      <div className="workflow-strip" aria-label="Repair workflow">
        {[
          ["01", "Report", "A permanent citizen ticket"],
          ["02", "Confirm", "An officer groups the evidence"],
          ["03", "Repair", "A dated job and after-photo"],
          ["04", "Verify", "A reviewer confirms the work"],
        ].map(([n, title, detail]) => (
          <div key={n}>
            <span>{n}</span>
            <div>
              <b>{title}</b>
              <small>{detail}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="stats">
        {[
          {
            label: "Active incidents",
            value: open.length,
            note: `${d.reports.length} citizen reports · one shared repair memory`,
            Icon: AlertTriangle,
          },
          {
            label: "Verified repairs",
            value: d.incidents.filter((i) => i.status === "closed").length,
            note: "Closed only after reviewer confirmation",
            Icon: ShieldCheck,
          },
          {
            label: "Reports grouped",
            value: metrics.merged,
            note: "Duplicate reports, fewer repair jobs",
            Icon: GitMerge,
          },
          {
            label: "Repeat segments",
            value: repeats.length,
            note: "Recurring failures flagged for inspection",
            Icon: History,
          },
        ].map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-top">
              <span>{s.label}</span>
              <span className="stat-icon">
                <s.Icon size={16} />
              </span>
            </div>
            <strong>
              {s.value}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#8b977f",
                  marginLeft: 12,
                }}
              >
                {s.label === "Repeat segments" ? "needs attention" : ""}
              </span>
            </strong>
            <small>{s.note}</small>
          </div>
        ))}
      </div>
      <OperationsPulse data={operations} demo={d.demo} role={d.role} />
      <div className="grid-main">
        <div>
          <section className="panel" id="repair-queue">
            <div className="panel-title">
              <div>
                <h2>
                  {d.role === "reviewer"
                    ? "Verification & repair queue"
                    : "Repair priority queue"}
                </h2>
                <p style={{ fontSize: 11, margin: "6px 0 0" }}>
                  Ranked by impact and waiting time. Every score is explainable.
                </p>
              </div>
              <QueueExport
                demo={d.demo}
                rows={queue.map((i) => {
                  const job = d.jobs.find((j) => j.incident_id === i.id);
                  return {
                    road: road(i.road_segment_id),
                    status: i.status,
                    priority: priority(
                      i.severity,
                      i.sensitive_location,
                      i.opened_at,
                      now,
                    ).score,
                    opened: i.opened_at,
                    due: job?.due_date ?? "",
                    contractor: job?.contractor_name ?? "",
                    reports: d.reports.filter((r) => r.incident_id === i.id)
                      .length,
                    incident: i.id,
                  };
                })}
              />
            </div>
            <form
              key={`${q}-${status}-${sort}-${filter}`}
              className="queue-tools"
              action="/"
              method="get"
            >
              <input type="hidden" name="filter" value={filter} />
              {d.demo && <input type="hidden" name="view" value={d.role} />}
              <label>
                Search queue
                <input
                  type="search"
                  name="q"
                  maxLength={200}
                  defaultValue={q}
                  placeholder="Road, ticket, or contractor"
                />
              </label>
              <label>
                Status
                <select name="status" defaultValue={status}>
                  <option value="all">All active statuses</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="repaired_pending_review">
                    Awaiting review
                  </option>
                </select>
              </label>
              <label>
                Sort by
                <select name="sort" defaultValue={sort}>
                  <option value="priority">Highest priority</option>
                  <option value="oldest">Oldest first</option>
                  <option value="due">Earliest due date</option>
                </select>
              </label>
              <button className="button small">
                <SlidersHorizontal size={14} /> Apply
              </button>
            </form>
            <div className="queue-result">
              <span>Matching jobs: {queue.length}</span>
              {(q || status !== "all" || sort !== "priority") && (
                <Link
                  className="mini-link"
                  href={`/?filter=${filter}${suffix}#repair-queue`}
                >
                  Reset search & sort
                </Link>
              )}
            </div>
            <div className="tabs">
              {[
                ["all", `All active (${open.length})`],
                ["overdue", `Overdue (${overdueCount})`],
                ["repeat", "Repeat failures"],
                ["review", "Awaiting review"],
              ].map(([key, title]) => (
                <Link
                  key={key}
                  href={`/?filter=${key}${suffix}`}
                  className={filter === key ? "active" : ""}
                >
                  {title}
                </Link>
              ))}
            </div>
            {queue.length ? (
              queue.map((i) => <IncidentRow key={i.id} i={i} d={d} now={now} />)
            ) : (
              <p className="empty">No incidents in this queue.</p>
            )}
            <div className="section-note" style={{ marginTop: 15 }}>
              <ShieldCheck
                size={12}
                style={{ display: "inline", marginRight: 6 }}
              />
              Priority = 50 × severity + 30 × sensitive location + 20 × waiting
              fraction. Report count never affects priority.
            </div>
          </section>
          <section className="panel" id="new-reports">
            <div className="panel-title">
              <h2>
                New citizen reports{" "}
                <span className="badge">
                  {d.reports.filter((r) => !r.incident_id).length} NEW
                </span>
              </h2>
              <span className="mini-link">Human confirmation required</span>
            </div>
            {d.reports
              .filter((r) => !r.incident_id)
              .map((r) => {
                const matches = d.incidents.filter((i) => mergeCandidate(r, i));
                const a = suggestions.find(
                  (a) => a.entity_id === r.id && a.kind === "photo_triage",
                );
                const duplicates = suggestions.filter(
                  (a) =>
                    a.entity_id === r.id &&
                    a.kind === "dup_match" &&
                    a.decision === "pending",
                );
                return (
                  <article key={r.id} className="report-card">
                    <div className="row-title">
                      <h3>{road(r.road_segment_id)}</h3>
                      <span className="badge">{r.ticket_id}</span>
                      <span className="badge green">NEW REPORT</span>
                    </div>
                    <p>{r.note}</p>
                    <div className="row-meta">
                      <span>
                        <MapPin size={11} style={{ display: "inline" }} />{" "}
                        {r.location_source === "gps"
                          ? "GPS location"
                          : "Manual map pin"}
                      </span>
                      <span>
                        Submitted{" "}
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {a && (
                      <AiBadge
                        suggestion={a}
                        live={!d.demo && d.role === "officer"}
                      />
                    )}
                    <p className="section-note">
                      {matches.length
                        ? `Rule suggests ${road(matches[0].road_segment_id)}: ${Math.round(distanceMeters(r, matches[0]))} m away, same road, within 7 days. Officer must confirm.`
                        : "No match meets all three rules: same road, within 20 m, within 7 days. Create a separate incident."}
                    </p>
                    {d.role === "officer" && !d.demo && (
                      <>
                        <form action={groupReport}>
                          <input type="hidden" name="id" value={r.id} />
                          <label>
                            Officer grouping decision
                            <select name="match">
                              <option value="">Create separate incident</option>
                              {d.incidents
                                .filter(
                                  (i) =>
                                    i.road_segment_id === r.road_segment_id &&
                                    ["open", "assigned"].includes(i.status),
                                )
                                .map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {road(i.road_segment_id)} ·{" "}
                                    {Math.round(distanceMeters(r, i))} m ·{" "}
                                    {matches.includes(i)
                                      ? "rule candidate"
                                      : "outside rule — human override"}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label>
                            Confirmation reason
                            <input
                              name="reason"
                              required
                              minLength={5}
                              maxLength={2000}
                              placeholder="Explain why these reports concern the same pothole, or why they stay separate."
                            />
                          </label>
                          <button className="button small">
                            Confirm grouping decision
                          </button>
                        </form>
                        {ai && (
                          <form
                            action={findDuplicates}
                            style={{ marginTop: 12 }}
                          >
                            <input type="hidden" name="id" value={r.id} />
                            <button className="button secondary small">
                              <Sparkles size={13} />
                              Find semantic duplicates
                            </button>
                          </form>
                        )}
                      </>
                    )}
                    {duplicates.map((a) => (
                      <div key={a.id} className="ai-box">
                        <b>
                          Possibly the same pothole as{" "}
                          {String(a.output.ticket_id)}
                        </b>
                        <p>
                          {Math.round(Number(a.output.similarity) * 100)}%
                          semantic match ·{" "}
                          {Math.round(Number(a.output.distance_m))} m away ·{" "}
                          {Number(a.output.days_apart).toFixed(1)} days apart
                        </p>
                        {!d.demo && d.role === "officer" && (
                          <form action={confirmDuplicate}>
                            <input
                              type="hidden"
                              name="suggestion"
                              value={a.id}
                            />
                            <label>
                              Human decision reason
                              <input name="reason" minLength={5} required />
                            </label>
                            <div className="actions">
                              <button
                                name="choice"
                                value="merge"
                                className="button small"
                              >
                                Merge
                              </button>
                              <button
                                name="choice"
                                value="separate"
                                className="button secondary small"
                              >
                                Keep separate
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </article>
                );
              })}
            {!d.reports.some((r) => !r.incident_id) && (
              <p className="empty">All reports have been reviewed.</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Ward at a glance</h2>
              <span className="badge">
                <MapPin size={11} /> OPENSTREETMAP
              </span>
            </div>
            <IncidentMap
              incidents={open}
              roads={d.roads}
              view={suffix.replace("&", "?")}
            />
            <p className="breakdown">
              Markers show accepted incidents; nearby reports never merge
              automatically.
            </p>
          </section>
          {d.notes.length > 0 && (
            <section className="panel">
              <h2>
                Citizen follow-up notes{" "}
                <span className="badge orange">OFFICER INBOX</span>
              </h2>
              {d.notes.map((n) => (
                <div key={n.id} className="report-card">
                  <Link href={`/tickets/${n.report_id}`} className="mini-link">
                    {d.reports.find((r) => r.id === n.report_id)?.ticket_id}
                  </Link>
                  <p>{n.note}</p>
                  <small>
                    Status unchanged ·{" "}
                    {new Date(n.created_at).toLocaleString("en-IN")}
                  </small>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="right-column">
          <section className="panel memory">
            <div className="memory-mark">
              <History size={21} />
            </div>
            <span className="eyebrow">THE ROAD REMEMBERS</span>
            <h2>
              Fixed once.
              <br />
              Failed again.
            </h2>
            <p style={{ fontSize: 12 }}>
              Repair history turns a repeat complaint into accountable action.
            </p>
            {memory && prior ? (
              <>
                <div className="row-title">
                  <b>{road(memory.road_segment_id)}</b>
                  <span className="badge orange">REPEAT FAILURE</span>
                </div>
                <div className="warranty">{warrantyMessage(memory, prior)}</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#7b866c",
                  }}
                >
                  <span>
                    {
                      d.incidents.filter(
                        (i) =>
                          i.road_segment_id === memory.road_segment_id &&
                          Date.parse(i.opened_at) > Date.now() - 90 * 86400000,
                      ).length
                    }{" "}
                    incidents in 90 days
                  </span>
                  <span>Inspection required</span>
                </div>
                <Link
                  href={`/incidents/${memory.id}${suffix.replace("&", "?")}`}
                  className="button secondary small"
                  style={{ width: "100%", marginTop: 20 }}
                >
                  Open repair history <ArrowUpRight size={13} />
                </Link>
              </>
            ) : (
              <p className="section-note">
                No segment currently meets the repeat rule.
              </p>
            )}
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Repeat-risk outlook</h2>
              <span className="badge purple">HEURISTIC V1</span>
            </div>
            <p style={{ fontSize: 11, marginTop: -8 }}>
              30-day risk score · a guide for inspection, with visible
              contributions.
            </p>
            {risks.slice(0, 3).map(({ road: r, risk }) => (
              <div key={r.id} className="risk-row">
                <div className="risk-top">
                  <b style={{ fontSize: 12 }}>{r.name}</b>
                  <span
                    className={`badge ${risk.label === "HIGH" ? "orange" : "green"}`}
                  >
                    {risk.label} · {risk.score.toFixed(2)}
                  </span>
                </div>
                <div className="risk-bar">
                  <span style={{ width: `${risk.score * 100}%` }} />
                </div>
                <small>
                  {risk.contributions[0].value} repairs / 180 days ·{" "}
                  {risk.contributions[3].value}
                </small>
                <details
                  style={{ fontSize: 10, marginTop: 8, color: "#78856e" }}
                >
                  <summary>Why this score?</summary>
                  {risk.contributions.map((c) => (
                    <p key={c.feature}>
                      {c.feature}: {c.value} · +{c.contribution.toFixed(3)}
                    </p>
                  ))}
                </details>
              </div>
            ))}
            <p className="section-note">
              Risk score (heuristic v1, upgradeable to ML). This score is not a
              calibrated probability and never changes priority or status.
            </p>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>One report, one promise.</h2>
              <ShieldCheck size={20} />
            </div>
            <p style={{ fontSize: 12 }}>
              Grouping reduces duplicate work. It never erases a citizen’s
              ticket or timeline.
            </p>
            <Link href="/tickets" className="mini-link">
              Explore citizen tickets →
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
function IncidentRow({ i, d, now }: { i: Incident; d: Dataset; now: Date }) {
  const view = d.demo && d.role !== "officer" ? `?view=${d.role}` : "";
  const p = priority(i.severity, i.sensitive_location, i.opened_at, now);
  const job = d.jobs.find((j) => j.incident_id === i.id);
  const late = job && overdue(job.due_date, i.status, now);
  const count = d.reports.filter((r) => r.incident_id === i.id).length;
  return (
    <div className="incident-row">
      <div className="score">
        <strong>{p.score}</strong>
        <small>PRIORITY</small>
      </div>
      <div>
        <div className="row-title">
          <Link href={`/incidents/${i.id}${view}`}>
            <b>{d.roads.find((r) => r.id === i.road_segment_id)?.name}</b>
          </Link>
          {i.sensitive_location && (
            <span className="badge orange">SENSITIVE AREA</span>
          )}
          {i.previous_repair_id && <span className="badge red">REPEAT</span>}
        </div>
        <div className="row-meta">
          <span>
            {count} linked {count === 1 ? "report" : "reports"}
          </span>
          <span>{Math.floor(p.days)} days waiting</span>
          <span>{i.status.replaceAll("_", " ")}</span>
        </div>
        <div className="breakdown">
          Severity {p.components.severity.toFixed(1)} + location{" "}
          {p.components.sensitive} + waiting {p.components.waiting.toFixed(1)}
        </div>
      </div>
      <div className="row-end">
        {late ? (
          <span className="badge red">
            <Clock3 size={10} />
            OVERDUE
          </span>
        ) : (
          <span
            className={`badge ${i.status === "repaired_pending_review" ? "green" : "orange"}`}
          >
            {i.status === "repaired_pending_review"
              ? "REVIEW"
              : i.status === "assigned"
                ? "ASSIGNED"
                : "OPEN"}
          </span>
        )}
        <Link
          href={`/incidents/${i.id}${view}`}
          className="mini-link"
          style={{ display: "block", marginTop: 12 }}
        >
          View <ArrowUpRight size={11} style={{ display: "inline" }} />
        </Link>
      </div>
    </div>
  );
}
