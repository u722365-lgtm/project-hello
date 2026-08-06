import { backend } from "@/integrations/local/client";
import { backendLoose } from "@/integrations/local/loose";
import { drainGrowthEvents } from "./growthEvents";
import {
  getShadowScaleClientId,
  isShadowScaleEngineEnabled,
  SHADOWSCALE_HEARTBEAT_MS,
  SHADOWSCALE_TICK_MS,
} from "./shadowScaleConfig";
import { refreshShadowScaleSignals, subscribeShadowScaleSignals } from "./shadowScaleSignals";

async function sendHeartbeat(route: string, userId: string | null): Promise<void> {
  const events = drainGrowthEvents();
  try {
    await backendLoose.from("shadowscale_heartbeats").insert({
      client_id: getShadowScaleClientId(),
      user_id: userId,
      route,
      events,
    });
  } catch {
    /* table may not exist */
  }

  try {
    await backend.functions.invoke("shadow-scale-orchestrator", {
      body: {
        client_id: getShadowScaleClientId(),
        user_id: userId,
        route,
        events,
      },
    });
  } catch {
    /* edge optional */
  }
}

export function startShadowScaleEngine(getUserId: () => string | null = () => null): () => void {
  if (typeof window === "undefined" || !isShadowScaleEngineEnabled()) return () => {};

  void refreshShadowScaleSignals();
  const unsubSignals = subscribeShadowScaleSignals(() => {});

  let lastHeartbeat = 0;
  const tick = window.setInterval(() => {
    const now = Date.now();
    if (now - lastHeartbeat >= SHADOWSCALE_HEARTBEAT_MS - 2000) {
      lastHeartbeat = now;
      void sendHeartbeat(window.location.pathname, getUserId());
    }
  }, SHADOWSCALE_TICK_MS);

  void sendHeartbeat(window.location.pathname, getUserId());

  return () => {
    clearInterval(tick);
    unsubSignals();
  };
}
