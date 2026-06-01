import { motion } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { pricingSpring } from "@/lib/pricingMotion";

export type BillingMode = "monthly" | "lifetime";

type PricingBillingToggleProps = {
  value: BillingMode;
  onChange: (mode: BillingMode) => void;
};

const PricingBillingToggle = ({ value, onChange }: PricingBillingToggleProps) => {
  const { profile } = useLandingMotion();

  return (
    <div
      className="pricing-billing-toggle relative inline-flex p-1 rounded-full border border-border/60 bg-muted/25 backdrop-blur-md"
      role="tablist"
      aria-label="Billing period"
    >
      {(["monthly", "lifetime"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          onClick={() => onChange(mode)}
          className={`relative z-[1] px-5 sm:px-6 py-2 text-sm font-medium rounded-full transition-colors ${
            value === mode ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
          }`}
        >
          {value === mode && (
            <motion.span
              layoutId="pricing-billing-pill"
              className="absolute inset-0 rounded-full bg-background border border-primary/25 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.5)]"
              transition={profile.reduced ? { duration: 0 } : pricingSpring.toggle}
            />
          )}
          <span className="relative z-[1]">{mode === "monthly" ? "Monthly" : "Lifetime"}</span>
        </button>
      ))}
    </div>
  );
};

export default PricingBillingToggle;
