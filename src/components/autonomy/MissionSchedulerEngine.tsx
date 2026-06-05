import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useMissionExecutor } from "@/hooks/useMissionExecutor";
import type { Mission, MissionStep } from "@/hooks/useMissions";
import { isAutonomousModeEnabled } from "@/lib/autonomy/config";
import { trackAgenticEvent } from "@/lib/agenticMetrics";

const POLL_MS = 60_000;
const runningIds = new Set<string>();

function rowToMission(row: Record<string, unknown>): Mission {
  return {
    ...(row as unknown as Mission),
    steps: (row.steps as unknown as MissionStep[]) || [],
    deliverable_type: (row.deliverable_type as Mission["deliverable_type"]) || "general",
  };
}

/**
 * Runs missions with scheduled_at <= now while the app is open (or PWA background).
 */
export function MissionSchedulerEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeMission } = useMissionExecutor();
  const executeRef = useRef(executeMission);
  executeRef.current = executeMission;

  useEffect(() => {
    if (!user || !isAutonomousModeEnabled()) return;

    const tick = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("missions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "queued")
          .not("scheduled_at", "is", null)
          .lte("scheduled_at", now)
          .order("scheduled_at", { ascending: true })
          .limit(3);

        if (error || !data?.length) return;

        for (const row of data) {
          const mission = rowToMission(row as Record<string, unknown>);
          if (runningIds.has(mission.id)) continue;
          runningIds.add(mission.id);

          trackAgenticEvent("mission_start", { source: "scheduler", goal: mission.title.slice(0, 80) });

          await supabase
            .from("missions")
            .update({ status: "running", started_at: new Date().toISOString() })
            .eq("id", mission.id);

          toast({
            title: "Scheduled mission started",
            description: `"${mission.title}" is running autonomously.`,
          });

          void executeRef.current(mission).then((result) => {
            runningIds.delete(mission.id);
            if (result) {
              trackAgenticEvent("mission_complete", { source: "scheduler" });
              toast({
                title: "Scheduled mission complete",
                description: mission.title,
              });
            }
          });
        }
      } catch (e) {
        console.warn("[MissionScheduler]", e);
      }
    };

    void tick();
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [user, toast]);

  return null;
}
