import fs from "node:fs";
import { z } from "zod";
const query =
  '[out:json][timeout:25];way["highway"~"^(primary|secondary|tertiary|residential)$"]["name"](13.07,80.255,13.095,80.285);out geom;';
const schema = z.object({
  osm3s: z.object({ timestamp_osm_base: z.string() }),
  elements: z.array(
    z.object({
      type: z.literal("way"),
      id: z.number().int().positive(),
      tags: z.object({ name: z.string(), highway: z.string() }),
      geometry: z
        .array(
          z.object({
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
          }),
        )
        .min(2),
    }),
  ),
});
const sourceFile = process.argv.indexOf("--from");
const endpoint =
  process.env.OVERPASS_ENDPOINT ?? "https://overpass-api.de/api/interpreter";
let raw;
if (sourceFile >= 0)
  raw = JSON.parse(fs.readFileSync(process.argv[sourceFile + 1], "utf8"));
else {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "RoadWatch-Hackathon/1.0 (one-off Chennai public road-network extract)",
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok)
    throw new Error(
      `Road source returned ${response.status}; existing snapshot was preserved.`,
    );
  raw = await response.json();
}
const parsed = schema.parse(raw);
const ways = parsed.elements
  .filter((e) => e.tags.name.trim())
  .sort((a, b) => a.tags.name.localeCompare(b.tags.name) || a.id - b.id)
  .slice(0, 80)
  .map((e) => ({
    osmId: e.id,
    name: e.tags.name,
    roadType: e.tags.highway,
    coordinates: e.geometry.map((p) => [p.lat, p.lon]),
  }));
if (!ways.length)
  throw new Error("The source returned no named roads. No file written.");
const dataset = {
  source: "OpenStreetMap contributors",
  endpoint,
  sourceUrl: "https://www.openstreetmap.org/copyright",
  license: "ODbL 1.0",
  retrievedAt: new Date().toISOString(),
  sourceTimestamp: parsed.osm3s.timestamp_osm_base,
  region: "Central Chennai sample",
  bounds: [13.07, 80.255, 13.095, 80.285],
  wardAssignment: "Unverified; this extract is not a municipal ward boundary",
  ways,
};
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/chennai-roads.json", JSON.stringify(dataset, null, 2));
console.log(
  `Saved ${ways.length} real OSM road segments, ${new Set(ways.map((w) => w.name)).size} unique names, source timestamp ${dataset.sourceTimestamp}. No complaint or repair records were imported.`,
);
