import { lazy, Suspense, useState, useEffect } from "react";
import LandingNavigation from "@/components/landing/LandingNavigation";
import HeroSection from "@/components/HeroSection";
import LandingSectionHub, { SectionHubTab } from "@/components/landing/LandingSectionHub";
import LandingContactSection from "@/components/landing/LandingContactSection";
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
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [activeSection, setActiveSection] = useState<SectionHubTab>("services");
  const [viewMode, setViewMode] = useState<"tabbed" | "all">("tabbed");
  const [showDeepComparisons, setShowDeepComparisons] = useState(false);

  // Synchronize hash with activeSection for instant navbar deep-linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["services", "founders", "pricing", "contact"].includes(hash)) {
        setActiveSection(hash as SectionHubTab);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

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
        "AI",
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
            {/* 3-Bar Navigation Bar with Hamburger Drawer */}
            <LandingNavigation />

            {/* High-Impact Hero Section */}
            <HeroSection />

            {/* Section Hub: Unified Interactive Switcher for Services, Founders, Pricing, Contact */}
            <LandingSectionHub
              activeTab={activeSection}
              onTabChange={(tab) => {
                setActiveSection(tab);
                const el = document.getElementById(tab);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Dynamic Modular Section Display: In default Tabbed Mode, only 1 section is shown to eliminate endless scrolling */}
            {viewMode === "tabbed" ? (
              <div className="relative min-h-[350px]">
                {/* SECTION 1: SERVICES */}
                {activeSection === "services" && (
                  <div id="services" className="relative">
                    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading services...</div>}>
                      <WhatIsShadowTalk />
                    </Suspense>
                  </div>
                )}

                {/* SECTION 2: ABOUT US & FOUNDERS SPOTLIGHT */}
                {activeSection === "founders" && (
                  <div id="founders" className="relative">
                    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading founders...</div>}>
                      <FounderSpotlightSection />
                    </Suspense>
                  </div>
                )}

                {/* SECTION 3: TRANSPARENT PRICING & TIERS */}
                {activeSection === "pricing" && (
                  <div id="pricing" className="relative">
                    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading pricing...</div>}>
                      <PricingSection />
                    </Suspense>
                  </div>
                )}

                {/* SECTION 4: CONTACT DETAILS & 24/7 SUPPORT */}
                {activeSection === "contact" && (
                  <div id="contact" className="relative">
                    <LandingContactSection />
                  </div>
                )}
              </div>
            ) : (
              /* All 4 Modular Sections (Rendered if visitor toggles View All) */
              <div className="relative space-y-4">
                <div id="services" className="relative">
                  <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading services...</div>}>
                    <WhatIsShadowTalk />
                  </Suspense>
                </div>

                <div id="founders" className="relative">
                  <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading founders...</div>}>
                    <FounderSpotlightSection />
                  </Suspense>
                </div>

                <div id="pricing" className="relative">
                  <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading pricing...</div>}>
                    <PricingSection />
                  </Suspense>
                </div>

                <div id="contact" className="relative">
                  <LandingContactSection />
                </div>
              </div>
            )}

            {/* Optional Deep-Dive Expander for Users who want in-depth competitive benchmarks */}
            <div className="py-8 px-4 text-center border-t border-white/5 bg-slate-950/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeepComparisons(!showDeepComparisons)}
                className="border-white/10 hover:bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                <Layers className="h-3.5 w-3.5 mr-2 text-cyan-400" />
                <span>
                  {showDeepComparisons
                    ? "Collapse In-Depth Comparisons & Ecosystem"
                    : "Show In-Depth Comparisons, Community & Features"}
                </span>
                {showDeepComparisons ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                )}
              </Button>
            </div>

            {/* Deep-Dive Modules (Rendered when expanded) */}
            {showDeepComparisons && (
              <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading extended analysis...</div>}>
                <CompetitiveComparison />
                <BrandManifestoSection />
                <FeaturesSection />
                <TestimonialsSection />
                <CommunitySection />
                <CommunityBuildingBlock />
                <GrowthAmplifier />
              </Suspense>
            )}

            {/* Conversion Prompts & Footer */}
            <Suspense fallback={null}>
              <StickyTryCTA />
              <ExitIntentPrompt />
              <FreeTierViralPrompt />
              <Footer />
            </Suspense>
          </div>
        </LandingPageShell>
      </PlatformMetricsProvider>
    </>
  );
};

export default Index;

