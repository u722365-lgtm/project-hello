import { Link, useParams, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getGoogleTopicBySlug } from "@/lib/googleSeo";
import { FOUNDER_CITATION } from "@/lib/founderIdentity";

const LearnTopicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getGoogleTopicBySlug(slug) : undefined;

  if (!page) {
    return <Navigate to="/google-seo" replace />;
  }

  const meta = {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    canonical: `https://www.shadowtalk-ai.com/learn/${page.slug}`,
    ogType: "article" as const,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={meta} />
      <Navigation />

      <article className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground mb-4">
            <Link to="/google-seo" className="hover:text-primary">
              Google SEO hub
            </Link>
            {" / "}
            {page.h1}
          </p>
          <h1 className="text-4xl font-bold mb-6">{page.h1}</h1>

          <div className="border-l-4 border-primary bg-primary/5 p-5 mb-8 text-lg leading-relaxed">
            {page.snippet}
          </div>

          {page.sections.map((s) => (
            <section key={s.heading} className="mb-8">
              <h2 className="text-xl font-bold mb-3">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-muted-foreground mb-3">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <p className="text-sm text-muted-foreground italic mb-8">{FOUNDER_CITATION}</p>

          <Button asChild size="lg">
            <Link
              to={`/chatbot?utm_source=learn_${page.slug}&utm_medium=google_seo&utm_campaign=aeo`}
            >
              Try ShadowTalk free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-8 text-sm text-muted-foreground">
            Static copy:{" "}
            <a href={`/learn/${page.slug}.html`} className="text-primary hover:underline">
              /learn/{page.slug}.html
            </a>
          </p>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default LearnTopicPage;
