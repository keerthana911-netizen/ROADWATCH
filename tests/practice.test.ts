import { describe, expect, it } from "vitest";
import {
  changePractice,
  emptyPractice,
  practiceSchema,
  type Practice,
} from "../lib/practice";
const id = "10000000-0000-4000-8000-000000000001";
const now = new Date("2026-10-10T10:00:00Z");
const input = {
  road: "College Road" as const,
  note: "Deep pothole beside the gate",
  lat: 13.07,
  lng: 80.26,
  before: "/dataset-potholes/potholes1.png",
};
const submit = () =>
  changePractice(emptyPractice, { type: "submit", id, input }, "citizen", now);
const assign = (s: Practice) =>
  changePractice(
    s,
    {
      type: "assign",
      id,
      severity: 0.9,
      sensitive: true,
      contractor: "City Works",
      due: "2026-10-11",
    },
    "officer",
    now,
  );
const repair = (s: Practice) =>
  changePractice(
    s,
    { type: "repair", id, after: "/demo-repair.png" },
    "officer",
    now,
  );
describe("browser-local core lifecycle", () => {
  it("preserves the citizen ticket and four actor events through closure and reload", () => {
    const submitted = submit();
    const closed = changePractice(
      repair(assign(submitted)),
      { type: "verify", id, note: "Compared the before and after evidence." },
      "reviewer",
      now,
    );
    const restored = practiceSchema.parse(JSON.parse(JSON.stringify(closed)));
    expect(restored.tickets[0].status).toBe("closed");
    expect(restored.tickets[0].id).toBe(id);
    expect(restored.tickets[0].events.map((e) => e.role)).toEqual([
      "citizen",
      "officer",
      "officer",
      "reviewer",
    ]);
    expect(submitted.tickets[0].status).toBe("submitted");
    expect(emptyPractice.tickets).toHaveLength(0);
  });
  it("blocks assigning as a citizen and verification as an officer", () => {
    expect(() =>
      changePractice(
        submit(),
        {
          type: "assign",
          id,
          severity: 0.9,
          sensitive: false,
          contractor: "City Works",
          due: "2026-10-11",
        },
        "citizen",
        now,
      ),
    ).toThrow("role");
    expect(() =>
      changePractice(
        repair(assign(submit())),
        { type: "verify", id, note: "Everything looks repaired." },
        "officer",
        now,
      ),
    ).toThrow("role");
  });
  it("blocks closure before repair and repair before assignment", () => {
    expect(() =>
      changePractice(
        assign(submit()),
        { type: "verify", id, note: "Everything looks repaired." },
        "reviewer",
        now,
      ),
    ).toThrow("await review");
    expect(() => repair(submit())).toThrow("Assign");
  });
  it("rejects out-of-range coordinates and empty descriptions", () => {
    expect(() =>
      changePractice(
        emptyPractice,
        { type: "submit", id, input: { ...input, lat: 91 } },
        "citizen",
        now,
      ),
    ).toThrow();
    expect(() =>
      changePractice(
        emptyPractice,
        { type: "submit", id, input: { ...input, note: " " } },
        "citizen",
        now,
      ),
    ).toThrow();
  });
  it("requires actual supported evidence and a meaningful verification note", () => {
    expect(() =>
      changePractice(
        assign(submit()),
        { type: "repair", id, after: "" },
        "officer",
        now,
      ),
    ).toThrow();
    expect(() =>
      changePractice(
        repair(assign(submit())),
        { type: "verify", id, note: "ok" },
        "reviewer",
        now,
      ),
    ).toThrow();
    expect(() =>
      changePractice(
        emptyPractice,
        {
          type: "submit",
          id,
          input: { ...input, before: "https://untrusted.example/photo.png" },
        },
        "citizen",
        now,
      ),
    ).toThrow();
  });
  it("rejects stale due dates, impossible dates and missing contractors", () => {
    for (const due of ["2026-10-09", "2026-02-30"]) {
      expect(() =>
        changePractice(
          submit(),
          {
            type: "assign",
            id,
            severity: 0.9,
            sensitive: false,
            contractor: "City Works",
            due,
          },
          "officer",
          now,
        ),
      ).toThrow();
    }
    expect(() =>
      changePractice(
        submit(),
        {
          type: "assign",
          id,
          severity: 0.9,
          sensitive: false,
          contractor: " ",
          due: "2026-10-11",
        },
        "officer",
        now,
      ),
    ).toThrow();
  });
  it("retains earlier closed repairs when another report is submitted", () => {
    const closed = changePractice(
      repair(assign(submit())),
      { type: "verify", id, note: "Compared both evidence photos." },
      "reviewer",
      now,
    );
    const next = changePractice(
      closed,
      { type: "submit", id: "10000000-0000-4000-8000-000000000002", input },
      "citizen",
      now,
    );
    expect(next.tickets).toHaveLength(2);
    expect(next.tickets[1].status).toBe("closed");
  });
  it("rejects corrupt restored closed records without evidence or reviewer event", () => {
    const t = submit().tickets[0];
    expect(
      practiceSchema.safeParse({
        version: 1,
        tickets: [{ ...t, status: "closed" }],
      }).success,
    ).toBe(false);
    expect(practiceSchema.safeParse({ version: 2, tickets: [] }).success).toBe(
      false,
    );
  });
});
