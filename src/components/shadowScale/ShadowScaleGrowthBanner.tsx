import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getShadowScaleSignals,
  isVideoStudioPromoActive,
  subscribeShadowScaleSignals,
} from "@/lib/shadowScale/shadowScaleSignals";

const DISMISS_KEY = "shadowscale_video_promo_dismissed";

export function ShadowScaleGrowthBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      if (localStorage.getItem(DISMISS_KEY) === "1") {
        setVisible(false);
        return;
      }
      const active = isVideoStudioPromoActive();
      setVisible(active);
      setMessage(getShadowScaleSignals().campaign_message);
    };
    const unsub = subscribeShadowScaleSignals(sync);
    sync();
    return unsub;
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-violet-500/5 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center gap-3 text-sm">
        <Clapperboard className="h-4 w-4 text-primary shrink-0" />
        <p className="flex-1 text-foreground/90">
          {message ?? "Pro users: generate viral shorts in Video Studio — no API key."}
        </p>
        <Button asChild size="sm" variant="secondary" className="h-8">
          <Link to="/video-studio">Open Video Studio</Link>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
