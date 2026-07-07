import { AI_KNOWLEDGE_BASE_URL } from "@/lib/aiPublicKnowledge";
import { type HowToGuide } from "./howToGuides";

const BASE = AI_KNOWLEDGE_BASE_URL;

export function renderHowToHtml(guide: HowToGuide): string {
  const stepsSchema = guide.steps.map((text, i) => ({
    "@type": "HowToStep",
    name: `Step ${i + 1}`,
    text,
  }));

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title.replace(" — ShadowTalk AI", "").replace(" — ShadowTalk", ""),
    step: stepsSchema,
  });

  const stepsList = guide.steps.map((s) => `<li>${s}</li>`).join("\n");
  const ctaUrl = `${BASE}/chatbot?utm_source=howto&utm_medium=${guide.slug}&utm_campaign=${guide.utmCampaign}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${guide.title}</title>
  <meta name="description" content="${guide.metaDescription}" />
  <meta name="keywords" content="${guide.keywords.join(", ")}" />
  <link rel="canonical" href="${BASE}/${guide.filename}" />
  <meta property="og:title" content="${guide.title}" />
  <meta property="og:description" content="${guide.metaDescription}" />
  <meta property="og:url" content="${BASE}/${guide.filename}" />
  <meta property="og:image" content="${BASE}/og-image.svg" />
  <script type="application/ld+json">${schema}</script>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.7; max-width: 44rem; margin: 2rem auto; padding: 0 1.25rem; background: #0a0a0f; color: #e8e8ef; }
    h1,h2 { color: #fff; }
    a.cta { display:inline-block;margin:1.5rem 0;padding:.75rem 1.5rem;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;}
  </style>
</head>
<body>
  <h1>${guide.title.replace(" — ShadowTalk AI", "").replace(" — ShadowTalk", "")}</h1>
  <p>${guide.metaDescription}</p>
  <h2>Steps</h2>
  <ul>${stepsList}</ul>
  <p><a class="cta" href="${ctaUrl}">${guide.ctaLabel}</a></p>
  <p><a href="${BASE}" style="color:#7c9cff">← ShadowTalk AI</a></p>
</body>
</html>`;
}
