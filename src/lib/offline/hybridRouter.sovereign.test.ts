import { beforeEach, describe, expect, it, vi } from "vitest";
import { decideRoute } from "./hybridRouter";

vi.mock("@/lib/desktopBridge", () => ({
  isShadowTalkDesktop: vi.fn(() => true),
}));

vi.mock("@/lib/desktop/sovereignMode", () => ({
  getSovereignRoutingMode: vi.fn(() => "sovereign"),
  isOllamaInferenceReady: vi.fn(() => true),
  isSovereignModeEnabled: vi.fn(() => true),
  shouldPreferOllamaInference: vi.fn(() => true),
}));

vi.mock("./localChat", () => ({
  isAnyLocalModelReady: vi.fn(() => false),
}));

describe("decideRoute sovereign desktop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to Ollama in sovereign mode when ready", () => {
    const route = decideRoute([{ role: "user", content: "Hello" }], true);
    expect(route.target).toBe("local");
    expect(route.backend).toBe("ollama");
    expect(route.reason).toMatch(/sovereign/i);
  });
});
