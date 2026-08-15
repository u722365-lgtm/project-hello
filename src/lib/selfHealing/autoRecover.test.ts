import { beforeEach, describe, expect, it, vi } from "vitest";
import { findHandlerFor, withSelfHeal } from "./autoRecover";

const APPLIED_KEY = "shadowtalk_self_heal_applied";

describe("autoRecover / self-heal closure", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("finds pattern-matched retry handlers", () => {
    localStorage.setItem(
      APPLIED_KEY,
      JSON.stringify({
        fix1: { action: "retry", pattern: "chat edge 502" },
      }),
    );
    const handler = findHandlerFor("chat edge 502 on (removed-edge-function)");
    expect(handler?.action).toBe("retry");
  });

  it("matches generic network errors to approved retry handlers", () => {
    localStorage.setItem(
      APPLIED_KEY,
      JSON.stringify({
        fix2: { action: "retry", pattern: "unrelated" },
      }),
    );
    const handler = findHandlerFor("Failed to fetch");
    expect(handler?.action).toBe("retry");
  });

  it("retries failed calls when retry handler is approved", async () => {
    localStorage.setItem(
      APPLIED_KEY,
      JSON.stringify({
        fix3: { action: "retry", pattern: "503" },
      }),
    );

    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error("503 service unavailable");
      return "ok";
    });

    const result = await withSelfHeal(fn, { label: "chat" });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses fallback when retry handler fails and fallback provided", async () => {
    localStorage.setItem(
      APPLIED_KEY,
      JSON.stringify({
        fix4: { action: "fallback", pattern: "timeout" },
      }),
    );

    const result = await withSelfHeal(
      async () => {
        throw new Error("request timeout exceeded");
      },
      { fallback: async () => "cached-response" },
    );
    expect(result).toBe("cached-response");
  });
});
