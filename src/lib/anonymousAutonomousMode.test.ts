import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAnonymousAutonomousDefaults,
  getAnonymousSessionId,
  isAnonymousAutonomousEnabled,
  setAnonymousAutonomousEnabled,
  shouldAutoApproveMissions,
  shouldUseAnonymousMissionStore,
} from "./anonymousAutonomousMode";

describe("anonymousAutonomousMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults anonymous autonomous mode on", () => {
    expect(isAnonymousAutonomousEnabled()).toBe(true);
    expect(shouldUseAnonymousMissionStore()).toBe(true);
  });

  it("can disable anonymous autonomous mode", () => {
    setAnonymousAutonomousEnabled(false);
    expect(isAnonymousAutonomousEnabled()).toBe(false);
    expect(shouldUseAnonymousMissionStore()).toBe(false);
  });

  it("auto-approves missions when autonomous + anonymous defaults apply", () => {
    applyAnonymousAutonomousDefaults();
    expect(shouldAutoApproveMissions()).toBe(true);
  });

  it("issues a stable anonymous session id", () => {
    const a = getAnonymousSessionId();
    const b = getAnonymousSessionId();
    expect(a).toBe(b);
    expect(a.startsWith("anon_")).toBe(true);
  });
});
