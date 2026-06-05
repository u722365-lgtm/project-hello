import { describe, expect, it } from "vitest";
import { resolvePlanFromCheckSubscription } from "./resolveUserPlan";

describe("resolvePlanFromCheckSubscription", () => {
  it("grants enterprise to Shan Foods email domains", () => {
    const result = resolvePlanFromCheckSubscription("ali.khan@shanfoods.com", null);
    expect(result.plan).toBe("enterprise");
    expect(result.subscribed).toBe(true);
  });

  it("maps check-subscription plan field", () => {
    const result = resolvePlanFromCheckSubscription("user@example.com", {
      subscribed: true,
      plan: "premium",
      subscription_end: "2026-12-01",
    });
    expect(result.plan).toBe("premium");
    expect(result.subscribed).toBe(true);
  });

  it("falls back to product_id when plan missing", () => {
    const result = resolvePlanFromCheckSubscription("user@example.com", {
      subscribed: true,
      product_id: "prod_TbhEVUPSLMSF53",
    });
    expect(result.plan).toBe("elite");
  });
});
