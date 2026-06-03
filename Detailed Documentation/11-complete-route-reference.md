# Complete route reference

All routes are declared in **`src/App.tsx`**. Unless noted, pages are lazy-loaded inside `<Suspense>` with a lightweight spinner fallback.

**Default:** `/` → redirect to **`/chatbot`**.

---

## Core workspace

| Path | Page | Description |
|------|------|-------------|
| `/` | — | Redirect to `/chatbot` |
| `/chatbot` | `ChatbotPage` | **Primary product** — chat, tools, missions, voice, images, marketplace agents (`?agent=`) |
| `/home` | `Index` | Marketing landing |
| `/auth` | `AuthPage` | Email/OAuth sign-in; skipped when already signed in (non-anonymous) |
| `/settings` | `SettingsPage` | App preferences, offline AI, chat defaults |
| `/profile` | `ProfilePage` | Profile, BYOK, privacy, offline models |

---

## AI & creation

| Path | Page | Description |
|------|------|-------------|
| `/missioncontrol` | `MissionControlPage` | Autonomous multi-step missions (S.E.E.) |
| `/research` | `DeepResearchPage` | Deep research hub (also via chat tools) |
| `/strategy` | `StrategyAgentPage` | Business / market intelligence |
| `/strategy-lab` | `StrategyLabPage` | Strategy experiments |
| `/presentations` | `PresentationBuilderPage` | AI slide decks |
| `/studio` | `CreativeStudioPage` | Creative / media synthesis |
| `/ide` | `IdePage` | Personal IDE — Monaco, multi-file, preview |
| `/workspace` | `WorkspacePage` | Team / business workspace |
| `/knowledge` | `KnowledgeGraphPage` | Entity graph |
| `/business-memory` | `BusinessMemoryPage` | Business memory store |
| `/shadow-memory` | `ShadowMemoryPage` | Shadow Memory context |
| `/personal-llm` | `PersonalLLMPage` | On-device LLM settings |

---

## Marketplace & developers

| Path | Page | Description |
|------|------|-------------|
| `/marketplace` | `MarketplacePage` | Agent catalog + install |
| `/developers` | `DevelopersPage` | Integrations, SDK |
| `/api` | `APIPage` | API keys management |

---

## Privacy, security, sovereignty

| Path | Page | Description |
|------|------|-------------|
| `/vault` | `StealthVaultPage` | Encrypted vault |
| `/sovereign-data` | `SovereignDataPage` | Data sovereignty controls |
| `/wallet` | `SovereignWalletPage` | Credits / billing wallet |
| `/privacy-score` | `PrivacyScorePage` | Privacy posture score |
| `/transparency` | `TransparencyPage` | Data handling transparency |
| `/trust` | `TrustPage` | Trust & compliance narrative |
| `/security-audit` | `SecurityAuditPage` | Code/URL security auditor |
| `/compliance` | `ComplianceDashboardPage` | Compliance dashboard |
| `/cyber` | `CyberCommandPage` | Cyber operations center |
| `/offline-license` | `EnterpriseLicensePage` | Enterprise offline license |

---

## Intelligence & industry

| Path | Page | Description |
|------|------|-------------|
| `/command-center` | `CommandCenterPage` | Industry command center |
| `/competitive` | `CompetitivePage` | Competitive intelligence |
| `/data-insights` | `DataInsightsPage` | Analytics insights |
| `/agents` | `AgentArchitecturePage` | Agent architecture explorer |

---

## Collaboration & growth

| Path | Page | Description |
|------|------|-------------|
| `/rooms` | `ChatRoomsPage` | Collaborative rooms list |
| `/rooms/:roomId` | `CollaborativeRoom` | Live collaborative room |
| `/referral` | `ReferralPage` | Referral program |

---

## Monetization

| Path | Page | Description |
|------|------|-------------|
| `/pricing` | `PricingPage` | Plans (Free, Pro, Premium, Elite) |
| `/billing` | `MonetizationPage` | Subscription management |
| `/lifetime-deal` | redirect → `/pricing` | Legacy URL (lifetime offer removed) |
| `/founder-access` | `FounderAccessPage` | Founder access |
| `/enterprise` | `EnterpriseSettingsPage` | Enterprise admin |
| `/ghost-ads` | `GhostAdsPage` | Privacy-preserving ads experiment |

---

## Admin & ops

| Path | Page | Description |
|------|------|-------------|
| `/admin` | `AdminPage` | Admin console (`admin` role) |
| `/analytics` | `AnalyticsPage` | Usage analytics |

---

## Marketing, support, legal

| Path | Page | Description |
|------|------|-------------|
| `/about` | `AboutPage` | About |
| `/blog` | `BlogPage` | Blog |
| `/changelog` | `ChangelogPage` | Release notes |
| `/docs` | `DocsPage` | User documentation (in-app) |
| `/help` | `HelpCenterPage` | Help center |
| `/faq` | `FAQPage` | FAQ |
| `/contact` | `ContactPage` | Contact |
| `/status` | `StatusPage` | Status |
| `/careers` | `CareersPage` | Careers |
| `/press` | `PressPage` | Press kit |
| `/privacy` | `PrivacyPolicyPage` | Privacy policy |
| `/terms` | `TermsOfServicePage` | Terms |
| `/cookies` | `CookiePolicyPage` | Cookies |
| `/gdpr` | `GDPRPage` | GDPR |

---

## Not found

| Path | Page |
|------|------|
| `*` | `NotFound` |

---

## Global chrome (not routes)

Loaded from `App.tsx` after idle/defer:

- Command palette (⌘K)
- Onboarding flow
- PWA banner, cookie consent
- Customer support widget
- Shadow Memory tracker, journey tracker
- Voice command system
- Auto-improve engine (lazy)

---

## Query parameters (chat)

| Param | Example | Effect |
|-------|---------|--------|
| `agent` | `/chatbot?agent=uuid` | Activate marketplace agent |
| `conversation` | `/chatbot?conversation=id` | Load conversation |
| `q` | `/chatbot?q=hello` | Pre-fill input |

---

See also: [10-ux-auth-and-navigation.md](./10-ux-auth-and-navigation.md), [08-architecture-reference.md](./08-architecture-reference.md).
