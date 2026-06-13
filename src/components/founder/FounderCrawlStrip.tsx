import { Link } from "react-router-dom";
import { FOUNDER_CANONICAL, FOUNDER_SOCIAL_PROFILES } from "@/lib/founderIdentity";

/**
 * Compact founder credit on /chatbot — indexed route (/) redirects here.
 */
export function FounderCrawlStrip() {
  return (
    <footer
      className="shrink-0 border-t border-border/30 bg-background/80 px-3 py-1.5 text-center text-[10px] sm:text-[11px] text-muted-foreground/80 leading-relaxed"
      aria-label="ShadowTalk AI founder"
    >
      <span>
        ShadowTalk AI — founded by{" "}
        <Link to="/zain-ahmed-fahad-patel" className="text-primary/90 hover:underline">
          {FOUNDER_CANONICAL.fullName}
        </Link>
        {" "}
        ({FOUNDER_CANONICAL.shortName}) · {FOUNDER_CANONICAL.location.city},{" "}
        {FOUNDER_CANONICAL.location.country}
      </span>
      <span className="hidden sm:inline">
        {" "}
        ·{" "}
        <a href={FOUNDER_SOCIAL_PROFILES.linkedin.url} rel="me noopener noreferrer" target="_blank">
          LinkedIn
        </a>
        {" "}
        ·{" "}
        <a href={FOUNDER_SOCIAL_PROFILES.instagram.url} rel="me noopener noreferrer" target="_blank">
          Instagram
        </a>
        {" "}
        ·{" "}
        <Link to="/about" className="hover:underline">
          About
        </Link>
      </span>
    </footer>
  );
}

export default FounderCrawlStrip;
