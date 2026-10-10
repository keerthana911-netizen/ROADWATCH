import Link from "next/link";
import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { reportLinkage } from "@/lib/report-linkage";
export const dynamic = "force-dynamic";
export default async function Tickets({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await searchParams;
  const d = await loadData(p.view);
  return (
    <Shell d={d} active="tickets">
      <div className="heading">
        <div>
          <span className="eyebrow">THE CITIZEN’S VIEW</span>
          <h1>{d.role === "citizen" ? "My tickets" : "Citizen reports"}</h1>
          <p>
            Every ticket stays visible through grouping, repair, and
            verification.
          </p>
        </div>
        {d.role === "citizen" && (
          <Link href="/report" className="button">
            + Report a pothole
          </Link>
        )}
      </div>
      <div className="panel">
        {d.reports.map((r) => (
          <article key={r.id} className="report-card">
            <div className="row-title">
              <Link
                className="mini-link"
                href={`/tickets/${r.id}`}
                style={{ fontSize: 15 }}
              >
                {r.ticket_id}
              </Link>
              <b>{d.roads.find((s) => s.id === r.road_segment_id)?.name}</b>
              <span
                className={`badge ${r.status === "closed" ? "green" : "orange"}`}
              >
                {r.status.replaceAll("_", " ").toUpperCase()}
              </span>
            </div>
            <p>{r.note}</p>
            <div className="row-meta">
              <span>{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
              <span>{reportLinkage(r, d.reports, d.demo).label}</span>
              <Link className="mini-link" href={`/tickets/${r.id}`}>
                Follow timeline →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}
