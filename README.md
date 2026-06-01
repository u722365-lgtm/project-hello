# ShadowTalk AI

**Think AI. Think ShadowTalk.**

**The AI workspace that doesn't own you.**

ShadowTalk is the **agentic AI workspace** for people who are tired of chatbots that only talk. Plan missions, run 30+ tools from one sentence, approve agent steps when it matters, and ship real work — on **web, PWA, or desktop** — while **you** stay in control of your keys, data, and pace.

> *ChatGPT answers. ShadowTalk executes.*

**[Launch workspace →](https://www.shadowtalk-ai.com/chatbot)** · **[Marketing site](https://www.shadowtalk-ai.com/home)** · [Repository](https://github.com/zain836/shadowtalk-ai-903ca615)

**Full documentation index:** [DOCUMENTATION.md](./DOCUMENTATION.md)

---

## Why people switch

| Others | ShadowTalk |
|--------|------------|
| Single-thread chat | **Mission Control** — multi-step autonomous runs |
| Manual tool hopping | **30+ tools** from natural language |
| Cloud-only | **Vault, BYOK, optional on-device Gemma** |
| Browser tab | **Desktop app** with native files & notifications |
| Platform credits only | **Your API keys** — Gemini, OpenRouter, Kimi |

| You get | What that means |
|--------|------------------|
| **Workspace-first** | Opening the site goes straight to **`/chatbot`** — no boot splash |
| **Persistent session** | Return visits stay signed in (anonymous or linked account) |
| **One workspace** | Chat, research, code, images, presentations, missions |
| **Privacy by design** | BYOK, optional local inference, stealth tooling |

---

## URLs (current)

| URL | Purpose |
|-----|---------|
| `/` | Redirects to `/chatbot` |
| `/chatbot` | **Main AI workspace** |
| `/home` | Marketing landing |
| `/pricing` | Plans & billing |
| `/docs` | User documentation |
| `/ide` | Personal IDE + App Builder output |

See [Detailed Documentation/11-complete-route-reference.md](./Detailed%20Documentation/11-complete-route-reference.md) for every route.

---

## What ShadowTalk is

- **Neural chat** — personalities, modes, tool orchestration, marketplace agents.
- **Mission Control** — autonomous workflows with human approval gates.
- **IDE & App Builder** — multi-file projects from chat (`/ide`).
- **BYOK** — route chat through your providers when configured.
- **Offline paths** — SmolLM / Gemma + hardware-aware local vs cloud routing.

**Stack:** React · Vite · TypeScript · Supabase · Tailwind · shadcn/ui · PWA · Electron (desktop).

---

## Start in 60 seconds

```bash
git clone https://github.com/zain836/shadowtalk-ai-903ca615.git
cd shadowtalk-ai-903ca615
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you land on **`/chatbot`**. Marketing page: [http://localhost:5173/home](http://localhost:5173/home).

### Environment

`.env` / `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Enable **Anonymous sign-ins** in Supabase Auth for Gemini-style auto session on first visit.

### Desktop

```bash
npm run build
npm run desktop:make
```

See [DESKTOP.md](./DESKTOP.md). Offline models: [OFFLINE.md](./OFFLINE.md).

---

## For developers

```bash
npm run build
npm test
```

| Area | Path |
|------|------|
| Routes | `src/App.tsx` |
| Chat | `src/pages/ChatbotPage.tsx` |
| Auth | `src/lib/persistentAuth.ts`, `src/components/AuthProvider.tsx` |
| Edge functions | `supabase/functions/` |
| Engineering docs | `Detailed Documentation/` |
| Doc hub | [DOCUMENTATION.md](./DOCUMENTATION.md) |

**Deploy:** run migrations, deploy `chat` and related functions; set secrets in Supabase — never commit keys.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [DOCUMENTATION.md](./DOCUMENTATION.md) | Master index |
| [Detailed Documentation/](./Detailed%20Documentation/README.md) | Engineering series (performance, WebGPU, marketplace, IDE, UX) |
| [RELEASE.md](./RELEASE.md) | Release checklist |
| [OFFLINE.md](./OFFLINE.md) | Offline tiers A/B/C |
| [DESKTOP.md](./DESKTOP.md) | Native desktop |

---

## Links

- **Workspace:** https://www.shadowtalk-ai.com/chatbot
- **Home:** https://www.shadowtalk-ai.com/home
- **Docs:** https://www.shadowtalk-ai.com/docs

---

*ShadowTalk AI · Private repo. Contact the maintainer for licensing.*

**Think AI. Think ShadowTalk.**
