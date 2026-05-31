import { describe, it, expect } from "vitest";
import { buildHardwareProfile, scoreCpu, scoreGpu } from "./hardwareIntelligence";
import type { WebGPUProbe } from "./webgpuRuntime";

const strongGpu: WebGPUProbe = {
  available: true,
  adapterLabel: "NVIDIA GeForce RTX 4070",
  vendor: "nvidia",
  estimatedVRAMGb: 8,
};

const weakGpu: WebGPUProbe = {
  available: true,
  adapterLabel: "Intel Integrated",
  vendor: "intel",
  estimatedVRAMGb: 1.5,
};

const noGpu: WebGPUProbe = {
  available: false,
  adapterLabel: null,
  vendor: null,
  estimatedVRAMGb: 0,
};

describe("hardwareIntelligence", () => {
  it("scores strong GPU highly", () => {
    expect(scoreGpu(strongGpu)).toBeGreaterThanOrEqual(70);
  });

  it("picks WebGPU turbo path for strong GPU in auto mode", () => {
    const profile = buildHardwareProfile(strongGpu, 40, scoreGpu(strongGpu));
    expect(profile.path).toBe("local-webgpu");
    expect(profile.tier).toBe("turbo");
    expect(profile.computeDevice).toBe("webgpu");
  });

  it("uses WebGPU for modest GPU in auto mode", () => {
    const gpuScore = scoreGpu(weakGpu);
    const profile = buildHardwareProfile(weakGpu, 30, gpuScore);
    expect(profile.computeDevice).toBe("webgpu");
  });

  it("prefers cloud on very weak hardware when auto", () => {
    const profile = buildHardwareProfile(noGpu, 20, 0);
    expect(profile.path).toBe("cloud");
    expect(profile.tier).toBe("cloud");
  });

  it("scoreCpu returns a bounded value", () => {
    expect(scoreCpu()).toBeGreaterThanOrEqual(0);
    expect(scoreCpu()).toBeLessThanOrEqual(100);
  });
});
