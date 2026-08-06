import { backend } from "@/integrations/local/client";
import { backendLoose } from "@/integrations/local/loose";

export interface ShadowScaleClientSignals {
  amplify_shares: boolean;
  amplify_shares_until: string | null;
  promote_video_studio: boolean;
  campaign_message: string | null;
}

const DEFAULT_SIGNALS: ShadowScaleClientSignals = {
  amplify_shares: false,
  amplify_shares_until: null,
  promote_video_studio: false,
  campaign_message: null,
};

let cached: ShadowScaleClientSignals = { ...DEFAULT_SIGNALS };
let loaded = false;

export function getShadowScaleSignals(): ShadowScaleClientSignals {
  return cached;
}

export async function refreshShadowScaleSignals(): Promise<ShadowScaleClientSignals> {
  try {
    const { data } = await backendLoose.from("shadowscale_client_signals").select("*").eq("id", 1).maybeSingle();
    if (data) {
      cached = {
        amplify_shares: Boolean(data.amplify_shares),
        amplify_shares_until: data.amplify_shares_until ?? null,
        promote_video_studio: Boolean(data.promote_video_studio),
        campaign_message: data.campaign_message ?? null,
      };
    }
    loaded = true;
  } catch {
    /* table may not exist yet */
  }
  return cached;
}

export function isShareAmplificationActive(): boolean {
  if (!cached.amplify_shares) return false;
  if (!cached.amplify_shares_until) return true;
  return new Date(cached.amplify_shares_until).getTime() > Date.now();
}

export function isVideoStudioPromoActive(): boolean {
  return cached.promote_video_studio;
}

export function subscribeShadowScaleSignals(onChange: () => void): () => void {
  const channel = backend
    .channel("shadowscale-signals")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shadowscale_client_signals" },
      () => {
        void refreshShadowScaleSignals().then(onChange);
      },
    )
    .subscribe();

  if (!loaded) void refreshShadowScaleSignals().then(onChange);

  return () => {
    void backend.removeChannel(channel);
  };
}
