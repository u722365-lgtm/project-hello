import { describe, expect, it } from "vitest";
import { buildWorkspacePrompt } from "./buildWorkspacePrompt";

describe("buildWorkspacePrompt", () => {
  it("includes task and file contents", () => {
    const prompt = buildWorkspacePrompt(
      "Add dark mode toggle",
      [{ name: "app.js", content: "console.log('hi')", language: "javascript" }],
      "app.js",
    );
    expect(prompt).toContain("Add dark mode toggle");
    expect(prompt).toContain("=== FILE: app.js");
    expect(prompt).toContain("console.log('hi')");
    expect(prompt).toContain("app.js");
  });
});
