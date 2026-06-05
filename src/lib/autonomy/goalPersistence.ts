/**
 * Cross-session goal tracking — inferred from chat and pursued proactively.
 */

import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "shadowtalk_active_goals_v1";

export type GoalStatus = "active" | "completed" | "paused";

export interface UserGoal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  lastPursuedAt?: string;
  source: "inferred" | "explicit";
  priority: number;
}

const GOAL_PATTERNS: Array<{ regex: RegExp; title: (m: RegExpMatchArray) => string }> = [
  {
    regex: /\b(?:i\s+)?(?:need|want)\s+to\s+(.+?)(?:\.|,|$)/i,
    title: (m) => m[1].trim().slice(0, 80),
  },
  {
    regex: /\b(?:my\s+)?goal\s+is\s+(?:to\s+)?(.+?)(?:\.|,|$)/i,
    title: (m) => m[1].trim().slice(0, 80),
  },
  {
    regex: /\b(?:help\s+me)\s+(.+?)(?:\.|,|$)/i,
    title: (m) => m[1].trim().slice(0, 80),
  },
  {
    regex: /\b(?:i(?:'m|\s+am)\s+)?(?:working\s+on|building|launching)\s+(.+?)(?:\.|,|$)/i,
    title: (m) => m[1].trim().slice(0, 80),
  },
];

function readGoals(): UserGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserGoal[]) : [];
  } catch {
    return [];
  }
}

function writeGoals(goals: UserGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals.slice(0, 30)));
  } catch { /* quota */ }
}

export function getActiveGoals(): UserGoal[] {
  return readGoals().filter((g) => g.status === "active");
}

export function getGoalsContextForPlanner(): string {
  const active = getActiveGoals().slice(0, 5);
  if (!active.length) return "";
  return active.map((g) => `- ${g.title}`).join("\n");
}

export function inferGoalsFromMessage(message: string): Omit<UserGoal, "id" | "createdAt" | "updatedAt">[] {
  const found: Omit<UserGoal, "id" | "createdAt" | "updatedAt">[] = [];
  for (const { regex, title } of GOAL_PATTERNS) {
    const m = message.match(regex);
    if (!m || m[1].length < 8) continue;
    const t = title(m);
    if (t.length < 8) continue;
    found.push({
      title: t,
      description: message.trim().slice(0, 300),
      status: "active",
      source: "inferred",
      priority: 1,
    });
  }
  return found;
}

export function upsertGoalsFromMessage(message: string): UserGoal[] {
  const inferred = inferGoalsFromMessage(message);
  if (!inferred.length) return getActiveGoals();

  const existing = readGoals();
  const now = new Date().toISOString();
  let changed = false;

  for (const g of inferred) {
    const dup = existing.find(
      (e) => e.status === "active" && e.title.toLowerCase() === g.title.toLowerCase(),
    );
    if (dup) continue;
    existing.unshift({
      ...g,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    changed = true;
  }

  if (changed) writeGoals(existing);
  return existing.filter((g) => g.status === "active");
}

export function markGoalPursued(goalId: string) {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx < 0) return;
  goals[idx] = {
    ...goals[idx],
    lastPursuedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeGoals(goals);
}

export function completeGoal(goalId: string) {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx < 0) return;
  goals[idx] = { ...goals[idx], status: "completed", updatedAt: new Date().toISOString() };
  writeGoals(goals);
}

/** Goals not pursued in 24h+ (candidates for proactive nudge) */
export function getStaleGoals(maxAgeHours = 24): UserGoal[] {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  return getActiveGoals().filter((g) => {
    const last = g.lastPursuedAt ? new Date(g.lastPursuedAt).getTime() : new Date(g.createdAt).getTime();
    return last < cutoff;
  });
}

export async function syncGoalToAiMemories(userId: string, goal: UserGoal): Promise<void> {
  try {
    const content = `Goal: ${goal.title} — ${goal.description}`;
    const { data: existing } = await supabase
      .from("ai_memories")
      .select("id")
      .eq("user_id", userId)
      .eq("category", "goal")
      .ilike("content", `%${goal.title.slice(0, 40)}%`)
      .limit(1);
    if (existing?.length) return;

    await supabase.from("ai_memories").insert({
      user_id: userId,
      content,
      category: "goal",
      source: "auto",
      confidence: 0.9,
    });
  } catch {
    /* offline */
  }
}
