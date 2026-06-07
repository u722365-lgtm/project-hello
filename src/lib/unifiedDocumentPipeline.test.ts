import { describe, expect, it } from "vitest";
import { buildDocumentPlan, shouldEnableResearch } from "./unifiedDocumentPipeline";

describe("unifiedDocumentPipeline", () => {
  it("enables research for report types and long lengths by default", () => {
    expect(shouldEnableResearch("report", "medium")).toBe(true);
    expect(shouldEnableResearch("email", "epic")).toBe(true);
    expect(shouldEnableResearch("email", "brief")).toBe(false);
    expect(shouldEnableResearch("memo", "short", false)).toBe(false);
    expect(shouldEnableResearch("memo", "short", true)).toBe(true);
  });

  it("builds a plan with audience and sections", () => {
    const plan = buildDocumentPlan({
      topic: "Q1 market outlook",
      docType: "report",
      tone: "professional",
      length: "long",
      audience: "Investors",
    });
    expect(plan.audience).toBe("Investors");
    expect(plan.enableResearch).toBe(true);
    expect(plan.sections.length).toBeGreaterThan(2);
    expect(plan.topic).toBe("Q1 market outlook");
  });
});
