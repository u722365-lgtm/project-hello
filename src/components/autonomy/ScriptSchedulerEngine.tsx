import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { queueChatInsert } from "@/lib/pendingChatInsert";
import { advanceScheduleConfig, parseScheduleConfig } from "@/lib/scriptSchedule";

const POLL_MS = 60_000;
const runningIds = new Set<string>();

interface AutomationScriptRow {
  id: string;
  name: string;
  script_code: string;
  trigger_config: unknown;
  run_count: number | null;
}

/**
 * Runs scheduled automation_scripts while the app is open (PWA background).
 */
export function ScriptSchedulerEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!user) return;

    const tick = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("automation_scripts")
          .select("id, name, script_code, trigger_config, run_count")
          .eq("user_id", user.id)
          .eq("trigger_type", "schedule")
          .eq("is_active", true)
          .order("last_run_at", { ascending: true, nullsFirst: true })
          .limit(10);

        if (error || !data?.length) return;

        for (const row of data as AutomationScriptRow[]) {
          const schedule = parseScheduleConfig(row.trigger_config);
          if (!schedule || schedule.next_run_at > now) continue;
          if (runningIds.has(row.id)) continue;
          runningIds.add(row.id);

          const { data: execution, error: execError } = await supabase
            .from("script_executions")
            .insert({
              script_id: row.id,
              user_id: user.id,
              status: "running",
              started_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (execError) {
            runningIds.delete(row.id);
            continue;
          }

          const nextConfig = advanceScheduleConfig(schedule as unknown as Record<string, unknown>);
          const runCount = (row.run_count ?? 0) + 1;

          await supabase
            .from("automation_scripts")
            .update({
              run_count: runCount,
              last_run_at: new Date().toISOString(),
              trigger_config: nextConfig as unknown as Record<string, string | number | null>,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);

          queueChatInsert(
            `Execute this scheduled workspace automation (${row.name}):\n\n\`\`\`\n${row.script_code}\n\`\`\``,
          );

          if (execution?.id) {
            await supabase
              .from("script_executions")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                output: { message: "Scheduled run queued for chat" },
              })
              .eq("id", execution.id);
          }

          toastRef.current({
            title: "Scheduled script ran",
            description: `"${row.name}" was queued in chat.`,
          });

          runningIds.delete(row.id);
        }
      } catch (e) {
        console.warn("[ScriptScheduler]", e);
      }
    };

    void tick();
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
