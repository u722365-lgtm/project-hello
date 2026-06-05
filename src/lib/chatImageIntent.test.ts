import { describe, expect, it } from "vitest";
import { detectChatImageIntent } from "./chatImageIntent";

describe("detectChatImageIntent", () => {
  it("detects edit instructions", () => {
    expect(detectChatImageIntent("Remove the background")).toBe("edit");
    expect(detectChatImageIntent("Make it black and white")).toBe("edit");
    expect(detectChatImageIntent("Change the sky to sunset colors")).toBe("edit");
  });

  it("detects analyze-only prompts", () => {
    expect(detectChatImageIntent("")).toBe("analyze");
    expect(detectChatImageIntent("describe this image")).toBe("analyze");
    expect(detectChatImageIntent("What is this?")).toBe("analyze");
  });

  it("defaults to vision Q&A for general questions", () => {
    expect(detectChatImageIntent("How many people are in this photo?")).toBe("vision");
    expect(detectChatImageIntent("Write alt text for accessibility")).toBe("vision");
  });
});
