import { describe, it, expect } from "vitest";
import { demoData } from "../lib/demo";
import { reportLinkage } from "../lib/report-linkage";
import { distanceMeters, mergeCandidate } from "../lib/merge";

describe("citizen ticket linkage evidence", () => {
  const d = demoData(new Date("2026-10-09T12:00:00Z"));
  it("keeps the nearby Station Road complaints separate and explains why", () => {
    const first = d.reports.find((r) => r.ticket_id === "RW-0007")!;
    const second = d.reports.find((r) => r.ticket_id === "RW-0008")!;
    const firstIncident = d.incidents.find((i) => i.id === first.incident_id)!;
    expect(second.incident_id).not.toBe(first.incident_id);
    expect(Math.round(distanceMeters(first, second))).toBe(30);
    expect(mergeCandidate(second, firstIncident)).toBe(false);
    expect(reportLinkage(second, d.reports).shared).toBe(false);
    expect(reportLinkage(second, d.reports, true).label).toContain(
      "Separate repair incident",
    );
  });
  it("identifies the five retained tickets sharing the earlier College Road incident", () => {
    const report = d.reports.find((r) => r.ticket_id === "RW-0001")!;
    expect(reportLinkage(report, d.reports)).toMatchObject({
      count: 5,
      shared: true,
    });
  });
  it("does not claim a repair incident for an unconfirmed report", () => {
    const report = d.reports.find((r) => r.ticket_id === "RW-0012")!;
    expect(reportLinkage(report, d.reports)).toMatchObject({
      count: 0,
      shared: false,
      label: "Awaiting officer grouping",
    });
  });
  it("does not infer separation from a role-restricted view of one ticket", () => {
    const report = d.reports.find((r) => r.ticket_id === "RW-0001")!;
    expect(reportLinkage(report, [report]).label).toBe(
      "Linked to a repair incident · your ticket retained",
    );
  });
});
