import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import CouponBanner from "@/components/CouponBanner";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import LandingPageShell from "@/components/landing/LandingPageShell";
import LandingSectionReveal from "@/components/landing/LandingSectionReveal";
import LandingSectionFallback from "@/components/landing/LandingSectionFallback";
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
                  <FAQSection />
                </LandingSectionReveal>
              </Suspense>
              <Suspense fallback={<LandingSectionFallback />}>
                <LandingSectionReveal preset="slideDown">
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
