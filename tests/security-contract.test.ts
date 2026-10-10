import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
const migration = readdirSync("supabase/migrations")
  .sort()
  .map((f) => readFileSync(`supabase/migrations/${f}`, "utf8"))
  .join("\n");
describe("checked-in database security contract (structural, not a live RLS test)", () => {
  it("enables RLS on all sensitive tables", () => {
    for (const table of [
      "profiles",
      "reports",
      "incidents",
      "repair_jobs",
      "status_events",
      "ai_suggestions",
      "report_embeddings",
      "report_notes",
    ])
      expect(migration).toContain(
        `alter table ${table} enable row level security`,
      );
  });
  it("defines no direct table write policies for authenticated users", () => {
    expect(migration).not.toMatch(
      /create policy [^;]* on (?:public\.)?(?:reports|incidents|repair_jobs|status_events)[^;]* for (?:insert|update|delete|all)/i,
    );
    expect(migration).toContain("revoke insert, update, delete");
  });
  it("guards both inserted and updated closed incidents", () =>
    expect(migration).toContain("closure_gate before insert or update"));
  it("creates a private bucket", () =>
    expect(migration).toContain("'road-photos','road-photos',false"));
  it("decision function writes only AI governance fields", () => {
    const body = migration.slice(
      migration.indexOf("create function public.decide_ai"),
      migration.indexOf("create function public.store_embedding"),
    );
    expect(body).toContain("update ai_suggestions");
    expect(body).not.toMatch(/update (incidents|reports|repair_jobs)\s/i);
  });
  it("locks AI decisions and records the authenticated actor", () => {
    expect(migration).toContain(
      "decision=choice,decided_by=auth.uid(),decided_at=now()",
    );
    expect(migration).toContain("a.decision<>'pending'");
  });
  it("service worker never caches authenticated navigation", () => {
    const sw = readFileSync("public/sw.js", "utf8");
    const navigation = sw.slice(
      sw.indexOf("if (e.request.mode === 'navigate')"),
      sw.indexOf("if (u.origin"),
    );
    expect(navigation).toContain("fetch(e.request)");
    expect(navigation).not.toContain(".put(");
  });
});
