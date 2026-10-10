import { describe, it, expect } from "vitest";
import { priority, overdue } from "../lib/priority";
import { mergeCandidate, distanceMeters } from "../lib/merge";
import {
  repeatSegments,
  previousRepair,
  warrantyMessage,
  contractorStats,
} from "../lib/repeat";
import { riskScore } from "../lib/risk";
import { assertRole, assertClosure } from "../lib/workflow";
import { triageSchema, voiceSchema, decisionPayload } from "../lib/ai-schema";
import { demoData } from "../lib/demo";
const now = new Date("2026-10-09T12:00:00Z");
const d = demoData(now);
const road = d.roads[0].id;
describe("deterministic core", () => {
  it("severe near school waiting two days = 86", () =>
    expect(priority(1, true, "2026-10-07T12:00:00Z", now).score).toBe(86));
  it("minor local road waiting seven days = 33", () =>
    expect(priority(0.25, false, "2026-10-02T12:00:00Z", now).score).toBe(33));
  it("exposes all three score components", () => {
    const c = priority(1, true, "2026-10-07T12:00:00Z", now).components;
    expect(c.severity).toBe(50);
    expect(c.sensitive).toBe(30);
    expect(c.waiting).toBeCloseTo((20 * 2) / 7, 12);
  });
  it("caps waiting at 20", () =>
    expect(
      priority(1, false, "2026-09-01T12:00:00Z", now).components.waiting,
    ).toBe(20));
  it("does not penalize future timestamps", () =>
    expect(priority(0.5, false, "2026-10-10T12:00:00Z", now).score).toBe(25));
  it("rejects citizen status mutations in the shared server gate", () =>
    expect(() => assertRole("citizen", ["officer", "reviewer"])).toThrow());
  it("rejects officer closure", () =>
    expect(() =>
      assertClosure("officer", "repaired_pending_review", "photo"),
    ).toThrow());
  it("blocks closure without after-photo", () =>
    expect(() =>
      assertClosure("reviewer", "repaired_pending_review", null),
    ).toThrow("After-photo"));
  it("permits reviewer closure with evidence in the correct state", () =>
    expect(() =>
      assertClosure("reviewer", "repaired_pending_review", "photo"),
    ).not.toThrow());
  it("blocks closure before repair review", () =>
    expect(() => assertClosure("reviewer", "assigned", "photo")).toThrow());
  it("keeps a 30 metre pair outside rule suggestions", () => {
    const a = d.reports[6],
      b = d.incidents.find((i) => i.id === d.reports[7].incident_id)!;
    expect(distanceMeters(a, b)).toBeGreaterThan(29);
    expect(distanceMeters(a, b)).toBeLessThan(31);
    expect(mergeCandidate(a, b)).toBe(false);
    expect(a.incident_id).not.toBe(b.id);
  });
  it("suggests but does not mutate nearby matches", () => {
    const report = { ...d.reports[0], created_at: now.toISOString() };
    const incident = { ...d.incidents[2], opened_at: now.toISOString() };
    const before = JSON.stringify(report);
    expect(mergeCandidate(report, incident)).toBe(true);
    expect(JSON.stringify(report)).toBe(before);
  });
  it("requires same segment", () =>
    expect(
      mergeCandidate(
        { ...d.reports[0], created_at: now.toISOString() },
        {
          ...d.incidents[2],
          road_segment_id: "other",
          opened_at: now.toISOString(),
        },
      ),
    ).toBe(false));
  it("requires seven day window", () =>
    expect(mergeCandidate(d.reports[0], d.incidents[2])).toBe(false));
  it("rejects closed incident candidates", () =>
    expect(mergeCandidate(d.reports[0], d.incidents[1])).toBe(false));
  it("flags only the seeded recurrence road", () =>
    expect(repeatSegments(d.incidents, d.jobs, now)).toEqual([road]));
  it("does not flag two incidents without a prior repair", () =>
    expect(repeatSegments(d.incidents, [], now)).toEqual([]));
  it("requires two incidents within ninety days", () =>
    expect(
      repeatSegments(
        d.incidents.filter((i) => i.id !== d.incidents[1].id),
        d.jobs,
        now,
      ),
    ).toEqual([]));
  it("selects latest earlier repair and calculates contractor message", () => {
    const i = d.incidents[2];
    const j = previousRepair(i, d.incidents, d.jobs)!;
    expect(j.id).toBe(d.jobs[1].id);
    expect(warrantyMessage(i, j)).toBe(
      "Failed within 35 days of Metro Roads Ltd.'s repair, warranty window 90 days.",
    );
  });
  it("never attaches future repairs", () =>
    expect(previousRepair(d.incidents[0], d.incidents, d.jobs)).toBeNull());
  it("retains five permanent tickets for one repair incident", () => {
    const linked = d.reports.filter((r) => r.incident_id === d.incidents[1].id);
    expect(linked).toHaveLength(5);
    expect(new Set(linked.map((r) => r.ticket_id)).size).toBe(5);
  });
  it("shows the overdue job and excludes repaired jobs", () => {
    expect(overdue(d.jobs[2].due_date, "assigned", now)).toBe(true);
    expect(overdue(d.jobs[2].due_date, "closed", now)).toBe(false);
    expect(overdue(d.jobs[2].due_date, "repaired_pending_review", now)).toBe(
      false,
    );
  });
});
describe("honest risk and contractor metrics", () => {
  it("reproduces the seeded repair memory as HIGH", () =>
    expect(riskScore(road, d.incidents, d.jobs, now).label).toBe("HIGH"));
  it("feature contributions sum to score", () => {
    const r = riskScore(road, d.incidents, d.jobs, now);
    expect(
      Number(
        r.contributions.reduce((n, c) => n + c.contribution, 0).toFixed(2),
      ),
    ).toBe(r.score);
    expect(r.model).toContain("heuristic");
  });
  it("handles roads without history", () =>
    expect(riskScore("empty", [], [], now).label).toBe("LOW"));
  it("counts each failed contractor repair once", () => {
    const c = contractorStats(d.incidents, d.jobs).find(
      (c) => c.name === "Metro Roads Ltd.",
    )!;
    expect(c.jobs).toBe(2);
    expect(c.failures).toBe(2);
    expect(c.rate).toBe(1);
    expect(c.avgDays).toBe(35);
  });
});
describe("AI governance validation", () => {
  it("rejects malformed vision output before logging", () => {
    expect(
      triageSchema.safeParse({ severity_estimate: 2, is_pothole: "yes" })
        .success,
    ).toBe(false);
  });
  it("rejects extra model instructions", () => {
    expect(
      triageSchema.safeParse({
        is_pothole: true,
        severity_estimate: 0.6,
        sensitive_hint: "none",
        reasoning: "Visible hole.",
        status: "closed",
      }).success,
    ).toBe(false);
  });
  it("requires a human actor on every decision", () =>
    expect(() => decisionPayload("accepted", "", {})).toThrow());
  it("accepted decision includes actor and timestamp", () =>
    expect(decisionPayload("accepted", d.userId, {}, now)).toMatchObject({
      decision: "accepted",
      decided_by: d.userId,
      decided_at: now.toISOString(),
    }));
  it("voice output accepts only the documented schema", () =>
    expect(
      voiceSchema.safeParse({
        note: "A hole",
        landmark: "",
        severity_hint: "unknown",
      }).success,
    ).toBe(true));
  it("seed has a documented accepted human suggestion", () =>
    expect(
      d.suggestions.find((s) => s.decision === "accepted")?.decided_by,
    ).toBeTruthy());
});
