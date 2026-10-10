import type { Dataset } from "./types";
export function analytics(d: Dataset) {
  const closed = d.incidents.filter((i) => i.status === "closed");
  const times = closed.flatMap((i) => {
    const j = d.jobs.find((j) => j.incident_id === i.id && j.verified_at);
    return j
      ? [(Date.parse(j.verified_at!) - Date.parse(i.opened_at)) / 86400000]
      : [];
  });
  const decided = d.suggestions.filter((a) => a.decision !== "pending");
  return {
    total: d.incidents.length,
    merged:
      d.reports.filter((r) => r.incident_id).length -
      new Set(d.reports.filter((r) => r.incident_id).map((r) => r.incident_id))
        .size,
    averageClose: times.length
      ? times.reduce((a, b) => a + b, 0) / times.length
      : null,
    acceptance: decided.length
      ? d.suggestions.filter(
          (a) => a.decision === "accepted" || a.decision === "edited",
        ).length / decided.length
      : null,
    decided: decided.length,
  };
}
