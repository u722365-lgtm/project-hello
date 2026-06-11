import { beforeEach, describe, expect, it } from "vitest";
import {
  canUseCloudAI,
  ensureDeviceOnlyPledgeDefaults,
  hasCloudOptIn,
  isDeviceOnlyPledgeActive,
  setCloudOptIn,
  setDeviceOnlyPledgeActive,
  shouldPersistChatToCloud,
} from "./deviceOnlyPledge";

describe("deviceOnlyPledge", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to pledge active with no cloud opt-in", () => {
    ensureDeviceOnlyPledgeDefaults();
    expect(isDeviceOnlyPledgeActive()).toBe(true);
    expect(hasCloudOptIn()).toBe(false);
    expect(canUseCloudAI()).toBe(false);
    expect(shouldPersistChatToCloud()).toBe(false);
  });

  it("allows cloud only after explicit opt-in", () => {
    ensureDeviceOnlyPledgeDefaults();
    setCloudOptIn(true);
    expect(canUseCloudAI()).toBe(true);
    expect(shouldPersistChatToCloud()).toBe(true);
  });

  it("re-blocks cloud when pledge re-enabled", () => {
    setCloudOptIn(true);
    setDeviceOnlyPledgeActive(true);
    expect(canUseCloudAI()).toBe(false);
  });
});
