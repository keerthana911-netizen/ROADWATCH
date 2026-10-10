import { describe, it, expect } from "vitest";
import snapshot from "../data/chennai-roads.json";
import { roadNetworkSchema } from "../lib/road-network";
describe("real road snapshot provenance", () => {
  it("validates all sourced geometries and metadata", () =>
    expect(roadNetworkSchema.safeParse(snapshot).success).toBe(true));
  it("preserves unique source way IDs and traceable names", () => {
    expect(new Set(snapshot.ways.map((w) => w.osmId)).size).toBe(
      snapshot.ways.length,
    );
    expect(
      snapshot.ways.every(
        (w) => w.name.length > 0 && w.coordinates.length >= 2,
      ),
    ).toBe(true);
  });
  it("never labels mapped geometry as verified complaint data", () => {
    expect(snapshot.wardAssignment).toContain("Unverified");
    expect(snapshot).not.toHaveProperty("complaints");
    expect(snapshot).not.toHaveProperty("contractors");
    expect(snapshot.license).toBe("ODbL 1.0");
  });
  it("exposes source snapshot age instead of claiming realtime data", () => {
    expect(Date.parse(snapshot.sourceTimestamp)).toBeLessThanOrEqual(
      Date.parse(snapshot.retrievedAt),
    );
  });
});
