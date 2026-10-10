"use client";
import { Download } from "lucide-react";
import { queueCsv } from "@/lib/operations";
import { FileExport } from "./file-export";
export function QueueExport({
  rows,
  demo,
}: {
  rows: Array<Record<string, string | number>>;
  demo: boolean;
}) {
  const csv = queueCsv(rows);
  return (
    <details className="csv-export">
      <summary className="button secondary small">
        <Download size={14} /> Export queue ({rows.length})
      </summary>
      <div className="csv-preview">
        <b>{demo ? "Demo queue export" : "Visible queue export"}</b>
        <p>Only jobs matching your current filters are included.</p>
        <FileExport
          text={"\uFEFF" + csv}
          mime="text/csv;charset=utf-8"
          filename={`roadwatch-${demo ? "demo-" : ""}queue.csv`}
          label="Download CSV"
          disabled={!rows.length}
        />
        <button
          type="button"
          className="button secondary small"
          onClick={(e) => {
            const panel = e.currentTarget.closest("details");
            if (panel) panel.open = false;
          }}
        >
          Close export
        </button>
      </div>
    </details>
  );
}
