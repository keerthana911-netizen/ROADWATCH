import { it, expect } from "vitest";
import { contractorStats } from "../lib/repeat";
import { demoData } from "../lib/demo";
it("failure ninety days plus one hour later is outside a ninety-day warranty", () => {
  const now = new Date("2026-10-09T12:00:00Z");
  const d = demoData(now);
  const job = d.jobs[1];
  const i = d.incidents[2];
  i.opened_at = new Date(
    Date.parse(job.repaired_at!) + 90 * 86400000 + 3600000,
  ).toISOString();
  const stats = contractorStats(d.incidents, d.jobs).find(
    (c) => c.name === job.contractor_name,
  )!;
  expect(stats.failures).toBe(1);
});
