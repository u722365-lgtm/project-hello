/**
 * Slide quality rules + post-processing (Kimi/Manus deck standards).
 * Fixes: text overlap, speaker scripts on slides, dense paragraphs, missing diagrams.
 */

export interface SlideLike {
  title: string;
  subtitle?: string;
  layout: string;
  html: string;
  speakerNotes?: string;
  content?: Record<string, unknown>;
}

export interface ThemeLike {
  bg: string;
  accent: string;
  accentEnd: string;
  text: string;
  secondaryBg: string;
  cardBg: string;
  mutedText: string;
}

export const SLIDE_ANTI_OVERLAP_RULES = `
SLIDE LAYOUT (MANDATORY — prevents text overlap):
- Root container MUST use: display:flex; flex-direction:column; box-sizing:border-box; padding:48px 56px;
- NEVER use position:absolute for titles, subtitles, or body text (decorative shapes only).
- Header zone (title + subtitle): flex:0 0 auto; margin-bottom:20px; — title and subtitle MUST be separate block elements with margin between them.
- Content zone: flex:1 1 auto; overflow:hidden; max-width:848px; — bullets and visuals live here ONLY.
- Footer zone (optional source line): flex:0 0 auto; margin-top:16px; font-size:11px; opacity:0.5;
- Title: font-size:28-36px; line-height:1.15; margin:0 0 8px 0;
- Subtitle: font-size:15-18px; line-height:1.3; margin:0 0 0 0; opacity:0.75; max-width:90%;
- Body bullets: font-size:14-16px; line-height:1.45; max 6 bullets; max 14 words per bullet.
- NEVER stack subtitle and first bullet/paragraph at the same vertical position.`;

export const SLIDE_CONTENT_RULES = `
ON-SLIDE CONTENT (MANDATORY):
- Slides are VISUAL AIDS — never speaker scripts. Put ALL conversational script in speakerNotes ONLY.
- FORBIDDEN on slides: "Good morning", "Good afternoon", "Thank you for joining", "Today we're going to talk about", "Let me begin", "I hope this presentation has given you".
- FORBIDDEN: dense paragraphs (>3 lines). Use <ul><li> bullets instead.
- Each content slide: 3-6 bullet points OR one diagram + 2-3 bullets. Never full prose paragraphs.
- If you mention a diagram/workflow/chart, you MUST include an inline <svg> diagram on that slide.
- Include at least one stats slide with big numbers, one comparison or process diagram, and varied layouts.
- Data claims need a small footer source line, e.g. "Source: Industry report, 2025".`;

export const SPEAKER_SCRIPT_PATTERNS = [
  /\bgood\s+(morning|afternoon|evening)\b/i,
  /\bthank\s+you\s+for\s+(joining|your\s+time|listening|coming)\b/i,
  /\btoday,?\s+we(?:'re| are)\s+going\s+to\b/i,
  /\blet\s+me\s+(start|begin|walk\s+you)\b/i,
  /\bi\s+hope\s+this\s+presentation\b/i,
  /\bfor\s+your\s+attention\b/i,
];

const DIAGRAM_KEYWORDS = /\b(diagram|workflow|flowchart|process\s+flow|illustrates\s+how|chart\s+shows)\b/i;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractScriptLines(text: string): { cleaned: string; script: string } {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const scriptParts: string[] = [];
  const keepParts: string[] = [];

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;
    if (SPEAKER_SCRIPT_PATTERNS.some((p) => p.test(s))) {
      scriptParts.push(s);
    } else {
      keepParts.push(s);
    }
  }

  return {
    cleaned: keepParts.join(" "),
    script: scriptParts.join(" "),
  };
}

function sentencesToBullets(text: string, max = 6): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && s.length < 120);
  return parts.slice(0, max);
}

function buildProcessDiagramSvg(accent: string, accentEnd: string): string {
  return `<svg width="100%" height="140" viewBox="0 0 720 140" xmlns="http://www.w3.org/2000/svg" style="margin:12px 0;">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accentEnd}"/></linearGradient></defs>
  <rect x="10" y="50" width="120" height="44" rx="10" fill="${accent}" opacity="0.15" stroke="${accent}" stroke-width="2"/>
  <text x="70" y="77" text-anchor="middle" font-size="13" font-weight="600" fill="${accent}">Plan</text>
  <line x1="130" y1="72" x2="170" y2="72" stroke="${accent}" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="180" y="50" width="120" height="44" rx="10" fill="${accent}" opacity="0.15" stroke="${accent}" stroke-width="2"/>
  <text x="240" y="77" text-anchor="middle" font-size="13" font-weight="600" fill="${accent}">Execute</text>
  <line x1="300" y1="72" x2="340" y2="72" stroke="${accent}" stroke-width="2"/>
  <rect x="350" y="50" width="120" height="44" rx="10" fill="${accent}" opacity="0.15" stroke="${accent}" stroke-width="2"/>
  <text x="410" y="77" text-anchor="middle" font-size="13" font-weight="600" fill="${accent}">Deliver</text>
  <line x1="470" y1="72" x2="510" y2="72" stroke="${accent}" stroke-width="2"/>
  <rect x="520" y="50" width="120" height="44" rx="10" fill="url(#g)" opacity="0.9"/>
  <text x="580" y="77" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">Result</text>
</svg>`;
}

function buildBulletHtml(bullets: string[], theme: ThemeLike): string {
  const items = bullets
    .map(
      (b) =>
        `<li style="margin-bottom:10px;line-height:1.45;font-size:15px;">${b.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`,
    )
    .join("");
  return `<ul style="margin:0;padding-left:22px;list-style:disc;color:${theme.text};">${items}</ul>`;
}

function buildScaffoldedSlide(
  slide: SlideLike,
  bodyHtml: string,
  theme: ThemeLike,
  isHero = false,
): string {
  const bg = isHero
    ? `background:linear-gradient(135deg,${theme.accent},${theme.accentEnd});color:#fff;`
    : `background:${theme.bg};color:${theme.text};`;
  const titleColor = isHero ? "#fff" : theme.accent;
  const subtitle = slide.subtitle
    ? `<p style="margin:0;font-size:16px;line-height:1.35;opacity:0.78;max-width:90%;">${slide.subtitle.replace(/</g, "&lt;")}</p>`
    : "";

  return `<div style="width:960px;height:540px;overflow:hidden;position:relative;${bg}font-family:'Inter','Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;padding:48px 56px;">
  <header style="flex:0 0 auto;margin-bottom:20px;">
    <h1 style="margin:0 0 10px 0;font-size:${isHero ? "44" : "32"}px;line-height:1.15;font-weight:800;color:${titleColor};">${slide.title.replace(/</g, "&lt;")}</h1>
    ${subtitle}
  </header>
  <main style="flex:1 1 auto;overflow:hidden;max-width:848px;">${bodyHtml}</main>
</div>`;
}

function needsScaffold(html: string): boolean {
  const lower = html.toLowerCase();
  const hasFlexColumn =
    lower.includes("flex-direction:column") || lower.includes("flex-direction: column");
  const hasAbsoluteText = /<h[1-6][^>]*position\s*:\s*absolute/i.test(html) ||
    /<p[^>]*position\s*:\s*absolute/i.test(html);
  return !hasFlexColumn || hasAbsoluteText;
}

function htmlHasBullets(html: string): boolean {
  return /<ul|<li|display\s*:\s*list/i.test(html);
}

function htmlHasSvg(html: string): boolean {
  return /<svg/i.test(html);
}

export function postProcessSlide(slide: SlideLike, theme: ThemeLike, index: number): SlideLike {
  let html = slide.html || "";
  let speakerNotes = slide.speakerNotes || "";
  const plain = stripHtml(html);
  const isHero = slide.layout === "title" || slide.layout === "closing" || index === 0;

  // Move speaker scripts from visible text into notes
  const { cleaned, script } = extractScriptLines(plain);
  if (script) {
    speakerNotes = [script, speakerNotes].filter(Boolean).join("\n\n");
  }

  // Dense paragraph → bullets
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  const tooDense = wordCount > 80 && !htmlHasBullets(html);

  if (tooDense || needsScaffold(html) || script) {
    let bodyHtml = "";
    const bullets = sentencesToBullets(cleaned);
    const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
    if (tooDense || script || bullets.length >= 2) {
      bodyHtml =
        (svgMatch ? svgMatch[0] : "") +
        (bullets.length >= 2
          ? buildBulletHtml(bullets, theme)
          : `<p style="margin:0;font-size:15px;line-height:1.5;max-width:720px;">${cleaned.slice(0, 400).replace(/</g, "&lt;")}</p>`);
    } else {
      bodyHtml =
        (svgMatch ? svgMatch[0] : "") +
        `<p style="margin:0;font-size:15px;line-height:1.5;max-width:720px;">${cleaned.slice(0, 400).replace(/</g, "&lt;")}</p>`;
    }

    // Inject diagram if text references one but HTML lacks SVG
    if (DIAGRAM_KEYWORDS.test(cleaned + " " + (slide.subtitle || "")) && !htmlHasSvg(html)) {
      bodyHtml = buildProcessDiagramSvg(theme.accent, theme.accentEnd) + bodyHtml;
    }

    html = buildScaffoldedSlide(slide, bodyHtml, theme, isHero);
  } else if (DIAGRAM_KEYWORDS.test(plain) && !htmlHasSvg(html)) {
    const diagram = buildProcessDiagramSvg(theme.accent, theme.accentEnd);
    html = html.replace(/<main[^>]*>/i, (m) => `${m}${diagram}`).replace(
      /<div style="width:960px/i,
      (m) => m,
    );
    if (!html.includes("<svg")) {
      html = buildScaffoldedSlide(
        slide,
        diagram + buildBulletHtml(sentencesToBullets(cleaned, 4), theme),
        theme,
        isHero,
      );
    }
  }

  // Title/closing slides: minimal on-slide text
  if (isHero && wordCount > 40) {
    html = buildScaffoldedSlide(
      slide,
      slide.subtitle
        ? `<p style="margin:0;font-size:18px;opacity:0.85;max-width:640px;">${slide.subtitle.replace(/</g, "&lt;")}</p>`
        : "",
      theme,
      true,
    );
    if (!speakerNotes && cleaned) speakerNotes = cleaned;
  }

  return {
    ...slide,
    html,
    speakerNotes: speakerNotes.trim(),
    content: {
      ...(slide.content || {}),
      bullets: sentencesToBullets(cleaned, 6),
    },
  };
}

export function postProcessPresentation<T extends { slides: SlideLike[] }>(
  presentation: T,
  theme: ThemeLike,
): T {
  if (!presentation.slides?.length) return presentation;
  presentation.slides = presentation.slides.map((slide, i) =>
    postProcessSlide(slide, theme, i)
  );
  return presentation;
}
