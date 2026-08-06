# ShadowTalk AI — Supabase Backend Setup Guide

## Overview

This guide walks you through setting up the Supabase backend for ShadowTalk AI. The entire
frontend (200+ files) was originally built on Supabase and uses `backend.*` calls that map
directly to Supabase's client API. Replacing the stub with a real Supabase project brings
all dead code back to life.

## What Was Done

| Change | File(s) |
|--------|--------|
| **Stub → Real Client** | `src/integrations/local/client.ts` — Now creates a real Supabase client when configured, falls back to stub in local-only mode |
| **Database Schema** | `supabase/migrations/001_schema.sql` — 95 tables matching the TypeScript type definitions |
| **RLS Policies** | `supabase/migrations/002_rls_policies.sql` — Row-level security for all user-scoped tables |
| **RPC Functions** | `supabase/migrations/003_functions_and_storage.sql` — Helper functions, storage buckets, constraints |
| **Edge Functions** | `supabase/functions/*/index.ts` — 10 server-side functions (chat, search, TTS, payments, etc.) |
| **Environment Config** | `env.example` — Updated with Supabase variables and server-side secret documentation |

---

## Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `ShadowTalk AI`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for Pakistan/Asia)
   - **Plan**: Free to start, upgrade to Pro ($25/mo) when you need more
4. Wait ~2 minutes for provisioning

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** → This is your `VITE_API_BASE_URL`
   - **anon (public) key** → This is your `VITE_API_KEY`

## Step 3: Configure Your `.env`

```bash
cp env.example .env
```

Edit `.env` and fill in:

```env
VITE_API_BASE_URL=https://xxxxx.supabase.co
VITE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

That's it for basic connectivity! The app will now connect to Supabase.

## Step 4: Run Database Migrations

### Option A: Via Supabase Dashboard (Recommended for first-time)

1. Go to **SQL Editor** in your Supabase dashboard
2. Run each migration file in order:
   - First: `supabase/migrations/001_schema.sql`
   - Second: `supabase/migrations/002_rls_policies.sql`
   - Third: `supabase/migrations/003_functions_and_storage.sql`

### Option B: Via Supabase CLI

```bash
# Install the CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

## Step 5: Enable Authentication Providers

1. Go to **Authentication → Providers** in Supabase dashboard
2. Enable **Email/Password** (enabled by default)
3. Enable **Google OAuth**:
   - Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add `https://xxxxx.supabase.co/auth/v1/callback` as authorized redirect URI
   - Paste Client ID and Secret into Supabase
4. Enable **Apple OAuth** (optional):
   - Configure in [Apple Developer](https://developer.apple.com/)

## Step 6: Set Up Edge Function Secrets

Go to **Edge Functions → Secrets** in Supabase dashboard and add:

| Secret | Value | Required | Get From |
|--------|-------|----------|----------|
| `GEMINI_API_KEY` | `AIza...` | **Yes** (for chat) | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GROQ_API_KEY` | `gsk_...` | Alternative | [Groq Console](https://console.groq.com) |
| `OPENAI_API_KEY` | `sk-...` | Alternative | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `ELEVENLABS_API_KEY` | `sk_...` | For TTS | [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) |
| `RESEND_API_KEY` | `re_...` | For emails | [Resend](https://resend.com/api-keys) |
| `FROM_EMAIL` | `noreply@shadowtalk-ai.com` | For emails | Your domain |
| `CONTACT_EMAIL` | `founder@shadowtalk-ai.com` | For contact form | Your email |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | For Stripe | Stripe Dashboard → Webhooks |
| `LEMONSQUEEZY_API_KEY` | `...` | For payments | [LemonSqueezy](https://app.lemonsqueezy.com/settings/api) |
| `SERP_API_KEY` | `...` | For web search | [SerpAPI](https://serpapi.com/manage-api-key) |
| `TAVILY_API_KEY` | `tvly-...` | For web search (alt) | [Tavily](https://app.tavily.com/home) |
| `FIRECRAWL_API_KEY` | `fc-...` | For scraping | [Firecrawl](https://www.firecrawl.dev/app/api-keys) |
| `TWILIO_ACCOUNT_SID` | `AC...` | For WhatsApp | [Twilio](https://console.twilio.com/) |
| `TWILIO_AUTH_TOKEN` | `...` | For WhatsApp | Twilio Console |
| `TWILIO_WHATSAPP_NUMBER` | `+1...` | For WhatsApp | Twilio Console |

## Step 7: Deploy Edge Functions

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Deploy all functions
supabase functions deploy chat
supabase functions deploy web-search
supabase functions deploy elevenlabs-tts
supabase functions deploy stripe-webhook
supabase functions deploy lemonsqueezy-checkout
supabase functions deploy send-contact-email
supabase functions deploy firecrawl-scrape
supabase functions deploy vision-analyze
supabase functions deploy shadow-agent-tools
supabase functions deploy whatsapp-qr
```

## Step 8: Set Up Stripe (Optional)

1. Create a [Stripe account](https://stripe.com/)
2. Create Products with prices matching `src/lib/stripe.ts`:
   - Pro: $5/month
   - Premium: $15/month
   - Elite: $20/month
3. Update price IDs in `src/lib/stripe.ts` and `supabase/functions/stripe-webhook/index.ts`
4. Create a webhook endpoint pointing to:
   `https://xxxxx.supabase.co/functions/v1/stripe-webhook`
5. Add `STRIPE_WEBHOOK_SECRET` to Edge Function secrets

## Step 9: Configure Storage Buckets

The storage buckets are created by `003_functions_and_storage.sql`. Verify in:

**Storage → Buckets** in Supabase dashboard. You should see:
- `avatars` (public)
- `payment-receipts` (private)

## Step 10: Make First User an Admin

After signing up, run this in the Supabase SQL Editor:

```sql
-- Replace with your actual user UUID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_UUID', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Also set plan to elite (optional)
UPDATE public.profiles SET plan = 'elite' WHERE id = 'YOUR_USER_UUID';
```

---

## Testing

```bash
# Start dev server
npm run dev

# Open http://localhost:5173
# Sign up with email → should create profile, streaks, credits, settings automatically
# Chat should connect to Supabase edge function → Gemini/Groq
```

## How It Works (Architecture)

```
Browser (React SPA)
  │
  ├── backend.auth.*     → Supabase Auth (JWT sessions, OAuth)
  ├── backend.from(*)     → Supabase PostgREST (PostgreSQL CRUD)
  ├── backend.channel(*)  → Supabase Realtime (WebSocket presence)
  ├── backend.storage.*   → Supabase Storage (S3-compatible)
  ├── backend.functions.* → Supabase Edge Functions (Deno)
  └── backend.rpc(*)      → PostgreSQL RPC functions

Supabase Edge Functions
  ├── /chat              → Proxies to Gemini/OpenAI/Groq with rate limiting
  ├── /web-search        → SerpAPI / Tavily
  ├── /elevenlabs-tts    → ElevenLabs TTS
  ├── /stripe-webhook    → Stripe payment processing
  ├── /lemonsqueezy-*    → LemonSqueezy checkout
  ├── /firecrawl-scrape  → Website scraping
  ├── /vision-analyze    → Gemini Vision
  ├── /send-contact-*    → Resend email
  ├── /shadow-agent-*    → Agent tool multiplexer
  └── /whatsapp-qr       → Twilio WhatsApp
```

## Graceful Fallback

When `VITE_API_BASE_URL` and `VITE_API_KEY` are **not set**, the client automatically
falls back to the no-op stub mode. This means:
- The app still compiles and runs
- All `backend.*` calls silently return empty data
- Local features (Ollama, WebLLM, WebGPU) continue working
- No error is thrown — just a console warning

---

## Files Created

```
supabase/
├── config.toml                         # Supabase CLI configuration
├── migrations/
│   ├── 001_schema.sql                  # 95 tables (1279 lines)
│   ├── 002_rls_policies.sql            # RLS policies + indexes (661 lines)
│   └── 003_functions_and_storage.sql    # RPCs, storage, constraints (293 lines)
└── functions/
    ├── chat/index.ts                   # AI chat proxy with rate limiting
    ├── web-search/index.ts             # SerpAPI / Tavily search
    ├── elevenlabs-tts/index.ts         # Text-to-speech proxy
    ├── stripe-webhook/index.ts         # Stripe payment webhook
    ├── lemonsqueezy-checkout/index.ts  # LemonSqueezy checkout
    ├── send-contact-email/index.ts      # Resend email proxy
    ├── firecrawl-scrape/index.ts       # Website scraping proxy
    ├── vision-analyze/index.ts         # Gemini Vision proxy
    ├── shadow-agent-tools/index.ts     # Agent tool multiplexer
    └── whatsapp-qr/index.ts            # WhatsApp QR generation

Modified files:
  src/integrations/local/client.ts       # Stub → Real Supabase client
  env.example                              # Updated with Supabase config
  package.json                            # Added @supabase/supabase-js
```

## Next Steps

1. [ ] Create Supabase project and get credentials
2. [ ] Run all 3 migration files
3. [ ] Set at least `GEMINI_API_KEY` or `GROQ_API_KEY` in Edge Function secrets
4. [ ] Deploy edge functions
5. [ ] Enable Google OAuth
6. [ ] Set up Resend for transactional emails
7. [ ] Set up Stripe or LemonSqueezy for payments
8. [ ] Make yourself admin via SQL
9. [ ] Test signup → chat → settings flow
