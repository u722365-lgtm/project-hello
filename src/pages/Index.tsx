import { lazy, Suspense } from "react";
import LandingNavigation from "@/components/landing/LandingNavigation";
import HeroSection from "@/components/HeroSection";
import { SEOHead } from "@/components/SEOHead";
import {
  PAGE_SEO,
  getFounderHomeStructuredData,
  getItemListSchema,
  getSoftwareApplicationSchema,
  getWebPageSchema,
  getWebSiteSchema,
} from "@/lib/seo";
import LandingPageShell from "@/components/landing/LandingPageShell";
import { PlatformMetricsProvider } from "@/contexts/PlatformMetricsContext";
import { COMPARISON_PAGES } from "@/lib/comparisonPages";

const WhatIsShadowTalk = lazy(() => import("@/components/landing/WhatIsShadowTalk"));
const UseCaseWedgesSection = lazy(() => import("@/components/landing/UseCaseWedgesSection"));
const BrandManifestoSection = lazy(() => import("@/components/brand/BrandManifestoSection"));
const CompetitiveComparison = lazy(() => import("@/components/CompetitiveComparison"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const CommunitySection = lazy(() => import("@/components/CommunitySection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CommunityBuildingBlock = lazy(() => import("@/components/growth/CommunityBuildingBlock"));
const FounderSpotlightSection = lazy(() => import("@/components/founder/FounderSpotlightSection"));
const GrowthAmplifier = lazy(() => import("@/components/landing/GrowthAmplifier"));
const Footer = lazy(() => import("@/components/Footer"));
const StickyTryCTA = lazy(() => import("@/components/landing/StickyTryCTA"));
const ExitIntentPrompt = lazy(() => import("@/components/landing/ExitIntentPrompt"));
const FreeTierViralPrompt = lazy(() => import("@/components/growth/FreeTierViralPrompt"));

const Index = () => {
  const structuredData = [
    getWebSiteSchema(),
    getSoftwareApplicationSchema(),
    getWebPageSchema({
      title: PAGE_SEO.home.title,
      description: PAGE_SEO.home.description,
      url: PAGE_SEO.home.canonical || "https://www.shadowtalk-ai.com/home",
      about: [
        "agentic AI workspace",
        "AI agents",
        "offline AI",
        "deep research",
        "AI comparison pages",
      ],
    }),
    getItemListSchema(
      COMPARISON_PAGES.map((page) => ({
        name: page.title,
        url: page.canonical,
        description: page.description,
      })),
    ),
    ...getFounderHomeStructuredData(),
  ];

  return (
    <>
      <SEOHead meta={PAGE_SEO.home} structuredData={structuredData} />
      <PlatformMetricsProvider>
        <LandingPageShell>
          <div className="min-h-screen bg-background text-foreground landing-page-content">
            <LandingNavigation />
            <HeroSection />
            <WhatIsShadowTalk />
            <UseCaseWedgesSection />
            <BrandManifestoSection />
            <CompetitiveComparison />
            <FeaturesSection />
            <PricingSection />
            <TestimonialsSection />
            <CommunitySection />
            <CommunityBuildingBlock />
            <FounderSpotlightSection />
            <FAQSection />
            <GrowthAmplifier />
            <StickyTryCTA />
            <ExitIntentPrompt />
            <FreeTierViralPrompt />
            <Footer />
          </div>
        </LandingPageShell>
      </PlatformMetricsProvider>
    </>
  );
};

export default Index;
