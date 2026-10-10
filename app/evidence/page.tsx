import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { PotholeGallery } from "@/components/pothole-gallery";
import { potholeDataset } from "@/lib/pothole-samples";
export const dynamic = "force-dynamic";
export default async function Evidence({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await searchParams;
  const d = await loadData(p.view);
  const boxes = potholeDataset.samples.reduce(
    (sum, s) => sum + s.boxes.length,
    0,
  );
  return (
    <Shell d={d} active="evidence">
      <div className="heading">
        <div>
          <span className="eyebrow">REAL PHOTOS · TRACEABLE LABELS</span>
          <h1>Evidence you can inspect.</h1>
          <p>
            Public pothole photographs with the original dataset annotations.
          </p>
        </div>
        <a
          href={potholeDataset.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="button secondary"
        >
          View Kaggle source ↗
        </a>
      </div>
      <div className="source-summary">
        <div>
          <strong>{potholeDataset.samples.length}</strong>
          <small>Imported sample photos</small>
        </div>
        <div>
          <strong>{boxes}</strong>
          <small>Dataset bounding boxes</small>
        </div>
        <div>
          <strong>CC0</strong>
          <small>Public Domain · Make ML / Yam Peleg</small>
        </div>
      </div>
      <div className="source-note">
        <b>Real visual evidence, clearly scoped.</b>
        <p>{potholeDataset.limitations}</p>
        <span>
          Dataset version {potholeDataset.version} · retrieved{" "}
          {new Date(potholeDataset.retrievedAt).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}{" "}
          · six selected examples, not a representative evaluation set.
        </span>
        <p>
          <a
            className="mini-link"
            href={potholeDataset.originalSourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Original author: Make ML ↗
          </a>
          {" · "}
          <a
            className="mini-link"
            href={potholeDataset.licenseUrl}
            target="_blank"
            rel="noreferrer"
          >
            CC0 license ↗
          </a>
        </p>
      </div>
      <PotholeGallery />
    </Shell>
  );
}
