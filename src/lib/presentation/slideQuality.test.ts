import { describe, expect, it } from "vitest";
import { shadowtalkBrokenDeck } from "./fixtures/shadowtalkBrokenDeck";
import { postProcessSlide, postProcessPresentation } from "./slideQuality";

const theme = {
  bg: "#09090B",
  accent: "#FBBF24",
  accentEnd: "#F59E0B",
  text: "#FAFAFA",
  secondaryBg: "#18181B",
  cardBg: "#1C1C1E",
  mutedText: "#A1A1AA",
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}

describe("postProcessSlide remediation", () => {
  it("removes speaker scripts and uses master flex layout", () => {
    const slide = postProcessSlide(
      {
        title: "Welcome",
        subtitle: "Disrupting fragmented AI workflows.",
        layout: "title",
        html: `<div style="position:absolute;"><p>Good morning everyone. Today we're going to talk about ShadowTalk.</p></div>`,
        speakerNotes: "",
      },
      theme,
      0,
      10,
    );
    expect(slide.speakerNotes).toMatch(/good morning/i);
    expect(slide.html).toContain("flex-direction:column");
    expect(slide.html).toContain("max-width:640px");
    expect(stripTags(slide.html).toLowerCase()).not.toMatch(/good morning/);
  });

  it("converts dense text to icon bullets with narrow content width", () => {
    const slide = postProcessSlide(
      {
        title: "Market problem",
        subtitle: "Hidden costs of fragmented AI.",
        layout: "bullets",
        html: `<div><p>Teams switch apps 36 times per hour. Workers lose focus. Enterprises pay twice for overlapping tools. Adoption stalls without unified workflows.</p></div>`,
        speakerNotes: "",
      },
      theme,
      1,
      10,
    );
    expect(slide.html).toContain("<ul");
    expect(slide.html).toContain("<svg");
    expect(slide.html).toContain("max-width:640px");
  });

  it("injects workflow diagram when mission flow is referenced", () => {
    const slide = postProcessSlide(
      {
        title: "Agentic workflow",
        subtitle: "How a mission unfolds.",
        layout: "process",
        html: `<div><p>This workflow diagram illustrates how a mission unfolds from plan to deliver.</p></div>`,
        speakerNotes: "",
      },
      theme,
      3,
      10,
    );
    expect(slide.html).toContain("Plan");
    expect(slide.html).toContain("Execute");
    expect(slide.html).toContain("<svg");
  });

  it("adds stat cards and bar chart for numeric claims", () => {
    const slide = postProcessSlide(
      {
        title: "Market opportunity",
        subtitle: "Productivity gains",
        layout: "stats",
        html: `<div><p>The market reached $207.9 billion in 2023 with 25% increase in productivity and 2.5 times more output.</p></div>`,
        speakerNotes: "",
      },
      theme,
      4,
      10,
    );
    expect(slide.html).toContain("font-weight:800");
    expect(slide.html).toMatch(/<rect[^>]*y=/);
  });

  it("keeps closing slide minimal with script in notes", () => {
    const slide = postProcessSlide(
      {
        title: "Thank you",
        subtitle: "Let's discuss.",
        layout: "closing",
        html: `<div><p>Thank you for joining me today. I hope this presentation has given you a clear understanding of ShadowTalk.</p></div>`,
        speakerNotes: "",
      },
      theme,
      9,
      10,
    );
    expect(slide.speakerNotes).toMatch(/thank you/i);
    expect(stripTags(slide.html).toLowerCase()).not.toMatch(/thank you for joining/);
  });

  it("remediates full ShadowTalk deck end-to-end", () => {
    const remediated = postProcessPresentation({ ...shadowtalkBrokenDeck }, theme);
    const total = remediated.slides.length;

    remediated.slides.forEach((slide, i) => {
      expect(slide.html).toContain("flex-direction:column");
      expect(slide.html).toContain("max-width:640px");
      expect(slide.html).not.toMatch(/<h[1-6][^>]*position\s*:\s*absolute/i);
      const plain = stripTags(slide.html).toLowerCase();
      expect(plain).not.toMatch(/good morning/);
      expect(plain).not.toMatch(/today we're going to/);
      if (i === total - 1) {
        expect(plain).not.toMatch(/thank you for joining/);
        expect(slide.speakerNotes).toMatch(/thank you/i);
      }
    });

    const workflow = remediated.slides[3];
    expect(workflow.html).toContain("Plan");
    expect(workflow.html).toContain("Execute");

    const stats = remediated.slides[2];
    expect(stats.html).toMatch(/font-weight:800|<rect[^>]*y=/);
  });
});
