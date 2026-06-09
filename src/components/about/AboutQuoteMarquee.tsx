import { ABOUT_MARQUEE_QUOTES } from "@/lib/aboutUserFeedback";

const LINES = ABOUT_MARQUEE_QUOTES;

const AboutQuoteMarquee = () => {
  const doubled = [...LINES, ...LINES];

  return (
    <section className="py-6 border-y border-border/40 bg-muted/20 overflow-hidden about-marquee-section">
      <div className="about-marquee-track flex gap-10 whitespace-nowrap">
        {doubled.map((line, i) => (
          <span
            key={`${i}-${line.slice(0, 12)}`}
            className="inline-flex items-center gap-10 text-sm md:text-base font-medium text-muted-foreground/90 shrink-0"
          >
            <span className="about-marquee-highlight">{line}</span>
            <span className="text-primary/40" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default AboutQuoteMarquee;
