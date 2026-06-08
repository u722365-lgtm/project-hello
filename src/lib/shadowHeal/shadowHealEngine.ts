import { capture, flush } from "@/lib/selfHealing/errorCapture";
import { isSelfHealRemoteEnabled } from "@/lib/selfHealing/selfHealConfig";
import { startAutoRecoverySync } from "@/lib/selfHealing/autoRecover";
import { supabase } from "@/integrations/supabase/client";
import {
  getHealClientId,
  isShadowHealEngineEnabled,
  SHADOW_HEAL_HEARTBEAT_MS,
  SHADOW_HEAL_TICK_MS,
} from "./shadowHealConfig";
import { applyLocalFixes, applyTrafficMitigations } from "./localFixes";
import { evaluateTraffic, getTrafficMetrics, startTrafficGuard } from "./trafficGuard";
import { runWiringProbe } from "./wiringProbe";

let running = false;
let stopRecovery: (() => void) | undefined;
let lastWiringIssues: { code: string; message: string }[] = [];

async function sendHeartbeat(
  route: string,
  trafficLevel: string,
  wiringIssues: { code: string; message: string }[],
): Promise<void> {
  if (!isSelfHealRemoteEnabled()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("shadowtalk_heal_heartbeats").insert({
      client_id: getHealClientId(),
      user_id: user?.id ?? null,
      route,
      traffic_level: trafficLevel,
      wiring_issues: wiringIssues,
      metrics: getTrafficMetrics(),
    });
  } catch {
    /* table may not exist yet */
  }

  try {
    await supabase.functions.invoke("shadow-heal-watchdog", {
      body: {
        client_id: getHealClientId(),
        route,
        traffic_level: trafficLevel,
        wiring_issues: wiringIssues,
      },
    });
  } catch {
    /* edge optional */
  }
}

export async function runShadowHealCycle(): Promise<void> {
  if (!isShadowHealEngineEnabled() || running) return;
  running = true;
  try {
    const traffic = evaluateTraffic();
    applyTrafficMitigations(traffic);

    const wiringIssues = await runWiringProbe();
    lastWiringIssues = wiringIssues.map((i) => ({ code: i.code, message: i.message }));
    for (const issue of wiringIssues.filter((i) => i.severity !== "low")) {
      capture({
        kind: "build",
        message: `[wiring] ${issue.message}`,
        context: { code: issue.code, severity: issue.severity },
        fingerprint: `wiring_${issue.code}`,
      });
    }

    await applyLocalFixes(wiringIssues);
    await flush();

    if (isSelfHealRemoteEnabled() && !stopRecovery) {
      stopRecovery = startAutoRecoverySync();
    }
  } finally {
    running = false;
  }
}

export function startShadowHealEngine(): () => void {
  if (typeof window === "undefined" || !isShadowHealEngineEnabled()) return () => {};

  const stopTraffic = startTrafficGuard();

  void runShadowHealCycle();
  const tick = window.setInterval(() => void runShadowHealCycle(), SHADOW_HEAL_TICK_MS);

  let lastHeartbeat = 0;
  const heartbeat = window.setInterval(() => {
    const now = Date.now();
    if (now - lastHeartbeat < SHADOW_HEAL_HEARTBEAT_MS - 1000) return;
    lastHeartbeat = now;
    void sendHeartbeat(window.location.pathname, evaluateTraffic(), lastWiringIssues);
  }, SHADOW_HEAL_HEARTBEAT_MS);

  const onVisible = () => {
    if (document.visibilityState === "visible") void runShadowHealCycle();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    clearInterval(tick);
    clearInterval(heartbeat);
    document.removeEventListener("visibilitychange", onVisible);
    stopTraffic();
    stopRecovery?.();
    stopRecovery = undefined;
  };
}
