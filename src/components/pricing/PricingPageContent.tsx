import { useState } from "react";
import PricingHero from "@/components/pricing/PricingHero";
import PricingCompareStrip from "@/components/pricing/PricingCompareStrip";
import PricingPlansGrid from "@/components/pricing/PricingPlansGrid";
import PricingAddonsSection from "@/components/pricing/PricingAddonsSection";
import PricingTrustSection from "@/components/pricing/PricingTrustSection";
import PricingTransparencyBlock from "@/components/growth/PricingTransparencyBlock";
import type { BillingMode } from "@/components/pricing/PricingBillingToggle";

const PricingPageContent = () => {
  const [billing, setBilling] = useState<BillingMode>("monthly");

  return (
    <>
      <PricingHero billing={billing} onBillingChange={setBilling} />
      <PricingCompareStrip />
      <PricingPlansGrid billing={billing} />
      <PricingAddonsSection />
      <div className="container mx-auto px-4 max-w-3xl">
        <PricingTransparencyBlock />
      </div>
      <PricingTrustSection />
    </>
  );
};

export default PricingPageContent;
