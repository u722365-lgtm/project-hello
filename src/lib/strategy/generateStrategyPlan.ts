import { streamChatCompletion, extractJsonArray } from "@/lib/see/chatCompletion";
import type { MissionPlanStep, MissionToolName } from "@/lib/see/types";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import type { BusinessIdea } from "@/lib/strategy/types";

const STRATEGY_TOOLS: MissionToolName[] = ["web_search", "deep_research", "synthesis", "general"];

const DEFAULT_PLAN: MissionPlanStep[] = [
  {
    id: "step-1",
    action: "Search top competitors, pricing, and market share",
    tool_name: "web_search",
    status: "pending",
    tool_params: {},
  },
  {
    id: "step-2",
    action: "Deep research on market trends and demand",
    tool_name: "deep_research",
    status: "pending",
    tool_params: {},
  },
  {
    id: "step-3",
    action: "Research regulations and compliance for the location",
    tool_name: "web_search",
    status: "pending",
    tool_params: {},
  },
  {
    id: "step-4",
    action: "Compile executive strategy report from findings",
    tool_name: "synthesis",
    status: "pending",
  },
];

interface RawPlanStep {
  action: string;
  tool_name?: string;
  tool_params?: Record<string, string>;
}

export async function generateStrategyPlan(
  idea: BusinessIdea,
  accessToken: string,
  signal?: AbortSignal,
): Promise<MissionPlanStep[]> {
  const goal = buildStrategyGoal(idea);

  const content = await streamChatCompletion(
    accessToken,
    `You are the ShadowTalk Strategy Agent planner. Break this business goal into 4-6 research steps using REAL tools.

${goal}

Return ONLY a JSON array. Each object:
- "action": specific imperative step
- "tool_name": one of ${STRATEGY_TOOLS.join(", ")}
- "tool_params": optional { "query": "..." } for search steps

Rules:
- Use web_search for competitors, regulations, costs, local market facts
- Use deep_research once for industry trends and TAM-style context
- End with exactly one synthesis step
- Include location and year 2026 in search queries where relevant
- No email, scrape, or security tools`,
    { model: "google/gemini-2.5-flash", signal },
  );

  const parsed = extractJsonArray<RawPlanStep>(content);
  if (parsed && parsed.length > 0) {
    const steps = parsed.slice(0, 6).map((s, i) => ({
      id: `step-${i + 1}`,
      action: s.action || `Step ${i + 1}`,
      tool_name: (STRATEGY_TOOLS.includes(s.tool_name as MissionToolName)
        ? s.tool_name
        : "web_search") as MissionToolName,
      status: "pending" as const,
      tool_params: {
        ...s.tool_params,
        query:
          s.tool_params?.query ||
          `${idea.name} ${idea.industry} ${idea.location} ${s.action}`.slice(0, 200),
      },
    }));
    return steps;
  }

  return DEFAULT_PLAN.map((s, i) => ({
    ...s,
    id: `step-${i + 1}`,
    tool_params: {
      query: `${idea.name} ${idea.industry} ${idea.location} ${s.action}`.slice(0, 200),
    },
  }));
}
