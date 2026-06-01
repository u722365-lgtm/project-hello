import { useCallback, useEffect, useRef, useState } from "react";
import { isLearningEnabled } from "@/lib/autoImprove/learningConsent";
import {
  buildLearnedContext,
  ingestMessage,
  loadModelState,
  resetShadowTalkModel,
  runUnsupervisedTraining,
  type ShadowTalkModelState,
} from "@/lib/shadowtalkModel";

export function useShadowTalkModel() {
  const [state, setState] = useState<ShadowTalkModelState | null>(null);
  const [training, setTraining] = useState(false);
  const enabled = isLearningEnabled();
  const trainQueued = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const s = await loadModelState();
      setState(s);
      return s;
    } catch (e) {
      console.warn("[ShadowTalkModel] load failed:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const queueTraining = useCallback(() => {
    if (trainQueued.current || !enabled) return;
    trainQueued.current = true;

    const run = async () => {
      setTraining(true);
      try {
        const next = await runUnsupervisedTraining();
        setState(next);
      } catch (e) {
        console.warn("[ShadowTalkModel] training failed:", e);
      } finally {
        setTraining(false);
        trainQueued.current = false;
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => void run(), { timeout: 8000 });
    } else {
      setTimeout(() => void run(), 1200);
    }
  }, [enabled]);

  const learnFromTurn = useCallback(
    async (userText: string, assistantText?: string) => {
      if (!enabled) return;
      try {
        const { shouldTrain } = await ingestMessage(userText, "user");
        if (assistantText && assistantText.trim().length > 20) {
          await ingestMessage(assistantText.slice(0, 800), "assistant");
        }
        const s = await loadModelState();
        setState(s);
        if (shouldTrain) queueTraining();
      } catch (e) {
        console.warn("[ShadowTalkModel] ingest failed:", e);
      }
    },
    [enabled, queueTraining],
  );

  const getLearnedSystemPrompt = useCallback(
    async (latestUserMessage: string) => {
      if (!enabled) return "";
      return buildLearnedContext(latestUserMessage);
    },
    [enabled],
  );

  const trainNow = useCallback(async () => {
    setTraining(true);
    try {
      const next = await runUnsupervisedTraining();
      setState(next);
      return next;
    } finally {
      setTraining(false);
    }
  }, []);

  const resetModel = useCallback(async () => {
    await resetShadowTalkModel();
    const s = await loadModelState();
    setState(s);
  }, []);

  return {
    enabled,
    state,
    training,
    refresh,
    learnFromTurn,
    getLearnedSystemPrompt,
    trainNow,
    resetModel,
  };
}
