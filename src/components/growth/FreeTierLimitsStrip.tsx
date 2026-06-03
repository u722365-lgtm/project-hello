import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { getFreeTierSummary, getPaidTierOneLiner } from "@/lib/ethicalGrowth";
import { FREE_TIER_MARKETING } from "@/lib/conversionCopy";

type FreeTierLimitsStripProps = {
  className?: string;
  showUpgradeLink?: boolean;
};

/** Honest free vs paid limits — no fake counters */
export function FreeTierLimitsStrip({ className = "", showUpgradeLink = true }: FreeTierLimitsStripProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-xs sm:text-sm text-muted-foreground ${className}`}
      role="note"
    >
      <div className="flex items-start gap-2 min-w-0">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-foreground/90 font-medium">{FREE_TIER_MARKETING.title}</p>
          <p>{FREE_TIER_MARKETING.hook}</p>
          <p className="mt-1 text-muted-foreground/90">{getFreeTierSummary()}</p>
          <p className="mt-1 text-muted-foreground/90">{getPaidTierOneLiner("premium")}</p>
        </div>
      </div>
      {showUpgradeLink && (
        <Link to="/pricing" className="shrink-0 text-primary font-medium hover:underline sm:ml-auto">
          {FREE_TIER_MARKETING.cta}
        </Link>
      )}
    </div>
  );
}

export default FreeTierLimitsStrip;
