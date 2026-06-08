import { describe, expect, it } from "vitest";
import {
  listCompatibleModels,
  recommendOllamaModel,
  OLLAMA_MODEL_CATALOG,
} from "./modelRecommendations";
import type { HardwareProfile } from "@/lib/hardwareIntelligence";

const turboProfile: HardwareProfile = {
  tier: "turbo",
  path: "local-webgpu",
  cpuScore: 80,
  gpuScore: 75,
  computeDevice: "webgpu",
  summary: "Strong GPU",
  probedAt: Date.now(),
};

const cloudProfile: HardwareProfile = {
  tier: "cloud",
  path: "cloud",
  cpuScore: 30,
  gpuScore: 0,
  computeDevice: "cpu",
  summary: "Weak device",
  probedAt: Date.now(),
};

describe("modelRecommendations", () => {
  it("recommends balanced 7B for strong GPU profile", () => {
    const rec = recommendOllamaModel({ profile: turboProfile, platform: "win32", arch: "x64" });
    expect(["qwen2.5:7b", "llama3.2", "qwen2.5:14b", "deepseek-r1:7b"]).toContain(rec.id);
  });

  it("recommends lite model for weak hardware", () => {
    const rec = recommendOllamaModel({
      profile: cloudProfile,
      platform: "win32",
      arch: "x64",
      deviceMemoryGB: 8,
    });
    expect(["phi3:mini", "qwen2.5:3b"]).toContain(rec.id);
  });

  it("lists compatible models filtered by hardware", () => {
    const models = listCompatibleModels({ profile: cloudProfile, deviceMemoryGB: 8 });
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => OLLAMA_MODEL_CATALOG.some((c) => c.id === m.id))).toBe(true);
  });
});
