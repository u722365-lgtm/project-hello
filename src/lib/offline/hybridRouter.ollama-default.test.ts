import { beforeEach, describe, expect, it, vi } from "vitest";
import { decideRoute } from "./hybridRouter";

const { isShadowTalkDesktop } = vi.hoisted(() => ({
  isShadowTalkDesktop: vi.fn(() => false),
}));

vi.mock("@/lib/desktopBridge", () => ({
  isShadowTalkDesktop,
}));

vi.mock("@/lib/desktop/sovereignMode", () => ({
  getSovereignRoutingMode: vi.fn(() => "auto"),
  isOllamaInferenceReady: vi.fn(() => true),
  isSovereignModeEnabled: vi.fn(() => false),
  shouldPreferOllamaInference: vi.fn(() => true),
}));

vi.mock("@/lib/privacy/deviceOnlyPledge", () => ({
  canUseCloudAI: vi.fn(() => true),
}));

vi.mock("./localChat", () => ({
  isAnyLocalModelReady: vi.fn(() => true),
}));

describe("decideRoute ollama default", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isShadowTalkDesktop.mockReturnValue(false);
  });

  it("prefers Ollama over browser models on web when Ollama is ready", () => {
    const route = decideRoute([{ role: "user", content: "Hello" }], true);
    expect(route.target).toBe("local");
    expect(route.backend).toBe("ollama");
    expect(route.reason).toMatch(/ollama default/i);
  });
});
