import { redirect } from "next/navigation";
import { configured, session } from "./supabase";
import { demoData } from "./demo";
import type { Dataset, Repair } from "./types";
export async function loadData(
  view?: string,
  photoEntity?: { type: "report" | "incident"; id: string },
): Promise<Dataset> {
  if (!configured()) {
    const d = demoData();
    if (view === "citizen") {
      d.role = "citizen";
      d.name = "Priya Sharma";
      d.userId = "00000000-0000-4000-8000-000000000002";
    } else if (view === "reviewer") {
      d.role = "reviewer";
      d.name = "Meera Rao";
      d.userId = "00000000-0000-4000-8000-000000000004";
    }
    return d;
  }
  const s = await session();
  if (!s) redirect("/login");
  const tables = [
    "road_segments",
    "report_locations",
    "incident_locations",
    "repair_jobs",
    "ai_suggestions",
    "status_events",
    "report_notes",
    "profiles",
  ] as const;
  const results = await Promise.all(
    tables.map((t) => s.db.from(t).select("*")),
  );
  for (const r of results)
    if (r.error)
      throw new Error(`Unable to load RoadWatch: ${r.error.message}`);
  const [
    roads,
    reports,
    incidents,
    rawJobs,
    suggestions,
    events,
    notes,
    profiles,
  ] = results.map((r) => r.data ?? []);
  // Strip private storage paths from all objects returned to the presentation layer.
  const jobs = rawJobs.map(({ after_photo_path, ...j }) => j as Repair);
  if (photoEntity) {
    const { data: privateReports } = await s.db
      .from("reports")
      .select("id,photo_path")
      .eq(photoEntity.type === "report" ? "id" : "incident_id", photoEntity.id);
    await Promise.all(
      (privateReports ?? []).map(async (r) => {
        const { data } = await s.db.storage
          .from("road-photos")
          .createSignedUrl(r.photo_path, 120);
        const report = reports.find((x) => x.id === r.id);
        if (report) report.photo_url = data?.signedUrl ?? null;
      }),
    );
    if (photoEntity.type === "incident") {
      const j = rawJobs.find((j) => j.incident_id === photoEntity.id);
      if (j?.after_photo_path) {
        const { data } = await s.db.storage
          .from("road-photos")
          .createSignedUrl(j.after_photo_path, 120);
        const job = jobs.find((x) => x.id === j.id);
        if (job) job.photo_url = data?.signedUrl ?? null;
      }
    }
  }
  return {
    roads: roads.map(({ id, name, ward_id }) => ({ id, name, ward_id })),
    reports,
    incidents,
    jobs,
    suggestions,
    events,
    notes,
    officers: profiles
      .filter((p) => p.role === "officer")
      .map((p) => ({ id: p.id, name: p.name })),
    demo: false,
    role: s.profile.role,
    name: s.profile.name,
    userId: s.user.id,
  };
}
