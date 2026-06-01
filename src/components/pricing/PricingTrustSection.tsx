import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { getRiskReversalBullets } from "@/lib/conversionPsychology";
import { useLandingMotion } from "@/hooks/use-landing-motion";

const PricingTrustSection = () => {
  const { viewport, variants, hoverLift, profile } = useLandingMotion();
  const bullets = getRiskReversalBullets();

  return (
    <section className="container mx-auto px-4 pb-20 sm:pb-28 max-w-3xl text-center">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants.fadeSlideUp}
        className="pricing-trust-panel rounded-2xl border border-border/50 p-8 sm:p-10"
      >
        <p className="text-lg sm:text-xl font-semibold mb-2">
          Most builders choose{" "}
          <span className="gradient-text">Premium ($15/mo)</span>
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Unlimited messages, Mission Control, and the full agent stack — without the $200 ChatGPT Pro tax.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {bullets.map((label, i) => (
            <motion.span
              key={label}
              custom={i}
              variants={variants.cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={profile.reduced ? undefined : hoverLift}
              className="inline-flex items-center gap-1.5 glass-subtle rounded-full px-3 py-1.5 text-xs text-muted-foreground"
            >
              <Check className="h-3.5 w-3.5 text-success" />
              {label}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PricingTrustSection;
