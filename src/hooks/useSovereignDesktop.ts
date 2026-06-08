import { useCallback, useEffect, useState } from "react";
import { getDesktopInfo, isShadowTalkDesktop } from "@/lib/desktopBridge";
import { configureOllama, fetchOllamaStatus, pullOllamaModel } from "@/lib/desktop/ollamaInference";
import {
  listCompatibleModels,
  recommendOllamaModel,
  type ModelRecommendation,
} from "@/lib/desktop/modelRecommendations";
import {
  getSovereignRoutingMode,
  getStoredOllamaModel,
  getStoredOllamaUrl,
  setSovereignRoutingMode,
  setStoredOllamaModel,
  setStoredOllamaUrl,
  updateOllamaCache,
  type SovereignRoutingMode,
} from "@/lib/desktop/sovereignMode";
import type { OllamaStatusInfo } from "@/types/shadowtalk-desktop";
import { useHardwareIntelligence } from "@/hooks/useHardwareIntelligence";

export function useSovereignDesktop() {
  const { profile } = useHardwareIntelligence();
  const [available, setAvailable] = useState(isShadowTalkDesktop());
  const [status, setStatus] = useState<OllamaStatusInfo | null>(null);
  const [routingMode, setRoutingMode] = useState<SovereignRoutingMode>(getSovereignRoutingMode());
  const [recommended, setRecommended] = useState<ModelRecommendation | null>(null);
  const [compatible, setCompatible] = useState<ModelRecommendation[]>([]);
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const [desktopInfo, setDesktopInfo] = useState<Awaited<ReturnType<typeof getDesktopInfo>>>(null);

  const refresh = useCallback(async () => {
    if (!isShadowTalkDesktop()) {
      setAvailable(false);
      return;
    }
    setAvailable(true);
    const info = await getDesktopInfo();
    setDesktopInfo(info);

    const recInput = {
      profile,
      platform: info?.platform,
      arch: info?.arch,
    };
    const rec = recommendOllamaModel(recInput);
    setRecommended(rec);
    setCompatible(listCompatibleModels(recInput));

    const ollamaStatus = await fetchOllamaStatus();
    if (ollamaStatus) {
      setStatus(ollamaStatus);
      updateOllamaCache(ollamaStatus);
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const updateRouting = useCallback((mode: SovereignRoutingMode) => {
    setSovereignRoutingMode(mode);
    setRoutingMode(mode);
  }, []);

  const updateOllamaEndpoint = useCallback(
    async (baseUrl: string, model?: string) => {
      setStoredOllamaUrl(baseUrl);
      if (model) setStoredOllamaModel(model);
      const next = await configureOllama({ baseUrl, model });
      if (next) {
        setStatus(next);
        updateOllamaCache(next);
      }
      return next;
    },
    [],
  );

  const downloadModel = useCallback(
    async (modelId?: string) => {
      const model = modelId ?? getStoredOllamaModel() ?? recommended?.id ?? "qwen2.5:7b";
      setPulling(true);
      setPullStatus("Starting download…");
      setStoredOllamaModel(model);
      const result = await pullOllamaModel(model, (status, percent) => {
        setPullStatus(percent != null ? `${status} (${percent}%)` : status);
      });
      setPulling(false);
      if (result.ok) {
        await refresh();
      }
      return result;
    },
    [recommended?.id, refresh],
  );

  return {
    available,
    status,
    routingMode,
    recommended,
    compatible,
    pulling,
    pullStatus,
    desktopInfo,
    ollamaUrl: getStoredOllamaUrl(),
    ollamaModel: getStoredOllamaModel(),
    refresh,
    updateRouting,
    updateOllamaEndpoint,
    downloadModel,
    isOllamaReady: Boolean(status?.reachable && status.models.length > 0),
  };
}
