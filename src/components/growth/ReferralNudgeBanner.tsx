import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useUserReferralCode } from "@/hooks/useUserReferralCode";
import { getShareLinks } from "@/hooks/useReferralTracking";
import {
  dismissReferralNudge,
  shouldShowReferralNudge,
} from "@/lib/growth/sessionMilestones";

export function ReferralNudgeBanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const referralCode = useUserReferralCode();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(shouldShowReferralNudge());
    sync();
    window.addEventListener("shadowtalk-session-milestone", sync);
    return () => window.removeEventListener("shadowtalk-session-milestone", sync);
  }, []);

  if (!visible || !referralCode) return null;

  const share = getShareLinks(referralCode, window.location.origin);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.link);
      setCopied(true);
      toast({ title: "Referral link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const close = () => {
    dismissReferralNudge();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="mx-3 sm:mx-4 mb-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              You&apos;re on a roll — invite a friend, earn rewards
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              After 3 sessions, share your link. They get a free start; you earn commission when they upgrade.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" size="sm" variant="secondary" onClick={copy}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            Copy link
          </Button>
          <Button type="button" size="sm" onClick={() => navigate("/referral")}>
            Details
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={close} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
