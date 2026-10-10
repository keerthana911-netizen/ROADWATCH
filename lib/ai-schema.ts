import { z } from "zod";
export const triageSchema = z
  .object({
    is_pothole: z.boolean(),
    severity_estimate: z.number().min(0).max(1),
    sensitive_hint: z.enum(["school", "hospital", "none"]),
    reasoning: z.string().min(1).max(300),
  })
  .strict();
export const voiceSchema = z
  .object({
    note: z.string().max(2000),
    landmark: z.string().max(200),
    severity_hint: z.enum(["minor", "moderate", "severe", "unknown"]),
  })
  .strict();
export const briefSchema = z
  .object({ bullets: z.array(z.string().max(400)).length(3) })
  .strict();
export const verdictSchema = z
  .object({ verdict: z.string().min(1).max(400) })
  .strict();
export const duplicateSchema = z
  .object({
    candidate_id: z.string().uuid(),
    similarity: z.number().min(0.82).max(1),
    distance_m: z.number().min(0),
    days_apart: z.number().min(0),
    ticket_id: z.string(),
  })
  .strict();
export function decisionPayload(
  decision: "accepted" | "rejected" | "edited",
  actor: string,
  output: unknown,
  now = new Date(),
) {
  if (!actor) throw new Error("A human actor is required.");
  return { decision, decided_by: actor, decided_at: now.toISOString(), output };
}
