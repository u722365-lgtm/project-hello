import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTONOMY_MODE_KEY,
  isAutonomousModeEnabled,
  setAutonomousModeEnabled,
} from "./config";

describe("autonomy config toggle", () => {
  beforeEach(() => {
    localStorage.removeItem(AUTONOMY_MODE_KEY);
  });

  it("defaults to enabled", () => {
    expect(isAutonomousModeEnabled()).toBe(true);
  });

  it("persists disabled state", () => {
    setAutonomousModeEnabled(false);
    expect(isAutonomousModeEnabled()).toBe(false);
    expect(localStorage.getItem(AUTONOMY_MODE_KEY)).toBe("0");
  });

  it("persists enabled state", () => {
    setAutonomousModeEnabled(false);
    setAutonomousModeEnabled(true);
    expect(isAutonomousModeEnabled()).toBe(true);
  });
});
