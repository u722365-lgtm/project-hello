import { describe, expect, it, beforeEach } from "vitest";
import {
  buildPersonalModelSystemBlock,
  ensureDefaultPersonalModel,
  learnPersonalExampleFromTurn,
  loadPersonalModels,
} from "./index";

describe("personalModel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates default My ShadowTalk model", () => {
    const model = ensureDefaultPersonalModel();
    expect(model.name).toBe("My ShadowTalk");
    expect(model.isActive).toBe(true);
    expect(loadPersonalModels()).toHaveLength(1);
  });

  it("learns from chat turns when autoLearn enabled", () => {
    ensureDefaultPersonalModel();
    learnPersonalExampleFromTurn("How do I use strategy agent?", "Open /strategy and describe your goal.");
    const models = loadPersonalModels();
    expect(models[0].trainingExamples.length).toBe(1);
  });

  it("buildPersonalModelSystemBlock includes few-shot examples", () => {
    const model = ensureDefaultPersonalModel();
    model.trainingExamples.push({
      id: "1",
      userMessage: "Plan my launch",
      assistantResponse: "Here is a 90-day GTM plan with channels and KPIs.",
    });
    const block = buildPersonalModelSystemBlock(model, "launch plan");
    expect(block).toContain("Personally trained ShadowTalk");
    expect(block).toContain("Plan my launch");
  });
});
