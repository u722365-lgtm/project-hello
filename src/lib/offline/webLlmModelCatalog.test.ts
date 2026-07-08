import { describe, expect, it } from "vitest";
import { prebuiltAppConfig } from "@mlc-ai/web-llm";
import {
  ALL_WEBLLM_MODEL_IDS,
  WEBLLM_MODEL_CATALOG,
  getWebLlmLoadChain,
  isKnownWebLlmModel,
} from "./webLlmModelCatalog";

describe("webLlmModelCatalog", () => {
  const prebuiltIds = new Set(prebuiltAppConfig.model_list.map((m) => m.model_id));

  it("lists only real @mlc-ai/web-llm prebuilt model ids", () => {
    const invalid = ALL_WEBLLM_MODEL_IDS.filter((id) => !prebuiltIds.has(id));
    expect(invalid).toEqual([]);
  });

  it("has unique primary catalog ids", () => {
    const ids = WEBLLM_MODEL_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves load chains for quick picks", () => {
    for (const entry of WEBLLM_MODEL_CATALOG.filter((m) => m.quickPick)) {
      expect(isKnownWebLlmModel(entry.id)).toBe(true);
      const chain = getWebLlmLoadChain(entry.id);
      expect(chain[0]).toBe(entry.id);
      expect(chain.length).toBeGreaterThanOrEqual(1);
      for (const id of chain) {
        expect(prebuiltIds.has(id)).toBe(true);
      }
    }
  });
});
