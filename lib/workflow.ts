export type Role = "citizen" | "officer" | "reviewer";
export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role))
    throw new Error("Your role cannot perform this action.");
}
export function assertClosure(
  role: Role,
  status: string,
  afterPhoto: string | null,
) {
  assertRole(role, ["reviewer"]);
  if (status !== "repaired_pending_review")
    throw new Error("Repair must await review.");
  if (!afterPhoto) throw new Error("After-photo required.");
}
