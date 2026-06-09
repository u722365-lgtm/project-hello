import { Link } from "react-router-dom";
import { CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="container mx-auto px-4 max-w-3xl -mt-4 mb-6">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Pay with JazzCash, Easypaisa, bank, or USDT
            </p>
            <p className="text-sm text-muted-foreground">
              Stripe isn&apos;t required — submit your receipt on Founder Access and get activated within 24h.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link to="/founder-access?plan=premium">
              <CreditCard className="h-4 w-4" />
              Go to checkout
            </Link>
          </Button>
        </div>
      </div>
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
