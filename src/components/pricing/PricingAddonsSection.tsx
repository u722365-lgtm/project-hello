import { motion } from "framer-motion";
import { BookOpen, Coins, Gift, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PRICING_ADDONS } from "@/lib/pricingCatalog";
import { useLandingMotion } from "@/hooks/use-landing-motion";

const extras = [
  {
    icon: Coins,
    title: "Pay-per-use credits",
    desc: "Buy credits without a subscription",
    cta: "Buy credits",
    href: "/founder-access",
  },
  {
    icon: TrendingUp,
    title: "Affiliate program",
    desc: "Earn 20–40% recurring commission",
    cta: "Start earning",
    href: "/profile",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "API reference & guides",
    cta: "Read docs",
    href: "/docs",
  },
] as const;

const PricingAddonsSection = () => {
  const navigate = useNavigate();
  const { viewport, variants, hoverLift, profile } = useLandingMotion();

  return (
    <section className="container mx-auto px-4 py-16 sm:py-20 max-w-5xl">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants.fadeSlideUp}
        className="text-center mb-10"
      >
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Beyond subscriptions</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Pay only for what you need — or grow with us.</p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {PRICING_ADDONS.map((item, i) => (
          <motion.div
            key={item.title}
            custom={i}
            variants={variants.cardReveal}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            whileHover={profile.reduced ? undefined : hoverLift}
            className="pricing-addon-card rounded-2xl border border-border/50 p-5 text-center"
          >
            <span className="text-2xl mb-3 block">{item.emoji}</span>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
            <p className="text-lg font-bold gradient-text mb-4">{item.price}</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/founder-access")}>
              Get started
            </Button>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants.fadeSlideUp}
        className="glass-subtle rounded-2xl border border-primary/15 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10"
      >
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary shrink-0" />
          <div className="text-left">
            <p className="font-semibold text-sm">Earn 20% on every referral</p>
            <p className="text-xs text-muted-foreground">Share ShadowTalk — get paid when friends upgrade.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
          Get your link →
        </Button>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4">
        {extras.map((item, i) => (
          <motion.div
            key={item.title}
            custom={i}
            variants={variants.cardReveal}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            whileHover={profile.reduced ? undefined : hoverLift}
            className="pricing-extra-card rounded-xl p-5 text-center border border-border/40"
          >
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
            <p className="text-xs text-muted-foreground mb-4">{item.desc}</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(item.href)}>
              {item.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default PricingAddonsSection;
