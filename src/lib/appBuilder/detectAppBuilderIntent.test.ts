import { describe, expect, it } from "vitest";
import { detectAppBuilderIntent } from "./detectAppBuilderIntent";

describe("detectAppBuilderIntent", () => {
  it("detects full web app requests", () => {
    const intent = detectAppBuilderIntent("Create a complete web app for a coffee shop menu");
    expect(intent).not.toBeNull();
    expect(intent?.platform).toBe("web");
    expect(intent?.confidence).toBeGreaterThanOrEqual(70);
  });

  it("detects mobile app requests", () => {
    const intent = detectAppBuilderIntent("Build me a mobile app for fitness tracking");
    expect(intent).not.toBeNull();
    expect(intent?.platform).toBe("mobile");
  });

  it("ignores small code snippets", () => {
    expect(detectAppBuilderIntent("fix this code")).toBeNull();
    expect(detectAppBuilderIntent("hi")).toBeNull();
  });
});
