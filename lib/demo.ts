import raw from "./demo-fixture.json";
import type { Dataset } from "./types";
export function demoData(now = new Date()): Dataset {
  const d = structuredClone(raw) as Dataset;
  const anchor = Date.parse("2026-10-09T12:00:00Z");
  const shift = (s: string | null) =>
    s ? new Date(Date.parse(s) + now.getTime() - anchor).toISOString() : null;
  d.reports.forEach((r) => (r.created_at = shift(r.created_at)!));
  d.incidents.forEach((i) => (i.opened_at = shift(i.opened_at)!));
  d.jobs.forEach((j) => {
    j.due_date = shift(j.due_date)!.slice(0, 10);
    j.repaired_at = shift(j.repaired_at);
    j.verified_at = shift(j.verified_at);
  });
  d.events.forEach((e) => (e.created_at = shift(e.created_at)!));
  d.suggestions.forEach((a) => {
    a.created_at = shift(a.created_at)!;
    a.decided_at = shift(a.decided_at);
  });
  return d;
}
