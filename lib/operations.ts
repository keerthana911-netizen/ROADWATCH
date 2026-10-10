import type { Dataset } from "./types";
import { overdue, priority } from "./priority";
import { repeatSegments } from "./repeat";
const day = 86400000;
export type QueueOptions = {
  filter?: string;
  q?: string;
  sort?: string;
  status?: string;
};
export function repairQueue(
  d: Dataset,
  options: QueueOptions,
  now = new Date(),
) {
  const repeats = repeatSegments(d.incidents, d.jobs, now);
  const query = (typeof options.q === "string" ? options.q : "")
    .slice(0, 200)
    .trim()
    .toLowerCase();
  const rank = (i: Dataset["incidents"][number]) =>
    priority(i.severity, i.sensitive_location, i.opened_at, now).score;
  return d.incidents
    .filter((i) => {
      if (i.status === "closed") return false;
      const job = d.jobs.find((j) => j.incident_id === i.id);
      if (options.filter === "unassigned" && job) return false;
      if (options.filter === "repeat" && !repeats.includes(i.road_segment_id))
        return false;
      if (
        options.filter === "overdue" &&
        !(job && overdue(job.due_date, i.status, now))
      )
        return false;
      if (options.filter === "review" && i.status !== "repaired_pending_review")
        return false;
      if (
        options.status &&
        options.status !== "all" &&
        i.status !== options.status
      )
        return false;
      const road = d.roads.find((r) => r.id === i.road_segment_id)?.name ?? "";
      const tickets = d.reports
        .filter((r) => r.incident_id === i.id)
        .map((r) => r.ticket_id)
        .join(" ");
      return (
        !query ||
        `${road} ${tickets} ${job?.contractor_name ?? ""}`
          .toLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) => {
      if (options.sort === "oldest")
        return (
          Date.parse(a.opened_at) - Date.parse(b.opened_at) ||
          a.id.localeCompare(b.id)
        );
      if (options.sort === "due") {
        const due = (id: string) =>
          d.jobs.find((j) => j.incident_id === id)?.due_date ?? "9999-12-31";
        return (
          due(a.id).localeCompare(due(b.id)) ||
          rank(b) - rank(a) ||
          a.id.localeCompare(b.id)
        );
      }
      return rank(b) - rank(a) || a.id.localeCompare(b.id);
    });
}
export function operationSummary(d: Dataset, now = new Date()) {
  const active = d.incidents.filter((i) => i.status !== "closed");
  const activeIds = new Set(active.map((i) => i.id));
  const jobs = d.jobs.filter((j) => activeIds.has(j.incident_id));
  const startOfToday = Date.parse(now.toISOString().slice(0, 10));
  const trends = [7, 30, 90].map((days) => {
    const start = startOfToday - (days - 1) * day;
    const bucketDays = Math.ceil(days / 14);
    const bins = Array.from(
      { length: Math.ceil(days / bucketDays) },
      (_, n) => ({
        date: new Date(start + n * bucketDays * day).toISOString().slice(0, 10),
        reports: 0,
        verified: 0,
      }),
    );
    const add = (timestamp: string, kind: "reports" | "verified") => {
      const t = Date.parse(timestamp);
      if (t < start || t > now.getTime()) return;
      const index = Math.floor((t - start) / (bucketDays * day));
      if (bins[index]) bins[index][kind]++;
    };
    d.reports.forEach((r) => add(r.created_at, "reports"));
    d.jobs
      .filter(
        (j) =>
          j.verified_at &&
          j.verified_by &&
          d.incidents.some(
            (i) => i.id === j.incident_id && i.status === "closed",
          ),
      )
      .forEach((j) => add(j.verified_at!, "verified"));
    return { days, bucketDays, bins };
  });
  const stages = ["open", "assigned", "repaired_pending_review", "closed"].map(
    (status) => ({
      status,
      count: d.incidents.filter((i) => i.status === status).length,
    }),
  );
  const workload = [...new Set(jobs.map((j) => j.owner))]
    .map((owner) => {
      const assigned = jobs.filter((j) => j.owner === owner);
      return {
        id: owner,
        name:
          d.officers.find((o) => o.id === owner)?.name ?? "Assigned officer",
        total: assigned.length,
        overdue: assigned.filter((j) =>
          overdue(
            j.due_date,
            d.incidents.find((i) => i.id === j.incident_id)!.status,
            now,
          ),
        ).length,
        review: assigned.filter(
          (j) =>
            d.incidents.find((i) => i.id === j.incident_id)?.status ===
            "repaired_pending_review",
        ).length,
      };
    })
    .sort((a, b) => b.total - a.total);
  const deadlines = jobs
    .filter(
      (j) =>
        !j.repaired_at &&
        Date.parse(j.due_date) >= startOfToday &&
        Date.parse(j.due_date) < startOfToday + 7 * day,
    )
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map((j) => ({
      id: j.id,
      incidentId: j.incident_id,
      date: j.due_date,
      road:
        d.roads.find(
          (r) =>
            r.id ===
            d.incidents.find((i) => i.id === j.incident_id)?.road_segment_id,
        )?.name ?? "Road segment",
      contractor: j.contractor_name ?? "Municipal team",
    }));
  const activity = d.events
    .filter(
      (e) =>
        (e.entity_type === "report" &&
          d.reports.some((r) => r.id === e.entity_id)) ||
        (e.entity_type === "incident" &&
          d.incidents.some((i) => i.id === e.entity_id)),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 24)
    .map((e) => ({
      id: e.id,
      type: e.entity_type,
      at: e.created_at,
      from: e.from_status,
      to: e.to_status,
      reason: e.reason,
      title:
        e.entity_type === "report"
          ? d.reports.find((r) => r.id === e.entity_id)!.ticket_id
          : (d.roads.find(
              (r) =>
                r.id ===
                d.incidents.find((i) => i.id === e.entity_id)?.road_segment_id,
            )?.name ?? "Repair job"),
      href: `${e.entity_type === "report" ? "/tickets/" : "/incidents/"}${e.entity_id}`,
    }));
  return {
    trends,
    stages,
    workload,
    deadlines,
    activity,
    unassigned: active.filter((i) => !jobs.some((j) => j.incident_id === i.id))
      .length,
    overdue: jobs.filter((j) =>
      overdue(
        j.due_date,
        d.incidents.find((i) => i.id === j.incident_id)!.status,
        now,
      ),
    ).length,
    review: active.filter((i) => i.status === "repaired_pending_review").length,
    newReports: d.reports.filter(
      (r) => !r.incident_id && r.status === "submitted",
    ).length,
    pendingAI: d.suggestions.filter((s) => s.decision === "pending").length,
  };
}
export type Operations = ReturnType<typeof operationSummary>;
export function queueCsv(rows: Array<Record<string, string | number>>) {
  const columns = [
    "road",
    "status",
    "priority",
    "opened",
    "due",
    "contractor",
    "reports",
    "incident",
  ];
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [
    columns.join(","),
    ...rows.map((r) => columns.map((c) => cell(r[c] ?? "")).join(",")),
  ].join("\r\n");
}
