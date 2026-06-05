import { beforeEach, describe, expect, it } from "vitest";
import {
  getActiveGoals,
  getGoalsContextForPlanner,
  getStaleGoals,
  inferGoalsFromMessage,
  markGoalPursued,
  upsertGoalsFromMessage,
} from "./goalPersistence";

const STORAGE_KEY = "shadowtalk_active_goals_v1";

describe("goalPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("infers goals from natural language", () => {
    const goals = inferGoalsFromMessage("I want to launch a mobile app for fitness tracking.");
    expect(goals.length).toBeGreaterThan(0);
    expect(goals[0].title.toLowerCase()).toContain("launch");
    expect(goals[0].status).toBe("active");
  });

  it("upserts without duplicating active goals", () => {
    upsertGoalsFromMessage("My goal is to raise a seed round for ShadowTalk.");
    const first = getActiveGoals().length;
    upsertGoalsFromMessage("My goal is to raise a seed round for ShadowTalk.");
    expect(getActiveGoals().length).toBe(first);
  });

  it("exposes active goals for planner context", () => {
    upsertGoalsFromMessage("Help me build a go-to-market strategy for Europe.");
    const ctx = getGoalsContextForPlanner();
    expect(ctx).toContain("-");
    expect(ctx.toLowerCase()).toMatch(/go-to-market|strategy/);
  });

  it("marks stale goals not pursued in 24h+", () => {
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "g1",
          title: "Launch beta",
          description: "Ship beta",
          status: "active",
          createdAt: old,
          updatedAt: old,
          source: "explicit",
          priority: 1,
        },
      ]),
    );
    expect(getStaleGoals(24).some((g) => g.id === "g1")).toBe(true);
    markGoalPursued("g1");
    expect(getStaleGoals(24).some((g) => g.id === "g1")).toBe(false);
  });
});
