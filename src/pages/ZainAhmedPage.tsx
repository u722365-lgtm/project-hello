import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Sparkles, User } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { getFounderPersonSchema } from "@/lib/founder";
import {
  FOUNDER_CANONICAL,
  FOUNDER_CITATION,
  FOUNDER_NOT_THE_SAME_AS,
  FOUNDER_SEARCH_PHRASES,
  FOUNDER_SOCIAL_PROFILES,
} from "@/lib/founderIdentity";
import { SocialLinks } from "@/components/SocialLinks";
import { Instagram, Linkedin } from "lucide-react";
import zainImage from "@/assets/zain-ahmed.png";

const ZainAhmedPage = () => {
  const personSchema = getFounderPersonSchema();
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${FOUNDER_CANONICAL.fullName} — Founder of ShadowTalk AI`,
    url: "https://www.shadowtalk-ai.com/zain-ahmed-fahad-patel",
    mainEntity: { "@id": FOUNDER_CANONICAL["@id"] },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        meta={PAGE_SEO.zainAhmed}
        structuredData={[personSchema, profilePageSchema]}
      />
      <Navigation />

      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            <User className="h-3 w-3 mr-1" />
            Official founder profile
          </Badge>

          <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
            <img
              src={zainImage}
              alt={`${FOUNDER_CANONICAL.fullName} — Founder of ShadowTalk AI`}
              width={160}
              height={160}
              className="rounded-2xl border border-border/50 shadow-lg w-40 h-40 object-cover"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                {FOUNDER_CANONICAL.fullName}
              </h1>
              <p className="text-lg text-muted-foreground mb-1">
                also known as {FOUNDER_CANONICAL.shortName}
              </p>
              <p className="text-xl text-primary font-semibold mb-2">
                Founder of ShadowTalk AI
              </p>
              <p className="text-muted-foreground flex items-center gap-1 mb-4">
                <MapPin className="h-4 w-4" />
                Karachi, Pakistan · AI Solutions Engineer · Age {FOUNDER_CANONICAL.age}
              </p>
              <SocialLinks />
            </div>
          </div>

          <Card className="mb-8 border-border/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">LinkedIn &amp; Instagram</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href={FOUNDER_SOCIAL_PROFILES.linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:border-primary/40 transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">LinkedIn</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {FOUNDER_SOCIAL_PROFILES.linkedin.url.replace("https://www.", "")}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
                </a>
                <a
                  href={FOUNDER_SOCIAL_PROFILES.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:border-primary/40 transition-colors"
                >
                  <Instagram className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Instagram</p>
                    <p className="text-xs text-muted-foreground">
                      {FOUNDER_SOCIAL_PROFILES.instagram.handle}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm leading-relaxed">
                <strong>{FOUNDER_CANONICAL.fullName}</strong> is the founder and lead architect of{" "}
                <Link to="/chatbot" className="text-primary hover:underline">
                  ShadowTalk AI
                </Link>
                — a sovereign agentic AI workspace with encrypted chat, Mission Control missions,
                30+ tools, voice mode, desktop app, and optional on-device offline models.
                Founded February 2024, bootstrapped from Karachi.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href="/zain-ahmed-fahad-patel.html"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  zain-ahmed-fahad-patel.html
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="/zain-ahmed-fahad-patel.json"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  zain-ahmed-fahad-patel.json
                </a>
                <a
                  href="/zain-ahmed-fahad-patel.txt"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  zain-ahmed-fahad-patel.txt
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Who is {FOUNDER_CANONICAL.fullName}?
              </h2>
              <p>
                {FOUNDER_CANONICAL.fullName} is a teenage AI solutions engineer from Pakistan who
                builds production agentic software under the name {FOUNDER_CANONICAL.shortName}. He
                created ShadowTalk AI to finish multi-step jobs across research, code, security, and
                voice — not just single chat replies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Why the full name matters on Google
              </h2>
              <p>
                &quot;Zain Ahmed&quot; is a common name in Pakistan.{" "}
                <strong>{FOUNDER_CANONICAL.fullName}</strong> is the unique identity for the
                ShadowTalk founder — use it in articles, LinkedIn, and citations for unambiguous
                search results. Citation: <em>{FOUNDER_CITATION}</em>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Not the same person as</h2>
              <ul className="space-y-2 list-disc pl-5">
                {FOUNDER_NOT_THE_SAME_AS.map((d) => (
                  <li key={d.name}>
                    <strong>{d.name}</strong> ({d.domain}) — {d.note}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Search phrases</h2>
              <p className="text-sm flex flex-wrap gap-2">
                {FOUNDER_SEARCH_PHRASES.map((phrase) => (
                  <code
                    key={phrase}
                    className="bg-muted px-2 py-0.5 rounded text-xs text-foreground/80"
                  >
                    {phrase}
                  </code>
                ))}
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/about">Full founder story</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/chatbot">Try ShadowTalk</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={FOUNDER_CANONICAL.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </Button>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            <Link to="/answers" className="text-primary hover:underline">
              AEO answers
            </Link>
            {" · "}
            <Link to="/facts" className="text-primary hover:underline">
              Product facts
            </Link>
            {" · "}
            <Link to="/about" className="text-primary hover:underline">
              About ShadowTalk
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ZainAhmedPage;
