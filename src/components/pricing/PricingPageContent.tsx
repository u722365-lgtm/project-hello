import PricingHero from "@/components/pricing/PricingHero";
import PricingCompareStrip from "@/components/pricing/PricingCompareStrip";
import PricingPlansGrid from "@/components/pricing/PricingPlansGrid";
import PricingAddonsSection from "@/components/pricing/PricingAddonsSection";
import PricingTrustSection from "@/components/pricing/PricingTrustSection";
import PricingTransparencyBlock from "@/components/growth/PricingTransparencyBlock";

const PricingPageContent = () => {
  return (
    <>
      <PricingHero />
      <PricingCompareStrip />
      <PricingPlansGrid />
      <PricingAddonsSection />
      <div className="container mx-auto px-4 max-w-3xl">
        <PricingTransparencyBlock />
      </div>
      <PricingTrustSection />
    </>
  );
};

export default PricingPageContent;
