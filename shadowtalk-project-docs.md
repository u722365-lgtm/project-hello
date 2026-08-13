# ShadowTalk AI — Full Project Documentation

**Repo:** https://github.com/zain836/shadowtalk-ai-903ca615.git
**Local clone:** C:\Users\Hacker\AppData\Local\hermes\shadowtalk-ai
**Documentation generated:** 2026-08-10

This file is a consolidated project overview. For detailed audits and fix plans, see the other docs in this folder.

---

## Documentation Index
- `shadowtalk-project-docs.md` — this file; high-level project overview
- `shadowtalk-project-issues.md` — full issues audit
- `shadowtalk-fix-documentation.md` — prioritized fix plan with code examples

---

## What It Is
ShadowTalk AI is an agentic AI workspace. Instead of a simple chat, it tries to combine:
- chat
- mission control / autonomous tasks
- IDE/app builder
- marketplace of agents
- video studio
- memory and insights
- cybersecurity training surfaces

Users can use cloud providers or bring their own keys (BYOK). There is also a local-first path with Ollama / WebLLM / WebGPU.

## Main Entry Points
- `/chatbot` — main workspace
- `/home` — marketing landing
- `/pricing` — plans
- `/ide` — IDE/app builder
- `/mission/:id` — shared missions

## Stack
- React 18 + TypeScript
- Vite 5 + PWA
- Tailwind + shadcn/ui
- Supabase primary backend
- Firebase secondary backend
- Electron desktop via Capacitor
- Remotion for video
- Zustand, React Query, Framer Motion

## How It Runs
1. `npm install`
2. `npm run dev`
3. Open http://localhost:5173 or configured port

## Key Configuration
- `.env` / `.env.local` for frontend public keys
- `config.yaml` not present; settings are mainly in-app
- `env.example` lists Supabase, Firebase, LemonSqueezy, Twilio, server secrets

## Notable Features
- Anonymous auth / persistent session restore
- BYOK with encrypted local key vault
- WebLLM + WebGPU local inference
- WhatsApp contacts page
- Admin, docs, SEO assets, changelog, blog, FAQ, contact
- Desktop installer build scripts

## Repo Paths
- `src/App.tsx` — route shell
- `src/pages/ChatbotPage.tsx` — main chat
- `src/lib/inference/router.ts` — inference routing
- `src/lib/byok/*` — bring-your-own-key client
- `src/integrations/firebase/*` — Firebase secondary backend
- `gateway/` — not present; this repo is primarily the frontend/desktop app
