import { lazy, Suspense } from "react";
import LandingNavigation from "@/components/landing/LandingNavigation";
import HeroSection from "@/components/HeroSection";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO, getFounderHomeStructuredData } from "@/lib/seo";
import LandingPageShell from "@/components/landing/LandingPageShell";
import LandingSectionReveal from "@/components/landing/LandingSectionReveal";
import LandingSectionFallback from "@/components/landing/LandingSectionFallback";
import { LandingMotionProvider } from "@/components/landing/LandingMotionProvider";
import { PlatformMetricsProvider } from "@/contexts/PlatformMetricsContext";

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
  return (
    <>
      <SEOHead meta={PAGE_SEO.home} structuredData={getFounderHomeStructuredData()} />
      <PlatformMetricsProvider>
        <LandingPageShell>
          <LandingMotionProvider>
            <div className="min-h-screen bg-background text-foreground landing-page-content">
              <LandingNavigation />
              <HeroSection />
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <WhatIsShadowTalk />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <UseCaseWedgesSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <BrandManifestoSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="slideLeft">
                  <CompetitiveComparison />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="section">
                  <FeaturesSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="scale">
                  <PricingSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="slideRight">
                  <TestimonialsSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="pop">
                  <CommunitySection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <CommunityBuildingBlock />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <FounderSpotlightSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <FAQSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="fadeUp">
                  <GrowthAmplifier />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="slideDown">
                  <Footer />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={null}>
                <StickyTryCTA />
                <ExitIntentPrompt />
                <FreeTierViralPrompt />
              </Suspense>
            </div>
          </LandingMotionProvider>
        </LandingPageShell>
      </PlatformMetricsProvider>
    </>
  );
};

export default Index;
