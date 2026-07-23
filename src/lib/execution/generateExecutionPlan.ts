import { streamChatCompletion, extractJsonArray } from "@/lib/see/chatCompletion";
import type { MissionPlanStep, MissionToolName } from "@/lib/see/types";
import type { DeliverableType } from "@/lib/execution/types";

const TOOLS: MissionToolName[] = [
  "web_search",
  "deep_research",
  "web_scrape",
  "synthesis",
  "general",
  "security_audit",
  "document_generator",
];

interface RawPlanStep {
  action: string;
  tool_name?: string;
  tool_params?: Record<string, string>;
  requires_approval?: boolean;
}

function defaultPlan(goal: string, type: DeliverableType): MissionPlanStep[] {
  if (type === "strategy_report") {
    return [
      {
        id: "step-1",
        action: "Search competitors, pricing, and market share",
        tool_name: "web_search",
        status: "pending",
        tool_params: { query: `${goal} competitors pricing 2026`.slice(0, 200) },
      },
      {
        id: "step-2",
        action: "Deep research on market trends and demand",
        tool_name: "deep_research",
        status: "pending",
        tool_params: { query: `${goal} market trends TAM 2026`.slice(0, 200) },
      },
      {
        id: "step-3",
        action: "Research regulations and compliance",
        tool_name: "web_search",
        status: "pending",
        tool_params: { query: `${goal} regulations compliance`.slice(0, 200) },
      },
      {
        id: "step-4",
        action: "Compile strategy report from findings",
        tool_name: "synthesis",
        status: "pending",
      },
    ];
  }

  if (type === "research_brief") {
    return [
      {
        id: "step-1",
        action: "Multi-source web research with citations",
        tool_name: "deep_research",
        status: "pending",
        tool_params: { query: goal.slice(0, 200) },
      },
      {
        id: "step-2",
        action: "Verify key claims with targeted search",
        tool_name: "web_search",
        status: "pending",
        tool_params: { query: goal.slice(0, 200) },
      },
      {
        id: "step-3",
        action: "Write executive research brief",
        tool_name: "synthesis",
        status: "pending",
      },
    ];
  }

  return [
    {
      id: "step-1",
      action: "Research context and gather sources",
      tool_name: "deep_research",
      status: "pending",
      tool_params: { query: goal.slice(0, 200) },
    },
    {
      id: "step-2",
      action: "Extract and verify key data points",
      tool_name: "web_search",
      status: "pending",
      tool_params: { query: goal.slice(0, 200) },
    },
    {
      id: "step-3",
      action: "Compile final deliverable",
      tool_name: "synthesis",
      status: "pending",
    },
  ];
}

function plannerPrompt(goal: string, type: DeliverableType): string {
  const typeRules =
    type === "strategy_report"
      ? `Deliverable: investor-ready STRATEGY REPORT (competitors, regulations, SWOT, 12-month financials).
- Use web_search for competitors, regulations, costs
- Use deep_research once for market/TAM trends
- End with one synthesis step
- 4-6 steps max`
      : type === "research_brief"
        ? `Deliverable: RESEARCH BRIEF with citations.
- Prefer deep_research and web_search
- End with synthesis`
        : `Deliverable: ${type} — actionable mission output.
- Use real tools (web_search, deep_research, web_scrape, security_audit when relevant)
- End with synthesis or document_generator`;

  return `You are the ShadowTalk Shadow Execution planner (S.E.E.). Break this goal into 4-8 concrete steps.

Goal: ${goal}

${typeRules}

Return ONLY a JSON array. Each object:
- "action": specific imperative step
- "tool_name": one of ${TOOLS.join(", ")}
- "tool_params": optional { "query": "..." } or { "url": "..." }
- "requires_approval": false unless sending email

No vague steps. Include 2026 in queries when relevant.`;
}

export interface GeneratedPlan {
  steps: MissionPlanStep[];
  usedDefault: boolean;
}

export async function generateExecutionPlan(
  goal: string,
  deliverableType: DeliverableType,
  accessToken: string,
  signal?: AbortSignal,
): Promise<MissionPlanStep[]> {
  try {
    const content = await streamChatCompletion(
      accessToken,
      plannerPrompt(goal, deliverableType),
      { model: "google/gemini-2.5-flash", signal },
    );

    const parsed = extractJsonArray<RawPlanStep>(content);
    if (parsed && parsed.length > 0) {
      return parsed.slice(0, 8).map((s, i) => ({
        id: `step-${i + 1}`,
        action: s.action || `Step ${i + 1}`,
        tool_name: (TOOLS.includes(s.tool_name as MissionToolName)
          ? s.tool_name
          : "web_search") as MissionToolName,
        status: "pending" as const,
        requires_approval: Boolean(s.requires_approval),
        tool_params: {
          ...s.tool_params,
          query: s.tool_params?.query || `${goal} ${s.action}`.slice(0, 200),
        },
      }));
    }
  } catch (e) {
    console.warn("[execution] plan generation failed, using default", e);
  }

  const fallback = defaultPlan(goal, deliverableType);
  // Mark first step so the executor can surface a "used default plan" warning
  if (fallback[0]) (fallback[0] as MissionPlanStep & { _planFallback?: boolean })._planFallback = true;
  return fallback;
}

/** @deprecated Use generateExecutionPlan */
export { generateExecutionPlan as generateStrategyPlan };
