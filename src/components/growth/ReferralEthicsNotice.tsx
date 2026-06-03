import { Shield } from "lucide-react";
import { REFERRAL_ETHICS } from "@/lib/ethicalGrowth";

export function ReferralEthicsNotice() {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm mb-2">{REFERRAL_ETHICS.title}</p>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            {REFERRAL_ETHICS.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/90 mt-3 italic">{REFERRAL_ETHICS.noSpam}</p>
        </div>
      </div>
    </div>
  );
}

export default ReferralEthicsNotice;
