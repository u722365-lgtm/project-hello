import { motion } from "framer-motion";
import { PRICING_COMPARE_ROWS } from "@/lib/pricingCatalog";
import { useLandingMotion } from "@/hooks/use-landing-motion";

const PricingCompareStrip = () => {
  const { profile, viewport, variants } = useLandingMotion();
  const rows = [...PRICING_COMPARE_ROWS, ...PRICING_COMPARE_ROWS];

  return (
    <section className="py-8 sm:py-10 overflow-hidden" aria-label="Price comparison">
      <motion.p
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants.fadeSlideUp}
        className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5"
      >
        Compare the market
      </motion.p>
      <div className="pricing-compare-track-wrap">
        <motion.div
          className="pricing-compare-track flex gap-3 w-max"
          animate={profile.reduced ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className={`pricing-compare-chip shrink-0 ${row.us ? "pricing-compare-chip--us" : ""}`}
            >
              <span className="text-sm font-medium">{row.label}</span>
              <span className={`text-sm font-bold ${row.us ? "gradient-text" : "text-muted-foreground"}`}>
                {row.price}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingCompareStrip;
