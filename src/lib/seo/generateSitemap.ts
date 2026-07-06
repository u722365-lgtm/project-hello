import { GOOGLE_TOPIC_PAGES } from "@/lib/googleSeo/topicPages";
import { COMPARISON_PAGES } from "@/lib/viral/comparisonCorpus";

const BASE = "https://www.shadowtalk-ai.com";
const TODAY = new Date().toISOString().slice(0, 10);

export type SitemapEntry = {
  path: string;
  priority: number;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  lastmod?: string;
};

const AEO_ENTRIES: SitemapEntry[] = [
  { path: "/aeo-answers.html", priority: 0.92, changefreq: "monthly" },
  { path: "/aeo-answers.json", priority: 0.88, changefreq: "monthly" },
  { path: "/aeo.txt", priority: 0.85, changefreq: "monthly" },
  { path: "/facts.html", priority: 0.9, changefreq: "monthly" },
  { path: "/shadowtalk.json", priority: 0.85, changefreq: "monthly" },
  { path: "/llms.txt", priority: 0.82, changefreq: "monthly" },
  { path: "/llms-full.txt", priority: 0.85, changefreq: "monthly" },
  { path: "/google-seo-hub.html", priority: 0.98, changefreq: "weekly" },
  { path: "/google-aeo.txt", priority: 0.9, changefreq: "weekly" },
  { path: "/answers", priority: 0.9, changefreq: "monthly" },
  { path: "/faq", priority: 0.55, changefreq: "monthly" },
  { path: "/zain-ahmed-fahad-patel.html", priority: 1.0, changefreq: "monthly" },
  { path: "/zain-ahmed.html", priority: 0.92, changefreq: "monthly" },
  { path: "/founder-zain-ahmed.html", priority: 0.88, changefreq: "monthly" },
  { path: "/discover.html", priority: 0.95, changefreq: "weekly" },
  { path: "/feed.xml", priority: 0.85, changefreq: "daily" },
  ...GOOGLE_TOPIC_PAGES.flatMap((p) => [
    { path: `/learn/${p.slug}.html`, priority: 0.95, changefreq: "weekly" as const },
  ]),
  ...COMPARISON_PAGES.flatMap((p) => [
    { path: `/vs/${p.slug}.html`, priority: 0.92, changefreq: "weekly" as const },
  ]),
];

/** Public routes and crawler assets — deduped by path */
export const SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/home", priority: 0.85, changefreq: "weekly" },
  { path: "/chatbot", priority: 0.95, changefreq: "daily" },
  { path: "/pricing", priority: 0.8, changefreq: "monthly" },
  { path: "/execute", priority: 0.88, changefreq: "weekly" },
  { path: "/missioncontrol", priority: 0.85, changefreq: "weekly" },
  { path: "/workspace", priority: 0.85, changefreq: "weekly" },
  { path: "/research", priority: 0.85, changefreq: "weekly" },
  { path: "/security", priority: 0.85, changefreq: "weekly" },
  { path: "/insights", priority: 0.82, changefreq: "weekly" },
  { path: "/forge", priority: 0.82, changefreq: "weekly" },
  { path: "/computer", priority: 0.88, changefreq: "weekly" },
  { path: "/ide", priority: 0.85, changefreq: "weekly" },
  { path: "/marketplace", priority: 0.8, changefreq: "weekly" },
  { path: "/templates", priority: 0.75, changefreq: "weekly" },
  { path: "/downloads", priority: 0.85, changefreq: "weekly" },
  { path: "/docs", priority: 0.7, changefreq: "weekly" },
  { path: "/developers", priority: 0.7, changefreq: "weekly" },
  { path: "/about", priority: 0.85, changefreq: "monthly" },
  { path: "/answers", priority: 0.9, changefreq: "monthly" },
  { path: "/google-seo", priority: 0.98, changefreq: "weekly" },
  { path: "/discover", priority: 0.95, changefreq: "weekly" },
  { path: "/facts", priority: 0.9, changefreq: "monthly" },
  { path: "/zain-ahmed-fahad-patel", priority: 1.0, changefreq: "monthly" },
  { path: "/zain-ahmed", priority: 0.9, changefreq: "monthly" },
  { path: "/faq", priority: 0.5, changefreq: "monthly" },
  { path: "/contact", priority: 0.5, changefreq: "monthly" },
  { path: "/help", priority: 0.5, changefreq: "monthly" },
  { path: "/status", priority: 0.4, changefreq: "daily" },
  { path: "/changelog", priority: 0.6, changefreq: "weekly" },
  { path: "/blog", priority: 0.7, changefreq: "weekly" },
  { path: "/careers", priority: 0.5, changefreq: "monthly" },
  { path: "/press", priority: 0.4, changefreq: "monthly" },
  { path: "/privacy", priority: 0.3, changefreq: "yearly" },
  { path: "/terms", priority: 0.3, changefreq: "yearly" },
  { path: "/cookies", priority: 0.3, changefreq: "yearly" },
  { path: "/gdpr", priority: 0.3, changefreq: "yearly" },
  { path: "/auth", priority: 0.5, changefreq: "monthly" },
  { path: "/founder-access", priority: 0.5, changefreq: "monthly" },
  { path: "/referral", priority: 0.5, changefreq: "monthly" },
  ...GOOGLE_TOPIC_PAGES.flatMap((p) => [
    { path: `/learn/${p.slug}`, priority: 0.94, changefreq: "weekly" as const },
    { path: `/learn/${p.slug}.html`, priority: 0.95, changefreq: "weekly" as const },
  ]),
  ...COMPARISON_PAGES.flatMap((p) => [
    { path: `/vs/${p.slug}`, priority: 0.9, changefreq: "weekly" as const },
    { path: `/vs/${p.slug}.html`, priority: 0.92, changefreq: "weekly" as const },
  ]),
];

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Map<string, SitemapEntry>();
  for (const e of entries) {
    if (!seen.has(e.path)) seen.set(e.path, e);
  }
  return [...seen.values()].sort((a, b) => b.priority - a.priority || a.path.localeCompare(b.path));
}

function buildUrlset(entries: SitemapEntry[]): string {
  const unique = dedupeEntries(entries);
  const urls = unique
    .map(
      (e) => `  <url>\n    <loc>${BASE}${e.path}</loc>\n    <lastmod>${e.lastmod ?? TODAY}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(2)}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapXml(entries: SitemapEntry[] = SITEMAP_ENTRIES): string {
  return buildUrlset(entries);
}

export function renderAeoSitemapXml(): string {
  return buildUrlset(AEO_ENTRIES);
}
