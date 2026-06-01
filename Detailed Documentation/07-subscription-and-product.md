# Subscription, product, and platform work

This document captures **related product engineering** on `main` and feature branches that supports the chat/IDE/marketplace experience—not all of it is in PRs #48–#52, but it is part of “what we have done” in the same initiative window.

## Monetization & conversion (PR #47 and related)

**Branch:** `cursor/subscription-psychology-7adb`

- **`src/lib/conversionPsychology.ts`** — Ethical nudges toward Premium as the primary plan.
- **`ChatUpgradeNudge`**, **`UpgradePrompt`** — In-chat limits and upgrade CTAs.
- **`useSubscriptionNudge`** — Daily message count + conversation count triggers.
- **`getDailyMessageCount` / `incrementDailyMessageCount`** — Free tier caps.

**User-visible behavior:** Free users hit daily limits; Premium ($15/mo positioning) unlocks unlimited messages and Mission Control messaging.

## Bring your own key (BYOK)

**Branches:** `cursor/byok-api-key-prompt-7adb`, `cursor/custom-api-keys-profile-7adb`

- **`src/lib/customApiKeys.ts`** — Store/merge custom provider keys.
- **`src/lib/chatProviderBridge.ts`** — Map UI provider → request payload.
- **`ByokProviderKeyDialog`** — Prompt when selecting a provider without a key.
- **Migration:** `20260527150000_user_provider_keys.sql` — Server-stored keys.

Chat and App Builder honor BYOK via `buildChatProviderPayload(aiProvider, aiConfig, keys)`.

## Landing & brand

| Work | Files / notes |
|------|----------------|
| **Workspace-first routing** | `/` → `/chatbot`; marketing at `/home` |
| **LandingNavigation** | `src/components/landing/LandingNavigation.tsx` — Pricing, Install, Notifications, Feedback, Login |
| Landing animations | `src/lib/landingMotion.ts`, interactive cards, section reveals |
| **Pricing page** | `/pricing` — `PricingPage.tsx`, `src/components/pricing/*` |
| Live metrics (not mock) | `platformMetricsShared.ts`, Supabase-backed counts |
| Stealth mode | Countdown, network guard, kill switch storage |
| Coupon banner | Removed from home (layout/runtime fix) |

## Auth & entry (main)

| Work | Files |
|------|--------|
| Persistent session | `persistentAuth.ts`, `AuthProvider.tsx` |
| Skip auth redirect when signed in | `PersistedAuthRedirect.tsx` |
| No chat boot / loading splash | `skipBootScreen.ts`, `ChatbotPage.tsx` |

See [10-ux-auth-and-navigation.md](./10-ux-auth-and-navigation.md).

## Chat quality of life

| Feature | Module |
|---------|--------|
| Archive conversations | `src/lib/chatArchive.ts`, migration `conversations_archived_at` |
| Delete own messages | `20260529220000_messages_delete_own.sql` |
| Command routes | `src/lib/chatCommandRoutes.ts` |

## Security & admin

- **`20260527123600_security_hardening.sql`**
- **`stealthNetworkGuard.ts`**, **`stealthKillSwitchStorage.ts`**
- Admin role grant migration for operations

## Auto-improve / behavior (parallel branches)

Under `src/lib/autoImprove/` — event bus, consent, behavior analysis, daily insights. Branches like `cursor/auto-improve-behavior-7adb` extend long-term personalization (separate from marketplace/App Builder).

## Shadow tools ecosystem

**`src/lib/shadowTools/executeShadowTool.ts`** — Central executor for:

- Web search, deep research, presentations, security scan, scrape, agent tools, etc.

Tools are detected in `useToolOrchestrator.ts` and surfaced in chat via bridge/dispatch patterns.

## Product knowledge in chat

**`src/lib/shadowTalkProductKnowledge.ts`** — Injected when users ask “what is ShadowTalk?” so answers match real features (plans, tools, IDE, marketplace).

## Related docs

- [00-project-overview.md](./00-project-overview.md)  
- [08-architecture-reference.md](./08-architecture-reference.md)
