import { Link } from "react-router-dom";
import { ExternalLink, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FOUNDER_CANONICAL,
  FOUNDER_CITATION,
  FOUNDER_SOCIAL_PROFILES,
} from "@/lib/founderIdentity";

/**
 * Visible founder block on /home — gives Google crawlable text on the marketing page.
 */
const FounderSpotlightSection = () => {
  return (
    <section
      id="founder"
      className="py-16 md:py-20 px-4 border-t border-border/40"
      aria-labelledby="founder-spotlight-heading"
    >
      <div className="container mx-auto max-w-3xl">
        <Badge variant="secondary" className="mb-4">
          <User className="h-3 w-3 mr-1" aria-hidden />
          Founder
        </Badge>
        <h2 id="founder-spotlight-heading" className="text-2xl md:text-3xl font-bold mb-3">
          {FOUNDER_CANONICAL.fullName}
        </h2>
        <p className="text-muted-foreground mb-1">
          also known as {FOUNDER_CANONICAL.shortName} · {FOUNDER_CANONICAL.jobTitle}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-5">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {FOUNDER_CANONICAL.location.city}, {FOUNDER_CANONICAL.location.country} · Founded ShadowTalk
          AI February 2024
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-6">
          <strong className="text-foreground">{FOUNDER_CANONICAL.fullName}</strong> is the founder and
          lead architect of{" "}
          <Link to="/chatbot" className="text-primary hover:underline">
            ShadowTalk AI
          </Link>
          — a sovereign agentic AI workspace with encrypted chat, Mission Control missions, 30+ tools,
          voice mode, desktop app, and optional on-device offline models. {FOUNDER_CITATION}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="default" size="sm" asChild>
            <Link to="/founder">Founder profile</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={FOUNDER_SOCIAL_PROFILES.linkedin.url} rel="me noopener noreferrer" target="_blank">
              LinkedIn
              <ExternalLink className="h-3 w-3 ml-1" aria-hidden />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={FOUNDER_SOCIAL_PROFILES.instagram.url} rel="me noopener noreferrer" target="_blank">
              Instagram {FOUNDER_SOCIAL_PROFILES.instagram.handle}
              <ExternalLink className="h-3 w-3 ml-1" aria-hidden />
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/answers">AEO answers</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FounderSpotlightSection;
