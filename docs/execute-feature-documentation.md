# Shadow Execution Engine (/execute) — Complete Documentation

> **Status**: Feature hidden from navigation (2026-08-15). Code preserved for future re-enable.
> **Unified page**: `/execute` absorbed `/strategy` and `/missioncontrol` — both now redirect here.

---

## 1. Overview

Shadow Execution ("S.E.E." — Shadow Execution Engine) is ShadowTalk's autonomous multi-step mission runner. It allows users to define a goal (e.g., "research competitors for X market"), which the system breaks down into sequential steps, executes each via LLM + tool calls, and synthesizes a final deliverable (strategy report, research brief, content pack, or general output).

The page lives at `/execute` and supports 4 deliverable modes:
- `general` — freeform goal, markdown output
- `strategy_report` — business strategy, structured 5-tab report (Overview, Research, SWOT, Charts, Export)
- `research_brief` — research-focused synthesis
- `content_pack` — content generation bundle

---

## 2. Architecture

### 2.1 Page Flow

```
User enters /execute
       |
       v
  ExecutePage.tsx (48 lines)
  +-- SEOHead (PAGE_SEO.execute)
  +-- Navigation + Footer
  +-- ComingSoonPopup (dismissible overlay)
  +-- ShadowExecution component
       |
       +-- [Run Tab] User configures:
       |   +-- deliverableType (general/strategy/research/content)
       |   +-- goal text OR business idea form (strategy mode)
       |   +-- autoApprove toggle
       |   +-- 10 templates across 5 categories
       |
       +-- handleRun() --->
       |                  v
       |   useMissionQuota.canCreateMission?
       |          |
       |          v
       |   useMissions.createMission() -> Supabase missions table
       |          |
       |          v
       |   useMissionExecutor.executeMission(mission)
       |          |
       |          +-- 1. generateExecutionPlan() [3-tier fallback]
       |          |     +-- Tier 1: Turbo (Groq direct, ~2-4s)
       |          |     +-- Tier 2: Standard (Gemini via Supabase edge)
       |          |     +-- Tier 3: OmniRoute bounded fallback
       |          |     +-- Tier 4: Hardcoded default plan
       |          |
       |          +-- 2. Loop: executeMissionTool() per step
       |          |     +-- web_search -> Supabase web-search fn
       |          |     +-- deep_research -> search + LLM synthesis
       |          |     +-- web_scrape -> Supabase firecrawl-scrape fn
       |          |     +-- security_audit -> Supabase website-security-scan fn
       |          |     +-- send_email -> Supabase shadow-agent-tools fn
       |          |     +-- read_emails -> shadow-agent-tools fn
       |          |     +-- get_calendar -> shadow-agent-tools fn
       |          |     +-- get_contacts -> shadow-agent-tools fn
       |          |     +-- create_event -> shadow-agent-tools fn
       |          |     +-- synthesis / general -> chatCompletion (Gemini)
       |          |
       |          +-- 3. synthesizeDeliverable()
       |                +-- strategy_report -> synthesizeStrategyReport()
       |                |     +-- StrategyDeliverableView (5 tabs)
       |                |     +-- Fallback if LLM fails
       |                +-- other -> Turbo -> Gemini markdown
       |
       +-- [Live Tab] StrategyStepTimeline + progress bar
       +-- [Deliverable Tab] StrategyDeliverableView or markdown
       +-- [History Tab] Past missions list (click to view)
       +-- ShareResultDialog (referral-aware)
```

### 2.2 Two Execution Modes

| Mode | Location | How it works |
|------|----------|-------------|
| **Standalone** | `/execute` page | Full 4-tab UI with plan/execute/synthesize pipeline |
| **In-Chat** | SEEMissionPanel inside ChatbotPage | Uses `useSEEFromChat` hook; missions run entirely within chat context |

---

## 3. File Inventory

### 3.1 Pages

| File | Lines | Role |
|------|-------|------|
| `src/pages/ExecutePage.tsx` | 48 | Route page; parses query params, shows ComingSoonPopup, renders ShadowExecution |
| `src/pages/StrategyAgentPage.tsx` | 8 | Pure redirect to `/execute?mode=strategy_report` |
| `src/pages/MissionControlPage.tsx` | 29 | Navigates to `/execute` on close/complete |

### 3.2 Components

| File | Lines | Role |
|------|-------|------|
| `src/components/execution/ShadowExecution.tsx` | 405 | Main 4-tab execution workspace (Run, Live, Deliverable, History) |
| `src/components/execution/StrategyDeliverableView.tsx` | 72 | 5-tab deliverable viewer for strategy reports |
| `src/components/chat/SEEMissionPanel.tsx` | ~200 | In-chat mission launcher/progress panel |
| `src/components/strategy/StrategyStepTimeline.tsx` | - | Step-by-step progress visualization |
| `src/components/strategy/StrategyPDFGenerator.tsx` | - | PDF export for strategy reports |
| `src/components/strategy/ResearchPanel.tsx` | - | Research tab content |
| `src/components/strategy/SWOTAnalysis.tsx` | - | SWOT analysis tab |
| `src/components/strategy/StrategyCharts.tsx` | - | Charts tab |

### 3.3 Hooks

| File | Lines | Role |
|------|-------|------|
| `src/hooks/useMissionExecutor.ts` | 370 | Core engine: plan, execute steps, synthesize. Supports pause/approve/cancel/skip. Uses AbortController. |
| `src/hooks/useMissions.ts` | 502 | Mission CRUD + realtime subscription to `missions` and `mission_actions` tables. Local store fallback. |
| `src/hooks/useMissionQuota.ts` | 131 | Monthly mission limits: Free=3, Pro=15, Premium=15, Lifetime=30, Elite=50, Enterprise=unlimited. 3 free retries. |
| `src/hooks/useAgenticToolDispatch.ts` | 383 | Tool detection and dispatch. For execution tools: auto-navigates to `/execute` or shows confirmation. |
| `src/hooks/useToolOrchestrator.ts` | 864 | Regex-based tool detection. `shadow_execution` (priority 8), `mission_control` (priority 7), `strategy_agent` (priority 7). |
| `src/hooks/useShadowToolBridge.ts` | 191 | Legacy bridge. Maps execution tool results to navigate to `/execute`. |
| `src/hooks/useSEEFromChat.ts` | 161 | In-chat SEE mission launcher. Creates/executes missions within chat context. |

### 3.4 Libraries

| File | Lines | Role |
|------|-------|------|
| `src/lib/execution/types.ts` | 31 | `DeliverableType` union, `DELIVERABLE_LABELS`, `ExecutionRunInput`, `ExecutionDeliverable` |
| `src/lib/execution/templates.ts` | 126 | 10 templates across 5 categories (CEO playbooks, Research, Business, Content, Engineering) |
| `src/lib/execution/generateExecutionPlan.ts` | 222 | 3-tier plan generation: Turbo (Groq), Standard (Gemini), OmniRoute, hardcoded default |
| `src/lib/execution/synthesizeDeliverable.ts` | 150 | Post-execution deliverable compilation. Strategy uses `synthesizeStrategyReport()`. |
| `src/lib/execution/inferFromChat.ts` | 92 | Chat message to deliverable type inference + `detectShadowExecutionFromChat()` + `buildExecutePath()` |
| `src/lib/execution/index.ts` | 5 | Barrel re-export |
| `src/lib/see/types.ts` | 51 | `MissionToolName` (16 tools), `MissionPlanStep`, `ToolExecutionResult`, `ComplexTaskDetection` |
| `src/lib/see/complexTaskDetector.ts` | 68 | Score-based multi-step task detection |
| `src/lib/see/chatCompletion.ts` | 104 | LLM completion: Ollama local, Supabase edge SSE streaming |
| `src/lib/see/missionToolExecutor.ts` | 261 | Executes individual mission steps via Supabase edge functions |
| `src/lib/see/generateMissionPlan.ts` | 11 | Deprecated wrapper, delegates to `generateExecutionPlan()` |
| `src/lib/see/ominiRoutePlannerFallback.ts` | 101 | Bounded fallback planner via OmniRoute API |
| `src/lib/see/index.ts` | 5 | Barrel re-export |
| `src/lib/shadowTools/executeShadowTool.ts` | ~285 | Maps tool types to `/execute` UI routes |
| `src/lib/autonomy/autonomousRouter.ts` | ~45 | Decides in-chat vs redirect-to-/execute routing |
| `src/lib/chatCommandRoutes.ts` | - | `missions` command maps to `/execute` |
| `src/lib/turbo/` (3 files) | - | Turbo fast-path for planning + synthesis (Groq direct) |

### 3.5 Supabase Edge Functions Used

| Function | Called By | Purpose |
|----------|----------|---------|
| `web-search` | `missionToolExecutor.ts` | Web search via SerpAPI/Tavily |
| `firecrawl-scrape` | `missionToolExecutor.ts` | Web page scraping |
| `website-security-scan` | `missionToolExecutor.ts` | Security audit of a URL |
| `shadow-agent-tools` | `missionToolExecutor.ts` | Email, calendar, contacts, events |
| `chat` | `generateExecutionPlan.ts` | Gemini-powered plan generation (standard tier) |

### 3.6 Database Tables

| Table | Purpose |
|-------|---------|
| `missions` | Mission records (id, user_id, goal, status, deliverable_type, plan, steps, result) |
| `mission_actions` | Individual step results within a mission |

---

## 4. All 14 Navigation Entry Points

1. **Direct URL** — `/execute`, `/execute?mode=strategy_report`, `/execute?goal=...`
2. **Primary nav** — "Shadow Execution" with Rocket icon (`Navigation.tsx:94`)
3. **Chat sidebar** — "Execute" / "Exec" (`chatSidebarNav.ts:28`)
4. **Global Command Palette** (Cmd+K) — "Shadow Execution" (`CommandPalette.tsx:38`)
5. **In-chat Command Palette** — "Shadow Execution" with "Pro" badge (`chat/CommandPalette.tsx:505`)
6. **Chat command** — Typing "missions" in chat (`ChatbotPage.tsx:2215`)
7. **Auto tool detection** — Regex patterns in `useToolOrchestrator.ts` (lines 627-713)
8. **Agentic tool dispatch** — `useAgenticToolDispatch.ts` `goToExecute()` (line 82)
9. **SEEMissionPanel** — "Open Mission Control" button
10. **Strategy page** — `/strategy` redirects to `/execute?mode=strategy_report`
11. **Mission Control page** — Close/complete navigate to `/execute`
12. **Docs page** — "Get started" button (`DocsPage.tsx:822`)
13. **Agent Architecture page** — Button (`AgentArchitecturePage.tsx:142`)
14. **Wedge/landing pages** — CTAs in marketing pages (`wedgePages.ts:102`)

---

## 5. Mission Quota System

| Plan | Monthly Missions | Free Retries per Mission |
|------|-----------------|--------------------------|
| Free | 3 | 3 |
| Pro | 15 | 3 |
| Premium | 15 | 3 |
| Lifetime | 30 | 3 |
| Elite | 50 | 3 |
| Enterprise | Unlimited | 3 |

---

## 6. 16 Supported Mission Tools

1. `web_search` — Search the web
2. `deep_research` — Deep research with synthesis
3. `web_scrape` — Scrape a web page
4. `security_audit` — Security audit a URL
5. `send_email` — Send an email
6. `read_emails` — Read emails
7. `get_calendar` — Get calendar events
8. `get_contacts` — Get contacts
9. `create_event` — Create calendar event
10. `synthesis` — LLM synthesis step
11. `general` — General LLM call
12. `code_execution` — Execute code
13. `data_analysis` — Analyze data
14. `file_generation` — Generate files
15. `image_generation` — Generate images
16. `presentation` — Create presentations

---

## 7. Templates (10 across 5 categories)

| Category | Templates |
|----------|----------|
| CEO Playbooks | Market Entry Analysis, Competitive Intelligence |
| Research | Industry Deep Dive, Academic Literature Review |
| Business | Business Model Canvas, Revenue Strategy |
| Content | Blog Series Generator, Social Media Campaign |
| Engineering | Architecture Decision Record, Technical Audit |

---

## 8. How to Re-Enable

To restore the /execute feature:

1. **Route**: In `src/App.tsx`, uncomment:
   ```tsx
   <Route path="/execute" element={<PageTransition><ExecutePage /></PageTransition>} />
   ```

2. **Navigation**: In `src/components/Navigation.tsx`, uncomment:
   ```tsx
   { name: "Shadow Execution", href: "/execute", icon: Rocket, isLink: true }
   ```

3. **Chat sidebar**: In `src/lib/chatSidebarNav.ts`, uncomment:
   ```tsx
   { label: "Execute", shortLabel: "Exec", icon: Brain, to: "/execute", section: "explore" }
   ```

4. **Command Palette**: In `src/components/CommandPalette.tsx`, uncomment the entry.

5. **In-chat palette**: In `src/components/chat/CommandPalette.tsx`, uncomment the entry.

6. **Chat commands**: In `src/pages/ChatbotPage.tsx`, restore the `"missions"` command handler.

7. **SEO**: In `src/lib/seo.ts`, restore `PAGE_SEO.execute`.

8. **Sitemap**: In `src/lib/seo/generateSitemap.ts` and `public/sitemap.xml`, restore the entry.

All component files, hooks, and libraries remain intact. Only navigation and routing references were removed.
