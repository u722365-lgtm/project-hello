import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ToolDetectionResult } from "@/hooks/useToolOrchestrator";
import { useToolOrchestrator } from "@/hooks/useToolOrchestrator";
import { useAutonomousPlanner } from "@/hooks/useAutonomousPlanner";
import {
  plannerStepToDetection,
  type PlannerPlan,
  type PlannerStep,
} from "@/lib/autonomy/llmToolPlanner";
import {
  buildExecutePath,
  inferDeliverableType,
} from "@/lib/execution/inferFromChat";
import type { DeliverableType } from "@/lib/execution/types";
import { executeShadowTool } from "@/lib/shadowTools/executeShadowTool";

export interface ToolDispatchUI {
  openDeepResearch: (query?: string) => void;
  openImageGenerator: () => void;
  openMusicGenerator?: (prompt?: string) => void;
  openAgenticRunner: (goal: string) => void;
  openBrowser: () => void;
  openShadowLive: () => void;
  openMissionControl: () => void;
  openShadowExecution: (goal: string, mode?: DeliverableType) => void;
  setPendingMessage: (text: string) => void;
  appendAssistantMessage: (content: string, toolExecution?: {
    tool: string;
    status: "complete" | "confirm" | "running";
    params?: Record<string, string>;
    result?: string;
  }) => void;
}

export type ToolDispatchOutcome = {
  handled: boolean;
  cognitiveLoop?: boolean;
  query?: string;
  chatFlags?: {
    webSearch?: boolean;
    searchQuery?: string;
    deepResearch?: boolean;
    researchQuery?: string;
    decodeImage?: boolean;
    imageDataUrl?: string;
  };
};


export interface AsyncDispatchResult {
  outcome: ToolDispatchOutcome;
  plan: PlannerPlan | null;
  executedStep: PlannerStep | null;
}

const MIN_CONFIDENCE = 50;

const EXECUTION_TOOLS = new Set(["shadow_execution", "mission_control", "strategy_agent"]);

function resolveExecuteMode(
  tool: string,
  message: string,
  params?: Record<string, string>,
): DeliverableType {
  const fromParams = params?.mode as DeliverableType | undefined;
  if (
    fromParams &&
    ["general", "strategy_report", "research_brief", "content_pack"].includes(fromParams)
  ) {
    return fromParams;
  }
  if (tool === "strategy_agent") return "strategy_report";
  return inferDeliverableType(message);
}

export function useAgenticToolDispatch() {
  const navigate = useNavigate();
  const { detectTool, executeCalculator } = useToolOrchestrator();
  const { resolveDetection, runCritic } = useAutonomousPlanner();

  const goToExecute = useCallback(
    (goal: string, mode?: DeliverableType) => {
      const path = buildExecutePath(goal, mode ?? inferDeliverableType(goal));
      navigate(path);
    },
    [navigate],
  );

  const dispatchExecutionTool = useCallback(
    (
      tool: string,
      message: string,
      params: Record<string, string> | undefined,
      ui: ToolDispatchUI,
      autoRoute: boolean,
    ): ToolDispatchOutcome => {
      const goal = params?.goal ?? params?.prompt ?? params?.topic ?? message;
      const mode = resolveExecuteMode(tool, message, params);
      const label =
        mode === "strategy_report"
          ? "Strategy report"
          : mode === "research_brief"
            ? "Research brief"
            : "Shadow Execution";

      if (autoRoute) {
        goToExecute(goal, mode);
        ui.appendAssistantMessage(
          `Opening **${label}** — I'll plan steps, run live web research, and build your deliverable. Continue on the execution workspace.`,
          { tool: "shadow_execution", status: "complete", params: { ...params, goal, mode } },
        );
        return { handled: true };
      }

      ui.appendAssistantMessage(
        `This looks like a **${label}** job (multi-step tools + saved deliverable). Open Shadow Execution to run it, or say "run execute now" to auto-open.`,
        { tool: "shadow_execution", status: "confirm", params: { ...params, goal, mode } },
      );
      return { handled: true };
    },
    [goToExecute],
  );

  const dispatchFromDetection = useCallback(
    (detection: ToolDetectionResult, message: string, ui: ToolDispatchUI): ToolDispatchOutcome => {
      if (!detection.tool || detection.confidence < MIN_CONFIDENCE) {
        return { handled: false };
      }

      const params = detection.params ?? {};
      const tool = detection.tool;

      if (EXECUTION_TOOLS.has(tool)) {
        return dispatchExecutionTool(tool, message, params, ui, Boolean(detection.autoExecute));
      }

      switch (tool) {
        case "calculator": {
          const expr = params.expression ?? message.replace(/^(calc|calculate|compute)\s*/i, "");
          const result = executeCalculator(expr);
          ui.appendAssistantMessage(result, {
            tool: "calculator",
            status: "complete",
            params,
            result,
          });
          return { handled: true };
        }

        case "web_search":
          if (detection.autoExecute) {
            return {
              handled: false,
              chatFlags: { webSearch: true, searchQuery: params.query ?? message },
            };
          }
          ui.appendAssistantMessage(
            "I can search the live web for this. Confirm to run, or rephrase with “search the web for …”.",
            { tool: "web_search", status: "confirm", params },
          );
          return { handled: true };

        case "deep_research": {
          const query = params.query ?? message;
          if (detection.autoExecute) {
            navigate(`/research?tab=investigate&q=${encodeURIComponent(query)}&auto=1`);
            ui.appendAssistantMessage("Opening **Shadow Research** — multi-source synthesis with citations.", {
              tool: "deep_research",
              status: "complete",
              params,
            });
            return { handled: true };
          }
          navigate(`/research?tab=investigate&q=${encodeURIComponent(query)}`);
          ui.appendAssistantMessage("Opening **Shadow Research** — multi-source synthesis with citations.", {
            tool: "deep_research",
            status: "complete",
            params,
          });
          return { handled: true };
        }

        case "image_generator":
          ui.setPendingMessage(params.prompt ?? message);
          ui.openImageGenerator();
          ui.appendAssistantMessage("Opening **image generation** with your prompt.", {
            tool: "image_generator",
            status: "complete",
            params,
          });
          return { handled: true };

        case "music_generator": {
          const prompt = params.prompt ?? message;
          ui.setPendingMessage(prompt);
          ui.openMusicGenerator?.(prompt);
          ui.appendAssistantMessage("Opening **Music Studio** with your prompt.", {
            tool: "music_generator",
            status: "complete",
            params,
          });
          return { handled: true };
        }

        case "image_decoder":
          return {
            handled: false,
            chatFlags: {
              decodeImage: true,
              imageDataUrl: params.image ?? params.data,
            },
          };

        case "agentic_runner":
          if (detection.autoExecute) {
            goToExecute(params.goal ?? params.prompt ?? message, "general");
            ui.appendAssistantMessage("Opening **Shadow Execution** for this multi-step goal.", {
              tool: "shadow_execution",
              status: "complete",
              params,
            });
            return { handled: true };
          }
          ui.openAgenticRunner(params.goal ?? params.prompt ?? message);
          ui.appendAssistantMessage("Launching **Agentic Task Runner** — I'll plan steps and execute them.", {
            tool: "agentic_runner",
            status: "complete",
            params,
          });
          return { handled: true };

        case "shadow_browser":
          navigate("/research?tab=browser");
          ui.appendAssistantMessage("Opening **Shadow Browser** in the research hub.", {
            tool: "shadow_browser",
            status: "complete",
            params,
          });
          return { handled: true };

        case "shadow_live":
          ui.openShadowLive();
          ui.appendAssistantMessage(
            "Opening **ShadowTalk Live** — real-time voice. Allow microphone access when prompted, then speak naturally.",
            { tool: "shadow_live", status: "complete", params },
          );
          return { handled: true };

        case "code_canvas":
          navigate("/ide");
          ui.appendAssistantMessage(
            "Opening **Code Canvas** — continue coding in the IDE.",
            { tool: "code_canvas", status: "complete", params },
          );
          return { handled: true };

        case "computer_mode":
          navigate("/computer");
          ui.appendAssistantMessage(
            "Opening **Computer Mode** — real npm/node shell in your browser. Use Shadow Browser for web research.",
            { tool: "computer_mode", status: "complete", params },
          );
          return { handled: true };

        case "eco_actions":
          navigate("/chatbot");
          ui.appendAssistantMessage(
            "Opening **Eco Actions** — I'll switch you to Planetary Action Guide mode.",
            { tool: "eco_actions", status: "complete", params },
          );
          return { handled: true };

        case "sovereign_models":
          navigate("/personal-llm");
          ui.appendAssistantMessage(
            "Opening **Personal LLM** — manage local/offline models and device-first inference.",
            { tool: "sovereign_models", status: "complete", params },
          );
          return { handled: true };

        case "presentation_builder":
        case "document_generator": {
          const path =
            tool === "presentation_builder"
              ? "/forge?mode=slides"
              : "/forge?mode=documents";
          const topic = params.topic || params.query || message.trim();
          navigate(topic ? `${path}&topic=${encodeURIComponent(topic)}&auto=1` : path);
          ui.appendAssistantMessage(
            `Opening **${tool === "presentation_builder" ? "Presentations" : "Documents"}** — I'll generate and format your output.`,
            { tool, status: "complete", params },
          );
          return { handled: true };
        }

        case "cognitive_loop":
          ui.appendAssistantMessage(
            "This needs **multi-agent debate** — legal, technical, and business specialists will analyze it together.",
            { tool: "cognitive_loop", status: "running", params: { query: message } },
          );
          return { handled: true, cognitiveLoop: true, query: message };

        default:
          if (!detection.autoExecute) {
            ui.appendAssistantMessage(
              `Detected **${tool.replace(/_/g, " ")}** intent. Open **Tools** (⌘K) or say it more explicitly to run.`,
              { tool, status: "confirm", params },
            );
            return { handled: true };
          }
          const fallbackTool = tool as import("@/hooks/useToolOrchestrator").ToolType;
          const fallbackRoute = (executeShadowTool as any).UI_ROUTES?.[fallbackTool];
          if (fallbackRoute?.path) {
            navigate(fallbackRoute.path);
            ui.appendAssistantMessage(
              `Opening **${fallbackRoute.label || tool.replace(/_/g, " ")}** — continue in that tool.`,
              { tool, status: "complete", params },
            );
            return { handled: true };
          }
          return { handled: false };
      }
    },
    [dispatchExecutionTool, executeCalculator, goToExecute, navigate],
  );

  const dispatchDetection = useCallback(
    (message: string, ui: ToolDispatchUI): ToolDispatchOutcome => {
      return dispatchFromDetection(detectTool(message), message, ui);
    },
    [detectTool, dispatchFromDetection],
  );

  /** LLM planner first, regex fallback; returns plan + step for critic chain */
  const dispatchDetectionAsync = useCallback(
    async (message: string, ui: ToolDispatchUI, signal?: AbortSignal): Promise<AsyncDispatchResult> => {
      const { detection, plan } = await resolveDetection(message, signal);
      const outcome = dispatchFromDetection(detection, message, ui);
      const executedStep = plan?.steps?.[0] ?? null;
      return { outcome, plan, executedStep };
    },
    [resolveDetection, dispatchFromDetection],
  );

  /** Critic phase — if unsatisfied, dispatch the suggested next tool step */
  const continueFromCritic = useCallback(
    async (
      message: string,
      executedStep: PlannerStep,
      outcomeSummary: string,
      ui: ToolDispatchUI,
      signal?: AbortSignal,
    ): Promise<AsyncDispatchResult | null> => {
      const verdict = await runCritic(message, executedStep, outcomeSummary, signal);
      if (verdict.satisfied) {
        if (verdict.summary) {
          ui.appendAssistantMessage(`**Planner review:** ${verdict.summary}`, {
            tool: executedStep.tool,
            status: "complete",
          });
        }
        return null;
      }

      const next = verdict.nextStep ?? null;
      if (!next) return null;

      const outcome = dispatchFromDetection(plannerStepToDetection(next, message), message, ui);
      return { outcome, plan: null, executedStep: next };
    },
    [runCritic, dispatchFromDetection],
  );

  return {
    dispatchDetection,
    dispatchDetectionAsync,
    continueFromCritic,
    dispatchFromDetection,
    detectTool,
    goToExecute,
  };
}
