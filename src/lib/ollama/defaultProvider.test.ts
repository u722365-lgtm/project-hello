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

  it("keeps Ollama opt-in on first run for faster normal chat", () => {
    applyOllamaDefaultProvider();
    expect(isOllamaDefaultProvider()).toBe(false);
    expect(localStorage.getItem(OLLAMA_WEB_ENABLED_KEY)).toBe("0");
  });

  it("respects explicit enable", () => {
    setOllamaDefaultProvider(true);
    expect(isOllamaDefaultProvider()).toBe(true);
  });

  it("respects explicit disable", () => {
    setOllamaDefaultProvider(false);
    expect(isOllamaDefaultProvider()).toBe(false);
  });
});
