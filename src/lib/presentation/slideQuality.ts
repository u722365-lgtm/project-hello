/**
 * Slide remediation engine — implements Kimi/Manus + QA remediation guide:
 * overlap fix, speaker notes separation, bullets, stats charts, icons, master layout.
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

/** Master template constants — ~65 char line length, clear hierarchy */
const CONTENT_MAX_WIDTH = "640px";
const HEADER_TITLE_SIZE = "30px";
const HERO_TITLE_SIZE = "42px";
const SUBTITLE_SIZE = "16px";
const BULLET_SIZE = "15px";

export const SLIDE_MASTER_TEMPLATE_RULES = `
MASTER SLIDE TEMPLATE (use on EVERY slide):
- Canvas: 960×540px, display:flex; flex-direction:column; padding:44px 52px; box-sizing:border-box
- Header zone: accent left bar (4px wide) + title (30px bold) + subtitle (16px, separate line, 10px gap below title)
- Content zone: max-width ${CONTENT_MAX_WIDTH} — NEVER full-bleed text (optimal 50-75 char lines)
- Footer zone: optional source line (11px, opacity 0.45) + bottom accent bar (4px gradient)
- Visual hierarchy: title (accent color) > subtitle (muted) > bullets (body) > footer (smallest)`;

export const SLIDE_ANTI_OVERLAP_RULES = `
ANTI-OVERLAP (CRITICAL):
- NEVER position:absolute on h1,h2,h3,p,ul,li,span text
- Title, subtitle, and body MUST be in separate block elements with margin between them
- Header margin-bottom: 22px minimum before content zone
- Content flex:1; overflow:hidden — bullets and charts only in content zone`;

export const SLIDE_CONTENT_RULES = `
CONTENT RULES:
- Slides = visual aids. ALL conversational script in speakerNotes ONLY
- FORBIDDEN on slides: "Good morning", "Thank you for joining", "Today we're going to", "I hope this presentation"
- FORBIDDEN: paragraphs >2 lines. Use 3-6 bullets, max 14 words each
- Title/closing slides: title + subtitle/tagline ONLY on slide — script in speakerNotes
- Stats slides: big numbers in KPI cards + inline SVG bar/line chart
- Process slides: inline SVG workflow diagram (Plan→Execute→Deliver→Result)
- Every bullet list: include small inline SVG icon per item`;

export const SLIDE_VISUAL_RULES = `
VISUAL ENGAGEMENT (MANDATORY):
- At least 2 slides with SVG bar charts or KPI stat cards for numeric claims
- At least 1 slide with process/workflow SVG diagram
- Every content slide: 1+ inline SVG icon (24px) on cards or bullet markers
- When citing "$X billion", "X times", "X%", render as visual stat — not plain text
- Footer source on data slides: "Source: [Org], 2025"`;

export const SPEAKER_SCRIPT_PATTERNS = [
  /\bgood\s+(morning|afternoon|evening)\b/i,
  /\bthank\s+you\s+for\s+(joining|your\s+time|listening|coming|your\s+attention)\b/i,
  /\btoday,?\s+we(?:'re| are)\s+going\s+to\b/i,
  /\blet\s+me\s+(start|begin|walk\s+you)\b/i,
  /\bi\s+hope\s+this\s+presentation\b/i,
  /\bfor\s+your\s+attention\b/i,
  /\bthank\s+you\s+for\s+joining\s+me\b/i,
];

const DIAGRAM_KEYWORDS = /\b(diagram|workflow|flowchart|process\s+flow|illustrates\s+how|mission\s+unfolds|chart\s+shows)\b/i;
const STATS_KEYWORDS = /\b(\d+[\d,.]*\s*%|\$\d|billion|million|\d+\s*times|increase|productivity|market\s+size)\b/i;

const METRIC_PATTERN = /(\d[\d,.]*)\s*(%|percent|times|x|billion|million|B|M)?/gi;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

  return { cleaned: keepParts.join(" "), script: scriptParts.join(" ") };
}

function sentencesToBullets(text: string, max = 6): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && s.length < 110)
    .slice(0, max);
}

function extractMetrics(text: string): { value: string; label: string }[] {
  const results: { value: string; label: string }[] = [];
  const seen = new Set<string>();

  const patterns = [
    /(\d[\d,.]*)\s*times?\s+(?:per\s+hour|more|faster)/gi,
    /\$\s*(\d[\d,.]*)\s*(billion|million|B|M)?/gi,
    /(\d[\d,.]*)\s*%/gi,
    /(\d[\d,.]*)\s*(?:x|×)\s*(?:more|faster|output)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null && results.length < 4) {
      const raw = match[0].trim();
      if (seen.has(raw)) continue;
      seen.add(raw);
      const value = match[1] ? match[0].replace(/\s+/g, " ").trim() : raw;
      const label = text.slice(Math.max(0, match.index - 20), match.index + raw.length + 30)
        .replace(raw, "")
        .trim()
        .slice(0, 40) || "Key metric";
      results.push({ value: value.slice(0, 18), label: label.slice(0, 32) });
    }
  }

  return results.slice(0, 4);
}

function buildBulletIconSvg(accent: string): string {
  return `<svg width="14" height="14" viewBox="0 0 14 14" style="display:inline-block;vertical-align:middle;margin-right:8px;flex-shrink:0;"><circle cx="7" cy="7" r="6" fill="${accent}" opacity="0.2"/><path d="M4.5 7l2 2 3-4" stroke="${accent}" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
}

function buildProcessDiagramSvg(accent: string, accentEnd: string): string {
  return `<svg width="100%" height="130" viewBox="0 0 640 130" xmlns="http://www.w3.org/2000/svg" style="margin:8px 0 14px 0;">
  <defs><linearGradient id="wf" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accentEnd}"/></linearGradient></defs>
  <rect x="8" y="44" width="108" height="40" rx="8" fill="${accent}" opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
  <text x="62" y="69" text-anchor="middle" font-size="12" font-weight="600" fill="${accent}">Plan</text>
  <line x1="116" y1="64" x2="148" y2="64" stroke="${accent}" stroke-width="2"/>
  <rect x="152" y="44" width="108" height="40" rx="8" fill="${accent}" opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
  <text x="206" y="69" text-anchor="middle" font-size="12" font-weight="600" fill="${accent}">Execute</text>
  <line x1="260" y1="64" x2="292" y2="64" stroke="${accent}" stroke-width="2"/>
  <rect x="296" y="44" width="108" height="40" rx="8" fill="${accent}" opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
  <text x="350" y="69" text-anchor="middle" font-size="12" font-weight="600" fill="${accent}">Deliver</text>
  <line x1="404" y1="64" x2="436" y2="64" stroke="${accent}" stroke-width="2"/>
  <rect x="440" y="44" width="108" height="40" rx="8" fill="url(#wf)"/>
  <text x="494" y="69" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Result</text>
</svg>`;
}

function buildBarChartSvg(metrics: { value: string; label: string }[], accent: string, accentEnd: string): string {
  if (metrics.length === 0) return "";
  const barW = Math.floor(520 / metrics.length) - 12;
  const bars = metrics
    .map((m, i) => {
      const h = 50 + (i % 3) * 25;
      const x = 20 + i * (barW + 12);
      return `<rect x="${x}" y="${110 - h}" width="${barW}" height="${h}" rx="6" fill="url(#bc)" opacity="0.85"/>
      <text x="${x + barW / 2}" y="${98 - h}" text-anchor="middle" font-size="13" font-weight="700" fill="${accent}">${escapeHtml(m.value)}</text>
      <text x="${x + barW / 2}" y="122" text-anchor="middle" font-size="9" fill="${accent}" opacity="0.7">${escapeHtml(m.label)}</text>`;
    })
    .join("");
  return `<svg width="100%" height="140" viewBox="0 0 560 140" xmlns="http://www.w3.org/2000/svg" style="margin:10px 0;">
  <defs><linearGradient id="bc" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accentEnd}"/></linearGradient></defs>
  ${bars}
</svg>`;
}

function buildStatsCardsHtml(metrics: { value: string; label: string }[], theme: ThemeLike): string {
  if (metrics.length === 0) return "";
  const cards = metrics
    .map(
      (m) =>
        `<div style="flex:1;min-width:120px;padding:16px 14px;border-radius:12px;background:${theme.cardBg};border:1px solid ${theme.accent}22;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:${theme.accent};line-height:1.1;">${escapeHtml(m.value)}</div>
      <div style="font-size:11px;color:${theme.mutedText};margin-top:6px;line-height:1.3;">${escapeHtml(m.label)}</div>
    </div>`,
    )
    .join("");
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 14px 0;">${cards}</div>`;
}

function buildBulletHtml(bullets: string[], theme: ThemeLike): string {
  const icon = buildBulletIconSvg(theme.accent);
  const items = bullets
    .map(
      (b) =>
        `<li style="margin-bottom:11px;line-height:1.45;font-size:${BULLET_SIZE};display:flex;align-items:flex-start;max-width:${CONTENT_MAX_WIDTH};">${icon}<span>${escapeHtml(b)}</span></li>`,
    )
    .join("");
  return `<ul style="margin:0;padding:0;list-style:none;color:${theme.text};">${items}</ul>`;
}

function buildMasterSlide(
  slide: SlideLike,
  bodyHtml: string,
  theme: ThemeLike,
  opts: { isHero?: boolean; isClosing?: boolean; source?: string } = {},
): string {
  const { isHero = false, isClosing = false, source } = opts;
  const bg = isHero || isClosing
    ? `background:linear-gradient(135deg,${theme.accent},${theme.accentEnd});color:#fff;`
    : `background:${theme.bg};color:${theme.text};`;
  const titleColor = isHero || isClosing ? "#fff" : theme.accent;
  const titleSize = isHero || isClosing ? HERO_TITLE_SIZE : HEADER_TITLE_SIZE;
  const subtitle = slide.subtitle
    ? `<p style="margin:8px 0 0 0;font-size:${SUBTITLE_SIZE};line-height:1.35;opacity:0.78;max-width:${CONTENT_MAX_WIDTH};">${escapeHtml(slide.subtitle)}</p>`
    : "";
  const accentBar = isHero || isClosing
    ? ""
    : `<div style="width:4px;min-height:48px;border-radius:2px;background:linear-gradient(180deg,${theme.accent},${theme.accentEnd});margin-right:14px;flex-shrink:0;"></div>`;
  const footer = source
    ? `<footer style="flex:0 0 auto;margin-top:14px;font-size:11px;opacity:0.45;max-width:${CONTENT_MAX_WIDTH};">${escapeHtml(source)}</footer>`
    : "";
  const bottomBar = `<div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${theme.accent},${theme.accentEnd});"></div>`;

  return `<div style="width:960px;height:540px;overflow:hidden;position:relative;${bg}font-family:'Inter','Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;padding:44px 52px;">
  ${bottomBar}
  <header style="flex:0 0 auto;margin-bottom:22px;display:flex;align-items:flex-start;max-width:100%;">
    ${accentBar}
    <div style="flex:1;min-width:0;">
      <h1 style="margin:0;font-size:${titleSize};line-height:1.12;font-weight:800;color:${titleColor};max-width:${CONTENT_MAX_WIDTH};">${escapeHtml(slide.title)}</h1>
      ${subtitle}
    </div>
  </header>
  <main style="flex:1 1 auto;overflow:hidden;max-width:${CONTENT_MAX_WIDTH};min-height:0;">${bodyHtml}</main>
  ${footer}
</div>`;
}

function needsScaffold(html: string): boolean {
  const lower = html.toLowerCase();
  const hasFlexColumn = lower.includes("flex-direction:column") || lower.includes("flex-direction: column");
  const hasAbsoluteText =
    /<h[1-6][^>]*position\s*:\s*absolute/i.test(html) || /<p[^>]*position\s*:\s*absolute/i.test(html);
  const tooWide = !lower.includes("max-width") || lower.includes("max-width:848") || lower.includes("max-width: 848");
  return !hasFlexColumn || hasAbsoluteText || tooWide;
}

function htmlHasBullets(html: string): boolean {
  return /<ul|<li/i.test(html);
}

function htmlHasSvg(html: string): boolean {
  return /<svg/i.test(html);
}

function buildBodyContent(
  cleaned: string,
  slide: SlideLike,
  theme: ThemeLike,
  existingHtml: string,
): string {
  const bullets = sentencesToBullets(cleaned);
  const svgMatch = existingHtml.match(/<svg[\s\S]*?<\/svg>/gi);
  const preservedSvg = svgMatch ? svgMatch.join("") : "";
  const textBlob = cleaned + " " + (slide.subtitle || "");

  let visuals = preservedSvg;

  if (DIAGRAM_KEYWORDS.test(textBlob) && !htmlHasSvg(visuals)) {
    visuals = buildProcessDiagramSvg(theme.accent, theme.accentEnd) + visuals;
  }

  const metrics = extractMetrics(cleaned);
  if (STATS_KEYWORDS.test(textBlob) && metrics.length > 0 && !/bar chart|kpi/i.test(visuals)) {
    visuals += buildStatsCardsHtml(metrics, theme) + buildBarChartSvg(metrics, theme.accent, theme.accentEnd);
  }

  if (bullets.length >= 2) {
    return visuals + buildBulletHtml(bullets, theme);
  }

  if (cleaned.length > 20) {
    return visuals + `<p style="margin:0;font-size:${BULLET_SIZE};line-height:1.5;max-width:${CONTENT_MAX_WIDTH};">${escapeHtml(cleaned.slice(0, 320))}</p>`;
  }

  return visuals;
}

export function postProcessSlide(slide: SlideLike, theme: ThemeLike, index: number, total = 10): SlideLike {
  let html = slide.html || "";
  let speakerNotes = slide.speakerNotes || "";
  const plain = stripHtml(html);
  const isHero = slide.layout === "title" || index === 0;
  const isClosing = slide.layout === "closing" || index === total - 1;

  const { cleaned, script } = extractScriptLines(plain);
  if (script) {
    speakerNotes = [script, speakerNotes].filter(Boolean).join("\n\n");
  }

  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  const tooDense = wordCount > 60 && !htmlHasBullets(html);
  const mustRebuild = tooDense || needsScaffold(html) || script || isHero || isClosing;

  if (mustRebuild) {
    let bodyHtml = "";

    if (isHero || isClosing) {
      bodyHtml = slide.subtitle
        ? `<p style="margin:0;font-size:18px;opacity:0.88;max-width:${CONTENT_MAX_WIDTH};line-height:1.4;">${escapeHtml(slide.subtitle)}</p>`
        : "";
      if (isClosing && !speakerNotes && cleaned) {
        speakerNotes = cleaned;
      }
      if (isHero && wordCount > 30 && !speakerNotes) {
        speakerNotes = cleaned;
      }
    } else {
      bodyHtml = buildBodyContent(cleaned, slide, theme, html);
    }

    const source = STATS_KEYWORDS.test(cleaned) ? "Source: Industry research, 2025" : undefined;
    html = buildMasterSlide(slide, bodyHtml, theme, { isHero, isClosing, source });
  } else {
    if (DIAGRAM_KEYWORDS.test(plain) && !htmlHasSvg(html)) {
      html = buildMasterSlide(
        slide,
        buildProcessDiagramSvg(theme.accent, theme.accentEnd) + buildBulletHtml(sentencesToBullets(cleaned, 4), theme),
        theme,
      );
    } else if (STATS_KEYWORDS.test(plain) && !htmlHasSvg(html)) {
      const metrics = extractMetrics(cleaned);
      html = buildMasterSlide(
        slide,
        buildStatsCardsHtml(metrics, theme) + buildBulletHtml(sentencesToBullets(cleaned, 4), theme),
        theme,
        { source: "Source: Industry research, 2025" },
      );
    }
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

export interface GateResult {
  score: number;
  reasons: string[];
  improved: boolean;
}

export function gateSlide(slide: SlideLike, theme: ThemeLike, index: number, total: number): GateResult {
  const reasons: string[] = [];
  let score = 100;

  const plain = stripHtml(slide.html || "").replace(/\s+/g, " ").trim();
  const wordCount = plain.split(" ").filter(Boolean).length;
  const isHero = slide.layout === "title" || index === 0;
  const isClosing = slide.layout === "closing" || index === total - 1;

  const hasTitle = Boolean(slide.title?.trim());
  const hasSubtitle = Boolean(isHero || isClosing ? slide.subtitle?.trim() : true);
  const noOverlongParagraphs = !/(<p[^>]*>[^<]{180,}<\/p>)/i.test(slide.html || "");
  const hasVisuals = /<svg/i.test(slide.html || "") || /stats|kpi|diagram|chart/i.test(plain);
  const hasBulletsOrStructure = /<ul|<li|flex-direction:column/i.test(slide.html || "");
  const speakerNotesHealthy = (!isHero && !isClosing) ? Boolean(slide.speakerNotes?.trim()) : true;

  if (!hasTitle) { score -= 25; reasons.push("missing title"); }
  if (!hasSubtitle) { score -= 15; reasons.push("missing subtitle"); }
  if (wordCount > 70 && !hasBulletsOrStructure) { score -= 20; reasons.push("dense text without bullets/structure"); }
  if (!noOverlongParagraphs) { score -= 15; reasons.push("overlong paragraph block"); }
  if (index > 0 && !hasVisuals) { score -= 10; reasons.push("no visual element"); }
  if (!speakerNotesHealthy) { score -= 10; reasons.push("speaker notes missing"); }

  return {
    score: Math.max(0, score),
    reasons,
    improved: reasons.length > 0,
  };
}

export function postProcessPresentation<T extends { slides: SlideLike[] }>(
  presentation: T,
  theme: ThemeLike,
): T {
  if (!presentation.slides?.length) return presentation;
  const total = presentation.slides.length;
  presentation.slides = presentation.slides.map((slide, i) =>
    postProcessSlide(slide, theme, i, total),
  );

  const gate = presentation.slides.map((s, idx) => gateSlide(s, theme, idx, total));
  const weakSlides = gate.filter((g) => g.score < 75);
  if (weakSlides.length) {
    presentation.slides = presentation.slides.map((slide, i) =>
      postProcessSlide(slide, theme, i, total),
    );
  }

  return presentation;
}
