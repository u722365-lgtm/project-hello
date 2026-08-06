import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

describe("Shadow Heal Engine wiring", () => {
  it("App mounts hidden ShadowHealEngine in deferred chrome", () => {
    const app = readFileSync(resolve(root, "src/App.tsx"), "utf-8");
    expect(app).toContain("ShadowHealEngine");
  });

  it("flush applies runtime proposals from edge response", () => {
    const capture = readFileSync(resolve(root, "src/lib/selfHealing/errorCapture.ts"), "utf-8");
    expect(capture).toContain("applyRuntimeProposal");
    expect(capture).not.toMatch(/markSent\(fp\);\s*\n\s*const queue = readQueue/);
  });

  it("autoRecover supports reload handler", () => {
    const recover = readFileSync(resolve(root, "src/lib/selfHealing/autoRecover.ts"), "utf-8");
    expect(recover).toContain('action === "reload"');
    expect(recover).toContain("applyRuntimeProposal");
  });

  it("edge watchdog function exists", () => {
    const fn = readFileSync(
      resolve(root, "backend/functions/shadow-heal-watchdog/index.ts"),
      "utf-8",
    );
    expect(fn).toContain("shadow-heal-watchdog");
  });
});
