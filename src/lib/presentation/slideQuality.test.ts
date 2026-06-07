import { describe, expect, it } from "vitest";
import { postProcessSlide } from "./slideQuality";

const theme = {
  bg: "#09090B",
  accent: "#FBBF24",
  accentEnd: "#F59E0B",
  text: "#FAFAFA",
  secondaryBg: "#18181B",
  cardBg: "#1C1C1E",
  mutedText: "#A1A1AA",
};

describe("postProcessSlide", () => {
  it("moves speaker script off the slide into notes", () => {
    const slide = postProcessSlide(
      {
        title: "Welcome",
        subtitle: "Disrupting fragmented AI workflows.",
        layout: "title",
        html: `<div style="position:absolute;top:40px;"><h1>Welcome</h1><p>Good morning everyone. Today we're going to talk about ShadowTalk AI and how it changes productivity.</p></div>`,
        speakerNotes: "",
      },
      theme,
      0,
    );
    expect(slide.speakerNotes).toMatch(/good morning/i);
    expect(slide.html).toContain("flex-direction:column");
    expect(stripTags(slide.html).toLowerCase()).not.toMatch(/good morning/);
  });

  it("converts dense paragraphs to bullets", () => {
    const slide = postProcessSlide(
      {
        title: "Market problem",
        subtitle: "Hidden costs of fragmented AI.",
        layout: "bullets",
        html: `<div><h2>Market problem</h2><p>The irony of the AI revolution is that while it promises efficiency teams still switch apps constantly. Workers lose focus and context. Enterprises pay twice for overlapping tools. Adoption stalls without unified workflows.</p></div>`,
        speakerNotes: "Delivery notes here.",
      },
      theme,
      1,
    );
    expect(slide.html).toContain("<ul");
    expect(slide.html).toContain("flex-direction:column");
  });

  it("injects workflow diagram when text references one", () => {
    const slide = postProcessSlide(
      {
        title: "Agentic workflow",
        subtitle: "Unleashing true agentic intelligence.",
        layout: "process",
        html: `<div><h2>Agentic workflow</h2><p>This workflow diagram illustrates how a mission unfolds from plan to deliver.</p></div>`,
        speakerNotes: "",
      },
      theme,
      3,
    );
    expect(slide.html).toContain("<svg");
  });
});

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}
