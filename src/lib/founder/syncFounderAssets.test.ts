import { describe, it } from "vitest";
import { writeFileSync } from "fs";
import { resolve } from "path";
import {
  renderFounderAliasHtml,
  renderFounderJson,
  renderFounderTxt,
  renderFullNameHtml,
  renderFullNameTxt,
  renderZainAhmedHtml,
} from "./renderFounder";

const root = resolve(__dirname, "../../..");

/** Keeps public founder entity assets in sync with founderIdentity.ts */
describe("sync founder public assets", () => {
  it("writes full-name and alias founder pages, json, txt", () => {
    writeFileSync(resolve(root, "public/zain-ahmed-fahad-patel.html"), renderFullNameHtml());
    writeFileSync(resolve(root, "public/zain-ahmed-fahad-patel.json"), renderFounderJson());
    writeFileSync(resolve(root, "public/zain-ahmed-fahad-patel.txt"), renderFullNameTxt());
    writeFileSync(resolve(root, "public/zain-ahmed.html"), renderZainAhmedHtml());
    writeFileSync(resolve(root, "public/founder-zain-ahmed.html"), renderFounderAliasHtml());
    writeFileSync(resolve(root, "public/zain-ahmed.json"), renderFounderJson());
    writeFileSync(resolve(root, "public/zain-ahmed.txt"), renderFounderTxt());
  });
});
