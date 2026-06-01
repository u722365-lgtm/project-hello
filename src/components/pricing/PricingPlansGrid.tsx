import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Check, Crown, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import {
  buildMonthlyPlans,
  LIFETIME_PRICE,
  RECOMMENDED_PLAN_ID,
  type PricingPlanId,
} from "@/lib/pricingCatalog";
import { PLAN_DETAILS } from "@/lib/stripe";
import PricingPlanCard from "@/components/pricing/PricingPlanCard";
import type { BillingMode } from "@/components/pricing/PricingBillingToggle";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { pricingSpring } from "@/lib/pricingMotion";

type PricingPlansGridProps = {
  billing: BillingMode;
};

const PricingPlansGrid = ({ billing }: PricingPlansGridProps) => {
  const navigate = useNavigate();
  const { userPlan } = useAuth();
  const { profile } = useLandingMotion();
  const plans = buildMonthlyPlans();
  const [focusedId, setFocusedId] = useState<PricingPlanId>(RECOMMENDED_PLAN_ID);

  const handleSelect = (planId: PricingPlanId) => {
    if (planId === "free") {
      navigate("/chatbot");
      return;
    }
    navigate(`/founder-access?plan=${planId}`);
  };

  return (
    <section className="container mx-auto px-4 pb-16 sm:pb-20 max-w-6xl">
      <AnimatePresence mode="wait">
        {billing === "lifetime" ? (
          <motion.div
            key="lifetime"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={profile.reduced ? { duration: 0 } : pricingSpring.card}
            className="max-w-lg mx-auto"
          >
            <div className="pricing-lifetime-card relative overflow-hidden rounded-2xl border border-warning/30 p-8 sm:p-10 text-center">
              <div className="pricing-lifetime-shine" aria-hidden />
              <Timer className="h-10 w-10 text-warning mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Lifetime access</h2>
              <p className="text-4xl sm:text-5xl font-bold gradient-text mb-2">${LIFETIME_PRICE}</p>
              <p className="text-sm text-muted-foreground mb-6">One payment · every Elite feature · forever</p>
              <ul className="text-left space-y-2 mb-8 max-w-sm mx-auto">
                {PLAN_DETAILS.lifetime.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="btn-glow w-full sm:w-auto px-8" size="lg" onClick={() => navigate("/lifetime-deal")}>
                <Crown className="mr-2 h-5 w-5" />
                Claim lifetime deal
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Prefer flexibility?{" "}
                <button type="button" className="text-primary underline" onClick={() => navigate("/founder-access?plan=premium")}>
                  Premium at $15/mo
                </button>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="monthly"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LayoutGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={plan.recommended ? "lg:row-span-1 lg:-mt-2 lg:mb-2" : ""}
                  >
                    <PricingPlanCard
                      plan={plan}
                      index={index}
                      isCurrent={userPlan === plan.id}
                      isFocused={focusedId === plan.id}
                      onFocus={() => setFocusedId(plan.id)}
                      onSelect={handleSelect}
                    />
                  </div>
                ))}
              </div>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PricingPlansGrid;
