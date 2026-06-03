import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import {
  buildMonthlyPlans,
  RECOMMENDED_PLAN_ID,
  type PricingPlanId,
} from "@/lib/pricingCatalog";
import PricingPlanCard from "@/components/pricing/PricingPlanCard";

const PricingPlansGrid = () => {
  const navigate = useNavigate();
  const { userPlan } = useAuth();
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
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
    </section>
  );
};

export default PricingPlansGrid;
