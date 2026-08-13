# ShadowTalk AI — Complete Project Documentation

**Repository:** https://github.com/zain836/shadowtalk-ai-903ca615.git
**Local Path:** C:\Users\Hacker\AppData\Local\hermes\shadowtalk-ai
**Generated:** August 10, 2026
**Author:** Hermes Agent

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [Project Structure](#4-project-structure)
5. [Setup & Installation](#5-setup--installation)
6. [Configuration & Environment](#6-configuration--environment)
7. [Key Features](#7-key-features)
8. [Authentication & Security](#8-authentication--security)
9. [Inference & AI Routing](#9-inference--ai-routing)
10. [Backend Integrations](#10-backend-integrations)
11. [Desktop & Mobile](#11-desktop--mobile)
12. [Deployment](#12-deployment)
13. [Testing](#13-testing)
14. [Known Issues & Fixes](#14-known-issues--fixes)
15. [Issue Audit](#15-issue-audit)
16. [Fix Documentation](#16-fix-documentation)
17. [Recommendations](#17-recommendations)

---

## 1. Project Overview

**Name:** ShadowTalk AI
**Tagline:** "Think AI. Think ShadowTalk. — The AI workspace that doesn't own you."
**Type:** Agentic AI workspace / SaaS frontend
**License:** Private repo — contact maintainer for licensing
**Primary URL:** https://www.shadowtalk-ai.com/chatbot
**Marketing URL:** https://www.shadowtalk-ai.com/home

ShadowTalk AI is a comprehensive AI workspace that goes beyond traditional chatbots. It combines:
- Real-time AI chat with mission control
- Autonomous agent workflows with human approval gates
- IDE and app builder for multi-file projects
- Marketplace of runnable agents
- Video studio and content generation
- Memory, insights, and analytics dashboards
- Cybersecurity training and OSINT tools
- Privacy-focused BYOK (Bring Your Own Key) architecture
- Offline/local inference capabilities

**Core Value Propositions:**
- Workspace-first design (opens directly to `/chatbot`)
- 30+ integrated tools accessible via natural language
- User-controlled API keys (BYOK) — keys never touch ShadowTalk servers
- Optional on-device inference via Ollama/WebLLM/WebGPU
- Cross-platform: web, PWA, Electron desktop app
- Privacy by design with device-only pledge mode

---

## 2. Technology Stack

### Frontend Core
- **React 18.3.1** — UI framework
- **TypeScript 5.8.3** — type safety
- **Vite 5.4.19** — build tool and dev server
- **React Router DOM 6.30.1** — client-side routing
- **Zustand 5.0.14** — state management
- **TanStack React Query 5.83.0** — server state management and caching

### UI & Styling
- **Tailwind CSS 3.4.17** — utility-first CSS
- **shadcn/ui** — component library (Radix UI primitives)
- **Framer Motion 12.25.0** — animations and transitions
- **Lucide React 0.462.0** — icon library
- **next-themes 0.3.0** — theme switching

### Backend & Data
- **Supabase** — primary backend (auth, database, edge functions)
- **Firebase** — secondary backend (auth, Firestore, RTDB, Storage, Messaging)
- **Supabase Edge Functions** — serverless API endpoints

### AI & Inference
- **Anthropic SDK 0.73.0** — Claude API
- **OpenAI SDK** — GPT models via API
- **WebLLM 0.2.84** — on-device LLM inference
- **@huggingface/transformers 4.2.0** — embedding models
- **WebGPU** — hardware acceleration for local inference
- **Ollama** — local model management (desktop)

### Media & Content
- **Three.js 0.170.0** — 3D graphics
- **@react-three/fiber 8.18.0** — React renderer for Three.js
- **@react-three/drei 9.122.0** — Three.js helpers
- **@ffmpeg/ffmpeg 0.12.15** — video/audio processing
- **pptxgenjs 4.0.1** — PowerPoint generation
- **jspdf 4.2.0** — PDF generation
- **Remotion** — video rendering for viral shorts
- **ElevenLabs React 0.13.0** — text-to-speech

### Desktop & Mobile
- **Electron** — desktop app shell
- **Capacitor 8.0.0** — mobile/native wrapper
- **@capacitor-community/electron 5.0.1** — Electron integration

### Development & Testing
- **Vitest 4.1.9** — unit testing
- **ESLint 9.32.0** — linting
- **Prettier** — code formatting
- **Happy DOM 20.3.0** — test environment

---

## 3. Architecture & Data Flow

### High-Level Architecture
```
┌─────────────────┐
│   User Browser  │
│   /chatbot      │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Vite    │
    │  Dev/    │
    │  Build   │
    └────┬─────┘
         │
    ┌────▼─────────────────────────┐
    │     React App Shell          │
    │  (App.tsx + Providers)       │
    └────┬─────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │   Inference Router           │
    │   (src/lib/inference/)       │
    └────┬─────────────────────────┘
         │
    ┌────┼─────────────────────────┐
    │    │                         │
┌───▼──┐ ┌──▼──┐ ┌────▼─────────┐
│WebLLM│ │BYOK │ │Shared Pool    │
│Local │ │Direct│ │(Edge Function)│
└──────┘ └─────┘ └───────────────┘
```

### Inference Priority
1. **WebLLM** — if user selected a local model and it's loaded → $0, runs in browser
2. **BYOK** — if user has encrypted API key for selected provider → $0 to user, direct to provider
3. **Shared Pool** — fallback to edge function (Groq → Google AI → OpenRouter)

### Authentication Flow
1. User visits `/chatbot`
2. AuthProvider checks for existing session in localStorage
3. If no session, offers anonymous sign-in or email/OAuth
4. Supabase/Firebase creates/restores session
5. Access token stored in localStorage
6. All API calls include `Authorization: Bearer <token>`

### Privacy Pledge System
- **Device-only mode** (default): data stays on device, no cloud AI
- **Auto mode**: cloud AI while local model loads, then switches to local-only
- **Cloud mode**: explicit opt-in to cloud features
- All modes stored in localStorage flags

---

## 4. Project Structure

```
shadowtalk-ai/
├── src/
│   ├── App.tsx                      # Main route shell
│   ├── main.tsx                     # React entry point
│   ├── index.html                   # Vite HTML entry
│   ├── computer-frame.html          # Computer Mode iframe
│   ├── api/                         # API client layer
│   ├── assets/                      # Images, fonts, static files
│   ├── components/
│   │   ├── AuthProvider.tsx         # Auth state management
│   │   ├── SecurityProvider.tsx     # Security/encryption
│   │   ├── chat/                    # Chat interface components
│   │   ├── cyber/                   # Cybersecurity training tools
│   │   ├── ide/                     # IDE components
│   │   ├── marketplace/             # Marketplace agents
│   │   ├── memory/                  # Memory/history features
│   │   ├── videoStudio/             # Video creation tools
│   │   ├── ui/                      # Reusable UI components
│   │   └── ...
│   ├── contexts/                    # React contexts
│   ├── hooks/                       # Custom React hooks
│   ├── integrations/
│   │   ├── firebase/                # Firebase backend integration
│   │   └── local/                   # Local-first client
│   ├── lib/
│   │   ├── api/                     # API utilities
│   │   ├── byok/                    # BYOK encryption and providers
│   │   ├── inference/               # AI routing logic
│   │   ├── ollama/                  # Ollama integration
│   │   ├── privacy/                 # Privacy/device-only modes
│   │   ├── shadowtalkModel/         # On-device personalization
│   │   ├── tools/                   # Tool definitions
│   │   └── ...
│   ├── pages/                       # Route pages
│   │   ├── ChatbotPage.tsx          # Main chat workspace
│   │   ├── IdePage.tsx              # IDE/app builder
│   │   ├── MarketplacePage.tsx      # Agent marketplace
│   │   ├── MissionControlPage.tsx   # Mission control
│   │   ├── PricingPage.tsx          # Pricing plans
│   │   └── ...
│   └── types/                       # TypeScript definitions
├── electron/                        # Electron desktop app
│   ├── src/
│   │   └── ollamaManager.ts         # Ollama process management
│   └── package.json
├── cli/                             # CLI tool
├── remotion/                        # Video rendering
├── scripts/                         # Build/utility scripts
├── backend/                         # (Empty in this clone)
├── Detailed Documentation/          # Engineering docs
├── public/                          # Static assets
├── .github/workflows/               # CI/CD pipelines
├── env.example                      # Environment variables template
├── package.json                     # Dependencies and scripts
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript config
├── firestore.rules                  # Firebase Firestore rules
├── storage.rules                    # Firebase Storage rules
└── README.md                        # Project readme
```

---

## 5. Setup & Installation

### Prerequisites
- **Node.js** 20+ (required)
- **npm** 9+ or **bun** (optional, faster installs)
- **Git**

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/zain836/shadowtalk-ai-903ca615.git
cd shadowtalk-ai-903ca615

# 2. Install dependencies
npm install

# 3. Copy environment file
cp env.example .env.local

# 4. Add your API keys to .env.local
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_PUBLISHABLE_KEY
#    - Optional: Firebase, LemonSqueezy, etc.

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:5173 → redirects to /chatbot
```

### Desktop App
```bash
# Install desktop dependencies
npm run desktop:install

# Build and start desktop app
npm run desktop:start

# Build distributable installer
npm run desktop:make
```

### CLI
```bash
cd cli
npm install
npm run dev
```

---

## 6. Configuration & Environment

### Frontend Environment Variables (`.env.local`)
All `VITE_*` variables are public and exposed in the browser bundle.

**Required:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**Optional:**
```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=

# Payments
VITE_LEMONSQUEEZY_VARIANT_PRO=
VITE_LEMONSQUEEZY_VARIANT_PREMIUM=
VITE_LEMONSQUEEZY_VARIANT_ELITE=

# Features
VITE_ENTERPRISE_MODE=true
VITE_TWILIO_WHATSAPP_NUMBER=+1415xxx8886
VITE_ENABLE_LOCATION_TRACKING=true
VITE_ENABLE_PROACTIVE_AI=true
VITE_ENABLE_BYOK_EDGE=true
VITE_SELF_HEAL_ENABLED=true

# Offline
VITE_LOCAL_FIRST=true  # Force local-only mode
VITE_OFFLINE_MODEL_CDN_URL=https://cdn.yourdomain.com/mlc-models
```

**Server-Side Secrets** (set in Supabase Dashboard → Edge Functions → Secrets):
```env
SUPABASE_SERVICE_ROLE_KEY=  # auto-set by Supabase
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
ELEVENLABS_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=noreply@shadowtalk-ai.com
CONTACT_EMAIL=founder@shadowtalk-ai.com
STRIPE_WEBHOOK_SECRET=
LEMONSQUEEZY_API_KEY=
SERP_API_KEY=
TAVILY_API_KEY=
FIRECRAWL_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

### Vite Configuration
- **Dev server:** Port 8080, dual-stack IPv4+IPv6
- **Build target:** ES2020
- **PWA:** Auto-update enabled, Workbox caching
- **COOP/COEP headers:** Enabled for WebContainer/WebGPU support
- **Path alias:** `@` → `./src`

### Firebase Rules
**Firestore:**
- Public read: blog_posts, shared_answers, shared_missions, announcements
- Write-only public: feedback, newsletter_subscriptions, contact_messages
- Per-user private: all other collections (keyed by `user_id`)
- Admin-only: user_roles, billing, referrals

**Storage:**
- Public read: `public-assets/`, `email-assets/`
- Private: `<bucket>/<uid>/**` — user can only access their own files
- Max upload size: 25MB per file

---

## 7. Key Features

### Chat & AI
- **Multi-modal chat** — text, images, documents
- **Personality modes** — different AI personalities
- **Deep research** — extended reasoning mode
- **Custom instructions** — per-user system prompts
- **Model fine-tuning** — adjustable max tokens, temperature
- **BYOK streaming** — direct-to-provider API calls

### Mission Control
- Autonomous multi-step workflows
- Human approval gates
- Step-by-step execution with skip/retry
- Mission templates

### IDE & App Builder
- Monaco editor integration
- Multi-file project creation
- WebContainer-based code execution
- Template library

### Marketplace
- Runnable agent templates
- Agent discovery and installation
- Custom agent creation

### Video & Content
- Remotion-based video rendering
- Voiceover generation (ElevenLabs/edge-tts)
- Presentation builder (pptxgenjs)
- Document generation (jspdf)

### Memory & Insights
- Chat history with search
- ShadowMemory — on-device topic clustering
- Journey tracking
- Usage analytics

### Cybersecurity
- OSINT dashboard
- Bug bounty tracker
- Security cheat sheets
- Payload library
- Cyber command center

### Offline & Privacy
- WebLLM local inference
- WebGPU acceleration
- Device-only pledge mode
- Encrypted BYOK vault
- Local-first fallback when Supabase unconfigured

---

## 8. Authentication & Security

### Auth Providers
1. **Supabase Auth** — primary
   - Email/password
   - OAuth (Google, GitHub, Apple, Twitter)
   - Anonymous sign-in
   - Magic links

2. **Firebase Auth** — secondary
   - Email/password
   - Google sign-in
   - Phone OTP
   - Custom tokens

### Session Management
- Access token stored in `localStorage` as `shadowtalk-auth-token`
- Token refresh handled by Supabase/Firebase client libraries
- Persistent sessions across browser restarts
- Optional “remember me” for extended sessions

### Security Features
- **DOMPurify** — XSS prevention
- **Encrypted BYOK** — AES-GCM encryption for API keys
- **Secret detection** — client-side SAST scanner
- **CSP headers** — via Vite/Netlify/NGINX config
- **COOP/COEP** — cross-origin isolation for WebContainers

### Known Security Gaps
- See `shadowtalk-project-issues.md` for full audit
- Critical: unsafe code execution surfaces
- High: privacy claim vs actual cloud behavior mismatch
- Medium: Firebase public write endpoints lack rate limiting

---

## 9. Inference & AI Routing

### Router Logic (`src/lib/inference/router.ts`)
```
detectMode(request):
  1. If model is in WEBLLM_MODELS and supported → WebLLM
  2. If byokProvider has decrypted key → BYOK
  3. If model name matches known provider (groq/google/openai/anthropic) → BYOK
  4. Otherwise → Shared Pool (Groq → Google AI → OpenRouter)
```

### WebLLM Path
- Loads models via `@mlc-ai/web-llm`
- Uses WebGPU when available, falls back to WASM
- Models cached in browser storage
- Progress callbacks for UI feedback

### BYOK Path
- Keys encrypted with AES-GCM
- Stored in localStorage
- Decrypted at runtime
- Direct browser-to-provider streaming
- Supports OpenAI-compatible and Anthropic formats

### Shared Pool Path
- Routes through Supabase Edge Function `/functions/v1/chat`
- Provider fallback: Groq → Google AI → OpenRouter
- Requires Supabase auth token
- Supports deep research and personalities

### Model Support
- **OpenAI:** GPT-4o, GPT-4o-mini, GPT-5, GPT-5-mini, GPT-5.2
- **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus
- **Google:** Gemini 2.5 Pro, Gemini Flash
- **Groq:** Llama, Mixtral, Gemma (fast inference)
- **OpenRouter:** 100+ models via unified API
- **DeepSeek:** DeepSeek Chat, DeepSeek Coder
- **Local:** WebLLM models (Llama, Gemma, Phi, etc.)

---

## 10. Backend Integrations

### Supabase (Primary)
- **Auth:** Email, OAuth, anonymous, magic links
- **Database:** PostgreSQL via Supabase
- **Edge Functions:** `/chat`, API routes
- **Storage:** User files, assets
- **Realtime:** Optional live updates

### Firebase (Secondary)
- **Auth:** Email, Google, phone OTP
- **Firestore:** Document database
- **Realtime DB:** Presence, typing indicators
- **Storage:** File uploads
- **Messaging:** Push notifications

### Local Backend
- **Ollama:** Local LLM management (desktop)
- **WebLLM:** Browser-based inference
- **IndexedDB:** Persistent local storage

---

## 11. Desktop & Mobile

### Electron Desktop
- Built with Capacitor Community Electron
- Bundles Ollama for offline AI
- Native menus and notifications
- Auto-updater support
- Windows installer (.exe), macOS (.dmg), Linux (.AppImage)

### PWA
- Service worker via VitePWA
- Offline caching
- Install prompt
- Push notifications (Firebase)

### Mobile (Capacitor)
- iOS and Android support
- Native file access
- Camera integration
- Push notifications

---

## 12. Deployment

### Web (Netlify)
```bash
npm run build
# Deploy dist/ folder to Netlify
```
- **Build output:** `dist/`
- **Redirects:** All routes → `/index.html` (SPA fallback)
- **Headers:** COOP/COEP for WebGPU/WebContainer

### Desktop
```bash
npm run desktop:make
# Outputs to electron/dist/
```

### Self-Hosted (NGINX)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "credentialless" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 13. Testing

### Test Framework
- **Vitest** — unit and integration tests
- **Happy DOM** — DOM environment for tests

### Running Tests
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
```

### Test Coverage
- ShadowTalk model training/embedding
- WebGPU runtime detection
- Wiring verification
- Site link audit
- Unified document pipeline

### Gaps
- No tests for auth flows
- No tests for inference router
- No tests for BYOK encryption
- No Firestore rule tests
- No E2E tests

---

## 14. Known Issues

### Critical
1. **Unsafe code execution** — multiple `eval()`/`new Function()` in user-facing surfaces
2. **XSS-prone rendering** — `dangerouslySetInnerHTML` and `innerHTML` without consistent sanitization

### High
3. **Privacy mismatch** — claims "privacy by design" but defaults to cloud inference
4. **Weak BYOK storage** — localStorage encryption is insufficient for high-security needs

### Medium
5. **Firebase public writes** — no rate limiting or CAPTCHA
6. **Monolithic app shell** — slow hydration, hard to debug
7. **Multiple backends** — Supabase + Firebase + local, no unified abstraction
8. **Windows desktop scripts** — fragile HOME/path handling
9. **CI gaps** — no secret scanning, audit continues-on-error

### Low-Medium
10. **Thin test coverage** — high-risk surfaces untested
11. **Repo artifacts** — merge scripts, temp files, academic submissions
12. **Partial Windows support** — inconsistent shell/path handling

**Full details:** See `shadowtalk-project-issues.md`

---

## 15. Issue Audit

### 1. CRITICAL — Security / Injection Risks

#### 1.1 Unsafe `eval()` / `new Function()` usage
**Locations:**
- `src/components/chat/CodeCanvas.tsx:47`
- `src/components/chat/CodePlayground.tsx:83`
- `src/components/chat/CodeWorkspace.tsx:107`
- `src/components/chat/LiveCodeArtifact.tsx:162`
- `src/components/chat/PersonalIDE.tsx:338`
- `src/components/chat/ShadowCowork.tsx:749`
- `src/hooks/useCodeSandbox.ts:234`
- `src/hooks/useOfflineCodeExecution.ts:96`
- `src/hooks/useOfflineMath.ts:104`

**Issue:** Arbitrary code execution in browser context. Even user-generated content can be malicious when shared or imported.

**Impact:** Token exfiltration, localStorage theft, session hijacking.

#### 1.2 XSS-prone rendering
**Locations:**
- `src/components/chat/Artifacts.tsx:83` — `dangerouslySetInnerHTML`
- `src/components/chat/LiveCodeArtifact.tsx:126` — `innerHTML +=`
- `src/components/chat/DocumentArtifact.tsx:134` — `innerHTML`

**Issue:** DOMPurify is available but not consistently applied.

#### 1.3 Placeholder secrets
**Locations:**
- `src/components/chat/PersonalIDE.tsx:143` — `JWT_SECRET=your-secret-key-here`
- `src/components/chat/APIMarketplace.tsx:76,92` — `Bearer YOUR_API_KEY`

**Issue:** Normalizes insecure defaults.

### 2. HIGH — Privacy / Data Handling

#### 2.1 Privacy claim mismatch
**Locations:**
- `src/lib/privacy/deviceOnlyPledge.ts`
- `src/lib/inference/router.ts`
- README + marketing

**Issue:** Defaults to cloud inference; anonymous auth creates server state.

#### 2.2 Weak BYOK storage
**Locations:**
- `src/lib/byok/crypto.ts`
- `src/lib/byok/client.ts`

**Issue:** localStorage encryption only protects against casual inspection.

#### 2.3 Firebase config risks
**Locations:**
- `src/integrations/firebase/*`
- `firestore.rules`

**Issue:** Public write endpoints lack rate limiting.

#### 2.4 Sensitive file ingestion
**Location:** `src/components/chat/KnowledgeVault.tsx:138`

**Issue:** Accepts `.env`, `.pem`, `.key` files.

### 3. MEDIUM-HIGH — Auth / Access Control

#### 3.1 Anonymous sign-in by default
**Locations:**
- `src/components/AuthProvider.tsx`
- `README.md`

**Issue:** Creates throwaway identities; complicates abuse control.

#### 3.2 Token handling gaps
**Locations:**
- `src/components/AuthProvider.tsx`
- `src/lib/inference/router.ts`

**Issue:** No explicit 401 refresh handling for streaming calls.

### 4. MEDIUM — Architecture / Reliability

#### 4.1 Monolithic app shell
**Location:** `src/App.tsx`

**Issue:** Many lazy routes, providers, engines in one shell.

#### 4.2 Multiple backends
**Locations:**
- `src/integrations/firebase/*`
- `src/lib/api/*`
- `src/lib/byok/*`

**Issue:** No unified abstraction.

#### 4.3 Desktop script fragility
**Locations:**
- `scripts/stage-ollama-bundle.mjs`
- `electron/src/ollamaManager.ts`

**Issue:** Uses `process.env.HOME` directly; fails on Windows.

#### 4.4 CI gaps
**Locations:**
- `.github/workflows/ci.yml`
- `.github/MERGE_PR_16.sh`

**Issue:** No secret scanning; `continue-on-error: true` on audit.

### 5. MEDIUM — Compliance / Legal / Ethical

#### 5.1 Cybersecurity surfaces
**Locations:**
- `src/components/cyber/*`
- `src/components/chat/UncensoredArena.tsx`

**Issue:** Payload libraries and WAF bypass references without strong guardrails.

#### 5.2 Marketing claims
**Locations:**
- `README.md`
- `src/components/chat/*BeaterIndicator.tsx`

**Issue:** Unsubstantiated "beats Claude/GPT/Gemini" claims.

#### 5.3 Data residency opacity
**Locations:**
- `env.example`
- Privacy pages

**Issue:** No documented data-residency controls.

### 6. LOW-MEDIUM — Developer Experience

#### 6.1 Thin test coverage
**Locations:**
- `src/lib/*.test.ts`

**Issue:** No tests for auth, router, BYOK, or Firebase rules.

#### 6.2 Repo artifacts
**Locations:**
- `.github/MERGE_PR_16.sh`
- `tmp/`, `-tmp-*.png`
- `NED-UNI-NIC-Submission/`

**Issue:** Operational debris and temp files in repo.

#### 6.3 Windows support
**Locations:**
- `scripts/stage-ollama-bundle.mjs`
- Desktop CI

**Issue:** No Windows CI job; path handling inconsistent.

---

## 16. Fix Documentation

### Critical Fixes (Week 1)

#### Fix 1.1: Sandbox Code Execution
**Approach:**
1. Add `@webcontainer/api` for full Node.js sandboxing
2. Add `expr-eval` for math expressions
3. Create `src/lib/sandbox/restricted-runner.ts`
4. Update all 9 affected files

**Example:**
```ts
// src/lib/sandbox/restricted-runner.ts
import { Parser } from 'expr-eval';

export function safeMath(expr: string): number {
  return new Parser().parse(expr).evaluate({});
}
```

#### Fix 1.2: Consistent HTML Sanitization
```tsx
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['svg', 'path', 'pre', 'code', 'div', 'span'],
});
```

#### Fix 1.3: Remove Placeholder Secrets
```yaml
# Add to .github/workflows/ci.yml
- name: Reject placeholder secrets
  run: |
    if git grep -nE "your-secret-key-here|YOUR_API_KEY|sk-xxx" -- '*.ts' '*.tsx'; then
      exit 1
    fi
```

### High Fixes (Week 2)

#### Fix 2.1: Privacy Consent UI
```tsx
const [mode, setMode] = useState<'local-only' | 'auto' | 'cloud'>('local-only');
// Show on first launch, persist choice
```

#### Fix 2.2: BYOK Re-Auth Gate
```ts
// Require password/biometric before decrypting keys
if (!hasRecentAuth()) {
  await promptForAuth();
}
```

#### Fix 2.3: Firebase App Check
```js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('public-key'),
});
```

#### Fix 2.4: Block Sensitive Files
```ts
const BLOCKED = new Set(['.env', '.pem', '.key', '.p12']);
if (BLOCKED.has(ext)) toast.error('File type blocked');
```

### Medium Fixes (Weeks 3-4)

#### Fix 3.1: Guest Mode UX
- Rename "anonymous auth" → "guest mode"
- Show data-retention notice
- Add deletion flow

#### Fix 3.2: Auth Session Manager
```ts
// src/lib/auth/session.ts
export async function withAuthRefresh<T>(fn: () => Promise<T>) {
  try { return await fn(); }
  catch (e) {
    if (isUnauthorized(e)) { await refresh(); return await fn(); }
    throw e;
  }
}
```

#### Fix 4.1: App Shell Split
- `PublicShell` for marketing/docs
- `WorkspaceShell` for `/chatbot`, `/ide`, `/mission/*`

#### Fix 4.2: Backend Interface
```ts
export interface Backend {
  auth: AuthBackend;
  messages: MessageBackend;
  files: FileBackend;
}
```

#### Fix 4.3: Windows Path Fix
```ts
import { homedir, join } from 'node:os/path';
const home = homedir(); // works on Windows/macOS/Linux
```

#### Fix 4.4: CI Hardening
- Remove `.github/MERGE_PR_16.sh`
- Add trufflehog secret scanning
- Fail `npm audit` on high/critical
- Add Windows CI job

### Low-Medium Fixes (Week 5)

#### Fix 5.1: Cyber Module Consent
- Age gate (18+)
- Explicit opt-in dialog
- Move payloads behind consent

#### Fix 5.2: Marketing Claims
- Replace "beats X" with "alternative to X"
- Add benchmarks page

#### Fix 5.3: Data Residency Docs
- Document Supabase/Firebase regions
- Add GDPR/CCPA rights pages

#### Fix 6.1: Add Tests
- `src/lib/auth/session.test.ts`
- `src/lib/inference/router.test.ts`
- `src/lib/byok/crypto.test.ts`

#### Fix 6.2: Clean Repo
```bash
git rm .github/MERGE_PR_16.sh
git mv NED-UNI-NIC-Submission docs/submissions/
rm -rf tmp/ -tmp-*.png
```

#### Fix 6.3: Windows CI
Add `.github/workflows/windows.yml` mirroring Linux CI.

---

## 17. Recommendations

1. **Immediate (Week 1):** Fix critical security issues — sandbox code execution, sanitize HTML, remove placeholder secrets
2. **Short-term (Weeks 2-3):** Harden privacy/UX, unify backend, split app shells
3. **Medium-term (Week 4):** Harden CI, add compliance docs, soften marketing
4. **Ongoing:** Add tests for high-risk surfaces, monitor third-party dependencies, maintain Windows parity

### Priority Matrix
| Issue | Priority | Effort | Impact |
|-------|----------|--------|--------|
| Code execution sandbox | P0 | High | Critical |
| HTML sanitization | P0 | Low | Critical |
| Privacy consent UI | P1 | Medium | High |
| BYOK re-auth | P1 | Medium | High |
| Firebase abuse protection | P1 | Medium | High |
| App shell split | P2 | High | Medium |
| CI secret scanning | P2 | Low | Medium |
| Cyber module consent | P2 | Low | Medium |
| Test coverage | P3 | High | Low-Medium |
| Repo cleanup | P3 | Low | Low |

---

*Document generated by Hermes Agent on 2026-08-10. For updates, re-run audit after changes.*
