import type { Report } from "./types";

/** Linking a report to an incident does not mean it was merged with another report. */
export function reportLinkage(
  report: Report,
  visibleReports: Report[],
  complete = false,
) {
  if (!report.incident_id)
    return { count: 0, shared: false, label: "Awaiting officer grouping" };
  const count = visibleReports.filter(
    (r) => r.incident_id === report.incident_id,
  ).length;
  return {
    count,
    shared: count > 1,
    label:
      count > 1
        ? `Shared repair incident · ${count} visible tickets retained`
        : complete
          ? "Separate repair incident · your ticket retained"
          : "Linked to a repair incident · your ticket retained",
  };
}
