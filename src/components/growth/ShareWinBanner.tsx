import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { buildViralShareBlurb } from "@/lib/growth/selfMarketing";
import { getShareSocialUrls } from "@/lib/growth/shareGrowth";
import { recordGrowthEvent } from "@/lib/shadowScale/growthEvents";
import { useMarketingExperiments } from "@/hooks/useMarketingExperiments";
type ShareWinBannerProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  referralCode?: string | null;
  colleagueMode?: boolean;
  orgName?: string;
  onOpenShareDialog: () => void;
  onDismiss: () => void;
};

export function ShareWinBanner({
  visible,
  title,
  subtitle,
  referralCode,
  colleagueMode,
  orgName,
  onOpenShareDialog,
  onDismiss,
}: ShareWinBannerProps) {
  const [sharing, setSharing] = useState(false);
  const { shareCta } = useMarketingExperiments();

  const social = getShareSocialUrls({
    title,
    subtitle,
    ref: colleagueMode ? null : referralCode,
    kind: "chat",
  });

  const tryNativeShare = async () => {
    recordGrowthEvent("share", title.slice(0, 80));
    if (!navigator.share) {
      onOpenShareDialog();
      return;
    }
    setSharing(true);
    try {
      await navigator.share({
        title: `${BRAND.fullName} — share your win`,
        text: buildViralShareBlurb(title, { colleague: colleagueMode, orgName }),
        url: social.link,
      });
      onDismiss();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      onOpenShareDialog();
    } finally {
      setSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="mx-auto max-w-[720px] w-full px-4 sm:px-6 pb-2"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent px-4 py-3 shadow-lg shadow-primary/5">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {colleagueMode
                  ? `Great result — share with a ${orgName ?? "colleague"} teammate`
                  : shareCta}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {title}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button type="button" size="sm" onClick={() => void tryNativeShare()} disabled={sharing}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onDismiss} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
