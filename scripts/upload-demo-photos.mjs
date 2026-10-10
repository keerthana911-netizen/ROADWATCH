import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error(
    "Set the server-only Supabase URL and service-role key for seed photo uploads.",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const d = JSON.parse(fs.readFileSync("lib/demo-fixture.json", "utf8"));
for (const r of d.reports) {
  const { error } = await db.storage
    .from("road-photos")
    .upload(
      `${r.reporter_id}/demo-report-${r.id}.png`,
      fs.readFileSync(`public${r.photo_url}`),
      { contentType: "image/png", upsert: true },
    );
  if (error) throw error;
}
for (const j of d.jobs.filter((j) => j.repaired_at)) {
  const { error } = await db.storage
    .from("road-photos")
    .upload(
      `${j.owner}/demo-after-${j.id}.png`,
      fs.readFileSync("public/demo-repair.png"),
      { contentType: "image/png", upsert: true },
    );
  if (error) throw error;
}
console.log(
  "Uploaded CC0 sample damage photos and demo repair illustrations to the private bucket. Report locations and histories remain simulated.",
);
