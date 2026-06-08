import { beforeEach, describe, expect, it } from "vitest";
import {
  getShadowScaleClientId,
  isShadowScaleEngineEnabled,
  setShadowScaleEngineEnabled,
} from "./shadowScaleConfig";
import { drainGrowthEvents, recordGrowthEvent } from "./growthEvents";

describe("shadowScaleEngine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates stable client id", () => {
    const a = getShadowScaleClientId();
    const b = getShadowScaleClientId();
    expect(a).toBe(b);
    expect(a.startsWith("ssc_")).toBe(true);
  });

  it("records and drains growth events", () => {
    recordGrowthEvent("share", "test");
    const events = drainGrowthEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("share");
    expect(drainGrowthEvents()).toHaveLength(0);
  });

  it("respects engine enabled flag", () => {
    expect(isShadowScaleEngineEnabled()).toBe(true);
    setShadowScaleEngineEnabled(false);
    expect(isShadowScaleEngineEnabled()).toBe(false);
  });
});
