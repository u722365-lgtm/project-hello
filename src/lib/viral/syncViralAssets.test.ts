import { describe, it } from "vitest";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { COMPARISON_PAGES } from "./comparisonCorpus";
import {
  renderComparisonHtml,
  renderDiscoverHtml,
  renderEmbedBadgeJs,
  renderRssFeed,
} from "./renderViral";

const root = resolve(__dirname, "../../..");

describe("sync viral public assets", () => {
  it("writes vs/*.html, discover.html, feed.xml, embed badge", () => {
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
    writeFileSync(
      resolve(embedDir, "demo.html"),
      `<!DOCTYPE html><html><head><title>ShadowTalk embed badge</title></head><body style="background:#111;padding:2rem;font-family:system-ui;color:#eee"><h1>Embed demo</h1><p>Add to any site:</p><pre>&lt;script src="https://www.shadowtalk-ai.com/embed/shadowtalk-badge.js" async&gt;&lt;/script&gt;</pre><script src="/embed/shadowtalk-badge.js" async></script></body></html>`,
    );
  });
});
