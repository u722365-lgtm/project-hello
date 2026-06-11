import { describe, expect, it } from "vitest";
import { advanceScheduleConfig, buildScheduleConfig, parseScheduleConfig } from "./scriptSchedule";

describe("scriptSchedule", () => {
  it("builds schedule config with future next_run_at", () => {
    const config = buildScheduleConfig("1h");
    expect(config.intervalMinutes).toBe(60);
    expect(new Date(config.next_run_at).getTime()).toBeGreaterThan(Date.now());
  });

  it("advances next_run_at", () => {
    const next = advanceScheduleConfig({ intervalMinutes: 15 });
    expect(next.intervalMinutes).toBe(15);
    expect(new Date(next.next_run_at).getTime()).toBeGreaterThan(Date.now());
  });

  it("parses stored config", () => {
    const raw = buildScheduleConfig("daily");
    const parsed = parseScheduleConfig(raw);
    expect(parsed?.intervalMinutes).toBe(24 * 60);
  });
});
