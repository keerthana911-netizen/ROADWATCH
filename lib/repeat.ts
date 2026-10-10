export type MemoryIncident = {
  id: string;
  road_segment_id: string;
  opened_at: string;
  previous_repair_id?: string | null;
  severity: number;
  sensitive_location: boolean;
  status: string;
};
export type MemoryRepair = {
  id: string;
  incident_id: string;
  repaired_at: string | null;
  contractor_name: string | null;
  warranty_days: number;
  verified_at?: string | null;
};
export function previousRepair(
  incident: MemoryIncident,
  incidents: MemoryIncident[],
  jobs: MemoryRepair[],
) {
  const same = new Set(
    incidents
      .filter((i) => i.road_segment_id === incident.road_segment_id)
      .map((i) => i.id),
  );
  return (
    jobs
      .filter(
        (j) =>
          same.has(j.incident_id) &&
          j.repaired_at &&
          Date.parse(j.repaired_at) < Date.parse(incident.opened_at),
      )
      .sort(
        (a, b) => Date.parse(b.repaired_at!) - Date.parse(a.repaired_at!),
      )[0] ?? null
  );
}
export function repeatSegments(
  incidents: MemoryIncident[],
  jobs: MemoryRepair[],
  now: Date = new Date(),
) {
  const recent = incidents.filter(
    (i) =>
      Date.parse(i.opened_at) >= now.getTime() - 90 * 86400000 &&
      Date.parse(i.opened_at) <= now.getTime(),
  );
  return [...new Set(recent.map((i) => i.road_segment_id))].filter((id) => {
    const group = recent.filter((i) => i.road_segment_id === id);
    return (
      group.length >= 2 && group.some((i) => previousRepair(i, incidents, jobs))
    );
  });
}
export function failureDays(incident: MemoryIncident, job: MemoryRepair) {
  return Math.max(
    0,
    Math.floor(
      (Date.parse(incident.opened_at) - Date.parse(job.repaired_at!)) /
        86400000,
    ),
  );
}
export function warrantyMessage(incident: MemoryIncident, job: MemoryRepair) {
  if (!job.repaired_at || !job.contractor_name) return null;
  return `Failed within ${failureDays(incident, job)} days of ${job.contractor_name}'s repair, warranty window ${job.warranty_days} days.`;
}
export function contractorStats(
  incidents: MemoryIncident[],
  jobs: MemoryRepair[],
) {
  return [
    ...new Set(
      jobs
        .filter((j) => j.contractor_name && j.repaired_at)
        .map((j) => j.contractor_name!),
    ),
  ].map((name) => {
    const own = jobs.filter((j) => j.contractor_name === name && j.repaired_at);
    const failures = own.flatMap((j) => {
      const recurrence = incidents
        .filter((i) => previousRepair(i, incidents, jobs)?.id === j.id)
        .sort((a, b) => Date.parse(a.opened_at) - Date.parse(b.opened_at))[0];
      if (!recurrence) return [];
      const days =
        (Date.parse(recurrence.opened_at) - Date.parse(j.repaired_at!)) /
        86400000;
      return days <= j.warranty_days ? [days] : [];
    });
    return {
      name,
      jobs: own.length,
      failures: failures.length,
      rate: failures.length / own.length,
      avgDays: failures.length
        ? failures.reduce((a, b) => a + b, 0) / failures.length
        : null,
    };
  });
}
