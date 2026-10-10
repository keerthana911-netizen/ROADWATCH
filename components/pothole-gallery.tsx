"use client";
import { useState } from "react";
import { potholeDataset } from "@/lib/pothole-samples";
export function PotholeGallery() {
  const [showBoxes, setShowBoxes] = useState(true);
  return (
    <>
      <div className="panel-title evidence-controls">
        <div>
          <h2>Inspect the original evidence</h2>
          <p>Green boxes come from the dataset’s XML labels.</p>
        </div>
        <label className="annotation-toggle">
          <input
            type="checkbox"
            checked={showBoxes}
            onChange={(e) => setShowBoxes(e.target.checked)}
          />{" "}
          Show dataset boxes
        </label>
      </div>
      <div className="evidence-grid">
        {potholeDataset.samples.map((sample) => (
          <article className="panel evidence-card" key={sample.id}>
            <div
              className="annotation-image"
              style={{ aspectRatio: `${sample.width} / ${sample.height}` }}
            >
              <img
                src={sample.image}
                alt={`Pothole dataset sample ${sample.id}`}
                width={sample.width}
                height={sample.height}
                loading="lazy"
              />
              {showBoxes && (
                <svg
                  viewBox={`0 0 ${sample.width} ${sample.height}`}
                  aria-hidden="true"
                >
                  {sample.boxes.map((box, n) => (
                    <rect
                      key={n}
                      x={Math.max(0, box.xmin - 1)}
                      y={Math.max(0, box.ymin - 1)}
                      width={box.xmax - box.xmin + 1}
                      height={box.ymax - box.ymin + 1}
                      fill="none"
                      stroke="#a8ff78"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
              )}
            </div>
            <div className="panel-title">
              <h3>{sample.id}</h3>
              <span className="badge green">
                {sample.boxes.length} labeled potholes
              </span>
            </div>
            <p>
              {sample.width} × {sample.height} px · PASCAL VOC
            </p>
            <small>
              Dataset annotation · no RoadWatch prediction or confidence score
            </small>
            <a
              href={sample.image}
              target="_blank"
              rel="noreferrer"
              className="mini-link"
            >
              Open original photo ↗
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
