import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { syncPublicSeoAssets } from "./syncPublicSeoAssets";
import { SITEMAP_ENTRIES } from "./generateSitemap";

const root = resolve(__dirname, "../../..");

describe("sync all public SEO assets", () => {
  it("writes AEO, founder, viral, Google SEO, and sitemap.xml", () => {
    syncPublicSeoAssets(root);

    expect(readFileSync(resolve(root, "public/aeo-answers.html"), "utf-8")).toContain("AEO Answer Corpus");
    expect(readFileSync(resolve(root, "public/zain-ahmed-fahad-patel.html"), "utf-8")).toContain(
      "Zain Ahmed Fahad Patel",
    );
    expect(readFileSync(resolve(root, "public/google-seo-hub.html"), "utf-8")).toContain("ShadowTalk AI");
    expect(readFileSync(resolve(root, "public/discover.html"), "utf-8")).toContain("ShadowTalk");
    expect(readFileSync(resolve(root, "public/vs/chatgpt.html"), "utf-8")).toContain("ChatGPT");

    const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf-8");
    expect(sitemap).toContain("/research");
    expect(sitemap).toContain("/security");
    expect(sitemap).toContain("/insights");
    expect(sitemap).toContain("/forge");
    expect(sitemap).toContain("/learn/best-agentic-ai-workspace");
    expect(sitemap).toContain("/vs/chatgpt");
    expect(sitemap).not.toMatch(/<loc>[^<]+\/about<\/loc>[\s\S]*<loc>[^<]+\/about<\/loc>/);
  });

  it("sitemap covers all declared entries", () => {
    syncPublicSeoAssets(root);
    const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf-8");
    for (const entry of SITEMAP_ENTRIES) {
      expect(sitemap).toContain(`https://www.shadowtalk-ai.com${entry.path}`);
    }
  });
});
