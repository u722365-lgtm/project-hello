# Phase 0 Audit Report — ShadowTalk AI
**Repo:** `/tmp/shadowtalk-ai-repo`  
**Date:** 2026-07-22  
**Scope:** Lovable cloud deps, Electron/Capacitor setup, Ollama integration, media pipeline, WhatsApp bridge, security/state, build/deploy pipeline, QA runtime, migration path.  
**Status:** Collected from repo-inspected source files.  
**Limitation:** Ripgrep-based `search_files` failed repeatedly on `/tmp/shadowtalk-ai-repo/src`, so some references are inferred from `find` + direct reads instead of exact code search; line numbers are exact where the file was read, representative where expected.

---

## 1. Executive Summary
ShadowTalk AI is a React/Vite app currently layered on top of **Lovable Cloud** (Supabase + generated auth/codegen), with **Electron** desktop via `@capacitor-community/electron` and a CLI-first local mode using **Ollama**. The app is hybrid: cloud-dependent for auth/state, with multiple “local-first” hooks in place (localStorage, idb-capable flows, offline queues, E2EE, WebGPU/WebContainer). Migration to **Tauri + local-first** requires decoupling from Lovable/Supabase, replacing Capacitor desktop plumbing with true Tauri windows + Rust backend, and hardening secrets/state.

Key risks:
- Hardcoded/auto-injected Supabase creds + client-side secrets management.
- Dual runtime stacks duplicate work and confuse secrets boundaries.
- No deterministic end-to-end offline auth without cloud dependency.
- WhatsApp bridge depends on unverified Supabase Edge function contracts.
- Media/WebGPU stacks ship but have limited production hardening under Electron.

---

## 2. Complete Inventory of Lovable Cloud Endpoints
**Sources:** `vite.config.ts:13-36`, `src/integrations/lovable/index.ts`, `src/integrations/supabase/client.ts`, `env.example`.

### 2.1 Auto-injected Supabase credentials
- `VITE_SUPABASE_URL` — default fallback `https://axsudmhjpfzffcicfvuj.supabase.co` (`vite.config.ts:13`).
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon key baked into built app (`vite.config.ts:14-15`).
- `VITE_SUPABASE_PROJECT_ID` — referenced in env example / CI (`env.example:13`).

**Risk:** Publishable key is client-side. If RLS/policies are weak, this is equivalent to a broader breach.

### 2.2 Lovable auth package
- `@lovable.dev/cloud-auth-js` auto-initialized in `src/integrations/lovable/index.ts:3-5`.
- Integrates Google/Apple OAuth and writes tokens into `supabase.auth.setSession(...)`.

**Risk:** Tight coupling to Lovable OAuth wrapper; non-trivial to swap without modifying generated file.

### 2.3 Supabase client behavior
- `src/integrations/supabase/client.ts:11-17`: auth uses `localStorage` with `storageKey: "shadowtalk-auth"`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- `src/integrations/supabase/loose.ts:5-8`: exported `supabaseLoose` to bypass generated schema.

**Risk:** Tokens lived in localStorage; XSS = account takeover.

### 2.4 Direct Supabase API use
- `components/chat/WhatsAppConnect.tsx:95-107`: calls `/functions/v1/whatsapp-webhook`.
- `lib/whatsappQr.ts:19-31`: calls `/functions/v1/whatsapp-qr`.
- `hooks/useCustomApiKeys.ts:30-31`: calls `/functions/v1/user-provider-keys` (optional, gated by `VITE_ENABLE_BYOK_EDGE`).
- `hooks/useShadowToolBridge.ts:100`: reads `supabase.auth.getSession()` for tool execution tokens.
- `components/AuthProvider.tsx:89`: calls `supabase.functions.invoke('check-subscription')`.

### 2.5 Runtime caching of Supabase REST/Storage
- `vite.config.ts:176-207`: PWA workbox caches `/rest/v1/...` and `/storage/...` with `NetworkFirst` / `CacheFirst`.

**Observation:** Offline cache helps but cannot replace local auth/state.

---

## 3. Electron / Capacitor Architecture Map
**Sources:** `electron/package.json`, `electron/src/index.ts`, `electron/src/setup.ts`, `electron/src/preload.ts`, `electron/src/shadowtalk-preload.ts`, `electron/capacitor.config.ts`, `capacitor.config.ts`, `electron/src/desktopIpc.ts`.

### 3.1 Packaging model
- Root build uses Vite (`webDir: dist` in `capacitor.config.ts:6`).
- Electron package uses `@capacitor-community/electron` and `electron-serve` to load built assets.
- Desktop entrypoint: `electron/src/index.ts` bootstraps an `ElectronCapacitorApp`, registers `registerDesktopIpc()`, auto-web GPU / preload setup, and starts bundled Ollama.

### 3.2 Window + security
- `electron/src/setup.ts`:
  - Uses `preload` path: `build/src/preload.js` (`setup.ts:109`).
  - `nodeIntegration: true`, `contextIsolation: true` (`setup.ts:118-120`).
  - CSP varies by dev mode (`setup.ts:255-276`).
  - Blocks non-custom-scheme opens and external navigation (`setup.ts:184-198`).
  - Patches Supabase CORS ACAO headers for desktop custom scheme (`setup.ts:231-252`).

**Risk:** `nodeIntegration: true` + multi-layer preloads increase attack surface despite CSP.

### 3.3 IPC surface (`st-desktop:*`)
- `desktopIpc.ts:21-38` defines channels: `getInfo`, `openFile`, `saveFile`, `readTextFile`, `writeTextFile`, `openPath`, `openExternal`, `revealInFolder`, `notify`, `getAutoLaunch`, `setAutoLaunch`, `chatStream`, `ollamaStatus`, `ollamaConfigure`, `ollamaPull`, `ollamaBootstrap`, `ollamaBootstrapSnapshot`, `ollamaChat`, `fetchUrl`.

**Risk:** File dialogs + arbitrary fetchURL expands trust boundary; missing rate-limiting or path allowlists for file access.

### 3.4 Duplicate preload files
- `preload.ts` and `shadowtalk-preload.ts` both require.

**Risk:** Module execution order ambiguity; risk of duplicate/overlapping contextBridge exposure.

---

## 4. Ollama Integration Layout
**Sources:** `electron/src/ollamaManager.ts`, `electron/src/ollamaSidecar.ts`, `electron/src/ollamaPaths.ts`, `electron/src/index.ts`, `cli/src/ollama.ts`, `cli/src/router.ts`, `cli/src/config.ts`, `electron/src/desktopIpc.ts`.

### 4.1 Desktop bundled Ollama
- Manages local Ollama binary under `process.resourcesPath/ollama/bin/<platform-key>/ollama[.exe]`.
- Default bundled model: `qwen2.5:7b`; fallback `phi3:mini` (`ollamaPaths.ts:3-4`).
- First-run seeds bundled models into `<userData>/ollama-models` and writes completion flag.
- Probes `/api/version` and `/api/tags`; auto-pulls default model when models list is empty.

**Risk:** Large first-run download; little bandwidth/disk quota guard.

### 4.2 Streamed chat
- `electron/src/desktopIpc.ts:186-192` restricts `chatStream` to Supabase Function URLs only — oddly conservative for an "offline" renderer; bypasses internal Ollama reverse route.
- `electron/src/desktopIpc.ts:262-294` forwards `ollamaChat` to main-process sidecar via fragmented SSE.

### 4.3 CLI local mode
- `cli/src/config.ts:23-28`: defaults `routing.mode=local-only`, `sovereign.mode=sovereign`, url `http://127.0.0.1:11434`.
- `cli/src/router.ts:13-57` routes to local/cloud based on pledge + Ollama status.
- `cli/src/cloudChat.ts:5-53` still depends on Supabase Functions for cloud chat.

**Risk:** “Local-first default” is undermined by cloud auth dependency in every user flow.

---

## 5. Media Pipeline Status
**Sources:** `package.json`, `src/hooks/useChatSpeech.ts`, `src/hooks/useCodeSandbox.ts`.

### 5.1 Frontend media
- Dependencies: `@ffmpeg/ffmpeg`, `@ffmpeg/util`, `@webcontainer/api`, `katex`, `react-markdown`, `pptxgenjs`, `jspdf`, etc.
- Speech is Web Speech API only (`SpeechRecognition` + `SpeechSynthesisUtterance`); no WebContainer-backed cloud TTS/STT in hook itself.
- Code execution via WebContainer API (`src/hooks/useCodeSandbox.ts:1-261`) with `executeFallback` using `new Function(...)` in browsers without COOP/COEP.

**Risk:** WebContainer requires shared-array-buffer isolation; in Electron, isolation is limited unless explicitly configured.

---

## 6. WhatsApp Bridge Architecture
**Sources:** `src/components/chat/WhatsAppConnect.tsx`, `src/lib/whatsappQr.ts`, `env.example`.

### 6.1 QR-based link
- Uses `whatsapp_links` table to persist link state; state includes `connection_type === "qr"` and `qr_status`.
- Polls `/functions/v1/whatsapp-qr` with actions `start`, `qr`, `status`, `unlink`.
- Phone-OAuth fallback through `/functions/v1/whatsapp-webhook`.

### 6.2 Environment vars for WhatsApp
- Twilio sandbox vars: `TWILIO_*`, `VITE_TWILIO_WHATSAPP_NUMBER` (client-side exposed).
- Evolution API: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_SECRET`.

**Risk:** Client-side webhook tokens; no auth flow protection visible in frontend code.

---

## 7. Security & State Management
**Sources:** `src/hooks/useE2EE.ts`, `src/hooks/useOfflineAuth.ts`, `src/components/AuthProvider.tsx`, `src/integrations/supabase/client.ts`, `electron/src/setup.ts`.

### 7.1 E2EE
- Uses PBKDF2 (100k) + AES-256-GCM for vault (`useE2EE.ts:16-19`).
- Salt and fingerprint in `localStorage`; session key in `sessionStorage`.
- One-click session encryption via random entropy.

**Risk:** Salt + ciphertext co-located in same origin; if localStorage is read by a compromised page, cryto context is reachable.

### 7.2 Offline auth
- `useOfflineAuth.ts` stores bcrypt hash of password in `localStorage` with 30-day expiry.
- During offline validation, derives session token but never registers with online backend.

**Risk:** Storing password hashes client-side violates normal SaaS posture; XSS/other exfil risk.

### 7.3 AuthProvider lifecycle
- `PersistedAuthRedirect` + token refresh every 5 min (`AuthProvider.tsx:199-208`).
- Calls `check-subscription` edge function (`AuthProvider.tsx:89`); silently falls back to resolver-by-email on error.

**Risk:** Subscription state used as proxy for authorization; inconsistent fallback could allow plan spoofing.

### 7.4 Electron hardening
- CSP restricts domains for supabase, huggingface, cdn.jsdelivr, raw.githubusercontent.
- Hardened CORS patching for desktop origins.

---

## 8. Build / Deployment Pipeline
**Sources:** `package.json`, `vite.config.ts`, `vercel.json`, `.github/workflows/ci.yml`, `.github/workflows/desktop-release.yml`, `electron/electron-builder.config.json`.

### 8.1 Web build
- `vite build` bundles to `dist/`, includes `computer-frame.html` as separate entry.
- Dedupes React, chunks vendor, splits 3D/monaco/query.
- Defines Supabase env at build time.

### 8.2 CI
- On push/PR: lint → build → test → npm audit (`ci.yml`).
- Needs secrets for Supabase build-time envs.

### 8.3 Desktop release
- Tag-triggered workflow builds NSIS for Windows; attaches exe to GitHub release (`desktop-release.yml`).
- Optional `BUNDLE_OLLAMA=1` then `npm run desktop:stage-ollama`.

### 8.4 Hosting
- `vercel.json` rewrites everything to `index.html` except whitelisted assets; enforces COOP/COEP on `/sw.js`.

**Risk:** BUILD-TIME injection of secret values? `vite.config.ts:13-15` uses a fake-looking default anon key; if real creds leak to bundle, app distribution becomes a secret leak vector.

---

## 9. QA / Runtime Gaps
**Sources:** `package.json`, `.github/workflows/ci.yml`, `vitest.config.ts`, repo structure.

### 9.1 Test evidence
- `vitest.config.ts` exists but CI test job only runs `npm test`, not `desktop`/e2e tests.
- Coverage gaps: Electron main process, Ollama bootstrap, WhatsApp backend, media encoding.

### 9.2 QA/runtime monitor hooks
- `src/main.tsx:38-47`: logs global errors/unhandled rejections to console only.
- `SelfHealingProvider` / `UpdateNotificationProvider` wrapped in lazy `deferredChrome`.
- `main.tsx:62-64` bypasses SW registration on Lovable preview hostnames.

**Risk:** Poor visibility into field failures; no tracked crash reporting mentioned.

---

## 10. Recommended Tauri + Local-First Migration Path
### 10.1 End state
- Tauri `2.x` for desktop + mobile.
- Rust backend owns filesystem, Ollama lifecycle, secret store, encrypted state.
- Supabase reduced to optional sync/backup layer; offline-first by default.

### 10.2 Phase sequence (high level)
1. **Shim auth:** Replace Supabase auth with Tauri plugin store for local vault; retain OAuth only behind user opt-in. Map `localStorage` secrets → `tauri-plugin-secure-store`.
2. **Separate bundles:** Remove Lovable-generated auth module; craft thin API layer in `src/api/`.
3. **Ollama integration:** Reuse current `ollamaManager.ts` strategy but port to Rust command wrapper; guarantee auto-start via Tauri sidecar.
4. **State layer:** Replace `localStorage`/`sessionStorage` with `idb` + Tauri SQLite; implement E2EE backed by Rust libs + WASM fallback.
5. **Media:** Keep WebContainer for browser; swap Electron preloads for Tauri commands. Move `chatStream`, `fileDialogs`, `fetchUrl` into Tauri `invoke`.
6. **WhatsApp:** Rebuild bridge to avoid direct Supabase Edge dependency; expose local relay via Tauri HTTP server or local plugin.
7. **Desktop hardening:** Drop `nodeIntegration: true`; use strict CSP + Tauri allowlist. Remove custom preload from `node_modules/@capacitor-community` chain.
8. **Verification:** Port vitest tests, add Tauri E2E workflow, bundle size + security audits, CI build workflows per arch.

---

## 11. Consolidated Findings Index
| # | Topic | Finding | Risk | Key files |
|---|-------|---------|------|-----------|
| F01 | Lovable auth | Generated file couples OAuth to Supabase; difficult to customize | High | `src/integrations/lovable/index.ts` |
| F02 | Supabase creds | Publishable key + URL exposed at build + runtime | High | `vite.config.ts:13-15`, `env.example` |
| F03 | Client auth storage | localStorage for auth tokens + hash | High | `src/integrations/supabase/client.ts:12-17`, `src/hooks/useOfflineAuth.ts:60-74` |
| F04 | Electron attack surface | Dual preloads + nodeIntegration true | Medium-High | `electron/src/setup.ts:109-120`, `electron/src/preload.ts`, `electron/src/shadowtalk-preload.ts` |
| F05 | chatStream restriction | Desktop IPC restricts chatStream to Supabase functions only | Medium | `electron/src/desktopIpc.ts:186-192` |
| F06 | WhatsApp bridge | Client-local webhook tokens; backend secrets partially public | Medium | `env.example:39-49`, `src/components/chat/WhatsAppConnect.tsx:95-107` |
| F07 | BYOK edge optional | `VITE_ENABLE_BYOK_EDGE` gating makes user keys inconsistent across deployments | Medium | `src/hooks/useCustomApiKeys.ts:20` |
| F08 | Offline E2EE | Salt + ciphertext in same localStorage origin | Medium | `src/hooks/useE2EE.ts:30-45` |
| F09 | Build-time secrets | `vite.config.ts` injects Supabase creds at build; CI secrets are required but easy to misconfigure | Medium | `vite.config.ts:13-15`, `.github/workflows/ci.yml:31-33` |
| F10 | Test coverage | Only web unit tests; no Electron/Rust/Ollama integration tests | Low-Medium | `.github/workflows/ci.yml:37-54` |
| F11 | Media runtime | WebSpeech used as default voice pipeline; WebContainer relies on cross-origin isolation | Low-Medium | `src/hooks/useChatSpeech.ts:18-56`, `src/hooks/useCodeSandbox.ts:1-261` |

---

## 12. Migration Risk Matrix
| Target | Risk | Effort |
|--------|------|--------|
| Decouple Lovable auth | High | 3 w |
| Rust wrapper for Ollama | Low-Med | 2 w |
| Migrate Electron → Tauri 2 | High | 6-8 w |
| WhatsApp bridge rewrite | Medium | 4 w |
| Replace localStorage auth | High | 4 w |
| Media pipeline shim | Low | 2 w |
| CI/CD + signing | Medium | 2 w |

---

**Audit source map:**  
- `vite.config.ts`, `package.json`, `.github/workflows/ci.yml`, `.github/workflows/desktop-release.yml`, `vercel.json`, `capacitor.config.ts`, `env.example`
- `electron/src/index.ts`, `electron/src/setup.ts`, `electron/src/preload.ts`, `electron/src/shadowtalk-preload.ts`, `electron/src/desktopIpc.ts`, `electron/src/ollamaManager.ts`, `electron/src/ollamaSidecar.ts`, `electron/src/ollamaPaths.ts`, `electron/src/autoUpdate.ts`, `electron/capacitor.config.ts`, `electron/electron-builder.config.json`, `electron/package.json`
- `src/main.tsx`, `src/App.tsx`, `src/components/AuthProvider.tsx`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/loose.ts`, `src/integrations/supabase/types.ts`, `src/integrations/lovable/index.ts`, `src/hooks/useE2EE.ts`, `src/hooks/useOfflineAuth.ts`, `src/hooks/useOfflineMode.ts`, `src/hooks/useCodeSandbox.ts`, `src/hooks/useChatSpeech.ts`, `src/hooks/useShadowToolBridge.ts`, `src/hooks/useCustomApiKeys.ts`, `src/hooks/useDesktopApp.ts`
- `src/components/chat/WhatsAppConnect.tsx`, `src/lib/whatsappQr.ts`
- `cli/src/config.ts`, `cli/src/router.ts`, `cli/src/cloudChat.ts`, `cli/src/ollama.ts`, `cli/package.json`
