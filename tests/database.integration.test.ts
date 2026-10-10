import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.TEST_SUPABASE_URL,
  key = process.env.TEST_SUPABASE_ANON_KEY,
  service = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
describe.skipIf(!url || !key)(
  "live Supabase acceptance (requires seeded, disposable project)",
  () => {
    let citizen: SupabaseClient,
      officer: SupabaseClient,
      reviewer: SupabaseClient;
    beforeAll(async () => {
      const clients = await Promise.all(
        ["citizen", "officer", "reviewer"].map(async (role) => {
          const c = createClient(url!, key!, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { error } = await c.auth.signInWithPassword({
            email: `${role}@roadwatch.demo`,
            password: "RoadWatchDemo!2026",
          });
          if (error) throw error;
          return c;
        }),
      );
      [citizen, officer, reviewer] = clients;
    });
    it("RLS/table privileges deny citizen status edits", async () => {
      const { error } = await citizen
        .from("reports")
        .update({ status: "closed" })
        .eq("id", id(312));
      expect(error).not.toBeNull();
    });
    it("transaction gate denies citizen grouping", async () => {
      const { error } = await citizen.rpc("group_report", {
        target: id(312),
        match_id: null,
        explanation: "Unauthorized citizen status attempt",
      });
      expect(error?.message).toContain("Officer");
    });
    it("officer cannot invoke reviewer closure", async () => {
      const { error } = await officer.rpc("verify_repair", {
        target: id(207),
        approved: true,
        explanation: "Role bypass test",
      });
      expect(error?.message).toContain("Reviewer");
    });
    it("reviewer cannot close an incident lacking repair evidence", async () => {
      const { error } = await reviewer.rpc("verify_repair", {
        target: id(206),
        approved: true,
        explanation: "Missing after-photo gate test",
      });
      expect(error).not.toBeNull();
    });
    it("citizen cannot read other staff profiles", async () => {
      const { data, error } = await citizen
        .from("profiles")
        .select("id")
        .eq("id", id(3));
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
    it("tickets persist across independent authenticated reads", async () => {
      const a = await citizen
        .from("report_locations")
        .select("ticket_id,status")
        .eq("id", id(301))
        .single();
      const b = await citizen
        .from("report_locations")
        .select("ticket_id,status")
        .eq("id", id(301))
        .single();
      expect(a.error).toBeNull();
      expect(b.data).toEqual(a.data);
      expect(a.data?.ticket_id).toBe("RW-0001");
    });
    it("audit table cannot be modified", async () => {
      const { error } = await officer
        .from("status_events")
        .delete()
        .eq("entity_id", id(202));
      expect(error).not.toBeNull();
    });
    it("seed keeps thirty-metre potholes in different incidents", async () => {
      const { data, error } = await officer
        .from("report_locations")
        .select("incident_id")
        .in("id", [id(307), id(308)]);
      expect(error).toBeNull();
      expect(new Set(data?.map((r) => r.incident_id)).size).toBe(2);
    });
    it("accepted seed suggestion has a recorded human decision", async () => {
      const { data, error } = await officer
        .from("ai_suggestions")
        .select("decision,decided_by,decided_at")
        .eq("id", id(703))
        .single();
      expect(error).toBeNull();
      expect(data?.decision).toBe("accepted");
      expect(data?.decided_by).toBe(id(3));
      expect(data?.decided_at).toBeTruthy();
    });
    it.skipIf(!service)(
      "database trigger blocks closure even for service-role writes without evidence",
      async () => {
        const admin = createClient(url!, service!, {
          auth: { persistSession: false },
        });
        const { error } = await admin
          .from("incidents")
          .update({ status: "closed" })
          .eq("id", id(206));
        expect(error?.message).toContain("after-photo");
      },
    );
  },
);
