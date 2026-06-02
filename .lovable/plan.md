## Goal

1. **Never let a user see "credits exhausted" as a dead-end.** When Lovable credits run out (HTTP 402) — or platform gateway is unavailable — automatically fall back to the user's stored BYOK key. If they don't have one, surface a one-tap CTA to add one and retry.
2. **Make first-token latency as low as we can** without changing the chat surface.

The BYOK plumbing already exists (`user_provider_keys`, `streamWithUserKey`, `customApiKeys.ts`, ProviderSelector). We're wiring an automatic fallback path and shaving startup latency.

---

## Part 1 — Auto-BYOK fallback (edge function)

**File:** `supabase/functions/chat/index.ts`

Today the platform path returns a hard 402:
```text
if (response.status === 402)  →  JSON { error: "AI credits exhausted..." }, status 402
```

Change it to:

```text
on 402 (or 503 with no retry budget):
  if authUserId && serviceRoleKey:
     userKey = fetchUserProviderKey(admin, authUserId)   // any verified default key
     if userKey:
        log "[CHAT] Platform credits exhausted — auto-failover to BYOK (<provider>)"
        return streamWithUserKey(userKey.provider, userKey.apiKey, systemPrompt, trimmedMessages)
  // No key available — return structured error the client can act on
  return 402 { error: "credits_exhausted", code: "PLATFORM_CREDITS_EXHAUSTED", needsByok: true,
               message: "Platform AI credits are exhausted. Add your own API key to continue (free, ~2 min)." }
```

Same wrapper applies if `customAiChatCompletions` throws / returns 5xx with no upstream key.

---

## Part 2 — Frontend handles the structured 402

**Files:**
- `src/lib/api-error-handler.ts` — recognize `needsByok: true` in the JSON body and re-export a typed `CreditsExhaustedError`.
- `src/components/chat/ChatInput.tsx` (or wherever the chat send handler lives — find with grep) — on `CreditsExhaustedError`:
  - Show a non-blocking toast: "Out of platform credits — add your API key to keep chatting."
  - Open a lightweight modal `ByokFallbackPrompt` (new) with provider quick-pick (Gemini / OpenRouter), inline key field, "Where do I get a key?" links pulled from `AI_PROVIDER_OPTIONS`.
  - On save: write via existing `saveCustomAiConfig` + retry the last user message automatically.
- `src/components/chat/ByokFallbackPrompt.tsx` (new, ~120 lines) — small dialog, no new design tokens; reuses shadcn `Dialog`, `Input`, `Button`, semantic tokens only.

No DB migration needed — the existing `user_provider_keys` table and localStorage `shadowtalk_custom_ai_keys` both work.

---

## Part 3 — Speed wins (low-risk, measurable)

**`index.html`**
- Add `<link rel="preconnect" href="https://axsudmhjpfzffcicfvuj.supabase.co" crossorigin>` and `<link rel="dns-prefetch" href="https://ai.gateway.lovable.dev">` — shaves ~80–250ms off the first request.

**`supabase/functions/chat/index.ts`**
- For SIMPLE-tier queries, skip the post-stream quality re-score (already done) **and** skip the secondary system-prompt augmentation block when `trimmedMessages.length === 1` and total chars < 400 — saves a few ms of prompt assembly.
- Lower the default `model` for SIMPLE tier from whatever Router V2 picks to `google/gemini-3-flash-preview` when no override is set (already the chat default per AI-gateway guidance) — confirms our fastest path is the default.

**Frontend — `src/components/chat/ChatInput.tsx`**
- On composer focus, fire a `fetch(CHAT_URL, { method: 'OPTIONS' })` to warm the edge function (already cold-start friendly but verifies preconnect).
- Render the optimistic assistant bubble *before* the network call returns (current code already does this — verify).

Speed work is intentionally minimal and reversible. Bigger wins (regional pinning, persistent EventSource) are out of scope for today.

---

## Technical notes

- `fetchUserProviderKey(admin, userId)` already orders by `is_default DESC` then any verified key — exactly what auto-fallback needs.
- `streamWithUserKey` returns a streaming Response; we forward it with `corsHeaders` just like the existing BYOK branch (lines 1714–1735).
- The structured 402 payload is backwards-compatible: old clients still see `error` string; new clients also check `code === "PLATFORM_CREDITS_EXHAUSTED"`.
- BYOK auto-fallback is silent for the user (response just works). The CTA modal only opens when there is **no** stored key.
- No new env vars, no migrations, no new secrets.

---

## Files touched

```text
supabase/functions/chat/index.ts          (modify ~30 lines around 1756–1778)
index.html                                (add 2 preconnect lines)
src/lib/api-error-handler.ts              (typed error)
src/components/chat/ChatInput.tsx         (catch + retry)
src/components/chat/ByokFallbackPrompt.tsx (new, ~120 lines)
```

Estimated diff: ~250 lines net new.

## Out of scope (call out, don't build today)

- Regional edge replicas / Cloudflare Workers — needs infra change.
- Local-first SmolLM auto-fallback on 402 — already exists per memory, but wiring it as a third tier on top of BYOK is a separate plan.
- Encrypting localStorage BYOK keys at rest — already documented as device-local; broader rework.