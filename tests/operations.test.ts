import { describe, it, expect } from "vitest";
import { demoData } from "../lib/demo";
import { operationSummary, repairQueue, queueCsv } from "../lib/operations";
const now = new Date("2026-10-09T12:00:00Z");
const make = () => demoData(now);
describe("operations dashboard", () => {
  it("searches roads, ticket IDs and contractors without changing data", () => {
    const d = make();
    const before = JSON.stringify(d);
    expect(repairQueue(d, { q: "station" }, now).length).toBe(2);
    expect(
      repairQueue(d, { q: " RW-0007 " }, now).map((i) => i.id.slice(-3)),
    ).toEqual(["204"]);
    expect(
      repairQueue(d, { q: "Metro Roads" }, now).map((i) => i.id.slice(-3)),
    ).toEqual(["208"]);
    expect(JSON.stringify(d)).toBe(before);
  });
  it("keeps queue filters scoped and excludes closed incidents", () => {
    const d = make();
    expect(
      repairQueue(d, { filter: "overdue" }, now).map((i) => i.id.slice(-3)),
    ).toEqual(["206"]);
    expect(
      repairQueue(d, { filter: "unassigned" }, now).map((i) => i.id.slice(-3)),
    ).toEqual(["202", "205"]);
    expect(
      repairQueue(d, { status: "repaired_pending_review" }, now).map((i) =>
        i.id.slice(-3),
      ),
    ).toEqual(["207"]);
    expect(repairQueue(d, { q: "nonsense" }, now)).toEqual([]);
  });
  it("supports priority, age and due-date ordering with unscheduled jobs last", () => {
    const d = make();
    expect(repairQueue(d, {}, now)[0].id.slice(-3)).toBe("202");
    expect(repairQueue(d, { sort: "oldest" }, now)[0].id.slice(-3)).toBe("206");
    expect(
      repairQueue(d, { sort: "due" }, now).map((i) => i.id.slice(-3)),
    ).toEqual(["206", "207", "204", "208", "202", "205"]);
  });
  it("counts only genuinely verified closed jobs in the trend window", () => {
    const d = make();
    const assigned = d.jobs.find((j) => j.id.endsWith("504"))!;
    assigned.verified_at = now.toISOString();
    assigned.verified_by = "test-reviewer";
    const summary = operationSummary(d, now);
    const sum = (days: number, key: "reports" | "verified") =>
      summary.trends
        .find((t) => t.days === days)!
        .bins.reduce((s, b) => s + b[key], 0);
    expect(sum(30, "reports")).toBe(8);
    expect(sum(30, "verified")).toBe(0);
    expect(sum(90, "verified")).toBe(1);
  });
  it("includes a UTC window boundary but excludes future reports", () => {
    const d = make();
    d.reports = [
      { ...d.reports[0], created_at: "2026-09-10T00:00:00Z" },
      { ...d.reports[1], created_at: "2026-09-09T23:59:59Z" },
      { ...d.reports[2], created_at: "2026-10-09T12:00:01Z" },
    ];
    const period = operationSummary(d, now).trends.find((t) => t.days === 30)!;
    expect(period.bins.reduce((s, b) => s + b.reports, 0)).toBe(1);
  });
  it("keeps closed jobs out of workloads and overdue jobs out of upcoming deadlines", () => {
    const data = operationSummary(make(), now);
    expect(data.workload[0]).toMatchObject({ total: 4, overdue: 1, review: 1 });
    expect(data.deadlines.map((j) => j.incidentId.slice(-3))).toEqual([
      "204",
      "208",
    ]);
    expect(data.newReports).toBe(2);
    expect(data.stages.reduce((s, n) => s + n.count, 0)).toBe(8);
    const scoped = make();
    scoped.events.push({
      ...scoped.events[0],
      id: "hidden-event",
      entity_id: "not-visible",
    });
    expect(
      operationSummary(scoped, now).activity.some(
        (e) => e.id === "hidden-event",
      ),
    ).toBe(false);
  });
  it("escapes CSV quotes and prevents spreadsheet formula interpretation", () => {
    const csv = queueCsv([
      {
        road: '=HYPERLINK("bad")',
        contractor: "a,b",
        status: "open",
        priority: 86,
      },
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"a,b"');
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
