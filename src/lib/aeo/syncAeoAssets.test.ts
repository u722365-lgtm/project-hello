import { describe, it } from "vitest";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { renderAeoHtml, renderAeoJson, renderAeoTxt } from "./renderAeo";

const root = resolve(__dirname, "../../..");

/** Keeps public AEO assets in sync with answerCorpus.ts */
describe("sync AEO public assets", () => {
  it("writes aeo-answers.json, aeo-answers.html, aeo.txt", () => {
    writeFileSync(resolve(root, "public/aeo-answers.json"), renderAeoJson());
    writeFileSync(resolve(root, "public/aeo-answers.html"), renderAeoHtml());
    writeFileSync(resolve(root, "public/aeo.txt"), renderAeoTxt());
  });
});
