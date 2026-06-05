import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ToolDetectionResult } from "@/hooks/useToolOrchestrator";
import { useToolOrchestrator } from "@/hooks/useToolOrchestrator";
import {
  buildExecutePath,
  inferDeliverableType,
} from "@/lib/execution/inferFromChat";
import type { DeliverableType } from "@/lib/execution/types";

export interface ToolDispatchUI {
  openDeepResearch: (query?: string) => void;
  openImageGenerator: () => void;
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

export type ToolDispatchOutcome =
  | { handled: true }
  | { handled: false; chatFlags?: { webSearch?: boolean; searchQuery?: string; deepResearch?: boolean; researchQuery?: string; decodeImage?: boolean; imageDataUrl?: string } };

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
      const goal = params?.goal ?? params?.prompt ?? message;
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

  const dispatchDetection = useCallback(
    (message: string, ui: ToolDispatchUI): ToolDispatchOutcome => {
      const detection = detectTool(message);
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

        case "deep_research":
          if (detection.autoExecute) {
            return {
              handled: false,
              chatFlags: { deepResearch: true, researchQuery: params.query ?? message },
            };
          }
          ui.openDeepResearch(params.query ?? message);
          ui.appendAssistantMessage("Opening **Deep Research** — multi-source synthesis with citations.", {
            tool: "deep_research",
            status: "complete",
            params,
          });
          return { handled: true };

        case "image_generator":
          ui.setPendingMessage(params.prompt ?? message);
          ui.openImageGenerator();
          ui.appendAssistantMessage("Opening **image generation** with your prompt.", {
            tool: "image_generator",
            status: "complete",
            params,
          });
          return { handled: true };

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
          ui.openBrowser();
          return { handled: true };

        case "shadow_live":
          ui.openShadowLive();
          return { handled: true };

        case "document_generator":
        case "presentation_builder": {
          const path =
            tool === "presentation_builder"
              ? "/forge?mode=slides"
              : "/forge?mode=documents";
          const topic = params.topic || params.query || message.trim();
          navigate(topic ? `${path}&topic=${encodeURIComponent(topic)}&auto=1` : path);
          return { handled: true };
        }

        case "code_canvas":
          navigate("/ide");
          return { handled: true };

        case "cognitive_loop":
          goToExecute(message, "general");
          ui.appendAssistantMessage("Opening **Shadow Execution** for multi-agent style goals.", {
            tool: "shadow_execution",
            status: "complete",
          });
          return { handled: true };

        default:
          if (!detection.autoExecute) {
            ui.appendAssistantMessage(
              `Detected **${tool.replace(/_/g, " ")}** intent. Open **Tools** (⌘K) or say it more explicitly to run.`,
              { tool, status: "confirm", params },
            );
            return { handled: true };
          }
          return { handled: false };
      }
    },
    [detectTool, dispatchExecutionTool, executeCalculator, goToExecute, navigate],
  );

  return { dispatchDetection, detectTool, goToExecute };
}
