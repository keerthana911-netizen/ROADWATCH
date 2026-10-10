import { z } from "zod";
import { assertRole, assertClosure, type Role } from "./workflow";
export const practiceRoads = [
  "College Road",
  "Hospital Road",
  "Market Street",
  "Station Road",
  "Lake Avenue",
] as const;
const photo = z
  .string()
  .max(3_000_000)
  .refine(
    (v) =>
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ||
      v === "/dataset-potholes/potholes1.png" ||
      v === "/demo-repair.png",
    "Choose a supported photo.",
  );
const reportInput = z.object({
  road: z.enum(practiceRoads),
  note: z
    .string()
    .trim()
    .min(10, "Describe the damage in at least 10 characters.")
    .max(500),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  before: photo,
});
const event = z.object({
  at: z.string().datetime(),
  role: z.enum(["citizen", "officer", "reviewer"]),
  text: z.string().max(600),
});
const ticket = reportInput
  .extend({
    id: z.string().uuid(),
    created: z.string().datetime(),
    status: z.enum([
      "submitted",
      "assigned",
      "repaired_pending_review",
      "closed",
    ]),
    severity: z.number().min(0).max(1).nullable(),
    sensitive: z.boolean(),
    contractor: z.string().max(80),
    due: z.string(),
    after: photo.nullable(),
    verification: z.string().max(500),
    events: z.array(event).max(10),
  })
  .superRefine((t, ctx) => {
    if (
      t.status !== "submitted" &&
      (t.severity === null ||
        !t.contractor.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(t.due))
    )
      ctx.addIssue({
        code: "custom",
        message: "Assigned jobs require severity, a contractor and a due date.",
      });
    if (["repaired_pending_review", "closed"].includes(t.status) && !t.after)
      ctx.addIssue({ code: "custom", message: "Repair evidence is missing." });
    if (
      t.status === "closed" &&
      (t.verification.trim().length < 10 ||
        t.events.at(-1)?.role !== "reviewer")
    )
      ctx.addIssue({
        code: "custom",
        message: "Reviewer verification is missing.",
      });
  });
export const practiceSchema = z.object({
  version: z.literal(1),
  tickets: z.array(ticket).max(10),
});
export type Practice = z.infer<typeof practiceSchema>;
export type PracticeTicket = Practice["tickets"][number];
export const emptyPractice: Practice = { version: 1, tickets: [] };
export type PracticeAction =
  | { type: "submit"; id: string; input: z.input<typeof reportInput> }
  | {
      type: "assign";
      id: string;
      severity: number;
      sensitive: boolean;
      contractor: string;
      due: string;
    }
  | { type: "repair"; id: string; after: string }
  | { type: "verify"; id: string; note: string };
export function changePractice(
  state: Practice,
  action: PracticeAction,
  role: Role,
  now = new Date(),
): Practice {
  const next = structuredClone(practiceSchema.parse(state));
  const at = now.toISOString();
  if (action.type === "submit") {
    assertRole(role, ["citizen"]);
    if (next.tickets.length >= 10)
      throw new Error(
        "This practice holds up to 10 tickets. Export and reset to start another session.",
      );
    if (next.tickets.some((t) => t.id === action.id))
      throw new Error("Ticket already exists.");
    next.tickets.unshift({
      ...reportInput.parse(action.input),
      id: z.string().uuid().parse(action.id),
      created: at,
      status: "submitted",
      severity: null,
      sensitive: false,
      contractor: "",
      due: "",
      after: null,
      verification: "",
      events: [
        {
          at,
          role,
          text: "Citizen submitted photo, location and description.",
        },
      ],
    });
  } else {
    const t = next.tickets.find((t) => t.id === action.id);
    if (!t)
      throw new Error(
        "Ticket not found. Choose a ticket from your practice workspace.",
      );
    let text = "";
    if (action.type === "assign") {
      assertRole(role, ["officer"]);
      if (t.status !== "submitted")
        throw new Error("Only new reports can be assigned.");
      const a = z
        .object({
          severity: z.number().min(0).max(1),
          contractor: z
            .string()
            .trim()
            .min(2, "Enter a contractor name.")
            .max(80),
          due: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date.")
            .refine(
              (d) =>
                Number.isFinite(Date.parse(d)) &&
                new Date(d).toISOString().slice(0, 10) === d &&
                d >= at.slice(0, 10),
              "Due date must be today or later.",
            ),
        })
        .parse(action);
      Object.assign(t, a, { sensitive: action.sensitive, status: "assigned" });
      text = `Officer confirmed severity and assigned ${a.contractor}, due ${a.due}.`;
    } else if (action.type === "repair") {
      assertRole(role, ["officer"]);
      if (t.status !== "assigned")
        throw new Error("Assign this job before recording a repair.");
      t.after = photo.parse(action.after);
      t.status = "repaired_pending_review";
      text =
        "Officer recorded repair evidence. Reviewer verification required.";
    } else {
      assertClosure(role, t.status, t.after);
      t.verification = z
        .string()
        .trim()
        .min(10, "Explain your verification in at least 10 characters.")
        .max(500)
        .parse(action.note);
      t.status = "closed";
      text = `Reviewer verified the repair: ${t.verification}`;
    }
    t.events.push({ at, role, text });
  }
  return practiceSchema.parse(next);
}
export function practiceError(error: unknown) {
  return error instanceof z.ZodError
    ? (error.issues[0]?.message ?? "Check your inputs.")
    : error instanceof Error
      ? error.message
      : "Unable to complete this step. Please try again.";
}
