/**
 * Shared WebGPU / compute device runtime for ShadowTalk.
 * Powers on-device Gemma (Transformers.js) and respects the nav GPU selector.
 */

export type AccelerationMode = "auto" | "webgpu" | "npu" | "cpu";

export const ACCELERATION_MODE_KEY = "shadowtalk_acceleration_mode";
export const ACCELERATION_CHANGE_EVENT = "shadowtalk-acceleration-change";

export type WebGPUProbe = {
  available: boolean;
  adapterLabel: string | null;
  vendor: string | null;
  estimatedVRAMGb: number;
};

export type ComputeDevice = "webgpu" | "wasm";

let probeCache: WebGPUProbe | null = null;
let probePromise: Promise<WebGPUProbe> | null = null;

export function getAccelerationPreference(): AccelerationMode {
  if (typeof window === "undefined") return "auto";
  const raw = localStorage.getItem(ACCELERATION_MODE_KEY);
  if (raw === "webgpu" || raw === "npu" || raw === "cpu" || raw === "auto") return raw;
  return "auto";
}

export function setAccelerationPreference(mode: AccelerationMode): void {
  localStorage.setItem(ACCELERATION_MODE_KEY, mode);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACCELERATION_CHANGE_EVENT, { detail: mode }));
  }
}

/** Probe GPU once per session (cached). */
export async function probeWebGPU(): Promise<WebGPUProbe> {
  if (probeCache) return probeCache;
  if (probePromise) return probePromise;

  probePromise = (async (): Promise<WebGPUProbe> => {
    const empty: WebGPUProbe = {
      available: false,
      adapterLabel: null,
      vendor: null,
      estimatedVRAMGb: 0,
    };

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      probeCache = empty;
      return empty;
    }

    try {
      const gpu = navigator.gpu as GPU | undefined;
      const adapter = await gpu?.requestAdapter({
        powerPreference: "high-performance",
      });
      if (!adapter) {
        probeCache = empty;
        return empty;
      }

      const info = await adapter.requestAdapterInfo?.();
      const limits = adapter.limits;
      const estimatedVRAMBytes = (limits?.maxBufferSize ?? 0) * 4;
      let estimatedVRAMGb =
        Math.round((estimatedVRAMBytes / (1024 * 1024 * 1024)) * 10) / 10;
      const deviceMemory =
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      if (estimatedVRAMGb < 2) {
        estimatedVRAMGb = Math.min(deviceMemory / 2, 4);
      }

      probeCache = {
        available: true,
        adapterLabel: info?.description || info?.device || "GPU",
        vendor: info?.vendor ?? null,
        estimatedVRAMGb,
      };
      return probeCache;
    } catch {
      probeCache = empty;
      return empty;
    } finally {
      probePromise = null;
    }
  })();

  return probePromise;
}

export function invalidateWebGPUProbe(): void {
  probeCache = null;
  probePromise = null;
}

/** Map user preference + hardware probe → ONNX/transformers device id. */
export function resolveComputeDevice(
  probe: WebGPUProbe,
  preference: AccelerationMode = getAccelerationPreference(),
): ComputeDevice {
  if (preference === "cpu") return "wasm";
  if (preference === "webgpu") return probe.available ? "webgpu" : "wasm";
  // auto and npu: use WebGPU when the browser exposes it (NPU path is future)
  return probe.available ? "webgpu" : "wasm";
}

export function getDeviceMemoryGb(): number {
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
}

/** Warm WebGPU adapter early so first model load is faster. */
export function warmWebGPUProbe(): void {
  if (typeof window === "undefined") return;
  const run = () => void probeWebGPU().catch(() => undefined);
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 3000 });
  } else {
    window.setTimeout(run, 500);
  }
}

let transformersConfigured = false;

/** Tune Transformers.js for browser inference (WebGPU + WASM fallback). */
export async function configureTransformersEnv(): Promise<void> {
  if (transformersConfigured || typeof window === "undefined") return;
  transformersConfigured = true;

  try {
    const { env, LogLevel } = await import("@huggingface/transformers");
    env.logLevel = LogLevel.WARNING;

    const cores = navigator.hardwareConcurrency ?? 4;
    const wasmThreads = cores > 1 ? Math.min(4, cores) : 1;
    env.backends.onnx.wasm = {
      ...env.backends.onnx.wasm,
      numThreads: wasmThreads,
    };
  } catch (e) {
    console.warn("[WebGPU] Transformers env setup skipped:", e);
  }
}

export function deviceLabel(device: ComputeDevice, probe: WebGPUProbe): string {
  if (device === "webgpu") {
    return probe.adapterLabel ? `WebGPU · ${probe.adapterLabel}` : "WebGPU";
  }
  return "CPU (WASM)";
}
