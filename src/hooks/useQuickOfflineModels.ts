import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  QUICK_OFFLINE_MODELS,
  getQuickOfflineEngine,
  type QuickOfflineModel,
  type QuickDownloadProgress,
} from "@/lib/offline/quickOfflineModels";
import {
  activateForceOfflineSession,
  deactivateForceOfflineSession,
  getActiveQuickModelId,
  isForceOfflineSessionActive,
} from "@/lib/offline/forceOfflineSession";
import { setRoutingMode } from "@/lib/offline/hybridRouter";
import { useToast } from "@/hooks/use-toast";

export function useQuickOfflineModels() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const engine = getQuickOfflineEngine();

  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<QuickDownloadProgress | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(getActiveQuickModelId());
  const [forceOffline, setForceOffline] = useState(isForceOfflineSessionActive());
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshCached = useCallback(async () => {
    const next: Record<string, boolean> = {};
    for (const m of QUICK_OFFLINE_MODELS) {
      next[m.id] = await engine.isCached(m.id);
    }
    setCached(next);
  }, [engine]);

  useEffect(() => {
    void refreshCached();
    const off = engine.subscribe(setProgress);
    const onSession = () => {
      setForceOffline(isForceOfflineSessionActive());
      setActiveModelId(getActiveQuickModelId());
    };
    window.addEventListener("shadowtalk-offline-session-changed", onSession);
    return () => {
      off();
      window.removeEventListener("shadowtalk-offline-session-changed", onSession);
    };
  }, [engine, refreshCached]);

  const download = useCallback(
    async (model: QuickOfflineModel) => {
      setLoadingId(model.id);
      setLastError(null);
      const ok = await engine.download(model.id, setProgress);
      setLoadingId(null);
      await refreshCached();
      if (ok) {
        setLastError(null);
        toast({
          title: "Download complete",
          description: `${model.name} is cached on this device. Tap Configure to use it in chat.`,
        });
      } else {
        const msg = engine.error ?? "Download failed. Check connection and try SmolLM Nano first.";
        setLastError(msg);
        toast({
          title: "Download failed",
          description: msg,
          variant: "destructive",
        });
      }
      return ok;
    },
    [engine, refreshCached, toast],
  );

  const configureForChat = useCallback(
    async (model: QuickOfflineModel) => {
      if (!engine.isModelReady(model.id) && !cached[model.id]) {
        toast({
          title: "Download first",
          description: `Download ${model.name} before configuring offline chat.`,
          variant: "destructive",
        });
        return false;
      }

      if (!engine.isModelReady(model.id)) {
        setLoadingId(model.id);
        const ok = await engine.download(model.id, setProgress);
        setLoadingId(null);
        if (!ok) {
          toast({
            title: "Could not load model",
            description: engine.error ?? "Try SmolLM Nano (~130 MB).",
            variant: "destructive",
          });
          return false;
        }
      }

      activateForceOfflineSession(model.id);
      setForceOffline(true);
      setActiveModelId(model.id);
      setRoutingMode("local-only");

      toast({
        title: "Offline chat configured",
        description: `${model.name} is active. Cloud is disabled — chat runs on-device only.`,
      });
      navigate("/chatbot");
      return true;
    },
    [cached, engine, navigate, toast],
  );

  const disconnectCloud = useCallback(() => {
    deactivateForceOfflineSession();
    setForceOffline(false);
    setActiveModelId(null);
    toast({
      title: "Cloud re-enabled",
      description: "Offline-only mode turned off. Routing set back to Auto.",
    });
  }, [toast]);

  return {
    models: QUICK_OFFLINE_MODELS,
    cached,
    progress,
    loadingId,
    activeModelId,
    forceOffline,
    download,
    configureForChat,
    disconnectCloud,
    refreshCached,
    lastError,
    isModelReady: (id: string) => engine.isModelReady(id),
  };
}
