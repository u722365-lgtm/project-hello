import { describe, expect, it } from "vitest";
import { isAutonomousModeEnabled } from "./config";
import { MissionSchedulerEngine } from "@/components/autonomy/MissionSchedulerEngine";
import { GoalPursuitEngine } from "@/components/autonomy/GoalPursuitEngine";
import { AutonomousAgentEngine } from "@/components/autonomy/AutonomousAgentEngine";
import { selfHealedFetch } from "@/lib/selfHealing/selfHealedFetch";
import { planToolRoute, criticizeOutcome } from "./llmToolPlanner";

describe("autonomy stack wiring", () => {
  it("exports all engine components", () => {
    expect(typeof MissionSchedulerEngine).toBe("function");
    expect(typeof GoalPursuitEngine).toBe("function");
    expect(typeof AutonomousAgentEngine).toBe("function");
  });

  it("exports planner and self-heal primitives", () => {
    expect(typeof planToolRoute).toBe("function");
    expect(typeof criticizeOutcome).toBe("function");
    expect(typeof selfHealedFetch).toBe("function");
  });

  it("autonomous mode defaults to enabled", () => {
    localStorage.removeItem("shadowtalk_autonomous_mode_v1");
    expect(isAutonomousModeEnabled()).toBe(true);
  });
});
