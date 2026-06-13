import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { GOOGLE_SEO_HUB, GOOGLE_TOPIC_PAGES } from "@/lib/googleSeo";
import { AEO_ANSWER_CORPUS } from "@/lib/aeo";
import { FOUNDER_CANONICAL } from "@/lib/founderIdentity";

const GoogleSeoHubPage = () => {
  const googleAnswers = AEO_ANSWER_CORPUS.filter((a) => a.category === "google");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={PAGE_SEO.googleSeo} />
      <Navigation />

      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Google SEO + AEO</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Google search index</h1>
          <p className="text-lg text-muted-foreground mb-6">{GOOGLE_SEO_HUB.description}</p>
          <p className="text-sm mb-10">
            Founder:{" "}
            <Link to="/zain-ahmed-fahad-patel" className="text-primary hover:underline">
              {FOUNDER_CANONICAL.fullName}
            </Link>
          </p>

          <h2 className="text-2xl font-bold mb-4">Topic guides</h2>
          <div className="space-y-3 mb-10">
            {GOOGLE_TOPIC_PAGES.map((p) => (
              <Link
                key={p.slug}
                to={`/learn/${p.slug}`}
                className="block rounded-xl border border-border/50 p-4 hover:border-primary/40"
              >
                <p className="font-semibold">{p.h1}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.snippet}</p>
              </Link>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4">Google / AI Overview Q&amp;A</h2>
          <ul className="space-y-2 text-sm text-muted-foreground mb-10 list-disc pl-5">
            {googleAnswers.map((a) => (
              <li key={a.id}>
                <Link to={`/answers#${a.id}`} className="text-primary hover:underline">
                  {a.question}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold mb-4">Core AEO files</h2>
          <ul className="text-sm space-y-1 text-muted-foreground mb-10">
            <li>
              <a href="/aeo-answers.html" className="text-primary hover:underline">
                aeo-answers.html
              </a>
            </li>
            <li>
              <a href="/google-aeo.txt" className="text-primary hover:underline">
                google-aeo.txt
              </a>
            </li>
            <li>
              <a href="/zain-ahmed-fahad-patel.html" className="text-primary hover:underline">
                Founder entity
              </a>
            </li>
          </ul>

          <Button asChild>
            <Link to="/chatbot">
              Open ShadowTalk <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GoogleSeoHubPage;
