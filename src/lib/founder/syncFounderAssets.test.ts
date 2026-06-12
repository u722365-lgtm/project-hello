import { describe, it } from "vitest";
import { writeFileSync } from "fs";
import { resolve } from "path";
import {
  renderFounderAliasHtml,
  renderFounderJson,
  renderFounderTxt,
  renderZainAhmedHtml,
} from "./renderFounder";

const root = resolve(__dirname, "../../..");

/** Keeps public founder entity assets in sync with founderIdentity.ts */
describe("sync founder public assets", () => {
  it("writes zain-ahmed.html, founder-zain-ahmed.html, zain-ahmed.json, zain-ahmed.txt", () => {
    writeFileSync(resolve(root, "public/zain-ahmed.html"), renderZainAhmedHtml());
    writeFileSync(resolve(root, "public/founder-zain-ahmed.html"), renderFounderAliasHtml());
    writeFileSync(resolve(root, "public/zain-ahmed.json"), renderFounderJson());
    writeFileSync(resolve(root, "public/zain-ahmed.txt"), renderFounderTxt());
  });
});
