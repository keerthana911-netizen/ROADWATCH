import snapshot from "@/data/chennai-roads.json";
import { roadNetworkSchema } from "@/lib/road-network";
import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { RoadExplorer } from "@/components/road-explorer";
import { Database, MapPinned, ShieldCheck, ExternalLink } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Roads({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await searchParams;
  const d = await loadData(p.view);
  const network = roadNetworkSchema.parse(snapshot);
  const names = new Set(network.ways.map((r) => r.name)).size;
  return (
    <Shell d={d} active="roads">
      <div className="heading">
        <div>
          <span className="eyebrow">REAL STREETS · TRACEABLE SOURCES</span>
          <h1>Grounded in the real world.</h1>
          <p>
            A sourced road network, with a direct link to every mapped segment.
          </p>
        </div>
        <a
          href={network.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="button secondary"
        >
          OpenStreetMap attribution
          <ExternalLink size={14} />
        </a>
      </div>
      <div className="source-summary">
        <div>
          <span className="source-icon">
            <MapPinned size={22} />
          </span>
          <strong>{network.ways.length}</strong>
          <small>Mapped road segments</small>
        </div>
        <div>
          <span className="source-icon">
            <Database size={22} />
          </span>
          <strong>{names}</strong>
          <small>Named streets in the sample</small>
        </div>
        <div>
          <span className="source-icon">
            <ShieldCheck size={22} />
          </span>
          <strong>ODbL 1.0</strong>
          <small>© OpenStreetMap contributors</small>
        </div>
      </div>
      <div className="source-note">
        <b>Cached public source · {network.region}</b>
        <span>
          Source timestamp:{" "}
          {new Date(network.sourceTimestamp).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}{" "}
          · Retrieved:{" "}
          {new Date(network.retrievedAt).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
        </span>
        <p>
          Road geometry is real OpenStreetMap data. Complaint, repair, and
          contractor records in the preview are demo data. Ward assignment has
          not been verified; this sample is not a municipal coverage claim.
        </p>
      </div>
      <RoadExplorer roads={network.ways} />
    </Shell>
  );
}
