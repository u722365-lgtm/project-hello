import { describe, expect, it, beforeEach } from "vitest";
import {
  completeQuickPrompt,
  hasChattedBefore,
  markHasChatted,
  shouldSkipLandingForReturnVisitor,
  HAS_CHATTED_KEY,
} from "@/lib/growth/firstVisit";

describe("firstVisit bounce helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("completes trailing-for prompts", () => {
    expect(completeQuickPrompt("Help me brainstorm ideas for ")).toContain("ShadowTalk AI");
  });

  it("marks returning visitors", () => {
    expect(hasChattedBefore()).toBe(false);
    markHasChatted();
    expect(hasChattedBefore()).toBe(true);
    expect(localStorage.getItem(HAS_CHATTED_KEY)).toBe("1");
    expect(shouldSkipLandingForReturnVisitor()).toBe(false);
  });
});
