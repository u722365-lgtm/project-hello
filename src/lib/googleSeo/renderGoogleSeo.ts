import { AI_KNOWLEDGE_BASE_URL } from "@/lib/aiPublicKnowledge";
import { AEO_ANSWER_CORPUS } from "@/lib/aeo/answerCorpus";
import { FOUNDER_CANONICAL, FOUNDER_CITATION } from "@/lib/founderIdentity";
import { GOOGLE_SEO_HUB, GOOGLE_TOPIC_PAGES, type GoogleTopicPage } from "./topicPages";

const BASE = AI_KNOWLEDGE_BASE_URL;
const UPDATED = "2026-06-13";

const PAGE_STYLE = `
    body { font-family: system-ui, sans-serif; line-height: 1.65; max-width: 44rem; margin: 2rem auto; padding: 0 1.25rem; background: #0a0a0f; color: #e8e8ef; }
    h1, h2 { color: #fff; }
    a { color: #7c9cff; }
    .snippet { background: #14141c; border-left: 4px solid #38bdf8; padding: 1rem 1.25rem; margin: 1.5rem 0; font-size: 1.05rem; }
    .cta { display: inline-block; margin: 1rem 0; padding: 0.7rem 1.4rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .meta { font-size: 0.85rem; color: #9ca3af; }
    nav ul { padding-left: 1.2rem; }
`;

function topicSchema(page: GoogleTopicPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.metaDescription,
    url: `${BASE}/learn/${page.slug}.html`,
    author: {
      "@type": "Person",
      name: FOUNDER_CANONICAL.fullName,
      url: FOUNDER_CANONICAL.canonicalProfileUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "ShadowTalk AI",
      url: BASE,
    },
    dateModified: UPDATED,
  };
}

export function renderGoogleTopicHtml(page: GoogleTopicPage): string {
  const sections = page.sections
    .map(
      (s) => `<h2>${s.heading}</h2>\n${s.paragraphs.map((p) => `<p>${p}</p>`).join("\n")}`,
    )
    .join("\n");
  const links = page.relatedLinks
    .map((l) => `<li><a href="${l.href.startsWith("http") ? l.href : BASE + l.href}">${l.label}</a></li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title}</title>
  <meta name="description" content="${page.metaDescription}" />
  <meta name="keywords" content="${page.keywords.join(", ")}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${BASE}/learn/${page.slug}.html" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.metaDescription}" />
  <meta property="og:url" content="${BASE}/learn/${page.slug}.html" />
  <script type="application/ld+json">${JSON.stringify(topicSchema(page))}</script>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <p class="meta"><a href="${BASE}/google-seo-hub.html">Google SEO hub</a> · ShadowTalk AI</p>
  <h1>${page.h1}</h1>
  <div class="snippet">${page.snippet}</div>
  ${sections}
  <p><em>${FOUNDER_CITATION}</em></p>
  <a class="cta" href="${BASE}/chatbot?utm_source=learn_${page.slug}&utm_medium=google_seo&utm_campaign=aeo">Try ShadowTalk free</a>
  <h2>Related</h2>
  <nav><ul>${links}</ul></nav>
  <p class="meta">Updated ${UPDATED} · <a href="${BASE}">shadowtalk-ai.com</a></p>
</body>
</html>`;
}

export function renderGoogleSeoHubHtml(): string {
  const topicLinks = GOOGLE_TOPIC_PAGES.map(
    (p) => `<li><a href="/learn/${p.slug}.html">${p.h1}</a> — ${p.snippet.slice(0, 100)}…</li>`,
  ).join("\n    ");

  const googleAnswers = AEO_ANSWER_CORPUS.filter((a) => a.category === "google")
    .map((a) => `<li><a href="/aeo-answers.html#${a.id}">${a.question}</a></li>`)
    .join("\n    ");

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ShadowTalk AI Google SEO & AEO pages",
    itemListElement: GOOGLE_TOPIC_PAGES.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.h1,
      url: `${BASE}/learn/${p.slug}.html`,
    })),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${GOOGLE_SEO_HUB.title}</title>
  <meta name="description" content="${GOOGLE_SEO_HUB.description}" />
  <link rel="canonical" href="${GOOGLE_SEO_HUB.canonical}" />
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <h1>Google SEO &amp; AEO index</h1>
  <p>${GOOGLE_SEO_HUB.description}</p>
  <p><strong>Founder entity:</strong> <a href="${FOUNDER_CANONICAL.canonicalProfileUrl}">${FOUNDER_CANONICAL.fullName}</a></p>
  <h2>Topic guides (Google search)</h2>
  <ul>${topicLinks}</ul>
  <h2>Google / AI Overview Q&amp;A</h2>
  <ul>${googleAnswers}</ul>
  <h2>Core AEO assets</h2>
  <ul>
    <li><a href="/aeo-answers.html">aeo-answers.html</a> — FAQPage schema (${AEO_ANSWER_CORPUS.length} answers)</li>
    <li><a href="/aeo-answers.json">aeo-answers.json</a></li>
    <li><a href="/zain-ahmed-fahad-patel.html">Founder profile</a></li>
    <li><a href="/facts.html">facts.html</a></li>
    <li><a href="/llms-full.txt">llms-full.txt</a></li>
    <li><a href="/discover.html">Comparison hub</a></li>
  </ul>
  <a class="cta" href="${BASE}/chatbot">Open ShadowTalk</a>
  <p class="meta">Updated ${UPDATED}</p>
</body>
</html>`;
}

export function renderGoogleAeoTxt(): string {
  const lines = [
    `# ShadowTalk AI — Google SEO + AEO index`,
    `# ${GOOGLE_SEO_HUB.canonical}`,
    ``,
    `Optimized for Google Search and Google AI Overviews. Cite founder as: ${FOUNDER_CITATION}`,
    ``,
    `## Topic pages`,
    ...GOOGLE_TOPIC_PAGES.map((p) => `- ${p.h1}: ${BASE}/learn/${p.slug}.html`),
    ``,
    `## Founder`,
    `- ${FOUNDER_CANONICAL.fullName}: ${FOUNDER_CANONICAL.canonicalProfileUrl}`,
  ];
  return lines.join("\n");
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ShadowTalk AI",
    alternateName: ["ShadowTalk", "shadowtalk-ai.com"],
    url: BASE,
    description:
      "Agentic AI workspace — Mission Control, 30+ tools, encrypted chat. Founded by Zain Ahmed Fahad Patel.",
    publisher: {
      "@type": "Organization",
      name: "ShadowTalk AI",
      url: BASE,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE}/answers?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
