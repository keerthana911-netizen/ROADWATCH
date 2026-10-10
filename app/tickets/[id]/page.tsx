import Link from "next/link";
import { notFound } from "next/navigation";
import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { Timeline } from "@/components/timeline";
import { flagUnresolved } from "@/lib/actions";
import { ReportPhoto } from "@/components/report-photo";
import { reportLinkage } from "@/lib/report-linkage";
import { distanceMeters } from "@/lib/merge";
export const dynamic = "force-dynamic";
export default async function Ticket({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await loadData("citizen", { type: "report", id });
  const r = d.reports.find((r) => r.id === id);
  if (!r) notFound();
  const linkage = reportLinkage(r, d.reports, d.demo);
  const nearby =
    d.demo && r.ticket_id === "RW-0008"
      ? d.reports.find((other) => other.ticket_id === "RW-0007")
      : undefined;
  return (
    <Shell d={d} active="tickets">
      <Link href="/tickets" className="mini-link">
        ← All tickets
      </Link>
      <div className="heading" style={{ marginTop: 20 }}>
        <div>
          <span className="eyebrow">PERMANENT CITIZEN TICKET</span>
          <h1>{r.ticket_id}</h1>
          <p>{d.roads.find((s) => s.id === r.road_segment_id)?.name}</p>
        </div>
        <span className="badge green">
          {r.status.replaceAll("_", " ").toUpperCase()}
        </span>
      </div>
      <div className="grid-main">
        <section className="panel">
          <h2>Your report stays with you.</h2>
          <p>{r.note}</p>
          {r.photo_url ? (
            <ReportPhoto id={r.id} url={r.photo_url} />
          ) : (
            <p className="notice">
              Photo is unavailable. Upload seed photos to the private bucket if
              this is a demo record.
            </p>
          )}
          <p className="breakdown">
            {r.lat.toFixed(5)}, {r.lng.toFixed(5)} ·{" "}
            {r.location_source === "gps" ? "GPS" : "Manual map pin"}
          </p>
          {r.incident_id && (
            <div className="notice">
              {linkage.shared
                ? `This repair incident links ${linkage.count} visible citizen tickets. Your original ticket and timeline are preserved.`
                : d.demo
                  ? "Your report is linked to a separate repair incident. Your original ticket and timeline are preserved."
                  : "Your report is linked to a repair incident. Your original ticket and timeline are preserved."}
              {nearby && nearby.incident_id !== r.incident_id && (
                <p>
                  Demo separation proof: this report is approximately{" "}
                  {Math.round(distanceMeters(r, nearby))} metres from RW-0007 on
                  Station Road, beyond the 20-metre grouping limit. They remain
                  linked to different incidents.
                </p>
              )}
              <br />
              <Link className="mini-link" href={`/incidents/${r.incident_id}`}>
                View repair job →
              </Link>
            </div>
          )}
          <h3>Ticket timeline</h3>
          <Timeline
            events={d.events.filter(
              (e) => e.entity_type === "report" && e.entity_id === id,
            )}
          />
        </section>
        <aside>
          <section className="panel">
            <h2>Repair still unresolved?</h2>
            <p style={{ fontSize: 12 }}>
              Send a follow-up note to the ward officer. Your ticket’s status
              stays unchanged until staff review it.
            </p>
            <form action={flagUnresolved}>
              <input type="hidden" name="id" value={id} />
              <label>
                What still needs attention?
                <textarea name="note" required minLength={5} maxLength={2000} />
              </label>
              <button
                className="button small"
                disabled={
                  d.demo ||
                  d.role !== "citizen" ||
                  !["closed", "repaired_pending_review"].includes(r.status)
                }
              >
                Flag unresolved repair
              </button>
            </form>
            <small
              style={{ display: "block", marginTop: 12, color: "#839076" }}
            >
              {d.demo
                ? "Follow-up notes require a live account and configured Supabase workspace. This shared demo is read only."
                : d.role !== "citizen"
                  ? "Only the citizen who owns this ticket can submit a follow-up."
                  : "Available after repair is recorded."}
            </small>
          </section>
          {d.notes
            .filter((n) => n.report_id === id)
            .map((n) => (
              <section className="panel" key={n.id}>
                <b>Your follow-up note</b>
                <p>{n.note}</p>
                <small>Sent to the officer inbox · status unchanged</small>
              </section>
            ))}
        </aside>
      </div>
    </Shell>
  );
}
