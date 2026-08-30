import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import ReferralProgram from "@/components/ReferralProgram";
import { FreeMarketingPanel } from "@/components/growth/FreeMarketingPanel";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";

const ReferralPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={PAGE_SEO.referral} structuredData={undefined} />
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl space-y-8">
        <FreeMarketingPanel />
        <ReferralProgram />
      </div>
    </div>
  );
};

export default ReferralPage;
