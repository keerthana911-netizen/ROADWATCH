"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "./supabase";
async function upload(
  db: Awaited<ReturnType<typeof requireRole>>["db"],
  userId: string,
  file: FormDataEntryValue | null,
) {
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 6 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error("Upload a JPEG, PNG or WebP photo under 6 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid =
    file.type === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === "image/png"
        ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
        : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
          new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!valid) throw new Error("Photo content does not match its file type.");
  const path = `${userId}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  const { error } = await db.storage
    .from("road-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
export async function submitReport(form: FormData) {
  const s = await requireRole(["citizen"]);
  const v = z
    .object({
      segment: z.string().uuid(),
      lat: z.string().min(1).pipe(z.coerce.number().min(-90).max(90)),
      lng: z.string().min(1).pipe(z.coerce.number().min(-180).max(180)),
      source: z.enum(["gps", "manual_pin"]),
      note: z.string().max(2000),
    })
    .parse(Object.fromEntries(form));
  const photo = await upload(s.db, s.user.id, form.get("photo"));
  const { data, error } = await s.db.rpc("submit_report", {
    segment: v.segment,
    lat: v.lat,
    lng: v.lng,
    source: v.source,
    photo,
    report_note: v.note,
  });
  if (error) throw error;
  try {
    const { triageReport, embedReport } = await import("./ai");
    await triageReport(data);
    await embedReport(data);
  } catch {
    console.warn("Optional AI unavailable; the citizen ticket was saved.");
  }
  revalidatePath("/");
  redirect(`/tickets/${data}`);
}
export async function flagUnresolved(form: FormData) {
  const s = await requireRole(["citizen"]);
  const { error } = await s.db.rpc("flag_unresolved", {
    target: z.string().uuid().parse(form.get("id")),
    message: z.string().min(5).max(2000).parse(form.get("note")),
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath(`/tickets/${form.get("id")}`);
}
export async function groupReport(form: FormData) {
  const s = await requireRole(["officer"]);
  const { data, error } = await s.db.rpc("group_report", {
    target: z.string().uuid().parse(form.get("id")),
    match_id: form.get("match")
      ? z.string().uuid().parse(form.get("match"))
      : null,
    explanation: z.string().min(5).max(2000).parse(form.get("reason")),
  });
  if (error) throw error;
  revalidatePath("/");
  redirect(`/incidents/${data}`);
}
export async function assignRepair(form: FormData) {
  const s = await requireRole(["officer"]);
  const v = z
    .object({
      id: z.string().uuid(),
      severity: z.coerce.number().min(0).max(1),
      owner: z.string().uuid(),
      due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      contractor: z.string().max(200),
      warranty: z.coerce.number().int().min(1).max(3650),
      reason: z.string().min(5).max(2000),
    })
    .parse(Object.fromEntries(form));
  const { error } = await s.db.rpc("assign_repair", {
    target: v.id,
    confirmed_severity: v.severity,
    confirmed_sensitive: form.get("sensitive") === "on",
    assignee: v.owner,
    due: v.due,
    contractor: v.contractor,
    warranty: v.warranty,
    explanation: v.reason,
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath(`/incidents/${v.id}`);
}
export async function markRepaired(form: FormData) {
  const s = await requireRole(["officer"]);
  const id = z.string().uuid().parse(form.get("id"));
  const reason = z.string().min(5).max(2000).parse(form.get("reason"));
  const photo = await upload(s.db, s.user.id, form.get("photo"));
  const { error } = await s.db.rpc("mark_repaired", {
    target: id,
    photo,
    explanation: reason,
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath(`/incidents/${id}`);
}
export async function verifyRepair(form: FormData) {
  const s = await requireRole(["reviewer"]);
  const id = z.string().uuid().parse(form.get("id"));
  const { data: incident } = await s.db
    .from("incidents")
    .select("status")
    .eq("id", id)
    .single();
  const { data: job } = await s.db
    .from("repair_jobs")
    .select("after_photo_path")
    .eq("incident_id", id)
    .single();
  if (form.get("approved") === "yes") {
    const { assertClosure } = await import("./workflow");
    assertClosure(
      s.profile.role,
      incident?.status ?? "",
      job?.after_photo_path ?? null,
    );
  }
  const { error } = await s.db.rpc("verify_repair", {
    target: id,
    approved: form.get("approved") === "yes",
    explanation: z.string().min(5).max(2000).parse(form.get("reason")),
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath(`/incidents/${id}`);
}
export async function decideSuggestion(form: FormData) {
  const s = await requireRole(["officer", "reviewer"]);
  const id = z.string().uuid().parse(form.get("id"));
  const choice = z
    .enum(["accepted", "rejected", "edited"])
    .parse(form.get("decision"));
  let edited = null;
  if (choice === "edited") {
    const { triageSchema } = await import("./ai-schema");
    const { data: a } = await s.db
      .from("ai_suggestions")
      .select("kind,output")
      .eq("id", id)
      .single();
    if (a?.kind !== "photo_triage")
      throw new Error("Only photo triage supports this editor.");
    edited = triageSchema.parse({
      ...a.output,
      severity_estimate: Number(form.get("severity")),
      sensitive_hint: String(form.get("sensitive_hint")),
      reasoning: z.string().min(5).max(300).parse(form.get("reason")),
    });
  }
  const { error } = await s.db.rpc("decide_ai", {
    target: id,
    choice,
    edited_output: edited,
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/incidents/[id]", "page");
}
export async function findDuplicates(form: FormData) {
  await requireRole(["officer"]);
  const { smartDuplicates } = await import("./ai");
  await smartDuplicates(z.string().uuid().parse(form.get("id")));
  revalidatePath("/");
}
export async function confirmDuplicate(form: FormData) {
  const s = await requireRole(["officer"]);
  const id = z.string().uuid().parse(form.get("suggestion"));
  const { data: a } = await s.db
    .from("ai_suggestions")
    .select("*")
    .eq("id", id)
    .eq("kind", "dup_match")
    .single();
  if (!a) throw new Error("Suggestion not found");
  const merge = form.get("choice") === "merge";
  const { data, error } = await s.db.rpc("confirm_duplicate", {
    suggestion: id,
    merge_it: merge,
    explanation: z.string().min(5).max(2000).parse(form.get("reason")),
  });
  if (error) throw error;
  revalidatePath("/");
  if (merge) redirect(`/incidents/${data}`);
}
export async function briefIncident(form: FormData) {
  await requireRole(["officer", "reviewer"]);
  const id = z.string().uuid().parse(form.get("id"));
  const { incidentBrief } = await import("./ai");
  await incidentBrief(id);
  revalidatePath(`/incidents/${id}`);
}
export async function prepareSearch() {
  await requireRole(["officer"]);
  const { prepareSemanticSearch } = await import("./ai");
  await prepareSemanticSearch();
  revalidatePath("/analytics");
}
export async function requestVerdict(form: FormData) {
  await requireRole(["officer", "reviewer"]);
  const name = z.string().max(200).parse(form.get("contractor"));
  const { loadData } = await import("./data");
  const d = await loadData();
  const { contractorStats } = await import("./repeat");
  const stats = contractorStats(d.incidents, d.jobs).find(
    (c) => c.name === name,
  );
  const job = d.jobs.find((j) => j.contractor_name === name && j.repaired_at);
  const incident = d.incidents.find((i) => i.id === job?.incident_id);
  if (!stats || !incident)
    throw new Error("No contractor history visible to this role.");
  const { contractorVerdict } = await import("./ai");
  await contractorVerdict(incident.road_segment_id, stats);
  revalidatePath("/analytics");
}
