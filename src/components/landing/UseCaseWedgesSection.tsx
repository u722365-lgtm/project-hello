import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Compass, Globe, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WEDGE_PAGES } from "@/lib/marketing/wedgePages";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingInteractiveCard from "@/components/landing/LandingInteractiveCard";

const WEDGE_ICONS = {
  "ai-strategy-consultant": Compass,
  "ai-business-planner": Briefcase,
  "anonymous-ai": Lock,
  "multilingual-ai": Globe,
} as const;

/**
 * Home page — surfaces wedge landing pages so visitors find niche entry points.
 */
const UseCaseWedgesSection = () => {
  const { variants, viewport } = useLandingMotion();

  return (
    <section
      id="use-cases"
      className="py-16 sm:py-24 bg-muted/10 relative overflow-hidden"
      aria-labelledby="use-cases-heading"
    >
      <div className="absolute inset-0 bg-grid-dense opacity-20" aria-hidden />
      <div className="container mx-auto px-4 relative z-10">
        <LandingSectionHeader
          badge="Find your use case"
          badgeIcon={Compass}
          title={
            <>
              Not sure where to start?{" "}
              <span className="gradient-text">Pick your path.</span>
            </>
          }
          subtitle="ShadowTalk owns specific workflows — strategy, planning, private chat, and multilingual work — not just another generic chat box."
          className="mb-10 sm:mb-14"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10">
          {WEDGE_PAGES.map((page, i) => {
            const Icon = WEDGE_ICONS[page.slug];
            return (
              <LandingInteractiveCard key={page.slug} index={i}>
                <Link to={`/${page.slug}`} className="block h-full group">
                  <Card className="h-full border-border/50 bg-card/40 transition-colors group-hover:border-primary/35">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" aria-hidden />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                            {page.badge.replace("Wedge: ", "")}
                          </p>
                          <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug mb-2">
                            {page.h1.split("—")[0]?.trim() ?? page.h1}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {page.snippet}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </LandingInteractiveCard>
            );
          })}
        </div>

        <motion.div
          variants={variants.fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild variant="outline" size="sm">
            <Link to="/case-studies">Case studies</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/partnerships">Partnerships</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/discover">
              All comparisons <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCaseWedgesSection;
