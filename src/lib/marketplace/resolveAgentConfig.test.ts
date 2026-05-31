import { describe, it, expect } from "vitest";
import { resolveAgentRuntime, agentRequiresPro } from "./resolveAgentConfig";

describe("resolveAgentConfig", () => {
  it("uses bundled runtime when DB config empty", () => {
    const runtime = resolveAgentRuntime({
      id: "ef812f4c-6b5e-429f-9ae4-97eebccd796f",
      name: "Security Audit Scanner",
      agent_config: null,
    });
    expect(runtime?.systemPrompt).toContain("Security Audit");
    expect(runtime?.starterPrompts.length).toBeGreaterThan(0);
  });

  it("detects pro-priced agents", () => {
    expect(agentRequiresPro({ price: "Pro" })).toBe(true);
    expect(agentRequiresPro({ price: "Free" })).toBe(false);
  });
});
