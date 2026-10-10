import { describe, it, expect, vi, beforeEach } from "vitest";
const mocked = vi.hoisted(() => ({
  rpc: vi.fn(),
  completion: vi.fn(),
  session: vi.fn(),
  cached: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({
  supabase: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => ({ limit: () => ({ maybeSingle: mocked.cached }) }),
          }),
        }),
      }),
    }),
    rpc: mocked.rpc,
  }),
  requireRole: mocked.session,
}));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mocked.completion } };
  },
}));
import { aiEnabled, triageReport, parseVoice } from "../lib/ai";
describe("optional AI runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    mocked.cached.mockResolvedValue({ data: null });
    mocked.session.mockResolvedValue({ user: { id: "actor" } });
  });
  it("no key bypasses photo AI without any database or model work", async () => {
    expect(aiEnabled()).toBe(false);
    expect(await triageReport("report")).toBeNull();
    expect(mocked.session).not.toHaveBeenCalled();
    expect(mocked.completion).not.toHaveBeenCalled();
  });
  it("voice parsing degrades without a key", async () => {
    expect(await parseVoice("a pothole")).toBeNull();
    expect(mocked.completion).not.toHaveBeenCalled();
    expect(mocked.rpc).not.toHaveBeenCalled();
  });
  it("malformed model output never reaches suggestion storage", async () => {
    process.env.OPENAI_API_KEY = "test-only";
    mocked.completion.mockResolvedValue({
      choices: [{ message: { content: '{"note":42}' } }],
    });
    expect(await parseVoice("a pothole")).toBeNull();
    expect(mocked.rpc).not.toHaveBeenCalled();
    delete process.env.OPENAI_API_KEY;
  });
  it("model failures do not break the deterministic flow", async () => {
    process.env.OPENAI_API_KEY = "test-only";
    mocked.completion.mockRejectedValue(new Error("offline"));
    expect(await parseVoice("a pothole")).toBeNull();
    expect(mocked.rpc).not.toHaveBeenCalled();
    delete process.env.OPENAI_API_KEY;
  });
  it("valid output is logged pending and never writes operational fields", async () => {
    process.env.OPENAI_API_KEY = "test-only";
    mocked.completion.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              '{"note":"Pothole outside college","landmark":"college","severity_hint":"severe"}',
          },
        },
      ],
    });
    mocked.rpc.mockResolvedValue({ data: "suggestion-id", error: null });
    const result = await parseVoice("a pothole outside college");
    expect(result?.decision).toBe("pending");
    expect(mocked.rpc).toHaveBeenCalledTimes(1);
    expect(mocked.rpc.mock.calls[0][0]).toBe("log_ai");
    expect(mocked.rpc.mock.calls[0][1]).not.toHaveProperty("status");
    delete process.env.OPENAI_API_KEY;
  });
});
