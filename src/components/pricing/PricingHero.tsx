import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { heroTitleVariants } from "@/lib/pricingMotion";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { getSocialProofLine } from "@/lib/conversionPsychology";
import PricingBillingToggle, { type BillingMode } from "@/components/pricing/PricingBillingToggle";

type PricingHeroProps = {
  billing: BillingMode;
  onBillingChange: (mode: BillingMode) => void;
};

const PricingHero = ({ billing, onBillingChange }: PricingHeroProps) => {
  const { profile, viewport, variants } = useLandingMotion();
  const { totalUsers, isLoading } = usePlatformMetrics();

  return (
    <section className="pricing-hero relative pt-24 sm:pt-28 pb-10 sm:pb-14 px-4">
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants.scaleFadeIn}
          className="inline-flex items-center gap-2 glass-subtle rounded-full px-4 py-2 mb-6 border border-primary/20"
        >
          <Star className="h-4 w-4 text-primary" />
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">{LANDING_COPY.pricing.badge}</span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={heroTitleVariants(profile)}
          className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
        >
          {LANDING_COPY.pricing.title[0]}{" "}
          <span className="gradient-text block sm:inline mt-1 sm:mt-0">{LANDING_COPY.pricing.title[1]}</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={variants.fadeSlideUp}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
        >
          {LANDING_COPY.pricing.subtitle}
          {!isLoading && (
            <span className="block mt-3 text-sm text-primary/90 font-medium">{getSocialProofLine(totalUsers)}</span>
          )}
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants.fadeSlideUp}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-4"
        >
          <PricingBillingToggle value={billing} onChange={onBillingChange} />
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-warning" />
            {billing === "monthly"
              ? "Premium is the sweet spot for most builders"
              : "$99 once — everything in Elite, forever"}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingHero;
