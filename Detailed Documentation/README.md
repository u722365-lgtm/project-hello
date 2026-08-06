# ShadowTalk — Detailed Documentation

Engineering and product documentation for **ShadowTalk AI**. Written for developers, reviewers, operators, and stakeholders who need a full picture of **what was built, why, and where it lives**.

**Master index (all docs):** [../DOCUMENTATION.md](../DOCUMENTATION.md)

---

## How to read these docs

| Document | Topic |
|----------|--------|
| [00-project-overview.md](./00-project-overview.md) | Product context, goals, timeline |
| [01-startup-performance.md](./01-startup-performance.md) | Faster app open, deferred work (PR #48) |
| [02-webgpu-acceleration.md](./02-webgpu-acceleration.md) | On-device WebGPU (PR #49) |
| [03-hardware-turbo-routing.md](./03-hardware-turbo-routing.md) | CPU/GPU routing — local vs cloud (PR #50) |
| [04-marketplace-functional.md](./04-marketplace-functional.md) | Runnable marketplace agents (PR #51) |
| [05-app-builder.md](./05-app-builder.md) | Web & mobile app generation (PR #52) |
| [06-personal-ide-and-chat.md](./06-personal-ide-and-chat.md) | IDE, `/ide`, chat integration |
| [07-subscription-and-product.md](./07-subscription-and-product.md) | Monetization, BYOK, landing, pricing |
| [08-architecture-reference.md](./08-architecture-reference.md) | Modules, routes, data flow |
| [09-pull-requests-index.md](./09-pull-requests-index.md) | PR numbers, branches, merges |
| [10-ux-auth-and-navigation.md](./10-ux-auth-and-navigation.md) | **Workspace-first entry, auth, composer UX** |
| [11-complete-route-reference.md](./11-complete-route-reference.md) | **Every `App.tsx` route** |

---

## Repository

- **GitHub:** `zain836/shadowtalk-ai-903ca615`
- **App root:** `/workspace` (Vite + React + ShadowTalk backend)
- **Cloud agent branches:** `cursor/<name>-7adb`

---

## Product snapshot (June 2026)

1. **`/` → `/chatbot`** — workspace opens immediately; marketing at `/home`.
2. **Persistent auth** — session restore + anonymous sign-in unless user signed out.
3. **No chat boot screen** — skip global boot on chat paths; no “Warming up…” gate.
4. **Hardware routing** — automatic local vs cloud (Turbo badge removed from UI).
5. **Marketplace + App Builder** — runnable agents and multi-file IDE projects.
6. **Dedicated pricing page** — `/pricing` with motion-rich plan UX.

**Start here for users:** [05-app-builder.md](./05-app-builder.md), [04-marketplace-functional.md](./04-marketplace-functional.md), [10-ux-auth-and-navigation.md](./10-ux-auth-and-navigation.md).
