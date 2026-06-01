# Personal IDE and chat integration

This document covers the **code workspace** foundation that App Builder and Marketplace scripts rely on—including work merged before the performance/marketplace series (e.g. PR #46).

## Personal IDE

**Component:** `src/components/chat/PersonalIDE.tsx`

A full in-browser IDE with:

- **Multi-file explorer** — Add, rename, delete files.
- **Monaco editor** — Syntax highlighting per language.
- **Live preview** — HTML/CSS/JS bundled into iframe preview.
- **Viewport presets** — Desktop, tablet, **mobile (375px)**.
- **Built-in templates** — Blank, React (CDN), dashboard, landing, SaaS, e-commerce, portfolio, REST API server, and more.
- **Console / terminal panels** — Run and debug client-side JS.
- **AI assist actions** — Explain, refactor, optimize (via chat API from IDE).

## Route: `/ide`

**Page:** `src/pages/IdePage.tsx`

- Loads one-shot payload from **session storage** (`shadowtalk_ide_payload`).
- Payload consumed on read (so refresh does not duplicate stale state).

## Payload storage

**Module:** `src/lib/idePayloadStorage.ts`

| API | Use |
|-----|-----|
| `saveIdePayload({ code, language, openPreview })` | Single file from chat |
| `loadIdePayload()` | Read once on IDE mount |
| `openInIde(code, language, options?)` | Navigate to IDE with one file |
| `openProjectInIde(project, options?)` | **App Builder** — multi-file project |

## Chat → IDE flows

### From ChatbotPage

Message actions can send code blocks to IDE:

- Generic code → `saveIdePayload({ code, language })`
- HTML → `openPreview: true`

### From Marketplace

Script agents call `openInIde(content, language)` with agent’s `ideScript`.

### From App Builder

`openProjectInIde()` with full `files[]` array.

## Chat architecture (relevant pieces)

| Piece | Role |
|-------|------|
| `ChatbotPage.tsx` | Main chat UI, `runChatCompletion`, tool detection, App Builder |
| `useToolOrchestrator.ts` | Regex tool detection (`app_builder`, `code_canvas`, …) |
| `useShadowToolBridge.ts` | Executes tools via `executeShadowTool.ts` |
| `useChatToolRouter.ts` | Alternative router with `runChatTurn` (other entry points) |
| `useAgenticToolDispatch.ts` | Dispatches detected tools to modals/routes |
| `stringifyChatBody` / `buildChatProviderPayload` | BYOK + provider selection for edge `chat` function |

## CHAT_URL

```
${VITE_SUPABASE_URL}/functions/v1/chat
```

Streaming SSE for normal messages; App Builder may consume stream or JSON body depending on response type.

## SEO

`PAGE_SEO.ide` in `src/lib/seo.ts` — meta for IDE page.

## How to verify

1. Chat → ask for HTML → “Open in IDE” → preview works.
2. `/ide` directly → pick “SaaS App” template → multi-file loads.
3. App Builder flow → 4 files, mobile viewport for mobile platform.

## Related docs

- [05-app-builder.md](./05-app-builder.md)  
- [04-marketplace-functional.md](./04-marketplace-functional.md)
