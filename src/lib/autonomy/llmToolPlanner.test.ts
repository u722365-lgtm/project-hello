import { describe, expect, it } from "vitest";
import { plannerStepToDetection } from "./llmToolPlanner";

describe("plannerStepToDetection", () => {
  it("maps web_search step to detection with high confidence when autoExecute", () => {
    const detection = plannerStepToDetection(
      {
        tool: "web_search",
        params: { query: "latest AI regulation EU" },
        rationale: "Needs live data",
        autoExecute: true,
      },
      "search latest AI regulation in EU",
    );
    expect(detection.tool).toBe("web_search");
    expect(detection.confidence).toBeGreaterThanOrEqual(90);
    expect(detection.autoExecute).toBe(true);
    expect(detection.params?.query).toBe("latest AI regulation EU");
  });

  it("maps cognitive_loop step", () => {
    const detection = plannerStepToDetection(
      {
        tool: "cognitive_loop",
        params: {},
        rationale: "Multi-agent debate",
        autoExecute: true,
      },
      "Should we build vs buy our billing system?",
    );
    expect(detection.tool).toBe("cognitive_loop");
    expect(detection.autoExecute).toBe(true);
  });

  it("returns null tool for none", () => {
    const detection = plannerStepToDetection(
      { tool: "none", params: {}, rationale: "plain chat", autoExecute: true },
      "hello",
    );
    expect(detection.tool).toBeNull();
    expect(detection.confidence).toBe(0);
  });

  it("maps strategy_agent to strategy_agent deliverable routing", () => {
    const detection = plannerStepToDetection(
      {
        tool: "strategy_agent",
        params: { goal: "GTM plan" },
        rationale: "Multi-step mission",
        autoExecute: true,
      },
      "Create a go-to-market strategy",
    );
    expect(detection.tool).toBe("strategy_agent");
  });
});
