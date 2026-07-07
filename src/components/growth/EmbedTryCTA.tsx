import { Link } from "react-router-dom";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

interface EmbedTryCTAProps {
  /** UTM source for attribution — e.g. blog post slug */
  source?: string;
  /** Optional preset prompt shown in chat */
  prompt?: string;
  className?: string;
}

/**
 * Product-led content block — drop into blog posts or docs so readers try ShadowTalk immediately.
 */
export function EmbedTryCTA({
  source = "embed_cta",
  prompt = "Give me a 30-second overview of what ShadowTalk can do for me.",
  className = "",
}: EmbedTryCTAProps) {
  const chatHref = `/chatbot?utm_source=${encodeURIComponent(source)}&utm_medium=product_led&utm_campaign=phase3&prompt=${encodeURIComponent(prompt)}`;

  return (
    <div
      className={`rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6 ${className}`}
      role="complementary"
      aria-label={`Try ${BRAND.fullName}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-sm font-semibold text-foreground">Try it now — no login required</p>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Open {BRAND.fullName} in a new tab and run this prompt instantly. Free tier, stated daily limits.
      </p>
      <p className="text-xs font-mono bg-background/60 border border-border/40 rounded-lg px-3 py-2 mb-4 text-left text-muted-foreground">
        {prompt}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="btn-glow">
          <Link to={chatHref}>Open ShadowTalk chat</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href="/embed-widget.js" target="_blank" rel="noopener noreferrer">
            Embed on your site <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default EmbedTryCTA;
