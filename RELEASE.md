# ShadowTalk Release Notes

## Shan Foods enterprise rollout (June 2026)

**Lovable handles the backend.** ShadowTalk’s Supabase project (migrations, edge functions, auth) is managed by **Lovable Cloud** — you do **not** need to run `supabase db push` or `supabase functions deploy` locally. Push code to `main` on GitHub and Lovable syncs + deploys.

### What you do in Lovable (one-time)

1. **Sync from GitHub** — ensure Lovable is on `main` (latest enterprise commits)
2. **Rebuild / publish** the app after sync
3. **Lovable Cloud → Environment variables** (frontend):
   - `VITE_ENTERPRISE_MODE=true` — work-email gate, no anonymous sessions
   - `VITE_ENTERPRISE_DOMAINS=shanfoods.com,shan.com,shanfood.com` — optional extra domains
4. **Lovable Cloud → Secrets** (backend — usually auto-set by Lovable):
   - `LOVABLE_API_KEY` — required for chat AI (typically provided automatically)
   - `ENTERPRISE_EMAIL_DOMAINS` — optional; defaults already include Shan domains in code

### Employee onboarding

1. Employees open your Lovable-published URL → `/chatbot`
2. Sign in with `@shanfoods.com` (magic link) — or invite users via Lovable/Supabase Auth if you use invites
3. Auto **enterprise** tier, invite-colleague sharing, onboarding tour + help
4. iPhone: Share → Add to Home Screen for best experience

### Manual Supabase CLI (only if self-hosting outside Lovable)

```bash
supabase db push
supabase functions deploy chat check-subscription self-heal
```

**Smoke test:**

- [ ] `user@shanfoods.com` signs in → enterprise badge / no upgrade nag
- [ ] Send chat message → AI responds
- [ ] Refresh → history persists
- [ ] Works on iPhone Safari
- [ ] **Invite colleague** banner → share link opens auth with work email
- [ ] Good AI reply → **Share with a colleague** banner appears
- [ ] Copy AI reply → includes colleague invite link (no referral code)

---

## Latest (main — June 2026)

| Area | What shipped |
|------|----------------|
| **Enterprise** | Shan Foods `@shanfoods.com` auto enterprise tier + welcome UI |
| **Navigation** | `/` → `/chatbot`; marketing at `/home` |
| **Auth** | Persistent session + anonymous auto sign-in (`persistentAuth.ts`) |
| **Entry UX** | No boot screen on chat paths; chat shell renders during auth |
| **Composer** | Turbo badge removed from UI; send button aligned inside pill |
| **Docs** | [DOCUMENTATION.md](./DOCUMENTATION.md), docs 10–11, updated README & llms.txt |
| **Pricing** | Dedicated `/pricing` page |

**Smoke test (chat):**

- [ ] Open `/` → lands on `/chatbot` without boot or “Warming up…” splash
- [ ] Session persists after refresh
- [ ] Provider chip + send inside composer pill
- [ ] `/home` shows marketing nav only (no coupon bar regression)

See [Detailed Documentation/10-ux-auth-and-navigation.md](./Detailed%20Documentation/10-ux-auth-and-navigation.md).

---

## Foundation release

Unified release merging PRs **#12–#15** plus agentic loop hardening.

## What ships

| Area | Contents |
|------|----------|
| Trust (#12) | `productClaims.ts`, honest limits, real community metrics, no fake JSON-LD ratings |
| Desktop (#13) | Electron app, `/download`, native file picker, `desktopBridge` |
| Brand (#14) | Think AI. Think ShadowTalk., manifesto, SEO |
| Agentic (#15) | Tool dispatch, SSE streaming, default Agentic mode, ⌘K palette |
| Loop | HITL confirm on tools, `consumeChatSSE` in Task Runner, ReAct web-search routing, client metrics |

## Deploy checklist

### 1. Merge & build frontend

```bash
git checkout cursor/release-foundation-7adb
npm ci
npm run build
```

Deploy `dist/` to your host (Vercel, Cloudflare, etc.).

### 2. Supabase edge functions

```bash
supabase functions deploy chat
supabase functions deploy shadow-agent-tools
supabase functions deploy mission-execute
supabase functions deploy web-search
supabase functions deploy notify-app-update
```

Ensure secrets: `LOVABLE_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`.

### 3. Database migrations

```bash
supabase db push
```

Includes update notifications (`20260526150000_update_notification_system.sql`).

### 4. Desktop (optional)

```bash
npm run desktop:make
```

See `DESKTOP.md`.

### 5. Production smoke test (`/chat`)

- [ ] E2EE vault unlock
- [ ] Guest limits enforced
- [ ] `calculate 2+2` → calculator card
- [ ] Web search confirm → **Run** → cited results
- [ ] ⌘K → Agentic runner, Mission Control, browser
- [ ] Deep research (paid tier if gated)
- [ ] Export chat (ShareDialog / desktop save)
- [ ] `/download` page loads

### 6. Metrics (honest “#1” tracking)

Client stores events in `localStorage` key `shadowtalk_agentic_metrics_v1`.

In browser console:

```js
import { getAgenticMetricsSummary } from './src/lib/agenticMetrics';
// Or expose via admin debug panel later
```

Track: tool run rate, mission completion %, stream completes, retention (DAU/MAU in your analytics).

## Branch strategy

- **Merge to `main`:** `cursor/release-foundation-7adb` (single PR recommended)
- Close or rebase overlapping drafts: #5 vs #15 (keep #15 router), old #1/#2 after review

## Post-release priorities

1. Wire metrics to Supabase/PostHog
2. Offline (#8) + BYOK (#10) after online agentic is stable
3. Notifications (#11) when missions complete reliably
