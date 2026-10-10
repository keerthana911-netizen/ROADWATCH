import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import manifest from "../data/pothole-samples.json";
import fixture from "../lib/demo-fixture.json";

describe("imported pothole evidence integrity", () => {
  it("matches each original PNG to its recorded dimensions and hash", () => {
    for (const sample of manifest.samples) {
      const bytes = fs.readFileSync(`public${sample.image}`);
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(bytes.readUInt32BE(16)).toBe(sample.width);
      expect(bytes.readUInt32BE(20)).toBe(sample.height);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        sample.sha256,
      );
      const xml = fs.readFileSync(sample.annotationFile, "utf8");
      expect(xml).toContain(`<filename>${sample.id}.png</filename>`);
      expect([...xml.matchAll(/<object>/g)].length).toBe(sample.boxes.length);
      for (const box of sample.boxes) {
        expect(box.xmin).toBeGreaterThanOrEqual(0);
        expect(box.ymin).toBeGreaterThanOrEqual(0);
        expect(box.xmax).toBeLessThanOrEqual(sample.width);
        expect(box.ymax).toBeLessThanOrEqual(sample.height);
        expect(box.xmax).toBeGreaterThan(box.xmin);
        expect(box.ymax).toBeGreaterThan(box.ymin);
      }
    }
  });
  it("uses dataset photos for every demo report, and illustrations only for repairs", () => {
    const urls = new Set(manifest.samples.map((s) => s.image));
    expect(fixture.reports.every((r) => urls.has(r.photo_url))).toBe(true);
    expect(
      fixture.jobs
        .filter((j) => j.photo_url)
        .every((j) => j.photo_url === "/demo-repair.png"),
    ).toBe(true);
  });
  it("preserves license and the limits of imported evidence", () => {
    expect(manifest.license).toBe("CC0: Public Domain");
    expect(manifest.limitations).toContain("not verified Chennai complaints");
    expect(manifest.limitations).toContain("not RoadWatch predictions");
    expect(
      manifest.samples.every(
        (s) => !("lat" in s) && !("severity" in s) && !("confidence" in s),
      ),
    ).toBe(true);
  });
});
