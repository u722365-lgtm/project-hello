import { describe, expect, it } from "vitest";
import { shouldUseCognitiveLoop } from "./cognitiveLoopDetector";

describe("shouldUseCognitiveLoop", () => {
  it("returns false for short casual messages", () => {
    expect(shouldUseCognitiveLoop("hi")).toBe(false);
    expect(shouldUseCognitiveLoop("what is react?")).toBe(false);
  });

  it("detects trade-off and debate signals", () => {
    expect(
      shouldUseCognitiveLoop(
        "What are the trade-offs between building our own auth vs using Clerk for our SaaS?",
      ),
    ).toBe(true);
    expect(
      shouldUseCognitiveLoop(
        "Give me multiple perspectives on whether we should pivot the product strategy.",
      ),
    ).toBe(true);
  });

  it("detects hard architecture decisions when message is long enough", () => {
    expect(
      shouldUseCognitiveLoop(
        "We need an architecture decision: microservices vs monolith for our early-stage fintech startup with 5 engineers.",
      ),
    ).toBe(true);
  });

  it("detects multi-question complex prompts", () => {
    const msg =
      "Should we hire a full-time CTO or use fractional leadership? What are the risks? How does this affect our fundraising timeline and board expectations?";
    expect(shouldUseCognitiveLoop(msg)).toBe(true);
  });
});
