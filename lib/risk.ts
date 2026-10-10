import {
  contractorStats,
  type MemoryIncident,
  type MemoryRepair,
} from "./repeat";
export function riskScore(
  segment: string,
  incidents: MemoryIncident[],
  jobs: MemoryRepair[],
  now: Date = new Date(),
) {
  const own = incidents.filter((i) => i.road_segment_id === segment);
  const ids = new Set(own.map((i) => i.id));
  const repairs = jobs.filter(
    (j) =>
      ids.has(j.incident_id) &&
      j.repaired_at &&
      Date.parse(j.repaired_at) <= now.getTime(),
  );
  const recent = repairs.filter(
    (j) => Date.parse(j.repaired_at!) >= now.getTime() - 180 * 86400000,
  );
  const last = repairs.sort(
    (a, b) => Date.parse(b.repaired_at!) - Date.parse(a.repaired_at!),
  )[0];
  const days = last
    ? Math.max(0, (now.getTime() - Date.parse(last.repaired_at!)) / 86400000)
    : null;
  const average = own.length
    ? own.reduce((s, i) => s + i.severity, 0) / own.length
    : 0;
  const density = own.length
    ? own.filter((i) => i.sensitive_location).length / own.length
    : 0;
  const contractor = last?.contractor_name
    ? contractorStats(incidents, jobs).find(
        (c) => c.name === last.contractor_name,
      )
    : null;
  const seasonal = [5, 6, 7, 8, 9, 10].includes(now.getUTCMonth());
  const contributions = [
    {
      feature: "Repairs in last 180 days",
      value: recent.length,
      contribution: Math.min(recent.length / 3, 1) * 0.25,
    },
    {
      feature: "Time since last repair (days)",
      value: days === null ? "No repair" : Math.floor(days),
      contribution: days === null ? 0 : Math.min(days / 90, 1) * 0.1,
    },
    {
      feature: "Past average severity",
      value: Number(average.toFixed(2)),
      contribution: average * 0.2,
    },
    {
      feature: "Contractor warranty failure rate",
      value: contractor
        ? `${contractor.failures} of ${contractor.jobs} jobs`
        : "No recorded contractor",
      contribution: (contractor?.rate ?? 0) * 0.3,
    },
    {
      feature: "Sensitive location density",
      value: Number(density.toFixed(2)),
      contribution: density * 0.1,
    },
    {
      feature: "Seasonal flag (Jun–Nov)",
      value: seasonal ? "On" : "Off",
      contribution: seasonal ? 0.05 : 0,
    },
  ];
  const score = Number(
    contributions.reduce((s, c) => s + c.contribution, 0).toFixed(2),
  );
  return {
    score,
    label: score >= 0.6 ? "HIGH" : score >= 0.35 ? "MODERATE" : "LOW",
    contributions,
    model: "risk score (heuristic v1, upgradeable to ML)",
  };
}
