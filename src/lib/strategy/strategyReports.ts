import { supabase } from "@/integrations/supabase/client";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import type { BusinessIdea, StrategyPlanStep, StrategyResult } from "@/lib/strategy/types";
import { parseMissionResult } from "@/lib/execution/synthesizeDeliverable";

// Supabase generated types lag some columns; cast to a loose client for these writes.
type LooseClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (cols: string) => {
        single: () => Promise<{ data: { id?: string } | null; error: unknown }>;
      };
    };
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>;
    };
    select: (cols: string) => {
      eq: (c: string, v: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            order: (c: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: Array<Record<string, unknown>> | null; error: unknown }>;
            };
          };
        };
      };
    };
    delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
  };
};
const db = supabase as unknown as LooseClient;

/** @deprecated Writes go to unified `missions` table */
export async function createStrategyReport(
  userId: string,
  idea: BusinessIdea,
  planSteps: StrategyPlanStep[],
): Promise<string | null> {
  const { data, error } = await db
    .from("missions")
    .insert({
      user_id: userId,
      title: idea.name || "Strategy report",
      goal: buildStrategyGoal(idea),
      business_idea: idea as unknown as Record<string, unknown>,
      steps: planSteps as unknown as Record<string, unknown>[],
      deliverable_type: "strategy_report",
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[strategy] create mission failed", error);
    return null;
  }
  return data?.id ?? null;
}

export async function finalizeStrategyReport(
  reportId: string,
  result: StrategyResult,
  planSteps: StrategyPlanStep[],
  usedFallback: boolean,
): Promise<void> {
  await db
    .from("missions")
    .update({
      result: {
        deliverable_type: "strategy_report",
        strategy: result,
        markdown: result.executiveSummary,
        used_fallback: usedFallback,
      },
      steps: planSteps,
      status: "completed",
      used_fallback: usedFallback,
      deliverable_markdown: result.executiveSummary,
      progress: 100,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq("id", reportId);
}

export async function failStrategyReport(reportId: string): Promise<void> {
  await db
    .from("missions")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", reportId);
}

export async function listStrategyReports(userId: string, _limit = 20) {
  const { data, error } = await db
    .from("missions")
    .select(
      "id, title, business_idea, result, steps, status, used_fallback, created_at, deliverable_type",
    )
    .eq("user_id", userId)
    .eq("deliverable_type", "strategy_report")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(_limit);

  if (error) {
    console.warn("[strategy] list missions failed", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const parsed = parseMissionResult(row.result as Record<string, unknown> | undefined);
    return {
      id: row.id as string,
      title: row.title as string,
      business_idea: row.business_idea as BusinessIdea,
      result: parsed.strategy ?? (row.result as StrategyResult | null),
      plan_steps: (row.steps as unknown as StrategyPlanStep[]) || [],
      used_fallback: Boolean(row.used_fallback),
      created_at: row.created_at as string,
    };
  });
}

export async function deleteStrategyReport(reportId: string): Promise<void> {
  await db.from("missions").delete().eq("id", reportId);
}
