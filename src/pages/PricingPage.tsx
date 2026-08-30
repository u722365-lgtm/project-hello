import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import PricingPageShell from "@/components/pricing/PricingPageShell";
import PricingPageContent from "@/components/pricing/PricingPageContent";
import { LandingMotionProvider } from "@/components/landing/LandingMotionProvider";

const PricingPage = () => {
  return (
    <>
      <SEOHead meta={PAGE_SEO.pricing} />
      <LandingMotionProvider>
        <PricingPageShell>
          <Navigation />
          <main>
            <PricingPageContent />
          </main>
          <Footer />
          <ChatWidget />
        </PricingPageShell>
      </LandingMotionProvider>
    </>
  );
};

export default PricingPage;
