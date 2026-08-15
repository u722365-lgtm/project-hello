import { beforeEach, describe, expect, it, vi } from "vitest";
import { setAnonymousAutonomousEnabled } from "@/lib/anonymousAutonomousMode";
import {
  isSovereignAgentsEnabled,
  setSovereignAgentsEnabled,
  shouldUseLocalAgent,
} from "./sovereignAgentMode";

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

describe("sovereignAgentMode", () => {
  beforeEach(() => {
    localStorage.clear();
    setAnonymousAutonomousEnabled(false);
    setSovereignAgentsEnabled(true);
  });

  it("enables local agents on desktop when local model is ready", () => {
    expect(isSovereignAgentsEnabled()).toBe(true);
    expect(shouldUseLocalAgent()).toBe(true);
  });

  it("disables local agents when toggled off", () => {
    setSovereignAgentsEnabled(false);
    expect(shouldUseLocalAgent()).toBe(false);
  });
});
