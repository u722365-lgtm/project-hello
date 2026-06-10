import { useState } from "react";
import { X, Copy, Check, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyMarketingPost, formatPostForPlatform } from "@/lib/growth/freeMarketingToolkit";
import { useUserReferralCode } from "@/hooks/useUserReferralCode";
import { recordGrowthEvent } from "@/lib/shadowScale/growthEvents";

const DISMISS_KEY = "shadowtalk_marketing_banner_day";

export function MarketingDailyBanner() {
  const referralCode = useUserReferralCode();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const day = new Date().toISOString().slice(0, 10);
      return localStorage.getItem(DISMISS_KEY) === day;
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);

  if (dismissed) return null;

  const post = getDailyMarketingPost(referralCode);
  const text = formatPostForPlatform(post, "whatsapp");

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    recordGrowthEvent("share", "daily_marketing_banner");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent px-4 py-2">
      <div className="container mx-auto max-w-5xl flex items-center gap-3 text-sm">
        <Megaphone className="h-4 w-4 text-primary shrink-0 hidden sm:block" />
        <p className="flex-1 min-w-0 truncate text-muted-foreground">
          <span className="text-foreground font-medium">Post today: </span>
          {post.hook}
        </p>
        <Button size="sm" variant="secondary" className="shrink-0 h-8" onClick={() => void copy()}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? "Copied" : "Copy post"}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
