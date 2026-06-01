import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PricingPlan } from "@/lib/pricingCatalog";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { pricingSpring } from "@/lib/pricingMotion";
import { cn } from "@/lib/utils";

type PricingPlanCardProps = {
  plan: PricingPlan;
  index: number;
  isCurrent: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onSelect: (planId: PricingPlan["id"]) => void;
};

const PricingPlanCard = ({
  plan,
  index,
  isCurrent,
  isFocused,
  onFocus,
  onSelect,
}: PricingPlanCardProps) => {
  const { profile, viewport, variants, hoverLift } = useLandingMotion();
  const Icon = plan.icon;

  return (
    <motion.article
      layout
      custom={index}
      variants={variants.cardReveal}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      tabIndex={0}
      className={cn(
        "pricing-plan-card relative h-full outline-none",
        plan.recommended && "pricing-plan-card--recommended",
        isFocused && "pricing-plan-card--focused",
      )}
      transition={profile.reduced ? { duration: 0 } : pricingSpring.layout}
    >
      <AnimatePresence>
        {isFocused && !profile.reduced && (
          <motion.div
            layoutId="pricing-card-glow"
            className="pricing-plan-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={pricingSpring.card}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="pricing-plan-inner h-full flex flex-col"
        whileHover={profile.reduced ? undefined : hoverLift}
        transition={pricingSpring.card}
      >
        {plan.popular && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground shadow-lg px-3">
            Most popular
          </Badge>
        )}
        {isCurrent && (
          <Badge className="absolute -top-3 right-4 z-10 bg-success text-success-foreground">Your plan</Badge>
        )}

        <div className="p-5 sm:p-6 flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="pricing-plan-icon flex h-11 w-11 items-center justify-center rounded-xl"
              whileHover={profile.reduced ? undefined : { rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.45 }}
            >
              <Icon className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="text-left">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-xs text-muted-foreground">{plan.description}</p>
            </div>
          </div>

          <div className="mb-5 text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-bold gradient-text tracking-tight">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            {plan.daily && <p className="text-xs text-primary/90 font-medium mt-1">{plan.daily}/day</p>}
          </div>

          <ul className="space-y-2 mb-5 flex-1">
            {plan.features.slice(0, 6).map((feature, fi) => (
              <motion.li
                key={fi}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ delay: fi * 0.03, duration: 0.35 }}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>{feature}</span>
              </motion.li>
            ))}
            {plan.features.length > 6 && (
              <li className="text-[11px] text-muted-foreground/80 pl-5">+{plan.features.length - 6} more</li>
            )}
          </ul>

          {plan.comparison && (
            <p className="text-[11px] text-success font-medium text-center mb-4 px-2 py-1.5 rounded-lg bg-success/5 border border-success/15">
              {plan.comparison}
            </p>
          )}

          <Button
            className={cn("w-full mt-auto", plan.recommended && "btn-glow")}
            variant={plan.variant}
            size="sm"
            disabled={isCurrent}
            onClick={() => onSelect(plan.id)}
          >
            {isCurrent ? "Current plan" : plan.cta}
          </Button>
        </div>
      </motion.div>
    </motion.article>
  );
};

export default PricingPlanCard;
