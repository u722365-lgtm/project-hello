import { supabase } from "@/integrations/supabase/client";
import { drainGrowthEvents } from "./growthEvents";
import {
  getShadowScaleClientId,
  isShadowScaleEngineEnabled,
  SHADOWSCALE_HEARTBEAT_MS,
  SHADOWSCALE_TICK_MS,
} from "./shadowScaleConfig";

async function sendHeartbeat(route: string): Promise<void> {
  const events = drainGrowthEvents();
  try {
    await supabase.from("shadowscale_heartbeats").insert({
      client_id: getShadowScaleClientId(),
      route,
      events,
    });
  } catch {
    /* table may not exist */
  }

  try {
    await supabase.functions.invoke("shadow-scale-orchestrator", {
      body: {
        client_id: getShadowScaleClientId(),
        route,
        events,
      },
    });
  } catch {
    /* edge optional */
  }
}

export function startShadowScaleEngine(): () => void {
  if (typeof window === "undefined" || !isShadowScaleEngineEnabled()) return () => {};

  let lastHeartbeat = 0;
  const tick = window.setInterval(() => {
    const now = Date.now();
    if (now - lastHeartbeat >= SHADOWSCALE_HEARTBEAT_MS - 2000) {
      lastHeartbeat = now;
      void sendHeartbeat(window.location.pathname);
    }
  }, SHADOWSCALE_TICK_MS);

  void sendHeartbeat(window.location.pathname);

  return () => clearInterval(tick);
}
