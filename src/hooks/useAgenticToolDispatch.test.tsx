import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useAgenticToolDispatch } from "./useAgenticToolDispatch";

const resolveDetection = vi.fn();
const runCritic = vi.fn();
const detectTool = vi.fn();
const executeCalculator = vi.fn();

vi.mock("@/hooks/useAutonomousPlanner", () => ({
  useAutonomousPlanner: () => ({ resolveDetection, runCritic }),
}));

vi.mock("@/hooks/useToolOrchestrator", () => ({
  useToolOrchestrator: () => ({ detectTool, executeCalculator }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useAgenticToolDispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeCalculator.mockReturnValue("42");
  });

  it("dispatchDetectionAsync routes cognitive_loop in-chat", async () => {
    resolveDetection.mockResolvedValue({
      detection: {
        tool: "cognitive_loop",
        confidence: 92,
        autoExecute: true,
        originalMessage: "debate pros and cons",
        params: { query: "debate pros and cons" },
      },
      plan: { steps: [], confidence: 90, needsCognitiveLoop: true, reasoning: "hard" },
      usedLlm: true,
      needsCognitiveLoop: true,
    });

    const { result } = renderHook(() => useAgenticToolDispatch(), { wrapper });
    const append = vi.fn();

    let dispatchResult: Awaited<ReturnType<typeof result.current.dispatchDetectionAsync>>;
    await act(async () => {
      dispatchResult = await result.current.dispatchDetectionAsync("debate pros and cons", {
        openDeepResearch: vi.fn(),
        openImageGenerator: vi.fn(),
        openAgenticRunner: vi.fn(),
        openBrowser: vi.fn(),
        openShadowLive: vi.fn(),
        openMissionControl: vi.fn(),
        openShadowExecution: vi.fn(),
        setPendingMessage: vi.fn(),
        appendAssistantMessage: append,
      });
    });

    expect(dispatchResult!.outcome.handled).toBe(true);
    expect(dispatchResult!.outcome.cognitiveLoop).toBe(true);
    expect(append).toHaveBeenCalled();
  });

  it("continueFromCritic dispatches next step when critic is unsatisfied", async () => {
    runCritic.mockResolvedValue({
      satisfied: false,
      summary: "Need live web data",
      nextStep: {
        tool: "web_search",
        params: { query: "market size" },
        rationale: "Verify numbers",
        autoExecute: true,
      },
    });

    const { result } = renderHook(() => useAgenticToolDispatch(), { wrapper });
    const append = vi.fn();
    const ui = {
      openDeepResearch: vi.fn(),
      openImageGenerator: vi.fn(),
      openAgenticRunner: vi.fn(),
      openBrowser: vi.fn(),
      openShadowLive: vi.fn(),
      openMissionControl: vi.fn(),
      openShadowExecution: vi.fn(),
      setPendingMessage: vi.fn(),
      appendAssistantMessage: append,
    };

    let followUp: Awaited<ReturnType<typeof result.current.continueFromCritic>>;
    await act(async () => {
      followUp = await result.current.continueFromCritic(
        "analyze market size",
        {
          tool: "deep_research",
          params: { query: "market" },
          rationale: "first pass",
          autoExecute: true,
        },
        "Partial answer without citations",
        ui,
      );
    });

    expect(followUp).not.toBeNull();
    expect(followUp!.executedStep?.tool).toBe("web_search");
    expect(followUp!.outcome.handled).toBe(false);
    expect(followUp!.outcome.chatFlags?.webSearch).toBe(true);
  });

  it("continueFromCritic returns null when critic is satisfied", async () => {
    runCritic.mockResolvedValue({
      satisfied: true,
      summary: "Goal met",
    });

    const { result } = renderHook(() => useAgenticToolDispatch(), { wrapper });
    let followUp: Awaited<ReturnType<typeof result.current.continueFromCritic>> | null = null;

    await act(async () => {
      followUp = await result.current.continueFromCritic(
        "2+2",
        {
          tool: "calculator",
          params: { expression: "2+2" },
          rationale: "math",
          autoExecute: true,
        },
        "4",
        {
          openDeepResearch: vi.fn(),
          openImageGenerator: vi.fn(),
          openAgenticRunner: vi.fn(),
          openBrowser: vi.fn(),
          openShadowLive: vi.fn(),
          openMissionControl: vi.fn(),
          openShadowExecution: vi.fn(),
          setPendingMessage: vi.fn(),
          appendAssistantMessage: vi.fn(),
        },
      );
    });

    expect(followUp).toBeNull();
  });
});
