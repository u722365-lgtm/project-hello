/**
 * LLM planner → executor → critic loop for tool routing.
 * Falls back to regex detection when the model is unavailable.
 */

import { backend } from "@/integrations/local/client";
import { stringifyChatBody } from "@/lib/chatRequest";
import type { ToolDetectionResult, ToolType } from "@/hooks/useToolOrchestrator";

const CHAT_URL = `${import.meta.env.VITE_API_BASE_URL}/functions/v1/chat`;

const ROUTABLE_TOOLS = [
  "web_search",
  "deep_research",
  "image_generator",
  "document_generator",
  "presentation_builder",
  "shadow_execution",
  "strategy_agent",
  "calculator",
  "shadow_browser",
  "cognitive_loop",
  "none",
] as const;

export type RoutableTool = (typeof ROUTABLE_TOOLS)[number];

export interface PlannerStep {
  tool: RoutableTool;
  params: Record<string, string>;
  rationale: string;
  autoExecute: boolean;
}

export interface PlannerPlan {
  steps: PlannerStep[];
  confidence: number;
  needsCognitiveLoop: boolean;
  reasoning: string;
}

export interface CriticVerdict {
  satisfied: boolean;
  summary: string;
  nextStep?: PlannerStep;
}

function extractJsonBlock(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const brace = text.match(/\{[\s\S]*\}/);
  return brace ? brace[0] : null;
}

function parsePlannerJson(raw: string): PlannerPlan | null {
  const jsonStr = extractJsonBlock(raw);
  if (!jsonStr) return null;
  try {
    const data = JSON.parse(jsonStr) as {
      steps?: Array<{ tool?: string; params?: Record<string, string>; rationale?: string; autoExecute?: boolean }>;
      confidence?: number;
      needsCognitiveLoop?: boolean;
      reasoning?: string;
    };
    const steps: PlannerStep[] = (data.steps ?? [])
      .filter((s) => s.tool && ROUTABLE_TOOLS.includes(s.tool as RoutableTool))
      .map((s) => ({
        tool: s.tool as RoutableTool,
        params: s.params ?? {},
        rationale: s.rationale ?? "",
        autoExecute: s.autoExecute !== false,
      }));
    if (!steps.length && !data.needsCognitiveLoop) return null;
    return {
      steps,
      confidence: Math.min(100, Math.max(0, Number(data.confidence) || 70)),
      needsCognitiveLoop: Boolean(data.needsCognitiveLoop),
      reasoning: data.reasoning ?? "",
    };
  } catch {
    return null;
  }
}

async function callPlannerLlm(system: string, user: string, signal?: AbortSignal): Promise<string> {
  const { data: { session } } = await backend.auth.getSession();
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_API_KEY}`,
    },
    body: stringifyChatBody({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      personality: "professional",
      mode: "general",
      stream: false,
    }),
    signal,
  });
  if (!resp.ok) return "";

  const reader = resp.body?.getReader();
  const decoder = new TextDecoder();
  let out = "";
  if (!reader) return "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const data = JSON.parse(line.slice(6));
        const chunk = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
        if (chunk) out += chunk;
      } catch { /* partial */ }
    }
  }
  return out.trim();
}

/** Phase 1: Plan which tool(s) to invoke */
export async function planToolRoute(
  message: string,
  context?: { mode?: string; recentGoals?: string },
  signal?: AbortSignal,
): Promise<PlannerPlan | null> {
  const system = `You are ShadowTalk's autonomous tool planner. Output ONLY valid JSON (no markdown prose).

Available tools: ${ROUTABLE_TOOLS.join(", ")}
- web_search: live web lookup
- deep_research: multi-source research report
- image_generator: create images (params: prompt)
- document_generator: long-form doc (params: topic)
- presentation_builder: slides (params: topic)
- shadow_execution / strategy_agent: multi-step missions with deliverables
- calculator: math (params: expression)
- shadow_browser: open research browser
- cognitive_loop: hard problems needing multi-agent debate (legal+technical+business)
- none: plain chat answer

Return:
{
  "steps": [{ "tool": "...", "params": {}, "rationale": "...", "autoExecute": true }],
  "confidence": 0-100,
  "needsCognitiveLoop": false,
  "reasoning": "one sentence"
}
Use cognitive_loop for trade-offs, ethics, major decisions, or when user asks for multiple expert perspectives.
Use shadow_execution for multi-step autonomous work. Max 3 steps.`;

  const user = `User message:\n${message}${context?.recentGoals ? `\n\nActive goals:\n${context.recentGoals}` : ""}`;
  const raw = await callPlannerLlm(system, user, signal);
  return raw ? parsePlannerJson(raw) : null;
}

/** Phase 3: Critic — was the executed step enough? */
export async function criticizeOutcome(
  userMessage: string,
  executedStep: PlannerStep,
  outcomeSummary: string,
  signal?: AbortSignal,
): Promise<CriticVerdict> {
  const system = `You are the critic in a planner-executor-critic loop. Output ONLY JSON:
{ "satisfied": true|false, "summary": "...", "nextStep": null | { "tool": "...", "params": {}, "rationale": "...", "autoExecute": true } }
satisfied=true if the user's goal is met. Otherwise suggest one nextStep from: ${ROUTABLE_TOOLS.join(", ")}`;

  const user = `Original request: ${userMessage}
Executed: ${executedStep.tool} — ${executedStep.rationale}
Outcome: ${outcomeSummary.slice(0, 1500)}`;

  const raw = await callPlannerLlm(system, user, signal);
  const jsonStr = raw ? extractJsonBlock(raw) : null;
  if (!jsonStr) return { satisfied: true, summary: outcomeSummary.slice(0, 200) };
  try {
    const data = JSON.parse(jsonStr) as CriticVerdict & { nextStep?: PlannerStep };
    return {
      satisfied: Boolean(data.satisfied),
      summary: data.summary || "",
      nextStep: data.nextStep?.tool ? data.nextStep : undefined,
    };
  } catch {
    return { satisfied: true, summary: outcomeSummary.slice(0, 200) };
  }
}

/** Convert planner step to legacy ToolDetectionResult for dispatch */
export function plannerStepToDetection(step: PlannerStep, message: string): ToolDetectionResult {
  let tool = step.tool as ToolType;
  if (step.tool === "strategy_agent") tool = "strategy_agent";
  if (step.tool === "none") return { tool: null, confidence: 0 };

  return {
    tool,
    confidence: step.autoExecute ? 95 : 75,
    params: step.params,
    autoExecute: step.autoExecute,
    originalMessage: message,
    action: step.rationale,
  };
}
