# ShadowTalk AI — Documentation Hub

**Last updated:** June 2026 · **Production app:** [shadowtalk-ai.com](https://www.shadowtalk-ai.com)

This file is the **master index** for all ShadowTalk documentation. Start here if you are onboarding, writing release notes, or updating the product.

---

## Who should read what

| Audience | Start here |
|----------|------------|
| **New users** | [README.md](./README.md) → open `/chatbot` |
| **Developers** | [Detailed Documentation](./Detailed%20Documentation/README.md) → [08-architecture-reference](./Detailed%20Documentation/08-architecture-reference.md) |
| **Operators / deploy** | [RELEASE.md](./RELEASE.md), [DESKTOP.md](./DESKTOP.md), [OFFLINE.md](./OFFLINE.md) |
| **In-app help** | [/docs](https://www.shadowtalk-ai.com/docs) (`DocsPage.tsx`) |
| **LLM crawlers** | [public/llms.txt](./public/llms.txt) |

---

## Product snapshot (current)

| Topic | Current behavior |
|-------|------------------|
| **Default URL** | `/` redirects to **`/chatbot`** (workspace opens immediately) |
| **Marketing site** | **`/home`** — landing, features, pricing embed, neural dock header |
| **Auth** | Persistent session (Gemini-style): restore on load; anonymous sign-in unless user explicitly signed out |
| **Boot UX** | No global boot screen on `/` or `/chatbot`; chat shell renders while auth restores |
| **Chat composer** | Pill input with provider chip, voice, send — **no Turbo badge** in UI (routing still automatic) |
| **BYOK** | Gemini, , Kimi via Settings / provider selector |
| **Offline** | SmolLM + optional Gemma; hybrid router picks local vs cloud — see [OFFLINE.md](./OFFLINE.md) |
| **Desktop** | Electron + Capacitor — see [DESKTOP.md](./DESKTOP.md) |

---

## Documentation map

### Root guides

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Product overview, quick start, stack, deploy pointers |
| [RELEASE.md](./RELEASE.md) | Foundation release checklist (edge functions, migrations, smoke tests) |
| [DESKTOP.md](./DESKTOP.md) | Native desktop builds, tray, offline bundle |
| [OFFLINE.md](./OFFLINE.md) | Tier A/B/C offline models and routing |
| [monetization.md](./monetization.md) | Revenue tiers and strategy notes |
| [features.md](./features.md) | Feature wishlist / roadmap ideas |

### Engineering series (`Detailed Documentation/`)

| # | Document |
|---|----------|
| 00 | [Project overview](./Detailed%20Documentation/00-project-overview.md) |
| 01 | [Startup performance](./Detailed%20Documentation/01-startup-performance.md) |
| 02 | [WebGPU acceleration](./Detailed%20Documentation/02-webgpu-acceleration.md) |
| 03 | [Hardware turbo routing](./Detailed%20Documentation/03-hardware-turbo-routing.md) |
| 04 | [Marketplace](./Detailed%20Documentation/04-marketplace-functional.md) |
| 05 | [App Builder](./Detailed%20Documentation/05-app-builder.md) |
| 06 | [Personal IDE & chat](./Detailed%20Documentation/06-personal-ide-and-chat.md) |
| 07 | [Subscription & product](./Detailed%20Documentation/07-subscription-and-product.md) |
| 08 | [Architecture reference](./Detailed%20Documentation/08-architecture-reference.md) |
| 09 | [Pull requests index](./Detailed%20Documentation/09-pull-requests-index.md) |
| 10 | [UX, auth & navigation](./Detailed%20Documentation/10-ux-auth-and-navigation.md) **(new)** |
| 11 | [Complete route reference](./Detailed%20Documentation/11-complete-route-reference.md) **(new)** |

### Submission / historical (not primary ops docs)

- `NED-UNI-NIC-Submission/` — competition pitch package (Feb 2026)
- `My-Presentations/` — audits and PWA planning archives
- `.lovable/` — internal agent plans

---

## Key code locations

| Area | Path |
|------|------|
| Routes | `src/App.tsx` |
| Chat workspace | `src/pages/ChatbotPage.tsx` |
| Auth | `src/components/AuthProvider.tsx`, `src/lib/persistentAuth.ts` |
| Skip boot on chat | `src/lib/skipBootScreen.ts` |
| Chat input UI | `src/components/chat/ChatInput.tsx` |
| Landing (marketing) | `src/pages/Index.tsx`, `src/components/landing/` |
| Pricing page | `src/pages/PricingPage.tsx`, `src/components/pricing/` |
| Edge functions | `supabase/functions/` |
| Migrations | `supabase/migrations/` |

---

## Keeping docs current

When you ship a user-visible change:

1. Update **08-architecture-reference** if routes or modules move.
2. Update **10-ux-auth-and-navigation** for entry UX, auth, or composer changes.
3. Update **README.md** and **public/llms.txt** for positioning or URLs.
4. Update **DocsPage** (`src/pages/DocsPage.tsx`) for end-user guides.
5. Add a row to **09-pull-requests-index** when merging agent branches.

---

*ShadowTalk AI · Think AI. Think ShadowTalk.*
