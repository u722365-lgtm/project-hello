import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  getStaleGoals,
  markGoalPursued,
  syncGoalToAiMemories,
  getActiveGoals,
} from "@/lib/autonomy/goalPersistence";
import { isAutonomousModeEnabled } from "@/lib/autonomy/config";

const CHECK_MS = 15 * 60_000;

/**
 * Proactively nudges the user to continue stale goals; syncs goals to ai_memories.
 */
export function GoalPursuitEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nudgedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!user || !isAutonomousModeEnabled()) return;

    const syncAll = async () => {
      for (const g of getActiveGoals()) {
        await syncGoalToAiMemories(user.id, g);
      }
    };
    void syncAll();
  }, [user]);

  useEffect(() => {
    if (!user || !isAutonomousModeEnabled()) return;

    const check = () => {
      const stale = getStaleGoals(24);
      const top = stale.find((g) => !nudgedRef.current.has(g.id));
      if (!top) return;

      nudgedRef.current.add(top.id);
      markGoalPursued(top.id);

      toast({
        title: "Goal check-in",
        description: `Still working on "${top.title}"? Ask me to continue in chat.`,
        duration: 10000,
      });
    };

    const t = window.setTimeout(check, 8000);
    const interval = setInterval(check, CHECK_MS);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [user, toast]);

  return null;
}
