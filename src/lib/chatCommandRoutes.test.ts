import { describe, expect, it } from "vitest";
import { CHAT_COMMAND_MODAL_ACTIONS, CHAT_COMMAND_NAV_ROUTES } from "./chatCommandRoutes";

describe("chatCommandRoutes wiring", () => {
  it("modal actions do not also navigate away", () => {
    for (const action of CHAT_COMMAND_MODAL_ACTIONS) {
      expect(CHAT_COMMAND_NAV_ROUTES[action]).toBeUndefined();
    }
  });

  it("includes all in-chat tool modals", () => {
    const required = [
      "multi-model",
      "creative",
      "vision",
      "camera",
      "vision-agent",
      "screen-agent",
      "agentic",
      "agent-workflows",
      "analytics",
      "gemini-analytics",
      "organize",
      "uncensored-arena",
      "shadow-cowork",
      "knowledge-vault",
      "planner",
      "image-decoder",
      "cognitive-loop",
      "memory-panel",
      "intelligence-hub",
    ];
    for (const action of required) {
      expect(CHAT_COMMAND_MODAL_ACTIONS.has(action)).toBe(true);
    }
  });

  it("routes broken enterprise-license path to enterprise settings", () => {
    expect(CHAT_COMMAND_NAV_ROUTES["white-label"]).toBe("/enterprise");
    expect(CHAT_COMMAND_NAV_ROUTES["fine-tuning"]).toBe("/personal-llm");
  });

  it("routes computer mode and referral", () => {
    expect(CHAT_COMMAND_NAV_ROUTES.computer).toBe("/computer");
    expect(CHAT_COMMAND_NAV_ROUTES.referral).toBe("/referral");
  });

  it("handles branching in-chat without nav loop", () => {
    expect(CHAT_COMMAND_MODAL_ACTIONS.has("branching")).toBe(true);
    expect(CHAT_COMMAND_NAV_ROUTES.branching).toBeUndefined();
  });
});
