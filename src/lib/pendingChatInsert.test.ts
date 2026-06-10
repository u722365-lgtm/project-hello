import { describe, expect, it, beforeEach } from "vitest";
import { queueChatInsert, consumePendingChatInsert } from "./pendingChatInsert";

describe("pendingChatInsert", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("queues and consumes once", () => {
    queueChatInsert("Hello from research");
    expect(consumePendingChatInsert()).toBe("Hello from research");
    expect(consumePendingChatInsert()).toBeNull();
  });

  it("ignores empty content", () => {
    queueChatInsert("   ");
    expect(consumePendingChatInsert()).toBeNull();
  });
});
