import { Link } from "react-router-dom";
import { MessageSquare, GitBranch } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMMUNITY_ETHICS } from "@/lib/ethicalGrowth";
import { COMMUNITY_MARKETING } from "@/lib/conversionCopy";
import ProofOverHypeBar from "@/components/growth/ProofOverHypeBar";
import { useLandingMotion } from "@/hooks/use-landing-motion";

export function CommunityBuildingBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { variants } = useLandingMotion();

  return (
    <section className="py-16 sm:py-20 bg-muted/10 border-t border-border/40" ref={ref}>
      <motion.div
        className="container mx-auto px-4 max-w-4xl text-center"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={variants.staggerContainer}
      >
        <motion.div
          variants={variants.fadeSlideUp}
          className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-4"
        >
          <GitBranch className="h-3.5 w-3.5 text-primary" />
          {COMMUNITY_MARKETING.title}
        </motion.div>
        <motion.h2 variants={variants.fadeSlideUp} className="text-2xl sm:text-3xl font-bold mb-3">
          {COMMUNITY_MARKETING.headline}
        </motion.h2>
        <motion.p variants={variants.fadeSlideUp} className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          {COMMUNITY_MARKETING.subtitle}
        </motion.p>
        <motion.div variants={variants.fadeSlideUp}>
          <ProofOverHypeBar className="mb-8" />
        </motion.div>
        <motion.div variants={variants.fadeSlideUp} className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2 hover-scale">
            <Link to={COMMUNITY_ETHICS.ctaChangelog.href}>
              <GitBranch className="h-4 w-4" />
              {COMMUNITY_ETHICS.ctaChangelog.label}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 hover-scale">
            <Link to={COMMUNITY_ETHICS.ctaFeedback.href}>
              <MessageSquare className="h-4 w-4" />
              {COMMUNITY_ETHICS.ctaFeedback.label}
            </Link>
          </Button>
        </motion.div>
        <motion.div variants={variants.fadeSlideUp}>
          <Card className="mt-10 text-left border-border/50 bg-card/30">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p>
                We do not display fabricated testimonials or inflated “users online” counters. When you see
                community numbers on this site, they come from real workspace metrics or are labeled as
                illustrative.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default CommunityBuildingBlock;
