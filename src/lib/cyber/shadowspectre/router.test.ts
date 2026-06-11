import { describe, expect, it } from "vitest";
import { routeShadowSpectreHead } from "./router";

describe("routeShadowSpectreHead", () => {
  it("routes CVE questions to intel", () => {
    expect(routeShadowSpectreHead("Analyze CVE-2024-1234 CVSS score")).toBe("intel");
  });

  it("routes sigma rules to blue", () => {
    expect(routeShadowSpectreHead("Write a Sigma rule for mimikatz")).toBe("blue");
  });

  it("routes SQLi to exploit", () => {
    expect(routeShadowSpectreHead("SQLi payload for login bypass")).toBe("exploit");
  });

  it("respects explicit head override", () => {
    expect(routeShadowSpectreHead("hello", "grc")).toBe("grc");
  });
});
