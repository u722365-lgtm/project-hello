import { Link, useParams, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getComparisonBySlug } from "@/lib/viral";

const VsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getComparisonBySlug(slug) : undefined;

  if (!page) {
    return <Navigate to="/discover" replace />;
  }

  const meta = {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    canonical: `https://www.shadowtalk-ai.com/vs/${page.slug}`,
    ogType: "article" as const,
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.metaDescription,
    url: `https://www.shadowtalk-ai.com/vs/${page.slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={meta} structuredData={structuredData} />
      <Navigation />

      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground mb-2">
            <Link to="/discover" className="hover:text-primary">
              Discover
            </Link>
            {" / "}
            {page.h1}
          </p>
          <h1 className="text-4xl font-bold mb-6">{page.h1}</h1>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-10">
            <p className="text-lg leading-relaxed">{page.verdict}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ShadowTalk AI wins
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                {page.shadowtalkWins.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span className="text-emerald-500 shrink-0">✓</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-amber-500" />
                {page.competitor} wins
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                {page.competitorWins.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span className="text-amber-500 shrink-0">·</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button size="lg" className="btn-glow" asChild>
            <Link to={`/chatbot?utm_source=vs_${page.slug}&utm_medium=seo&utm_campaign=viral_compare`}>
              Try ShadowTalk free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-8 text-sm text-muted-foreground">
            Static copy for crawlers:{" "}
            <a href={`/vs/${page.slug}.html`} className="text-primary hover:underline">
              /vs/{page.slug}.html
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VsPage;
