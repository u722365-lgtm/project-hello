import { Link } from "react-router-dom";
import { MessageSquare, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMMUNITY_ETHICS } from "@/lib/ethicalGrowth";
import { COMMUNITY_MARKETING } from "@/lib/conversionCopy";
import ProofOverHypeBar from "@/components/growth/ProofOverHypeBar";

export function CommunityBuildingBlock() {
  return (
    <section className="py-16 sm:py-20 bg-muted/10 border-t border-border/40">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-4">
          <GitBranch className="h-3.5 w-3.5 text-primary" />
          {COMMUNITY_MARKETING.title}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">{COMMUNITY_MARKETING.headline}</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">{COMMUNITY_MARKETING.subtitle}</p>
        <ProofOverHypeBar className="mb-8" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to={COMMUNITY_ETHICS.ctaChangelog.href}>
              <GitBranch className="h-4 w-4" />
              {COMMUNITY_ETHICS.ctaChangelog.label}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to={COMMUNITY_ETHICS.ctaFeedback.href}>
              <MessageSquare className="h-4 w-4" />
              {COMMUNITY_ETHICS.ctaFeedback.label}
            </Link>
          </Button>
        </div>
        <Card className="mt-10 text-left border-border/50 bg-card/30">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p>
              We do not display fabricated testimonials or inflated “users online” counters. When you see
              community numbers on this site, they come from real workspace metrics or are labeled as
              illustrative.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default CommunityBuildingBlock;
