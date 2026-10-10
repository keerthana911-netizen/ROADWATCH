import { it, expect, vi } from "vitest";
import { assertRole, type Role } from "../lib/workflow";
vi.mock("../lib/supabase", () => ({
  requireRole: async (allowed: Role[]) => {
    assertRole("citizen", allowed);
    throw new Error("Unexpected citizen access");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import {
  groupReport,
  assignRepair,
  markRepaired,
  verifyRepair,
  decideSuggestion,
  confirmDuplicate,
} from "../lib/actions";
it.each([
  ["group", groupReport],
  ["assign", assignRepair],
  ["repair", markRepaired],
  ["verify", verifyRepair],
  ["AI decision", decideSuggestion],
  ["AI merge", confirmDuplicate],
] as const)(
  "Server Action rejects citizen before %s mutation",
  async (_, action) => {
    await expect(action(new FormData())).rejects.toThrow(
      "Your role cannot perform this action",
    );
  },
);
