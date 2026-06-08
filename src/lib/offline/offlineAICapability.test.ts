import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectOfflineAIPath, shouldSkipTierABootstrap } from "./offlineAICapability";

vi.mock("@/lib/desktopBridge", () => ({
  isShadowTalkDesktop: vi.fn(() => false),
  getDesktopInfo: vi.fn(async () => null),
}));

vi.mock("@/lib/desktop/ollamaInference", () => ({
  fetchOllamaStatus: vi.fn(async () => null),
}));

vi.mock("@/lib/offline/localChat", () => ({
  isAnyLocalModelReady: vi.fn(() => false),
}));

vi.mock("@/lib/offline/gemmaEngine", () => ({
  getGemmaEngine: vi.fn(() => ({ isReady: false })),
}));

describe("offlineAICapability", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { isShadowTalkDesktop, getDesktopInfo } = await import("@/lib/desktopBridge");
    const { fetchOllamaStatus } = await import("@/lib/desktop/ollamaInference");
    const { isAnyLocalModelReady } = await import("@/lib/offline/localChat");
    const { getGemmaEngine } = await import("@/lib/offline/gemmaEngine");
    vi.mocked(isShadowTalkDesktop).mockReturnValue(false);
    vi.mocked(getDesktopInfo).mockResolvedValue(null);
    vi.mocked(fetchOllamaStatus).mockResolvedValue(null);
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

  it("skips Tier A on desktop when Ollama is bundled", async () => {
    const { isShadowTalkDesktop, getDesktopInfo } = await import("@/lib/desktopBridge");
    vi.mocked(isShadowTalkDesktop).mockReturnValue(true);
    vi.mocked(getDesktopInfo).mockResolvedValue({
      platform: "linux",
      arch: "x64",
      appVersion: "1.0.0",
      electronVersion: "30",
      chromeVersion: "120",
      userDataPath: "/tmp",
      documentsPath: "/tmp",
      homePath: "/tmp",
      shadowtalkDataPath: "/tmp",
      ollamaBundled: true,
    });

    expect(await detectOfflineAIPath()).toBe("ollama");
    expect(await shouldSkipTierABootstrap()).toBe(true);
  });

  it("skips Tier A on desktop when Ollama is reachable", async () => {
    const { isShadowTalkDesktop } = await import("@/lib/desktopBridge");
    const { fetchOllamaStatus } = await import("@/lib/desktop/ollamaInference");
    vi.mocked(isShadowTalkDesktop).mockReturnValue(true);
    vi.mocked(fetchOllamaStatus).mockResolvedValue({
      reachable: true,
      models: [],
      activeModel: "qwen2.5:7b",
      baseUrl: "http://127.0.0.1:11434",
    });

    expect(await detectOfflineAIPath()).toBe("ollama");
    expect(await shouldSkipTierABootstrap()).toBe(true);
  });
});
