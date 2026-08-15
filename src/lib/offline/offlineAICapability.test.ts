import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectOfflineAIPath, shouldSkipTierABootstrap } from "./offlineAICapability";

vi.mock("@/lib/offline/localChat", () => ({
  isAnyLocalModelReady: vi.fn(() => false),
}));

vi.mock("@/lib/offline/gemmaEngine", () => ({
  getGemmaEngine: vi.fn(() => ({ isReady: false })),
}));

describe("offlineAICapability", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { isAnyLocalModelReady } = await import("@/lib/offline/localChat");
    const { getGemmaEngine } = await import("@/lib/offline/gemmaEngine");
    vi.mocked(isAnyLocalModelReady).mockReturnValue(false);
    vi.mocked(getGemmaEngine).mockReturnValue({ isReady: false } as ReturnType<typeof getGemmaEngine>);
  });

  it("returns none when no offline path is available", async () => {
    expect(await detectOfflineAIPath()).toBe("none");
    expect(await shouldSkipTierABootstrap()).toBe(false);
  });

  it("skips Tier A when browser model is ready", async () => {
    const { isAnyLocalModelReady } = await import("@/lib/offline/localChat");
    vi.mocked(isAnyLocalModelReady).mockReturnValue(true);
    expect(await detectOfflineAIPath()).toBe("browser");
    expect(await shouldSkipTierABootstrap()).toBe(true);
  });

  it("skips Tier A when Gemma is ready", async () => {
    const { getGemmaEngine } = await import("@/lib/offline/gemmaEngine");
    vi.mocked(getGemmaEngine).mockReturnValue({ isReady: true } as ReturnType<typeof getGemmaEngine>);
    expect(await detectOfflineAIPath()).toBe("gemma");
    expect(await shouldSkipTierABootstrap()).toBe(true);
  });
});
