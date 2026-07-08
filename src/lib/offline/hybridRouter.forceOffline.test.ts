import { beforeEach, describe, expect, it } from "vitest";
import { decideRoute, setRoutingMode } from "./hybridRouter";
import { activateForceOfflineSession } from "./forceOfflineSession";
import { ensureDeviceOnlyPledgeDefaults, setInterimCloudConsent } from "@/lib/privacy/deviceOnlyPledge";

describe("hybridRouter force-offline session", () => {
  beforeEach(() => {
    localStorage.clear();
    ensureDeviceOnlyPledgeDefaults();
    setInterimCloudConsent(true);
    setRoutingMode("local-only");
  });

  it("never routes to cloud while force-offline session is active", () => {
    activateForceOfflineSession("SmolLM2-135M-Instruct-q0f16-MLC");
    const route = decideRoute([{ role: "user", content: "hello" }], true);
    expect(route.target).toBe("local");
    expect(route.target).not.toBe("cloud");
  });
});
