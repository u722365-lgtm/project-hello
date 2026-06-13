import { describe, expect, it } from "vitest";
import { FEATURES } from "@/hooks/useFeatureGating";
import { FREE_TIER_DAILY } from "@/lib/productClaims";

describe("productClaims parity", () => {
  it("feature gating free limits match productClaims SSOT", () => {
    expect(FEATURES.dailyMessages.freeLimit).toBe(FREE_TIER_DAILY.messages);
    expect(FEATURES.imageGeneration.freeLimit).toBe(FREE_TIER_DAILY.imageGenerations);
  });
});
