import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { renderAeoHtml, renderAeoJson, renderAeoTxt } from "@/lib/aeo/renderAeo";
import {
  renderFounderAliasHtml,
  renderFounderJson,
  renderFounderTxt,
  renderFullNameHtml,
  renderFullNameTxt,
  renderZainAhmedHtml,
} from "@/lib/founder/renderFounder";
import { GOOGLE_TOPIC_PAGES } from "@/lib/googleSeo/topicPages";
import {
  renderGoogleAeoTxt,
  renderGoogleSeoHubHtml,
  renderGoogleTopicHtml,
} from "@/lib/googleSeo/renderGoogleSeo";
import { COMPARISON_PAGES } from "@/lib/viral/comparisonCorpus";
import {
  renderComparisonHtml,
  renderDiscoverHtml,
  renderEmbedBadgeJs,
  renderRssFeed,
} from "@/lib/viral/renderViral";
import { renderSitemapXml, renderAeoSitemapXml } from "@/lib/seo/generateSitemap";
import { WEDGE_PAGES } from "@/lib/marketing/wedgePages";
import { renderWedgeHtml } from "@/lib/marketing/renderWedge";
import { HOW_TO_GUIDES } from "@/lib/marketing/howToGuides";
import { renderHowToHtml } from "@/lib/marketing/renderHowTo";


export function syncPublicSeoAssets(rootDir?: string): void {
  const root = rootDir ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

  writeFileSync(resolve(root, "public/aeo-answers.json"), renderAeoJson());
  writeFileSync(resolve(root, "public/aeo-answers.html"), renderAeoHtml());
  writeFileSync(resolve(root, "public/aeo.txt"), renderAeoTxt());

  writeFileSync(resolve(root, "public/zain-ahmed-fahad-patel.html"), renderFullNameHtml());
  writeFileSync(resolve(root, "public/zain-ahmed-fahad-patel.json"), renderFounderJson());
  writeFileSync(resolve(root, "public/zain-ahmed-fahad-patel.txt"), renderFullNameTxt());
  writeFileSync(resolve(root, "public/zain-ahmed.html"), renderZainAhmedHtml());
  writeFileSync(resolve(root, "public/founder-zain-ahmed.html"), renderFounderAliasHtml());
  writeFileSync(resolve(root, "public/zain-ahmed.json"), renderFounderJson());
  writeFileSync(resolve(root, "public/zain-ahmed.txt"), renderFounderTxt());

  const learnDir = resolve(root, "public/learn");
  mkdirSync(learnDir, { recursive: true });
  for (const page of GOOGLE_TOPIC_PAGES) {
    writeFileSync(resolve(learnDir, `${page.slug}.html`), renderGoogleTopicHtml(page));
  }
  writeFileSync(resolve(root, "public/google-seo-hub.html"), renderGoogleSeoHubHtml());
  writeFileSync(resolve(root, "public/google-aeo.txt"), renderGoogleAeoTxt());

  const vsDir = resolve(root, "public/vs");
  mkdirSync(vsDir, { recursive: true });
  for (const page of COMPARISON_PAGES) {
    writeFileSync(resolve(vsDir, `${page.slug}.html`), renderComparisonHtml(page));
  }
  writeFileSync(resolve(root, "public/discover.html"), renderDiscoverHtml());
  writeFileSync(resolve(root, "public/feed.xml"), renderRssFeed());

  const embedDir = resolve(root, "public/embed");
  mkdirSync(embedDir, { recursive: true });
  writeFileSync(resolve(embedDir, "shadowtalk-badge.js"), renderEmbedBadgeJs());

  writeFileSync(resolve(root, "public/sitemap.xml"), renderSitemapXml());
  writeFileSync(resolve(root, "public/aeo-sitemap.xml"), renderAeoSitemapXml());

  for (const page of WEDGE_PAGES) {
    writeFileSync(resolve(root, `public/${page.slug}.html`), renderWedgeHtml(page));
  }

  for (const guide of HOW_TO_GUIDES) {
    writeFileSync(resolve(root, `public/${guide.filename}`), renderHowToHtml(guide));
  }
}
