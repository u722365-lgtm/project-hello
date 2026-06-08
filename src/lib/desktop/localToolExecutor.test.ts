import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeLocalMissionTool } from "./localToolExecutor";

vi.mock("@/lib/desktop/localAgentCompletion", () => ({
  streamLocalAgentCompletion: vi.fn(async () => "Local synthesis output"),
}));

vi.mock("@/lib/desktop/sovereignMemoryRag", () => ({
  retrieveSovereignMemoryContext: vi.fn(async () => ""),
}));

vi.mock("@/lib/desktop/localMemoryStore", () => ({
  searchLocalMemories: vi.fn(async () => [
    { id: "1", text: "ShadowTalk uses agentic missions", similarity: 0.8, category: "chat" as const },
  ]),
  formatMemoryContext: vi.fn(() => "## LOCAL MEMORY\n1. ShadowTalk uses agentic missions"),
}));

describe("executeLocalMissionTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs synthesis locally", async () => {
    const result = await executeLocalMissionTool(
      { id: "s1", action: "Compile findings", tool_name: "synthesis", status: "pending" },
      "Research ShadowTalk",
      ["prior data"],
    );
    expect(result.success).toBe(true);
    expect(result.output).toContain("Local synthesis");
  });

  it("blocks cloud-only tools offline", async () => {
    const result = await executeLocalMissionTool(
      { id: "s2", action: "Read inbox", tool_name: "read_emails", status: "pending" },
      "Email triage",
      [],
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("OFFLINE_TOOL");
  });
});
