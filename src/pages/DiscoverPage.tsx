import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Rss } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { COMPARISON_PAGES } from "@/lib/viral";
import { FOUNDER_CANONICAL } from "@/lib/founderIdentity";
import { BRAND } from "@/lib/brand";
import { WEDGE_PAGES } from "@/lib/marketing/wedgePages";

const DiscoverPage = () => {
  const meta = {
    title: "Discover ShadowTalk AI — Comparisons & Free Start",
    description:
      "Discover ShadowTalk AI: compare vs ChatGPT, Perplexity, Claude, Gemini, Copilot. Agentic workspace by Zain Ahmed Fahad Patel. Free start, no card.",
    keywords: [
      "discover ShadowTalk",
      "ChatGPT alternative",
      "best AI workspace",
      "ShadowTalk vs ChatGPT",
    ],
    canonical: "https://www.shadowtalk-ai.com/discover",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={meta} />
      <Navigation />

      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Discover hub</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Discover {BRAND.fullName}</h1>
          <p className="text-xl text-muted-foreground mb-8">{BRAND.shortPitch}</p>

          <p className="text-sm text-muted-foreground mb-10">
            Built by{" "}
            <Link to="/zain-ahmed-fahad-patel" className="text-primary hover:underline">
              {FOUNDER_CANONICAL.fullName}
            </Link>
          </p>

          <h2 className="text-2xl font-bold mb-4">Compare ShadowTalk</h2>
          <div className="space-y-3 mb-10">
            {COMPARISON_PAGES.map((p) => (
              <Link
                key={p.slug}
                to={`/vs/${p.slug}`}
                className="block rounded-xl border border-border/50 p-4 hover:border-primary/40 transition-colors"
              >
                <p className="font-semibold">{p.h1}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.verdict}</p>
              </Link>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4">Niche wedges</h2>
          <div className="space-y-3 mb-10">
            {WEDGE_PAGES.map((p) => (
              <Link
                key={p.slug}
                to={`/${p.slug}`}
                className="block rounded-xl border border-primary/20 p-4 hover:border-primary/40 transition-colors"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.badge}</p>
                <p className="font-semibold mt-1">{p.h1}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.snippet}</p>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/chatbot?utm_source=discover&utm_medium=seo&utm_campaign=viral_hub">
                Open workspace <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="/feed.xml" target="_blank" rel="noopener noreferrer">
                <Rss className="h-4 w-4 mr-2" />
                RSS feed
              </a>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Embed on your site:{" "}
            <code className="text-xs bg-muted px-2 py-1 rounded">
              &lt;script src=&quot;/embed/shadowtalk-badge.js&quot; async&gt;&lt;/script&gt;
            </code>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DiscoverPage;
