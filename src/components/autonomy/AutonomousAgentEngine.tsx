import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { usePushIntelligence } from "@/hooks/usePushIntelligence";
import { isAutonomousModeEnabled } from "@/lib/autonomy/config";
import { isAnonymousAutonomousEnabled } from "@/lib/anonymousAutonomousMode";

/**
 * Background autonomous layer: proactive signals, stale-mission nudges, briefings.
 * Mount once globally (App.tsx deferred chrome).
 */
export function AutonomousAgentEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const shownSignalsRef = useRef(new Set<string>());
  const enabled =
    isAutonomousModeEnabled() &&
    (Boolean(user) || isAnonymousAutonomousEnabled());

  const { signals, fetchBriefing } = usePushIntelligence({
    enabled,
    pollIntervalMs: 4 * 60 * 1000,
  });

  useEffect(() => {
    if (!enabled) return;
    void fetchBriefing();
  }, [enabled, fetchBriefing]);

  useEffect(() => {
    if (!enabled || signals.length === 0) return;

    for (const signal of signals) {
      if (signal.priority !== "high" && signal.priority !== "critical") continue;
      const key = `${signal.type}::${signal.title}`;
      if (shownSignalsRef.current.has(key)) continue;
      shownSignalsRef.current.add(key);

      toast({
        title: signal.title,
        description: signal.body,
        duration: signal.priority === "critical" ? 12000 : 8000,
      });
    }
  }, [enabled, signals, toast]);

  return null;
}
