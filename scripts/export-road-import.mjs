import fs from "node:fs";
import { createHash } from "node:crypto";
import { z } from "zod";
const wardIndex = process.argv.indexOf("--ward");
if (wardIndex < 0 || !process.argv.includes("--ward-assignment-reviewed"))
  throw new Error(
    "Supply --ward <UUID> --ward-assignment-reviewed after reviewing road ownership. The central Chennai sample is not a verified municipal ward.",
  );
const ward = z
  .string()
  .uuid()
  .parse(process.argv[wardIndex + 1]);
const data = z
  .object({
    sourceTimestamp: z.string().datetime(),
    ways: z
      .array(
        z.object({
          osmId: z.number().int().positive(),
          name: z.string().min(1),
          coordinates: z
            .array(
              z.tuple([
                z.number().min(-90).max(90),
                z.number().min(-180).max(180),
              ]),
            )
            .min(2),
        }),
      )
      .min(1),
  })
  .parse(JSON.parse(fs.readFileSync("data/chennai-roads.json", "utf8")));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const rows = data.ways.map((way) => {
  const digest = createHash("sha256")
    .update(`roadwatch:osm:way:${way.osmId}`)
    .digest("hex");
  const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  const geometry = `LINESTRING(${way.coordinates.map(([lat, lng]) => `${lng} ${lat}`).join(",")})`;
  return `insert into public.road_segments(id,name,ward_id,geometry,source,osm_way_id,source_url,source_snapshot_at) values(${quote(id)},${quote(way.name)},${quote(ward)},extensions.st_geomfromtext(${quote(geometry)},4326),'openstreetmap',${way.osmId},${quote(`https://www.openstreetmap.org/way/${way.osmId}`)},${quote(data.sourceTimestamp)}) on conflict(osm_way_id) do nothing;`;
});
fs.writeFileSync(
  "data/import-roads.sql",
  `-- © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright\n-- Ward assignment supplied and explicitly reviewed by the operator.\n-- Apply migration 015 first. Existing segments and tickets are preserved.\nbegin;\n${rows.join("\n")}\ncommit;\n`,
);
console.log(
  `Wrote a reviewable SQL import for ${rows.length} sourced roads. No database was modified.`,
);
