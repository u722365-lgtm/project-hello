import { describe, it, expect, beforeEach } from "vitest";
import {
  activateForceOfflineSession,
  deactivateForceOfflineSession,
  getActiveQuickModelId,
  isForceOfflineSessionActive,
  setHeavyDownloadInProgress,
  isHeavyDownloadInProgress,
} from "./forceOfflineSession";
import { getRoutingMode } from "./hybridRouter";

describe("forceOfflineSession", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("activates offline session and blocks cloud routing pref", () => {
    activateForceOfflineSession("SmolLM2-135M-Instruct-q4f16_1-MLC");
    expect(isForceOfflineSessionActive()).toBe(true);
    expect(getActiveQuickModelId()).toBe("SmolLM2-135M-Instruct-q4f16_1-MLC");
    expect(getRoutingMode()).toBe("local-only");
  });

  it("deactivates offline session", () => {
    activateForceOfflineSession("test-model");
    deactivateForceOfflineSession();
    expect(isForceOfflineSessionActive()).toBe(false);
    expect(getRoutingMode()).toBe("auto");
  });

  it("tracks heavy download flag in sessionStorage", () => {
    expect(isHeavyDownloadInProgress()).toBe(false);
    setHeavyDownloadInProgress(true);
    expect(isHeavyDownloadInProgress()).toBe(true);
    setHeavyDownloadInProgress(false);
    expect(isHeavyDownloadInProgress()).toBe(false);
  });
});
