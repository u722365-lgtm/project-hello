# App Builder — full web & mobile apps from chat (PR #52)

**Branch:** `cursor/app-builder-7adb`  
**Pull request:** [#52](https://github.com/zain836/shadowtalk-ai-903ca615/pull/52)  
**Commit theme:** `feat: generate full web and mobile apps from chat`

## Problem

Users asked ShadowTalk to **“build an app”** but only received **single snippets** or generic code blocks—not a complete, previewable project with HTML, CSS, and JavaScript.

## Solution

**App Builder** is an end-to-end pipeline:

```
User message → intent detection → AI project JSON → parse → IDE (multi-file) + preview
                     ↓ (on failure)
              fallback scaffold (web or mobile)
```

## Module: `src/lib/appBuilder/`

| File | Role |
|------|------|
| `types.ts` | `AppProject`, `AppPlatform`, `AppProjectFile` |
| `detectAppBuilderIntent.ts` | Regex/heuristic: full app vs snippet |
| `parseAppProject.ts` | Extract JSON from model output (fenced or raw) |
| `generateAppProject.ts` | Call `functions/v1/chat` with strict JSON schema |
| `fallbackProject.ts` | Production-quality scaffold when API fails |
| `index.ts` | Public exports |

### Intent examples (trigger App Builder)

- “Build a complete web app for a restaurant booking system”
- “Create a mobile app for a daily habit tracker”
- “Scaffold a SaaS dashboard application”

Confidence threshold in chat: **≥ 50** (combined with `app_builder` tool detection).

### Generated project shape

```json
{
  "title": "App Name",
  "platform": "web" | "mobile",
  "description": "...",
  "files": [
    { "name": "index.html", "language": "html", "content": "..." },
    { "name": "style.css", "language": "css", "content": "..." },
    { "name": "app.js", "language": "javascript", "content": "..." },
    { "name": "README.md", "language": "markdown", "content": "..." }
  ]
}
```

**Rules enforced in the system prompt:**

- Vanilla HTML/CSS/JS only (no build step).
- React via CDN only if user explicitly asks.
- **Mobile:** mobile-first, viewport meta, touch UI, tab bar patterns.
- **Web:** nav, hero, sections, responsive layout.

## IDE integration

### `src/lib/idePayloadStorage.ts`

- Extended `IdePayload` with optional **`project`** field.
- New **`openProjectInIde(project, { openPreview })`** — saves session payload and navigates to `/ide`.

### `src/components/chat/PersonalIDE.tsx`

- New prop **`initialProject`** with `files[]` and optional `platform`.
- Initial viewport: **mobile (375px)** when `platform === "mobile"`.
- Skips template picker when project is preloaded.

### `src/pages/IdePage.tsx`

- Loads `payload.project` from session storage into `PersonalIDE`.

## Chat integration (`src/pages/ChatbotPage.tsx`)

Before normal `runChatCompletion`:

1. `detectAppBuilderIntent(message)` OR tool orchestrator `app_builder`.
2. Show AI status message with `toolExecution: { tool: "app_builder", status: "running" }`.
3. `generateAppProject({ prompt, platform, accessToken, providerPayload })`.
4. `openProjectInIde({ title, platform, files }, { openPreview: true })`.
5. Replace status with summary (file count, preview hint, mobile viewport note).

## Tool orchestrator

**New tool type:** `app_builder` in `src/hooks/useToolOrchestrator.ts`

- Priority **9** (above `code_canvas`) so “build mobile app” is not treated as a single-file code request.
- `code_canvas` patterns tightened to avoid stealing full-app intents.

**UI:** `ToolExecutionCard` — “App Builder” label with layout icon.

## What “mobile app” means in ShadowTalk

- **Not** native `.ipa` / `.apk` binaries.
- **Is** a mobile-first **Progressive Web App style** HTML/CSS/JS bundle previewed in the IDE’s mobile frame—editable and exportable as static files.

## How to verify

1. Chat: “Build a mobile app for tracking water intake.”
2. Expect building message → redirect to `/ide` with 4+ files.
3. Preview tab → switch viewport to **Mobile**.
4. Chat: “Create a full web app landing page for a SaaS analytics product.”
5. Run tests: `npx vitest run src/lib/appBuilder`

## Failure modes

| Case | Behavior |
|------|----------|
| Chat API error | Fallback scaffold from `fallbackProject.ts` |
| Invalid JSON from model | Fallback scaffold |
| User offline without local model | Error toast; suggest retry online |

## Related docs

- [06-personal-ide-and-chat.md](./06-personal-ide-and-chat.md)  
- [04-marketplace-functional.md](./04-marketplace-functional.md) — script templates vs App Builder
