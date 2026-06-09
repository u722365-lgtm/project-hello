import { describe, expect, it } from "vitest";
import { canAccessVideoStudio } from "./planAccess";

describe("canAccessVideoStudio", () => {
  it("allows pro and elite tiers", () => {
    expect(canAccessVideoStudio("pro")).toBe(true);
    expect(canAccessVideoStudio("elite")).toBe(true);
    expect(canAccessVideoStudio("premium")).toBe(true);
    expect(canAccessVideoStudio("enterprise")).toBe(true);
  });

  it("blocks free", () => {
    expect(canAccessVideoStudio("free")).toBe(false);
  });

  it("allows special access bypass", () => {
    expect(canAccessVideoStudio("free", true)).toBe(true);
  });
});
