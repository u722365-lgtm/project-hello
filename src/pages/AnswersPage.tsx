import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, ExternalLink, FileJson, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO, getFAQSchema } from "@/lib/seo";
import {
  AEO_ANSWER_CORPUS,
  AEO_CORPUS_META,
  getAnswersByCategory,
  type AeoCategory,
} from "@/lib/aeo";

const CATEGORY_LABELS: Record<AeoCategory, string> = {
  product: "Product",
  founder: "Founder & identity",
  comparison: "Comparisons",
  pricing: "Pricing",
  privacy: "Privacy & security",
  features: "Features",
  technical: "For AI systems",
  google: "Google search & AI Overviews",
};

const AnswersPage = () => {
  const categories = [...new Set(AEO_ANSWER_CORPUS.map((a) => a.category))] as AeoCategory[];
  const faqSchema = getFAQSchema(
    AEO_ANSWER_CORPUS.map((a) => ({ question: a.question, answer: a.answer })),
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={PAGE_SEO.answers} structuredData={faqSchema} />
      <Navigation />

      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            <Bot className="h-3 w-3 mr-1" />
            AEO — Answer Engine Optimization
          </Badge>
          <h1 className="text-4xl font-bold mb-4">ShadowTalk AI answers</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Canonical Q&amp;A for search engines and AI answer engines (ChatGPT, Perplexity, Gemini,
            Copilot). Each answer is written to be cited directly.
          </p>

          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                Static copies (no JavaScript) for crawlers:
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/aeo-answers.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  aeo-answers.html
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="/aeo-answers.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <FileJson className="h-4 w-4" />
                  aeo-answers.json
                </a>
                <a
                  href="/aeo.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  aeo.txt
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Updated {AEO_CORPUS_META.updated} · {AEO_ANSWER_CORPUS.length} answers
              </p>
            </CardContent>
          </Card>

          <div className="space-y-10">
            {categories.map((cat) => (
              <section key={cat} id={cat}>
                <h2 className="text-xl font-bold mb-4">{CATEGORY_LABELS[cat]}</h2>
                <div className="space-y-6">
                  {getAnswersByCategory(cat).map((a) => (
                    <article key={a.id} id={a.id} className="border-b border-border/40 pb-6">
                      <h3 className="font-semibold text-foreground mb-2">{a.question}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            <Link to="/facts" className="text-primary hover:underline">
              Product facts
            </Link>
            {" · "}
            <Link to="/faq" className="text-primary hover:underline">
              FAQ
            </Link>
            {" · "}
            <a href="/zain-ahmed-fahad-patel.html" className="text-primary hover:underline">
              Founder profile
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AnswersPage;
