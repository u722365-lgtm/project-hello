import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resolveComputeDevice,
  getAccelerationPreference,
  ACCELERATION_MODE_KEY,
  type WebGPUProbe,
} from "./webgpuRuntime";

const gpuAvailable: WebGPUProbe = {
  available: true,
  adapterLabel: "Test GPU",
  vendor: "test",
  estimatedVRAMGb: 8,
};

const gpuMissing: WebGPUProbe = {
  available: false,
  adapterLabel: null,
  vendor: null,
  estimatedVRAMGb: 0,
};

describe("webgpuRuntime", () => {
  beforeEach(() => {
    localStorage.removeItem(ACCELERATION_MODE_KEY);
  });

  it("defaults acceleration preference to auto", () => {
    expect(getAccelerationPreference()).toBe("auto");
  });

  it("resolves webgpu when auto and GPU is available", () => {
    expect(resolveComputeDevice(gpuAvailable, "auto")).toBe("webgpu");
  });

  it("resolves wasm when auto and GPU is missing", () => {
    expect(resolveComputeDevice(gpuMissing, "auto")).toBe("wasm");
  });

  it("forces wasm when user selects CPU", () => {
    expect(resolveComputeDevice(gpuAvailable, "cpu")).toBe("wasm");
  });

  it("honors webgpu preference when hardware supports it", () => {
    expect(resolveComputeDevice(gpuAvailable, "webgpu")).toBe("webgpu");
  });

  it("falls back to wasm when webgpu preferred but unavailable", () => {
    expect(resolveComputeDevice(gpuMissing, "webgpu")).toBe("wasm");
  });
});
