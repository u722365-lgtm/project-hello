import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("config", () => {
  let tempHome: string;
  const originalHome = process.env.HOME;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "st-cli-"));
    process.env.HOME = tempHome;
    const { resetConfigCache } = await import("./config.js");
    resetConfigCache();
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    rmSync(tempHome, { recursive: true, force: true });
  });

  it("defaults to device-only pledge", async () => {
    const { loadConfig } = await import("./config.js");
    const cfg = loadConfig();
    expect(cfg.pledge.deviceOnly).toBe(true);
    expect(cfg.routing.mode).toBe("local-only");
  });
});
