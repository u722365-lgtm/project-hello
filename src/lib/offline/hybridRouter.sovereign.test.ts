import { beforeEach, describe, expect, it, vi } from "vitest";
import { decideRoute } from "./hybridRouter";

vi.mock("@/lib/desktopBridge", () => ({
  isShadowTalkDesktop: vi.fn(() => true),
}));

vi.mock("@/lib/desktop/sovereignMode", () => ({
  getSovereignRoutingMode: vi.fn(() => "sovereign"),
  isSovereignModeEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/offline/localChat", () => ({
  isAnyLocalModelReady: vi.fn(() => true),
}));

describe("decideRoute sovereign desktop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to browser model in sovereign mode when local model is ready", () => {
    const route = decideRoute([{ role: "user", content: "Hello" }], true);
    expect(route.target).toBe("local");
    expect(route.backend).toBe("browser");
    expect(route.reason).toMatch(/sovereign/i);
  });
});
