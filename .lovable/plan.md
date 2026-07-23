# Fix ShadowTalk chat end-to-end

Four blockers, fixed in one pass.

## 1. OpenRouter fallback across every AI path

Today only the main streaming path in `supabase/functions/chat/index.ts` falls back to OpenRouter when `LOVABLE_API_KEY` returns 402/429. Every other path (planner, tool executor, special-mode handlers, image-edit, vision, deep-research, agent workflows) hits `ai.gateway.lovable.dev` and errors out when credits are exhausted.

- Create `supabase/functions/_shared/aiGatewayFetch.ts`: a single helper `callAI(body, { stream? })` that:
  - Calls Lovable gateway with `LOVABLE_API_KEY`
  - On 402/429 or missing key, retries against `https://openrouter.ai/api/v1/chat/completions` with `OPENROUTER_FALLBACK_KEY` (model id preserved — `openai/gpt-5.5` → `openai/gpt-4o-mini`, `google/*` passes through)
  - Emits fallback marker so the client can show "using backup provider"
- Replace all ~15 raw `fetch("https://ai.gateway.lovable.dev/...")` sites in `chat/index.ts`, `image-edit`, `vision-analyze`, `deep-research`-style functions, `strategy` and `mission-execute` with `callAI`.
- Request `OPENROUTER_FALLBACK_KEY` from user via `add_secret` (user must obtain from openrouter.ai and paste — cannot generate).

## 2. Special tool execution paths

Audit each panel that today only renders UI:

- **Image generation** — already routed via chat function tool call; ensure it forwards through `callAI` and returns base64 to renderer.
- **Music generation** — currently ElevenLabs; verify `ELEVENLABS_API_KEY` connector is used and surface real error toasts.
- **Deep research** — wire `web-search` + `firecrawl-scrape` outputs back into chat as tool results, not just UI.
- **Agent workflows / mission-execute** — swap direct gateway calls to `callAI`.
- **Security audit (HSCA URL scan)** — confirm `website-security-scan` returns to chat panel.
- Any panel with no live path → hide behind a "Coming soon" flag rather than showing broken UI.

## 3. Desktop Ollama fallback (real one)

Edge functions cannot reach a user's `127.0.0.1:11434`. The correct fix is client-side:

- In `src/api/chat.ts`, before hitting `/functions/v1/chat`, probe `http://localhost:11434/api/tags` (short timeout).
- If reachable and user has "Use local Ollama" enabled OR cloud returned 402/429, stream directly from Ollama's `/api/chat` endpoint on the same browser/desktop process.
- Keeps the "cloud tools stay cloud, chat can go local" separation from the earlier local-first cutover.

## 4. Free-tier robustness

- Client shows a clear banner when both Lovable credits and OpenRouter fallback are unavailable.
- Special-mode requests degrade to "requires Pro / add your own key" instead of a generic 500.

## Technical details

Files touched:

- New: `supabase/functions/_shared/aiGatewayFetch.ts`
- Edit: `supabase/functions/chat/index.ts` (replace ~15 fetch sites)
- Edit: `supabase/functions/image-edit/index.ts`, `vision-analyze/index.ts`, `mission-execute/index.ts`, and any other function calling the gateway directly
- Edit: `src/api/chat.ts` (Ollama pre-flight + direct stream)
- Edit: `src/pages/ChatbotPage.tsx` (fallback banner)

Model mapping for OpenRouter fallback:

```text
openai/gpt-5.5     -> openai/gpt-4o-mini
openai/gpt-5.4-*   -> openai/gpt-4o-mini
google/gemini-2.5-pro   -> google/gemini-2.5-pro
google/gemini-*-flash*  -> google/gemini-flash-1.5
```

Secret required from you:

- `OPENROUTER_FALLBACK_KEY` — grab from [https://openrouter.ai/keys](https://openrouter.ai/keys), I'll open the secure form once you approve this plan.

Out of scope (call out only):

- Music generation quality tuning
- Building new tool panels (only wire existing ones)
- Cross-compiling desktop installers,
- i think you should use free models,
- &nbsp;