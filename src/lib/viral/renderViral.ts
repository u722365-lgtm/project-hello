import { AI_KNOWLEDGE_BASE_URL } from "@/lib/aiPublicKnowledge";
import { FOUNDER_CANONICAL, FOUNDER_CITATION } from "@/lib/founderIdentity";
import { COMPARISON_PAGES, type ComparisonPage } from "./comparisonCorpus";
import { AEO_ANSWER_CORPUS, AEO_CORPUS_META } from "@/lib/aeo/answerCorpus";

const BASE = AI_KNOWLEDGE_BASE_URL;
const UPDATED = "2026-06-11";

function comparisonSchema(page: ComparisonPage) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.metaDescription,
    url: `${BASE}/vs/${page.slug}.html`,
    about: [
      { "@type": "SoftwareApplication", name: "ShadowTalk AI", url: BASE },
      { "@type": "SoftwareApplication", name: page.competitor },
    ],
    author: {
      "@type": "Person",
      name: FOUNDER_CANONICAL.fullName,
      url: FOUNDER_CANONICAL.canonicalProfileUrl,
    },
  };
}

export function renderComparisonHtml(page: ComparisonPage): string {
  const schema = JSON.stringify(comparisonSchema(page));
  const wins = page.shadowtalkWins.map((w) => `<li>${w}</li>`).join("\n      ");
  const theirs = page.competitorWins.map((w) => `<li>${w}</li>`).join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title}</title>
  <meta name="description" content="${page.metaDescription}" />
  <meta name="keywords" content="${page.keywords.join(", ")}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${BASE}/vs/${page.slug}.html" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.metaDescription}" />
  <meta property="og:url" content="${BASE}/vs/${page.slug}.html" />
  <meta property="og:image" content="${BASE}/og-image.svg" />
  <script type="application/ld+json">${schema}</script>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.65; max-width: 44rem; margin: 2rem auto; padding: 0 1.25rem; background: #0a0a0f; color: #e8e8ef; }
    h1, h2 { color: #fff; }
    a { color: #7c9cff; }
    .cta { display: inline-block; margin: 1.5rem 0; padding: 0.75rem 1.5rem; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    ul { padding-left: 1.25rem; }
    .verdict { background: #14141c; border: 1px solid #3b4f9a; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>${page.h1}</h1>
  <div class="verdict"><p><strong>Verdict:</strong> ${page.verdict}</p></div>
  <h2>Where ShadowTalk AI wins</h2>
  <ul>${wins}</ul>
  <h2>Where ${page.competitor} wins</h2>
  <ul>${theirs}</ul>
  <p>Founder: ${FOUNDER_CITATION}</p>
  <a class="cta" href="${BASE}/chatbot?utm_source=vs_${page.slug}&utm_medium=seo&utm_campaign=viral_compare">Try ShadowTalk free — no card</a>
  <p><a href="${BASE}/discover.html">More comparisons</a> · <a href="${BASE}">← ShadowTalk AI</a></p>
</body>
</html>`;
}

export function renderDiscoverHtml(): string {
  const links = COMPARISON_PAGES.map(
    (p) => `<li><a href="/vs/${p.slug}.html">${p.h1}</a> — ${p.verdict.slice(0, 120)}…</li>`,
  ).join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discover ShadowTalk AI — Comparisons, Founder, Free Start</title>
  <meta name="description" content="Discover ShadowTalk AI: agentic workspace vs ChatGPT, Perplexity, Claude, Gemini, Copilot. Built by Zain Ahmed Fahad Patel. Free start, no card." />
  <link rel="canonical" href="${BASE}/discover.html" />
  <meta property="og:title" content="Discover ShadowTalk AI" />
  <meta property="og:image" content="${BASE}/og-image.svg" />
</head>
<body style="font-family:system-ui;max-width:44rem;margin:2rem auto;padding:0 1.25rem;background:#0a0a0f;color:#e8e8ef;line-height:1.65">
  <h1 style="color:#fff">Discover ShadowTalk AI</h1>
  <p><strong>Think AI. Think ShadowTalk.</strong> Agentic workspace — chat, missions, 30+ tools, voice &amp; code. Free start.</p>
  <p>Founder: <a href="${FOUNDER_CANONICAL.canonicalProfileUrl}">${FOUNDER_CANONICAL.fullName}</a></p>
  <h2 style="color:#fff">Comparisons (SEO)</h2>
  <ul>${links}</ul>
  <h2 style="color:#fff">Try now</h2>
  <p><a href="${BASE}/chatbot?utm_source=discover&utm_medium=seo&utm_campaign=viral_hub" style="color:#7c9cff;font-weight:600">Open ShadowTalk workspace →</a></p>
  <p><a href="${BASE}/aeo-answers.html">AI Q&amp;A corpus</a> · <a href="${BASE}/llms.txt">llms.txt</a></p>
</body>
</html>`;
}

export function renderRssFeed(): string {
  const items = [
    ...COMPARISON_PAGES.map((p) => ({
      title: p.h1,
      link: `${BASE}/vs/${p.slug}.html`,
      description: p.metaDescription,
    })),
    {
      title: "ShadowTalk AI — Official discover hub",
      link: `${BASE}/discover.html`,
      description: "Comparisons, founder profile, and free trial links for ShadowTalk AI.",
    },
    ...AEO_ANSWER_CORPUS.slice(0, 15).map((a) => ({
      title: a.question,
      link: `${BASE}/answers#${a.id}`,
      description: a.answer,
    })),
  ];

  const rssItems = items
    .map(
      (item) => `  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${item.link}</link>
    <guid isPermaLink="true">${item.link}</guid>
    <description>${escapeXml(item.description)}</description>
    <pubDate>${new Date(UPDATED).toUTCString()}</pubDate>
  </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ShadowTalk AI — Discover &amp; Compare</title>
    <link>${BASE}/discover.html</link>
    <description>ShadowTalk AI comparisons, answers, and updates. Founder: ${FOUNDER_CANONICAL.fullName}.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(UPDATED).toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;
}

export function renderEmbedBadgeJs(): string {
  return `(function () {
  var ORIGIN = "${BASE}";
  var href = ORIGIN + "/chatbot?utm_source=embed&utm_medium=badge&utm_campaign=viral_widget";
  var el = document.createElement("a");
  el.href = href;
  el.target = "_blank";
  el.rel = "noopener noreferrer";
  el.setAttribute("data-shadowtalk-badge", "1");
  el.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;font:600 13px system-ui,sans-serif;color:#e8e8ef;background:linear-gradient(135deg,#0f172a,#1e1b4b);border:1px solid rgba(56,189,248,0.35);text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,0.25);";
  el.innerHTML = '<span style="color:#38bdf8">⚡</span> Powered by <strong style="color:#fff">ShadowTalk AI</strong>';
  var mount = document.currentScript && document.currentScript.parentNode;
  if (mount) mount.appendChild(el);
})();`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function syncAllViralStaticPages(): { paths: string[] } {
  return { paths: COMPARISON_PAGES.map((p) => `public/vs/${p.slug}.html`) };
}
