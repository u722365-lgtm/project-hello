# Startup performance (PR #48)

**Branch:** `cursor/fix-startup-performance-7adb`  
**Pull request:** [#48](https://github.com/zain836/shadowtalk-ai-903ca615/pull/48)  
**Commit theme:** `fix: reduce startup lag on open`

## Problem

Users experienced **device and app lag** when opening ShadowTalk—especially on first visit or after idle. Heavy work on the critical path (landing animations, model probes, sidebar chrome) delayed interaction.

## Solution summary

Work was split into:

1. **Shared platform metrics** — Centralized loading of public stats so multiple components do not each fetch Supabase independently on boot.
2. **Faster boot path** — Reduce synchronous work before the user can navigate or type in chat.
3. **Lazy landing** — Defer non-critical landing sections until after first paint.
4. **Deferred chrome** — Sidebars, toolbars, and secondary panels mount after the shell is usable.
5. **WebGPU warmup (non-blocking)** — Start hardware probe in the background without blocking chat input.

## Key files

| File | Role |
|------|------|
| `src/lib/platformMetricsShared.ts` | Shared cache/fetch for landing/product metrics |
| `src/lib/performance.ts` | Performance helpers used across the app |
| `src/lib/webgpuRuntime.ts` | `prewarm` / probe hooks used after idle |
| `src/lib/hardwareIntelligence.ts` | `warmHardwareProfile()` — cached profile without blocking UI |
| Landing page components | Lazy-loaded sections (varies by route) |

## Design principles

- **Nothing critical waits on WebGPU** — Probing runs async; chat can fall back to cloud immediately.
- **One metrics fetch** — Avoid N+1 Supabase calls on the marketing home page.
- **Progressive enhancement** — Shell first, polish second.

## How to verify

1. Cold load `/` and `/chatbot` with DevTools **Performance** tab.
2. Confirm **Time to first contentful paint** improves vs `main` before #48.
3. Confirm chat input is focusable before marketplace catalog or heavy panels finish loading.
4. In Application → Local Storage, confirm `shadowtalk_hardware_profile_v1` appears after a short delay (not before first interaction).

## Known limits

- Local model download (Tier A offline) is still heavy; that path is intentionally separate from “app open” optimization.
- Very low-end devices may still feel slow when switching to IDE or generating large apps (see App Builder doc).

## Related docs

- [02-webgpu-acceleration.md](./02-webgpu-acceleration.md) — GPU probe details  
- [03-hardware-turbo-routing.md](./03-hardware-turbo-routing.md) — Uses warmed profile in chat
