import { beforeEach, describe, expect, it } from "vitest";
import {
  applyOllamaDefaultProvider,
  isOllamaDefaultProvider,
  OLLAMA_WEB_ENABLED_KEY,
  setOllamaDefaultProvider,
} from "./defaultProvider";

describe("ollama defaultProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("enables Ollama by default on first run", () => {
    applyOllamaDefaultProvider();
    expect(isOllamaDefaultProvider()).toBe(true);
    expect(localStorage.getItem(OLLAMA_WEB_ENABLED_KEY)).toBe("1");
  });

  it("respects explicit disable", () => {
    setOllamaDefaultProvider(false);
    expect(isOllamaDefaultProvider()).toBe(false);
  });
});
