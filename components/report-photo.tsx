import { potholeDataset } from "@/lib/pothole-samples";
import fixture from "@/lib/demo-fixture.json";
export function ReportPhoto({ id, url }: { id: string; url: string }) {
  const report = fixture.reports.find((r) => r.id === id);
  const sample = potholeDataset.samples.find(
    (s) => s.image === report?.photo_url,
  );
  return (
    <figure className="evidence-photo">
      <img
        className="photo"
        src={url}
        alt={
          sample ? "Dataset sample showing road damage" : "Reported road damage"
        }
      />
      {sample && (
        <figcaption>
          <b>Real dataset photo · simulated report</b>
          <span>
            This photo is not verified at the ticket’s location or date.
          </span>
          <a href={potholeDataset.sourceUrl} target="_blank" rel="noreferrer">
            Make ML / Yam Peleg · CC0 · {sample.id} ↗
          </a>
        </figcaption>
      )}
    </figure>
  );
}
