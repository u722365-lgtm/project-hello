# Hardware-aware turbo routing (PR #50)

**Branch:** `cursor/hardware-turbo-routing-7adb`  
**Pull request:** [#50](https://github.com/zain836/shadowtalk-ai-903ca615/pull/50)  
**Commit theme:** `feat: hardware-aware turbo routing for fastest chat path`

## Problem

ShadowTalk needed to behave like the **fastest chatbot on capable hardware**: use the GPU/CPU when strong, and only pay cloud latency when local execution is not viable.

## Solution

### 1. Hardware intelligence (`src/lib/hardwareIntelligence.ts`)

Builds a **HardwareProfile**:

| Field | Meaning |
|-------|---------|
| `tier` | `turbo` \| `performance` \| `balanced` \| `cloud` |
| `path` | `local-webgpu` \| `local-wasm` \| `cloud` \| `hybrid` |
| `cpuScore` | 0–100 from cores + device memory |
| `gpuScore` | 0–100 from WebGPU probe |
| `summary` | Human-readable explanation for UI/debug |

Profile is cached under `shadowtalk_hardware_profile_v1` in `localStorage`.

**Scoring strategy (documented in source):**

- Strong GPU → WebGPU local inference  
- Strong CPU, weak GPU → multi-thread WASM  
- Modest GPU → still prefer WebGPU when available  
- Weak CPU + weak GPU + online → cloud API  

### 2. Hybrid router (`src/lib/offline/hybridRouter.ts`)

**`decideRoute(messages, isOnline)`** returns `local` or `cloud` (and metadata) using the hardware profile and message context.

### 3. Chat integration (`src/pages/ChatbotPage.tsx`)

In `runChatCompletion`:

1. Augment messages (e.g. marketplace agent system prompt).
2. Call `decideRoute()`.
3. If `local` and models ready → stream via `runLocalChat` / `runOfflineCompletion`.
4. On failure or weak hardware → fall through to Supabase `functions/v1/chat`.

Also calls `prewarmFastestLocalPath()` and `warmHardwareProfile()` during session start.

## Tests

- `src/lib/hardwareIntelligence.test.ts`

## How to verify

| Scenario | Expected |
|----------|----------|
| High-end desktop + WebGPU | Local path, fast first token |
| Low RAM / no WebGPU | Cloud path |
| Offline | Offline completion or clear error |
| Throttle CPU 6× in DevTools | More cloud fallbacks |

## UX implications

- Users on good laptops/desktops get **lower latency** and more privacy (local).
- Users on weak phones still get **reliable** cloud responses.
- **UI (June 2026):** The `HardwareTurboBadge` (“Turbo” chip) was **removed** from the chat composer and toolbar. Routing is automatic and silent; tier info remains available in Profile → Offline AI and debug tooling — not in the input bar.

## Related docs

- [02-webgpu-acceleration.md](./02-webgpu-acceleration.md)  
- [06-personal-ide-and-chat.md](./06-personal-ide-and-chat.md)
