import { AI_KNOWLEDGE_BASE_URL } from "@/lib/aiPublicKnowledge";
import { FOUNDER_CANONICAL, FOUNDER_CITATION } from "@/lib/founderIdentity";
import { type WedgePage } from "./wedgePages";

const BASE = AI_KNOWLEDGE_BASE_URL;
const UPDATED = "2026-06-13";

const PAGE_STYLE = `
    body { font-family: system-ui, sans-serif; line-height: 1.65; max-width: 44rem; margin: 2rem auto; padding: 0 1.25rem; background: #0a0a0f; color: #e8e8ef; }
    h1, h2 { color: #fff; }
    a { color: #7c9cff; }
    .badge { display:inline-block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:0.5rem; }
    .snippet { background: #14141c; border-left: 4px solid #38bdf8; padding: 1rem 1.25rem; margin: 1.5rem 0; font-size: 1.05rem; }
    .cta { display: inline-block; margin: 1rem 0; padding: 0.7rem 1.4rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .meta { font-size: 0.85rem; color: #9ca3af; }
    nav ul { padding-left: 1.2rem; }
`;

function wedgeSchema(page: WedgePage) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.metaDescription,
    url: `${BASE}/${page.slug}.html`,
    author: {
      "@type": "Person",
      name: FOUNDER_CANONICAL.fullName,
      url: FOUNDER_CANONICAL.canonicalProfileUrl,
    },
    dateModified: UPDATED,
  };
}

export function renderWedgeHtml(page: WedgePage): string {
  const sections = page.sections
    .map(
      (s) => `<h2>${s.heading}</h2>\n${s.paragraphs.map((p) => `<p>${p}</p>`).join("\n")}`,
    )
    .join("\n");
  const links = page.relatedLinks
    .map((l) => {
      const href = l.href.startsWith("http") ? l.href : BASE + l.href;
      return `<li><a href="${href}">${l.label}</a></li>`;
    })
    .join("\n");
  const ctaHref = page.ctaHref.startsWith("http") ? page.ctaHref : BASE + page.ctaHref;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title}</title>
  <meta name="description" content="${page.metaDescription}" />
  <meta name="keywords" content="${page.keywords.join(", ")}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${BASE}/${page.slug}.html" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.metaDescription}" />
  <meta property="og:url" content="${BASE}/${page.slug}.html" />
  <script type="application/ld+json">${JSON.stringify(wedgeSchema(page))}</script>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <p class="meta"><a href="${BASE}/google-seo">Growth index</a> · ShadowTalk AI</p>
  <p class="badge">${page.badge}</p>
  <h1>${page.h1}</h1>
  <div class="snippet">${page.snippet}</div>
  ${sections}
  <p><em>${FOUNDER_CITATION}</em></p>
  <a class="cta" href="${ctaHref}">${page.ctaLabel}</a>
  <h2>Related</h2>
  <nav><ul>${links}</ul></nav>
  <p class="meta">Updated ${UPDATED} · <a href="${BASE}">shadowtalk-ai.com</a></p>
</body>
</html>`;
}
