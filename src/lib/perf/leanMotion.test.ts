import { beforeEach, describe, expect, it } from "vitest";
import {
  applyLeanMotionClass,
  isLeanMotionEnabled,
  setLeanMotionEnabled,
  shouldReduceMotionForPerf,
} from "./leanMotion";

describe("leanMotion", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset module cache via setLeanMotionEnabled after clear
    setLeanMotionEnabled(true);
  });

  it("is enabled by default", () => {
    localStorage.clear();
    setLeanMotionEnabled(true);
    expect(isLeanMotionEnabled()).toBe(true);
  });

  it("lean motion is always on for performance", () => {
    setLeanMotionEnabled(false);
    expect(isLeanMotionEnabled()).toBe(true);
  });

  it("forces reduced motion for perf when lean is on", () => {
    setLeanMotionEnabled(true);
    expect(shouldReduceMotionForPerf(false)).toBe(true);
    expect(shouldReduceMotionForPerf(true)).toBe(true);
  });


  it("applies lean-motion class on html", () => {
    setLeanMotionEnabled(true);
    applyLeanMotionClass();
    expect(document.documentElement.classList.contains("lean-motion")).toBe(true);
  });
});
