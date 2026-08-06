import { backend } from "@/integrations/local/client";
import { markSelfHealRemoteDisabled, markSelfHealRemoteEnabled } from "@/lib/selfHealing/selfHealConfig";

let probePromise: Promise<boolean> | null = null;

/** Ping the edge function once; cache result for the session */
export async function probeSelfHealEndpoint(): Promise<boolean> {
  if (probePromise) return probePromise;

  probePromise = (async () => {
    try {
      const { data, error } = await backend.functions.invoke("self-heal", {
        body: { health: true },
      });
      if (error) {
        markSelfHealRemoteDisabled();
        return false;
      }
      if (data?.ok === true || data?.service === "self-heal") {
        markSelfHealRemoteEnabled();
        return true;
      }
      markSelfHealRemoteDisabled();
      return false;
    } catch {
      markSelfHealRemoteDisabled();
      return false;
    }
  })();

  return probePromise;
}
