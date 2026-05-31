import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import CouponBanner from "@/components/CouponBanner";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import LandingPageShell from "@/components/landing/LandingPageShell";
import LandingSectionReveal from "@/components/landing/LandingSectionReveal";
import { LandingMotionProvider } from "@/components/landing/LandingMotionProvider";
import { PlatformMetricsProvider } from "@/contexts/PlatformMetricsContext";

const BrandManifestoSection = lazy(() => import("@/components/brand/BrandManifestoSection"));
const CompetitiveComparison = lazy(() => import("@/components/CompetitiveComparison"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const CommunitySection = lazy(() => import("@/components/CommunitySection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionFallback = () => (
  <div className="py-16 sm:py-20 min-h-[120px]" aria-hidden />
);

const Index = () => {
  return (
    <>
      <SEOHead meta={PAGE_SEO.home} />
      <PlatformMetricsProvider>
        <LandingPageShell>
          <LandingMotionProvider>
            <div className="min-h-screen bg-background text-foreground landing-page-content">
              <CouponBanner />
              <Navigation landingAnimated />
              <HeroSection />
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <BrandManifestoSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <CompetitiveComparison />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <FeaturesSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <PricingSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <TestimonialsSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <CommunitySection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <FAQSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<SectionFallback />}>
                <LandingSectionReveal>
                  <Footer />
                </LandingSectionReveal>
              </Suspense>
            </div>
          </LandingMotionProvider>
        </LandingPageShell>
      </PlatformMetricsProvider>
    </>
  );
};

export default Index;
