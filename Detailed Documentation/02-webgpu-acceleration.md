# WebGPU acceleration (PR #49)

**Branch:** `cursor/webgpu-acceleration-7adb`  
**Pull request:** [#49](https://github.com/zain836/shadowtalk-ai-903ca615/pull/49)  
**Commit theme:** `feat: unify WebGPU acceleration for on-device AI`

## Problem

On-device AI (Gemma / transformers.js style workloads) was inconsistent: some paths used WASM-only CPU inference even when **WebGPU** was available, leaving performance on the table for users with capable GPUs.

## Solution

A unified **WebGPU runtime layer** probes the browser’s GPU, respects user acceleration preferences, and exposes a single API for local inference code paths.

## Key module: `src/lib/webgpuRuntime.ts`

Responsibilities:

- **`probeWebGPU()`** — Detect adapter, limits, and availability.
- **`getAccelerationPreference()`** — Read user/settings preference (auto vs force paths).
- **`getDeviceMemoryGb()`** — Heuristic from `navigator.deviceMemory`.
- **Compute device typing** — `ComputeDevice` enum used by hardware scoring.

Tests: `src/lib/webgpuRuntime.test.ts`

## Integration points

| Consumer | Usage |
|----------|--------|
| `hardwareIntelligence.ts` | GPU score from probe |
| `offline/gemmaEngine.ts` | Prefer WebGPU backend when probe succeeds |
| `offline/localChat.ts` | Local chat execution |
| Chatbot boot | Background prewarm |

## Behavior

1. On supported browsers (Chrome/Edge, etc.), WebGPU adapter is requested.
2. If available, local pipelines register WebGPU-backed execution.
3. If unavailable or user disables acceleration, fall back to WASM CPU paths.
4. Probe results are cached for the session to avoid repeated adapter churn.

## How to verify

1. Chrome → `chrome://gpu` — confirm WebGPU enabled.
2. Open chat; send a message with local models installed.
3. Console / logs should indicate WebGPU path when tier is `turbo` or `performance`.
4. Run unit tests: `npx vitest run src/lib/webgpuRuntime.test.ts`

## Security & compatibility notes

- WebGPU requires a secure context (HTTPS or localhost).
- Safari/Firefox support varies; code must always handle `probe.available === false`.

## Related docs

- [03-hardware-turbo-routing.md](./03-hardware-turbo-routing.md)
