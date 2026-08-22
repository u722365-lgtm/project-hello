/**
 * Tier A bootstrap — install default SmolLM for all users (web + desktop).
 * Tier C: desktop may skip download when bundled model flag is set.
 * Desktop with on-device models may skip Tier A — sovereign path handles offline chat.
 */

import { useCallback, useEffect, useState } from "react";



import { isShadowTalkDesktop, getDesktopInfo } from "@/lib/desktopBridge";

import {
  BOOTSTRAP_CONSENT_KEY,
  BOOTSTRAP_DONE_KEY,
  isSilentTierAEnabled,
} from "@/lib/offline/tierAInstall";

import { getSuccessfulSessionCount } from "@/lib/growth/sessionMilestones";

const BOOTSTRAP_SKIP_KEY = "shadowtalk_offline_tier_a_skip";
export type BootstrapPhase =
  | "idle"
  | "needs_consent"
  | "downloading"
  | "ready"
  | "skipped"
  | "error";

function markBootstrapReady(): void {
  localStorage.setItem(BOOTSTRAP_DONE_KEY, "1");
}

export function useOfflineBootstrap() {
  const [phase, setPhase] = useState<BootstrapPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDesktopBundled, setIsDesktopBundled] = useState(false);

  const checkState = useCallback(async () => {
    if (getSuccessfulSessionCount() < 1) {
      setPhase("idle");
      return;
    }

    if (localStorage.getItem(BOOTSTRAP_SKIP_KEY) === "1") {
      setPhase("skipped");
      return;
    }
    if (localStorage.getItem(BOOTSTRAP_DONE_KEY) === "1" || false) {
      setPhase("ready");
      return;
    }
    if (getGemmaEngine().isReady) {
      setPhase("ready");
      return;
    }

    const cached = await isTierAModelCached();
    if (cached) {
      setPhase("ready");
      return;
    }

    if (await shouldSkipTierABootstrap()) {
      markBootstrapReady();
      setPhase("ready");
      return;
    }

    if (isShadowTalkDesktop()) {
      const info = await getDesktopInfo();
      const bundled = !!info?.offlineModelBundled;
      setIsDesktopBundled(bundled);
    }

    if (localStorage.getItem(BOOTSTRAP_CONSENT_KEY) === "1" || isSilentTierAEnabled()) {
      setPhase("downloading");
      return;
    }

    setPhase("needs_consent");
  }, []);

  useEffect(() => {
    void checkState();
    const onMilestone = () => void checkState();
    window.addEventListener("shadowtalk-session-milestone", onMilestone);
    return () => window.removeEventListener("shadowtalk-session-milestone", onMilestone);
  }, [checkState]);

  const acceptAndInstall = useCallback(async () => {
    if (await shouldSkipTierABootstrap()) {
      markBootstrapReady();
      setPhase("ready");
      return true;
    }

    localStorage.setItem(BOOTSTRAP_CONSENT_KEY, "1");
    setPhase("downloading");
    setError(null);

    const ok = await getSmolLMEngine().ensureLoaded((p) => {
      setProgress(p.progress);
      setStatusText(p.text);
    });

    if (ok) {
      markBootstrapReady();
      setPhase("ready");
      return true;
    }

    if (await shouldSkipTierABootstrap()) {
      markBootstrapReady();
      setPhase("ready");
      return true;
    }

    const detail = getSmolLMEngine().loadError;
    const online = typeof navigator !== "undefined" && navigator.onLine;

    if (online) {
      localStorage.setItem(BOOTSTRAP_SKIP_KEY, "1");
      setPhase("skipped");
      return false;
    }

    setPhase("error");
    setError(
      detail
        ? `Could not install offline AI: ${detail}`
        : "Could not install offline AI. Check connection and storage, then retry.",
    );
    return false;
  }, []);

  const skipInstall = useCallback(() => {
    localStorage.setItem(BOOTSTRAP_SKIP_KEY, "1");
    setPhase("skipped");
  }, []);

  const retry = useCallback(() => {
    localStorage.removeItem(BOOTSTRAP_SKIP_KEY);
    setPhase("downloading");
    void acceptAndInstall();
  }, [acceptAndInstall]);

  useEffect(() => {
    if (phase !== "downloading") return;

    void acceptAndInstall();
  }, [phase, acceptAndInstall]);

  const silentInstall = isSilentTierAEnabled();

  return {
    phase,
    progress,
    statusText,
    error,
    isDesktopBundled,
    silentInstall,
    tierASizeMB: TIER_A_SIZE_MB,
    acceptAndInstall,
    skipInstall,
    retry,
    refresh: checkState,
  };
}
