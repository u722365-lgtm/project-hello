import { Link } from "react-router-dom";
import { Check, Shield } from "lucide-react";
import { PRICING_TRANSPARENCY } from "@/lib/ethicalGrowth";
import { PRICING_PAGE_HOOK } from "@/lib/conversionCopy";

type PricingTransparencyBlockProps = {
  className?: string;
  compact?: boolean;
};

export function PricingTransparencyBlock({ className = "", compact = false }: PricingTransparencyBlockProps) {
  return (
    <div
      className={`rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-8 ${className}`}
      id="pricing-transparency"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Before you upgrade</h3>
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground mb-4">{PRICING_PAGE_HOOK}</p>
      )}
      <ul className="space-y-2 text-sm text-muted-foreground mb-4">
        <li>{PRICING_TRANSPARENCY.cancel}</li>
        <li>{PRICING_TRANSPARENCY.refund}</li>
        <li>{PRICING_TRANSPARENCY.data}</li>
      </ul>
      <div className="flex flex-wrap gap-2 mb-4">
        {PRICING_TRANSPARENCY.trustBullets.map((b) => (
          <span
            key={b}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs"
          >
            <Check className="h-3 w-3 text-success" />
            {b}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {PRICING_TRANSPARENCY.privacyLinks.map((l) => (
          <Link key={l.href} to={l.href} className="text-primary hover:underline">
            {l.label}
          </Link>
        ))}
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}

export default PricingTransparencyBlock;
