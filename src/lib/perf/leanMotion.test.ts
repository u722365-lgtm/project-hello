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

  it("can be disabled", () => {
    setLeanMotionEnabled(false);
    expect(isLeanMotionEnabled()).toBe(false);
  });

  it("forces reduced motion for perf when lean is on", () => {
    setLeanMotionEnabled(true);
    expect(shouldReduceMotionForPerf(false)).toBe(true);
    expect(shouldReduceMotionForPerf(true)).toBe(true);
  });

  it("respects user reduced-motion when lean is off", () => {
    setLeanMotionEnabled(false);
    expect(shouldReduceMotionForPerf(false)).toBe(false);
    expect(shouldReduceMotionForPerf(true)).toBe(true);
  });

  it("applies lean-motion class on html", () => {
    setLeanMotionEnabled(true);
    applyLeanMotionClass();
    expect(document.documentElement.classList.contains("lean-motion")).toBe(true);
  });
});
