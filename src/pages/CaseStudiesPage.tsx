import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { CASE_STUDIES } from "@/lib/marketing/caseStudies";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const CASE_STUDIES_META = {
  title: "Case Studies — ShadowTalk AI (PSOF Framework)",
  description:
    "Real ShadowTalk use cases: Problem, Solution, Outcome, Framework. Founder GTM, anonymous research, and multilingual ops — try the product free.",
  keywords: [
    "ShadowTalk case study",
    "AI strategy case study",
    "agentic AI outcomes",
    "PSOF framework",
  ],
  canonical: "https://www.shadowtalk-ai.com/case-studies",
  ogType: "article" as const,
};

const CaseStudiesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={CASE_STUDIES_META} />
      <Navigation />

      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">GEO · Case studies</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Case studies (PSOF)</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Problem → Solution → Outcome → Framework. Structured stories so search engines and AI
            answer engines can cite ShadowTalk accurately for niche workflows.
          </p>

          <div className="space-y-6 mb-10">
            {CASE_STUDIES.map((study) => (
              <Card key={study.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {study.persona}
                  </p>
                  <h2 className="text-xl font-bold">{study.title}</h2>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    <strong className="text-foreground">Problem:</strong>{" "}
                    <span className="text-muted-foreground">{study.problem}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">Solution:</strong>{" "}
                    <span className="text-muted-foreground">{study.solution}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">Outcome:</strong>{" "}
                    <span className="text-muted-foreground">{study.outcome}</span>
                  </p>
                  <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                    {study.framework}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link to={study.ctaHref}>
                      Try this workflow <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button asChild size="lg" className="btn-glow">
            <Link to="/chatbot?utm_source=case_studies&utm_medium=geo&utm_campaign=phase4">
              Start free on ShadowTalk <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseStudiesPage;
