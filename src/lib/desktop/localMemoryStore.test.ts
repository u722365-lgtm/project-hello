import { describe, expect, it } from "vitest";
import { cosineSimilarity, formatMemoryContext } from "./localMemoryStore";
import type { MemorySearchResult } from "./localMemoryStore";

describe("localMemoryStore", () => {
  it("computes cosine similarity", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
  });

  it("formats memory context for system prompt", () => {
    const results: MemorySearchResult[] = [
      { id: "1", text: "User prefers dark mode", similarity: 0.9, category: "chat", source: "user" },
    ];
    const ctx = formatMemoryContext(results);
    expect(ctx).toContain("LOCAL MEMORY");
    expect(ctx).toContain("dark mode");
  });
});
