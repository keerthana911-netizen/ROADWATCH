"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Users,
  ShieldCheck,
  Inbox,
  Sparkles,
} from "lucide-react";
import type { Operations } from "@/lib/operations";
export function OperationsPulse({
  data,
  demo,
  role,
}: {
  data: Operations;
  demo: boolean;
  role: string;
}) {
  const [range, setRange] = useState(30);
  const [activityType, setActivityType] = useState("all");
  const series = data.trends.find((t) => t.days === range)!;
  const reports = series.bins.reduce((s, b) => s + b.reports, 0);
  const verified = series.bins.reduce((s, b) => s + b.verified, 0);
  const max = Math.max(
    1,
    ...series.bins.flatMap((b) => [b.reports, b.verified]),
  );
  const suffix = demo && role !== "officer" ? `&view=${role}` : "";
  const feed = data.activity
    .filter((e) => activityType === "all" || e.type === activityType)
    .slice(0, 6);
  const actions = [
    {
      count: data.newReports,
      title: "Reports to confirm",
      text: "Review location and grouping",
      href: `/?filter=all${suffix}#new-reports`,
      Icon: Inbox,
    },
    {
      count: data.unassigned,
      title: "Jobs needing an owner",
      text: "Assign a repair and due date",
      href: `/?filter=unassigned${suffix}#repair-queue`,
      Icon: Users,
    },
    {
      count: data.review,
      title: "Repairs awaiting review",
      text: "Inspect the after-photo",
      href: `/?filter=review${suffix}#repair-queue`,
      Icon: ShieldCheck,
    },
    {
      count: data.overdue,
      title: "Overdue repair jobs",
      text: "Inspect the missed deadline",
      href: `/?filter=overdue${suffix}#repair-queue`,
      Icon: Clock3,
    },
  ];
  return (
    <>
      <section className="attention-strip" aria-label="Action center">
        {actions.map(({ Icon, ...a }) => (
          <Link
            href={a.href}
            key={a.title}
            className={`attention-card ${a.count ? "has-work" : ""}`}
          >
            <Icon size={19} />
            <div>
              <strong>{a.count}</strong>
              <b>{a.title}</b>
              <small>{a.text}</small>
            </div>
            <ArrowUpRight size={14} />
          </Link>
        ))}
      </section>
      <div className="operations-grid">
        <section className="panel trend-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">OPERATIONS PULSE</span>
              <h2>Reports in. Repairs verified.</h2>
            </div>
            <div className="range-switch" aria-label="Trend period">
              {[7, 30, 90].map((n) => (
                <button
                  type="button"
                  aria-pressed={range === n}
                  key={n}
                  onClick={() => setRange(n)}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>
          <div className="trend-totals">
            <span>
              <b>{reports}</b> citizen reports
            </span>
            <span>
              <b>{verified}</b> verified repairs
            </span>
            <span className="badge">
              {demo ? "DEMO RECORDS" : "VISIBLE RECORDS"}
            </span>
          </div>
          <div
            className="trend-chart"
            role="img"
            aria-label={`${range} calendar days: ${reports} reports and ${verified} verified repairs. ${series.bucketDays}-day chart buckets.`}
          >
            {series.bins.map((b) => (
              <div
                className="trend-bin"
                key={b.date}
                title={`${b.date}: ${b.reports} reports, ${b.verified} verified repairs`}
              >
                <div className="trend-bars">
                  <span
                    className="report-bar"
                    style={{ height: `${(b.reports / max) * 100}%` }}
                  />
                  <span
                    className="verified-bar"
                    style={{ height: `${(b.verified / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="chart-axis">
            <span>{series.bins[0].date}</span>
            <span>{series.bucketDays}-day buckets · UTC</span>
            <span>Today</span>
          </div>
          <div className="chart-legend">
            <span>
              <i className="report-key" /> Reports
            </span>
            <span>
              <i className="verified-key" /> Verified repairs
            </span>
            <details>
              <summary>Inspect chart values</summary>
              {series.bins.map((b) => (
                <p key={b.date}>
                  {b.date}: {b.reports} reports · {b.verified} verified repairs
                </p>
              ))}
            </details>
          </div>
        </section>
        <section className="panel pipeline-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">REPAIR PIPELINE</span>
              <h2>Every step accounted for.</h2>
            </div>
            <Activity size={19} />
          </div>
          {data.stages.map((s, n) => (
            <div className="pipeline-stage" key={s.status}>
              <span className={`pipeline-dot stage-${n}`} />
              <span>
                {
                  [
                    "Open",
                    "Assigned",
                    "Awaiting verification",
                    "Verified & closed",
                  ][n]
                }
              </span>
              <strong>{s.count}</strong>
              <div className="pipeline-track">
                <i
                  style={{
                    width: `${(s.count / Math.max(1, ...data.stages.map((s) => s.count))) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <Link
            href={`/analytics${suffix.replace("&", "?")}`}
            className="mini-link"
          >
            <Sparkles size={13} /> {data.pendingAI} AI suggestions awaiting a
            decision ↗
          </Link>
          <p className="section-note">
            Counts reflect records available to your role. A recorded repair
            still needs reviewer verification.
          </p>
        </section>
      </div>
      <div className="operations-lower">
        <section className="panel">
          <div className="panel-title">
            <h2>Team workload</h2>
            <Users size={18} />
          </div>
          <p className="section-note">
            Active assigned jobs, including work awaiting review.
          </p>
          {data.workload.length ? (
            data.workload.slice(0, 5).map((w) => (
              <div className="workload-row" key={w.id}>
                <span className="workload-avatar">
                  {w.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <b>{w.name}</b>
                  <small>
                    {w.overdue} overdue · {w.review} awaiting review
                  </small>
                </div>
                <strong>
                  {w.total}
                  <small>jobs</small>
                </strong>
              </div>
            ))
          ) : (
            <p className="empty">No assigned jobs in the visible records.</p>
          )}
          <div className="workload-footer">
            {data.unassigned} active jobs still need an owner.
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Next seven days</h2>
            <Clock3 size={18} />
          </div>
          <p className="section-note">
            Scheduled deadlines · UTC calendar dates
          </p>
          {data.deadlines.length ? (
            data.deadlines.slice(0, 5).map((j) => (
              <Link
                className="deadline-row"
                href={`/incidents/${j.incidentId}${suffix.replace("&", "?")}`}
                key={j.id}
              >
                <time dateTime={j.date}>
                  <b>{j.date.slice(8)}</b>
                  <small>
                    {new Date(j.date).toLocaleDateString("en", {
                      month: "short",
                      timeZone: "UTC",
                    })}
                  </small>
                </time>
                <div>
                  <b>{j.road}</b>
                  <small>{j.contractor}</small>
                </div>
                <ArrowUpRight size={14} />
              </Link>
            ))
          ) : (
            <div className="calendar-empty">
              <ShieldCheck size={24} />
              <b>No deadlines scheduled in the next seven days.</b>
              <span>Open jobs may still need assignment.</span>
            </div>
          )}
          <Link
            className="mini-link"
            href={`/?filter=overdue${suffix}#repair-queue`}
          >
            {data.overdue} overdue jobs outside this calendar →
          </Link>
        </section>
        <section className="panel activity-panel">
          <div className="panel-title">
            <h2>Recorded activity</h2>
            <Activity size={18} />
          </div>
          <div className="activity-switch">
            {["all", "report", "incident"].map((type) => (
              <button
                type="button"
                key={type}
                aria-pressed={activityType === type}
                onClick={() => setActivityType(type)}
              >
                {type === "all"
                  ? "All"
                  : type === "report"
                    ? "Tickets"
                    : "Repairs"}
              </button>
            ))}
          </div>
          {feed.length ? (
            feed.map((e) => (
              <Link
                href={`${e.href}${suffix.replace("&", "?")}`}
                className="activity-row"
                key={e.id}
              >
                <i />
                <div>
                  <b>{e.title}</b>
                  <span>
                    {e.from ? `${e.from.replaceAll("_", " ")} → ` : ""}
                    {e.to.replaceAll("_", " ")}
                  </span>
                  <small>
                    {new Date(e.at).toLocaleDateString("en-IN", {
                      timeZone: "UTC",
                    })}{" "}
                    · UTC
                  </small>
                  <p>{e.reason}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="empty">No recorded transitions in this view.</p>
          )}
        </section>
      </div>
    </>
  );
}
