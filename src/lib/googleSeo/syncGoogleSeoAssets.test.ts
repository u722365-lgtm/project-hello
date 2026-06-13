import { describe, it } from "vitest";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { GOOGLE_TOPIC_PAGES } from "./topicPages";
import {
  renderGoogleAeoTxt,
  renderGoogleSeoHubHtml,
  renderGoogleTopicHtml,
} from "./renderGoogleSeo";

const root = resolve(__dirname, "../../..");

describe("sync Google SEO+AEO public assets", () => {
  it("writes learn/*.html, google-seo-hub.html, google-aeo.txt", () => {
    const learnDir = resolve(root, "public/learn");
    mkdirSync(learnDir, { recursive: true });

    for (const page of GOOGLE_TOPIC_PAGES) {
      writeFileSync(resolve(learnDir, `${page.slug}.html`), renderGoogleTopicHtml(page));
    }

    writeFileSync(resolve(root, "public/google-seo-hub.html"), renderGoogleSeoHubHtml());
    writeFileSync(resolve(root, "public/google-aeo.txt"), renderGoogleAeoTxt());
  });
});
