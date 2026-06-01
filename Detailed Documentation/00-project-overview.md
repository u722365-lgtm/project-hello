# Project overview

## What is ShadowTalk?

ShadowTalk is an AI-powered web application that combines:

- **Chat** — Multi-personality assistant with tools (search, research, images, code, missions, and more).
- **Workspace & IDE** — Personal multi-file code editor with live HTML preview and mobile viewport.
- **Marketplace** — Catalog of specialist agents users can install and run.
- **Offline / local paths** — Optional on-device models (Gemma, SmolLM) with WebGPU when hardware allows.
- **Monetization** — Free tier limits, Premium/Elite plans, and bring-your-own-key (BYOK) providers.

Stack: **React**, **TypeScript**, **Vite**, **Supabase** (auth, DB, edge functions), **PWA**.

---

## Goals of this improvement initiative

Users reported and we targeted:

| Goal | Outcome |
|------|---------|
| App feels slow on open | Startup performance pass (metrics, lazy landing, deferred chrome) |
| “Fastest chatbot” on good hardware | WebGPU runtime + hardware intelligence + hybrid router |
| Marketplace feels fake | Real install registry **and** runnable agent configs in chat/IDE |
| “Build me an app” only gives snippets | App Builder: full multi-file projects in IDE |

---

## Timeline (high level)

Work landed in a series of focused pull requests on branch names like `cursor/<feature>-7adb`:

| Order | PR | Branch (typical) | Theme |
|-------|-----|------------------|--------|
| Earlier | #46 | `cursor/wire-personal-ide-7adb` | Personal IDE on `/ide`, chat → IDE payload |
| Earlier | #47 | `cursor/subscription-psychology-7adb` | Premium-focused conversion UX |
| 1 | #48 | `cursor/fix-startup-performance-7adb` | Startup lag |
| 2 | #49 | `cursor/webgpu-acceleration-7adb` | WebGPU for local inference |
| 3 | #50 | `cursor/hardware-turbo-routing-7adb` | Hardware-aware chat routing |
| 4 | #51 | `cursor/marketplace-functional-7adb` | Runnable marketplace |
| 5 | #52 | `cursor/app-builder-7adb` | Web + mobile app builder |

Additional parallel work on `main` includes: live landing metrics, stealth mode, BYOK prompts, dark theme restore, chat archive, and security migrations.

---

## What “done” means for each pillar

### Performance
- First paint and time-to-interactive improved by not blocking the main thread on non-critical UI and model warmup.

### Speed (chat)
- Device is probed once (cached): CPU cores/RAM, WebGPU adapter.
- `decideRoute()` in the hybrid router sends messages to **local WebGPU**, **local WASM**, or **cloud** as appropriate.

### Marketplace
- Each catalog agent has a **runtime config** (system prompt, starters, optional IDE script).
- **Run** → chat with injected specialist behavior; **Script** agents → IDE with template.

### App Builder
- Natural language like “build a mobile app for fitness” triggers generation of `index.html`, `style.css`, `app.js`, `README.md` and opens the IDE with preview.

---

## Audience for this documentation

- **Engineers** — Use [08-architecture-reference.md](./08-architecture-reference.md) and per-feature docs for file paths and flows.
- **QA** — Use “How to verify” sections in each feature doc.
- **Product** — Use this overview and [09-pull-requests-index.md](./09-pull-requests-index.md) for release notes.
