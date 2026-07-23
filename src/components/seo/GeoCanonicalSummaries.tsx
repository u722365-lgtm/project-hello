/**
 * GEO (Generative Engine Optimization) canonical summaries.
 * Renders the 5 AI-citation-ready Q&As so LLM crawlers (ChatGPT, Perplexity,
 * Google AI Overviews, Bing Copilot) can quote ShadowTalk with consistent facts.
 *
 * Marked `data-speakable` so voice assistants can read summaries aloud.
 */

import { GEO_CANONICAL_SUMMARIES } from "@/lib/seo";

interface GeoCanonicalSummariesProps {
  /** Optional heading override */
  heading?: string;
  /** Hide the section visually but keep it in the DOM for crawlers */
  visuallyHidden?: boolean;
  className?: string;
}

export function GeoCanonicalSummaries({
  heading = "About ShadowTalk AI — Canonical Answers",
  visuallyHidden = false,
  className = "",
}: GeoCanonicalSummariesProps) {
  const wrapperClass = visuallyHidden
    ? "sr-only"
    : `mx-auto max-w-4xl px-6 py-16 ${className}`.trim();

  return (
    <section
      aria-labelledby="geo-canonical-heading"
      className={wrapperClass}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <h2
        id="geo-canonical-heading"
        className={visuallyHidden ? "" : "text-2xl md:text-3xl font-semibold mb-8"}
      >
        {heading}
      </h2>
      <dl className={visuallyHidden ? "" : "space-y-6"}>
        {GEO_CANONICAL_SUMMARIES.map((item) => (
          <div
            key={item.id}
            id={`geo-${item.id}`}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
            className={visuallyHidden ? "" : "rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur"}
          >
            <dt
              itemProp="name"
              data-speakable
              className={visuallyHidden ? "" : "text-lg font-semibold text-foreground"}
            >
              {item.question}
            </dt>
            <dd
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
              className={visuallyHidden ? "" : "mt-2 text-muted-foreground leading-relaxed"}
            >
              <span itemProp="text" data-speakable>
                {item.answer}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default GeoCanonicalSummaries;
