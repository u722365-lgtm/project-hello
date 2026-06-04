import { streamChatCompletion } from "@/lib/see/chatCompletion";
import { synthesizeStrategyReport } from "@/lib/strategy/synthesizeStrategyReport";
import {
  generateFallbackAnalysis,
  generateFallbackResearch,
} from "@/lib/strategy/fallbackData";
import type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";
import type { MissionPlanStep } from "@/lib/see/types";
import type { DeliverableType, ExecutionDeliverable } from "@/lib/execution/types";

export async function synthesizeDeliverable(opts: {
  deliverableType: DeliverableType;
  goal: string;
  steps: MissionPlanStep[];
  accessToken: string;
  businessIdea?: BusinessIdea | null;
  signal?: AbortSignal;
}): Promise<ExecutionDeliverable> {
  const stepOutputs = opts.steps
    .filter((s) => s.result)
    .map((s) => s.result as string);

  if (opts.deliverableType === "strategy_report") {
    const idea: BusinessIdea = opts.businessIdea ?? {
      name: "Business",
      description: opts.goal,
      location: "Global",
      industry: "General",
      targetMarket: "",
      initialInvestment: "",
    };

    let strategy = await synthesizeStrategyReport(idea, opts.steps, opts.signal);
    let usedFallback = false;

    if (!strategy) {
      usedFallback = true;
      const research = generateFallbackResearch(idea);
      strategy = generateFallbackAnalysis(idea, research);
    } else {
      const hasRealSources = strategy.research?.sources?.some(
        (s) => s.url?.startsWith("http") && !s.url.includes("example.com"),
      );
      if (!hasRealSources && opts.steps.every((s) => s.status === "failed")) {
        usedFallback = true;
      }
    }

    return {
      deliverableType: "strategy_report",
      strategy,
      usedFallback,
      stepOutputs,
      markdown: strategy.executiveSummary,
    };
  }

  const briefType =
    opts.deliverableType === "research_brief"
      ? "executive research brief with citations"
      : opts.deliverableType === "content_pack"
        ? "content pack (ready-to-publish outlines and copy)"
        : "comprehensive actionable report";

  const markdown = await streamChatCompletion(
    opts.accessToken,
    `Compile the final Shadow Execution deliverable (${briefType}).

Goal: ${opts.goal}

Step outputs:
${stepOutputs.map((r, idx) => `### Step ${idx + 1}\n${r}`).join("\n\n")}

Provide a polished, structured deliverable with citations (URLs) where available. No placeholders.`,
    { model: "google/gemini-2.5-pro", signal: opts.signal },
  );

  return {
    deliverableType: opts.deliverableType,
    markdown,
    stepOutputs,
    usedFallback: false,
  };
}

export function parseMissionResult(result: Record<string, unknown> | undefined): {
  strategy: StrategyResult | null;
  markdown: string | null;
  deliverableType: DeliverableType | null;
} {
  if (!result) return { strategy: null, markdown: null, deliverableType: null };

  const dtype = (result.deliverable_type as DeliverableType) || null;
  if (result.strategy && typeof result.strategy === "object") {
    return {
      strategy: result.strategy as StrategyResult,
      markdown: (result.markdown as string) || null,
      deliverableType: dtype || "strategy_report",
    };
  }
  if (typeof result.output === "string") {
    return { strategy: null, markdown: result.output, deliverableType: dtype || "general" };
  }
  return { strategy: null, markdown: null, deliverableType: dtype };
}

export function buildMissionResultPayload(deliverable: ExecutionDeliverable): Record<string, unknown> {
  if (deliverable.deliverableType === "strategy_report" && deliverable.strategy) {
    return {
      deliverable_type: "strategy_report",
      strategy: deliverable.strategy,
      markdown: deliverable.markdown || deliverable.strategy.executiveSummary,
      used_fallback: deliverable.usedFallback ?? false,
      steps: deliverable.stepOutputs,
    };
  }
  return {
    deliverable_type: deliverable.deliverableType,
    output: deliverable.markdown,
    steps: deliverable.stepOutputs,
    used_fallback: deliverable.usedFallback ?? false,
  };
}
