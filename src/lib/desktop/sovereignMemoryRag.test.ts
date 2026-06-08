import { beforeEach, describe, expect, it, vi } from "vitest";
import { augmentMessagesWithLocalMemory } from "./sovereignMemoryRag";

vi.mock("@/lib/desktopBridge", () => ({
  isShadowTalkDesktop: vi.fn(() => true),
}));

vi.mock("@/lib/desktop/sovereignMode", () => ({
  isSovereignModeEnabled: vi.fn(() => true),
  shouldPreferOllamaInference: vi.fn(() => true),
}));

vi.mock("@/lib/desktop/localMemoryStore", () => ({
  searchLocalMemories: vi.fn(async () => [
    {
      id: "m1",
      text: "ShadowTalk mission control uses local agents",
      similarity: 0.85,
      category: "chat" as const,
      source: "assistant",
    },
  ]),
  formatMemoryContext: vi.fn(
    () => "## LOCAL MEMORY\n1. ShadowTalk mission control uses local agents",
  ),
}));

describe("sovereignMemoryRag", () => {
  beforeEach(() => {
    localStorage.setItem("shadowtalk_sovereign_memory_index", "1");
  });

  it("augments messages with retrieved local memory", async () => {
    const out = await augmentMessagesWithLocalMemory([
      { role: "user", content: "How does mission control work?" },
    ]);
    expect(out[0].role).toBe("system");
    expect(out[0].content).toContain("LOCAL MEMORY");
    expect(out[1].content).toContain("mission control");
  });
});
