import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SHARE_CTA = "Share ShadowTalk with someone who needs private AI";

export function useMarketingExperiments() {
  const [shareCta, setShareCta] = useState(DEFAULT_SHARE_CTA);
  const [videoHook, setVideoHook] = useState("privacy");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("shadowscale_experiments")
        .select("key, active_variant, variants")
        .in("key", ["share_cta", "video_hook"]);

      for (const row of data ?? []) {
        if (row.key === "share_cta" && row.active_variant) {
          setShareCta(String(row.active_variant));
        }
        if (row.key === "video_hook" && row.active_variant) {
          setVideoHook(String(row.active_variant));
        }
      }
    })();
  }, []);

  return { shareCta, videoHook };
}
