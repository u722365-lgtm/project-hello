import { beforeEach, describe, expect, it } from "vitest";
import { decideRoute } from "./hybridRouter";
import {
  ensureDeviceOnlyPledgeDefaults,
  setInterimCloudConsent,
} from "@/lib/privacy/deviceOnlyPledge";

describe("hybridRouter device-only pledge", () => {
  beforeEach(() => {
    localStorage.clear();
    ensureDeviceOnlyPledgeDefaults();
  });

  it("routes local when pledge is active without interim consent", () => {
    const route = decideRoute([{ role: "user", content: "hello" }], true);
    expect(route.target).toBe("local");
    expect(route.reason.toLowerCase()).toMatch(/device-only|local|ollama|offline|load/);
  });

  it("can route to cloud with interim consent while online", () => {
    setInterimCloudConsent(true);
    const route = decideRoute([{ role: "user", content: "hello" }], true);
    expect(route.target).toBe("cloud");
  });
});
