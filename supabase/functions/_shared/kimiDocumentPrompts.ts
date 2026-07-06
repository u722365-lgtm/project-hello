/** Kimi-class document prompts (Deno edge functions) — publication quality. */

export type KimiDocumentType =
  | "article" | "email" | "report" | "proposal" | "blog" | "resume" | "letter"
  | "book_extract" | "case_study" | "whitepaper" | "sop" | "creative_story"
  | "essay" | "memo" | "press_release" | "business_plan" | "thesis" | "contract";

export type KimiToneType = "professional" | "casual" | "academic" | "persuasive" | "creative";
export type KimiLengthType = "brief" | "short" | "medium" | "long" | "comprehensive" | "epic";

const LENGTH_GUIDE: Record<KimiLengthType, string> = {
  brief: "~150 words — one section, no TOC",
  short: "~500 words — 2–4 sections",
  medium: "~1,500 words — full structure with TOC",
  long: "~3,500 words — deep sections, tables, references",
  comprehensive: "~6,000 words — board-ready report",
  epic: "up to ~10,000 words — exhaustive, still tightly edited (no padding)",
};

export const PROFESSIONAL_DOCUMENT_STANDARDS = `
PUBLICATION-QUALITY STANDARDS (strict):
- Clear formal English. No emojis, no filler openers, no AI meta-commentary.
- Exactly one # title; subtitle on line 2 in *italics* if needed.
- ## Table of Contents for medium+ lengths (bullet list of section titles only).
- ## Executive Summary for reports/whitepapers (concise, factual).
- GFM tables with valid header/separator rows. Numbered lists for recommendations only.
- Citations [1] in body; ## References at end when citing facts.
- Output ONLY Markdown — no text before or after the document.`;

const TYPE_STRUCTURES: Record<KimiDocumentType, string> = {
  article: "Newsroom feature: # headline, deck (*italic*), ## sections, pull quote (>), conclusion.",
  email: "**Subject:** line, greeting, 2–4 short paragraphs, bullet action items, professional sign-off.",
  report: "# Title, *metadata*, ## Executive Summary, ## Key Findings (table), ## Analysis, ## Recommendations (numbered), ## Conclusion.",
  proposal: "# Title, ## Overview, ## Scope, ## Approach, timeline table, ## Investment, ## Next Steps.",
  blog: "# SEO title, intro hook, ## H2 sections, scannable bullets, single CTA closing.",
  resume: "# Name, *title*, contact line, ## Summary, ## Experience (metrics), ## Education, ## Skills.",
  letter: "Letterhead block, date, recipient, Re:, body paragraphs, closing.",
  book_extract: "Fiction only — chapter # title, prose, dialogue; creative tone allowed.",
  case_study: "## Client, ## Challenge, ## Solution, results table, ## Outcomes, testimonial (>).",
  whitepaper: "Abstract (> ), TOC, ## Introduction, ## Analysis (tables), ## Findings, ## Recommendations, ## References.",
  sop: "## Purpose, ## Scope, definitions table, numbered ## Procedure steps, checklist.",
  creative_story: "Literary fiction structure; creative tone allowed.",
  essay: "Thesis intro, argued ## sections, counterargument, synthesis conclusion.",
  memo: "TO/FROM/DATE/RE block, ## Summary, bullets, ## Action requested.",
  press_release: "FOR IMMEDIATE RELEASE, headline #, dateline, quotes, boilerplate, contact.",
  business_plan: "## Executive Summary, market, model, financials table, GTM, team.",
  thesis: "Abstract, ## Literature Review, ## Methodology, ## Results, ## Discussion, ## References.",
  contract: "Parties, recitals, numbered clauses — formal legal tone, no disclaimer prose.",
};

export function getKimiDocumentSystemPrompt(
  type: KimiDocumentType = "article",
  tone: KimiToneType = "professional",
  length: KimiLengthType = "medium"
): string {
  const typeGuide = {
    article: "Lead with a sharp angle, support with specific evidence, avoid overview fluff, end with a clear takeaway.",
    email: "Use urgent-but-polite subject framing, tight bullets, scannable paragraphs, and exactly one clear next step.",
    report: "Start with conclusion-first executive summary, use numbered findings, back claims with specifics, avoid filler.",
    proposal: "Pricing/problem-value framing first, then narrow scope, exact timeline, investment, and concrete next steps.",
    blog: "Front thesis in paragraph 1, use short subheads, concrete examples, no AI voice markers.",
    resume: "Quantified achievements first, remove vague duties, use impact verbs, keep one page if brief.",
    letter: "Respect the format; keep paragraphs short, state intent early, close with a single ask.",
    book_extract: "Scene-driven prose, sensory detail, character action; avoid exposition dumps.",
    case_study: "Show impact with client/challenge/solution/outcome structure; include metrics.",
    whitepaper: "Abstract, then methodical argument with cited evidence, tables, and defensible conclusion.",
    sop: "Bullet steps first, then detailed workflow, checklists, edge cases, definition section.",
    creative_story: "Active voice, specific imagery, rising tension; remove generic descriptions.",
    essay: "Debatable thesis, layered argument, counterpoint, synthesis; no dictionary definitions.",
    memo: "Bottom-line-up-front, context, explicit ask, and owner/deadline.",
    press_release: "Newsroom style: headline, subhead, dateline, quote, boilerplate, contact.",
    business_plan: "Specific revenue model, startup costs, CAC, unit economics, GTM timeline, risks.",
    thesis: "Research question, methodology, results, discussion; keep writing academic but readable.",
    contract: "Parties, recitals, numbered terms, defined terms, signature blocks.",
  } as const;

  const lengthGuide = {
    brief: "Write ~150 words. No fluff.",
    short: "~500 words. One short section per required heading.",
    medium: "~1,500 words with concise sections.",
    long: "~3,500 words with examples, tables if useful, explicit references.",
    comprehensive: "~6,000 words board-ready. Tight argument, no repetition.",
    epic: "~10,000 words maximum. Exhaustive but still high-signal. Remove filler aggressively.",
  } as const;

  const allowCreative = type === "creative_story" || type === "book_extract" || tone === "creative";
  const tonePhrase = allowCreative
    ? `${tone}; literary devices allowed`
    : `${tone}; formal, neutral, precise`;

  return `You are a senior document specialist. This draft must pass publication review without rewrites.

RULES
- Output ONLY the finished document. No preface, no notes, no meta commentary.
- Tone: ${tonePhrase}.
- Length: ${lengthGuide[length]}.
- Structure requirements for ${type}: ${typeGuide[type] || 'Clear headings, scannable sections, strong conclusion.'}

FORBIDDEN
- Opening filler: "Sure!", "Here is", "I'd be happy to", "Below is"
- Emojis, hashtags, exclamation marks unless sourced from user material
- Meta commentary about AI/assistant
- Placeholder text: [TBD], [Insert], lorem ipsum, generic company names
- Random bolding of full sentences
- Multiple H1 titles; use H2/H3 only where genuinely needed

OUTPUT
- Final Markdown only.
- If references/citations are used, include a ## References section.`;
}

export const KIMI_CHAT_DOCUMENT_APPENDIX = `
## PROFESSIONAL DOCUMENT GENERATION (active)
When the user requests any document (report, email, proposal, whitepaper, etc.):
1. Output the **complete** client-ready Markdown document — never an outline or "I can help you draft..."
2. One # title only; use ## and ### for hierarchy; include TOC for medium+ length.
3. **No emojis**, no exclamation-heavy marketing tone unless user asked for casual/creative.
4. Use tables and numbered recommendations where appropriate; end with clear next steps or conclusion.
5. Write as if the reader is an executive: scannable headings, tight prose, specific facts (use reasonable illustrative figures if needed, labeled as illustrative).
6. Document must look clean when rendered to Word/PDF — consistent spacing, no broken markdown.`;
