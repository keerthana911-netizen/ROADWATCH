"use server";
import { z } from "zod";
import { configured, requireRole } from "./supabase";
import { parseVoice } from "./ai";
export async function voiceParse(transcript: string) {
  if (!configured()) return null;
  const result = await parseVoice(z.string().max(2000).parse(transcript));
  if (!result) return null;
  return { id: result.id, ...result.output } as {
    id: string;
    note: string;
    landmark: string;
    severity_hint: string;
  };
}
export async function voiceDecision(
  id: string,
  choice: "accepted" | "rejected",
  note: string,
) {
  const s = await requireRole(["citizen"]);
  const { error } = await s.db.rpc("decide_ai", {
    target: z.string().uuid().parse(id),
    choice: z.enum(["accepted", "rejected"]).parse(choice),
    edited_output: null,
  });
  if (error) throw error;
}
