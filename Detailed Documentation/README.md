# ShadowTalk — Detailed Documentation

This folder documents product and engineering work on **ShadowTalk** from the start of the recent improvement initiative through the latest features. It is written for developers, reviewers, and stakeholders who need a full picture of **what was built, why, and where it lives in the codebase**.

## How to read these docs

| Document | Topic |
|----------|--------|
| [00-project-overview.md](./00-project-overview.md) | Product context, goals, and timeline |
| [01-startup-performance.md](./01-startup-performance.md) | Faster app open, deferred work, metrics (PR #48) |
| [02-webgpu-acceleration.md](./02-webgpu-acceleration.md) | On-device WebGPU for local AI (PR #49) |
| [03-hardware-turbo-routing.md](./03-hardware-turbo-routing.md) | CPU/GPU scoring and chat route selection (PR #50) |
| [04-marketplace-functional.md](./04-marketplace-functional.md) | Runnable marketplace agents (PR #51) |
| [05-app-builder.md](./05-app-builder.md) | Full web & mobile app generation from chat (PR #52) |
| [06-personal-ide-and-chat.md](./06-personal-ide-and-chat.md) | Personal IDE, `/ide` route, chat integration |
| [07-subscription-and-product.md](./07-subscription-and-product.md) | Monetization, BYOK, landing, live metrics |
| [08-architecture-reference.md](./08-architecture-reference.md) | Key modules, routes, and data flow |
| [09-pull-requests-index.md](./09-pull-requests-index.md) | PR numbers, branches, and merge status |

## Repository

- **GitHub:** `zain836/shadowtalk-ai-903ca615`
- **Primary app path:** `/workspace` (Vite + React + Supabase)
- **Cloud agent branch suffix:** `*-7adb`

## Quick feature summary (latest state)

1. **Performance** — Landing and chat boot faster; heavy work is deferred.
2. **Speed** — WebGPU + hardware-aware routing choose local vs cloud chat paths.
3. **Marketplace** — Install agents, run them in chat with real system prompts and IDE scripts.
4. **App Builder** — “Build a full web/mobile app” opens a multi-file project in the IDE.

For day-to-day usage, start with [05-app-builder.md](./05-app-builder.md) and [04-marketplace-functional.md](./04-marketplace-functional.md).
