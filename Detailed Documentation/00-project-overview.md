# Project overview

## What is ShadowTalk?

ShadowTalk is an **agentic AI workspace** — not a thin chat wrapper. It combines:

- **Chat** (`/chatbot`) — Multi-personality assistant, 30+ tools, voice, images, deep research, missions.
- **Workspace & IDE** — Personal multi-file editor with live preview; App Builder from natural language.
- **Marketplace** — Installable specialist agents with real runtime configs.
- **Offline / local** — SmolLM, Gemma, WebGPU when hardware allows; hybrid router to cloud.
- **Monetization** — Free tier limits, Premium/Elite, BYOK (Gemini / OpenRouter / Kimi).
- **Privacy & ops** — Vault, cyber command, compliance surfaces, admin panel.

**Stack:** React, TypeScript, Vite, Supabase (auth, DB, edge functions), PWA, optional Electron desktop.

**Default entry:** `/` redirects to **`/chatbot`**. Marketing at **`/home`**.

---

## Goals of the improvement initiative

| Goal | Outcome |
|------|---------|
| App feels slow on open | Startup deferral; skip boot on chat; non-blocking auth |
| Fastest chat on good hardware | WebGPU + hardware intelligence + hybrid router |
| Marketplace feels fake | Runnable agents in chat/IDE |
| “Build me an app” only snippets | App Builder → multi-file IDE |
| Users bounce on auth | Persistent / anonymous session (Gemini-style) |
| Cluttered marketing | Dedicated landing nav; `/pricing` page |

---

## Timeline (high level)

| Order | PR / theme | Focus |
|-------|------------|--------|
| Earlier | #46 | Personal IDE on `/ide` |
| Earlier | #47 | Subscription psychology, upgrade nudges |
| 1 | #48 | Startup performance |
| 2 | #49 | WebGPU local inference |
| 3 | #50 | Hardware-aware routing |
| 4 | #51 | Marketplace runnable |
| 5 | #52 | App Builder |
| Main | — | `/` → chatbot, persistent auth, skip boot, pricing UX, remove Turbo UI badge |

See [09-pull-requests-index.md](./09-pull-requests-index.md) and [10-ux-auth-and-navigation.md](./10-ux-auth-and-navigation.md).

---

## What “done” means per pillar

### Performance & entry
- Chat-first routing; no blocking boot on `/chatbot`.
- Auth does not wait for subscription API before rendering workspace.

### Speed (chat)
- Device probed once (cached): CPU, RAM, WebGPU.
- `decideRoute()` → local WebGPU, WASM, or cloud SSE.

### Marketplace
- Agents have runtime config (prompt, starters, IDE script).
- **Run** → `/chatbot?agent=id` with injected behavior.

### App Builder
- “Build a fitness app” → `index.html`, CSS, JS, README → IDE preview.

### Product UX
- Landing at `/home` with `LandingNavigation`.
- Full pricing at `/pricing`.
- Composer: provider chip, voice, send inside pill (no Turbo badge).

---

## Audience

- **Engineers** — [08-architecture-reference.md](./08-architecture-reference.md), [11-complete-route-reference.md](./11-complete-route-reference.md)
- **QA** — “How to verify” in each feature doc + [10-ux-auth-and-navigation.md](./10-ux-auth-and-navigation.md)
- **Product** — This overview + [09-pull-requests-index.md](./09-pull-requests-index.md)
- **End users** — [/docs](https://www.shadowtalk-ai.com/docs) and [DOCUMENTATION.md](../DOCUMENTATION.md)
