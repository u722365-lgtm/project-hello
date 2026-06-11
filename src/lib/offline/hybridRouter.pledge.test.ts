import { beforeEach, describe, expect, it } from "vitest";
import { decideRoute } from "./hybridRouter";
import { ensureDeviceOnlyPledgeDefaults } from "@/lib/privacy/deviceOnlyPledge";

describe("hybridRouter device-only pledge", () => {
  beforeEach(() => {
    localStorage.clear();
    ensureDeviceOnlyPledgeDefaults();
  });

  it("never routes to cloud when pledge is active", () => {
    const route = decideRoute([{ role: "user", content: "hello" }], true);
    expect(route.target).toBe("local");
    expect(route.reason.toLowerCase()).toMatch(/device-only|local|ollama|offline|load/);
  });
});
