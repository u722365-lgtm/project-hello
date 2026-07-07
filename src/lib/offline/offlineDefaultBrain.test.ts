import { describe, expect, it } from "vitest";
import {
  buildTierASystemPrompt,
  mergeMessagesForTierA,
  retrieveOfflineKnowledge,
} from "./offlineDefaultBrain";

describe("offlineDefaultBrain", () => {
  it("retrieves strategy-related facts for strategy queries", () => {
    const chunks = retrieveOfflineKnowledge("AI strategy consultant business plan", 3);
    expect(chunks.length).toBeGreaterThan(0);
    const text = chunks.map((c) => c.text).join(" ");
    expect(text.toLowerCase()).toMatch(/shadowtalk|strategy|business/);
  });

  it("buildTierASystemPrompt includes product brief and session context", () => {
    const prompt = buildTierASystemPrompt(
      [{ role: "system", content: "User prefers bullet lists." }, { role: "user", content: "What is ShadowTalk?" }],
      "What is ShadowTalk?",
    );
    expect(prompt).toContain("ShadowTalk AI");
    expect(prompt).toContain("User prefers bullet lists");
    expect(prompt).toContain("Relevant facts");
  });

  it("mergeMessagesForTierA collapses to single system message", () => {
    const merged = mergeMessagesForTierA([
      { role: "system", content: "Extra context" },
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ]);
    expect(merged.filter((m) => m.role === "system")).toHaveLength(1);
    expect(merged.some((m) => m.role === "user" && m.content === "Hello")).toBe(true);
  });
});
