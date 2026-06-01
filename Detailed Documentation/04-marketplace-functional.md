# Marketplace — fully functional agents (PR #51)

**Branch:** `cursor/marketplace-functional-7adb`  
**Pull request:** [#51](https://github.com/zain836/shadowtalk-ai-903ca615/pull/51)  
**Commit theme:** `feat: make marketplace agents fully runnable`

## Problem (audit findings)

Before this work, the marketplace was **partially real**:

| Worked | Did not work |
|--------|----------------|
| Browse catalog (8 agents in prod Supabase) | Runnable config not wired to chat |
| Install / uninstall (`user_installed_agents`) | Installed agents ignored in workspace |
| Sign-in gate for install | “Added to workspace” toast was misleading |
| | Download count only bumped in UI, not DB |
| | Creator CTA → `/developers` (docs only) |

**Verdict:** Real install registry, but **not runnable** specialist agents.

## Solution

### Runtime configuration model

Each agent has a versioned **`MarketplaceAgentRuntime`** (`src/lib/marketplace/types.ts`):

```typescript
{
  version: 1,
  systemPrompt: string,
  chatMode?: ChatMode,
  personality?: MarketplacePersonality,
  starterPrompts: string[],
  ideScript?: { filename, language, content },
  welcomeMessage?: string
}
```

Configs live in:

- **Bundled definitions** — `src/lib/marketplace/agentDefinitions.ts` (8 agents by UUID, works offline).
- **Database** — `agent_config` JSONB column + seed migration (syncs prod when applied).

### Resolution pipeline

| Module | Purpose |
|--------|---------|
| `resolveAgentConfig.ts` | Merge DB + bundled fallback by agent id |
| `applyAgentToChat.ts` | `prependAgentSystemPrompt()` for chat API |
| `activeAgentSession.ts` | Session storage for “active agent” across navigation |

### Database migration

**File:** `supabase/migrations/20260530120000_marketplace_agent_runtime.sql`

- Adds `agent_config` JSONB on marketplace agents table.
- Seeds runtime JSON for catalog agents.
- Adds RPC **`increment_marketplace_download`** for real download counts.

### Hook: `src/hooks/useMarketplace.ts`

New/updated behaviors:

- **`runAgent(agent)`** — Install if needed → navigate to chat with `?agent=<id>`.
- **`runAgent` for scripts category** — `openInIde()` with `ideScript` template.
- **Pro gating** where applicable.
- **`getAuthUser()` guard** — Safe when Supabase auth mock lacks `getUser` in tests.

### UI

| Component | Change |
|-----------|--------|
| `MarketplacePage.tsx` | Run button, My Library tab |
| `MarketplaceAgentCard.tsx` | Install / Run / Uninstall |
| `InstalledAgentsPanel.tsx` | Quick-run installed agents |
| `MarketplaceAgentBanner.tsx` | Active agent indicator in chat |

### Chat & workspace wiring

- **`ChatbotPage.tsx`** — Reads `?agent=` query param; injects system prompt; shows welcome + starter chips.
- **`ChatShadowSidebar.tsx`** — Links to installed agents.
- **`WorkspacePage.tsx`** — Quick-run from workspace.

## User flows

### Run a specialist agent

1. Marketplace → **Run** on an agent card.
2. If not installed → install row in `user_installed_agents`.
3. Redirect to `/chatbot?agent=<uuid>`.
4. Chat uses specialist `systemPrompt`, personality, mode, and optional welcome message.

### Run a script agent

1. Category **scripts** → **Run** opens **IDE** with prefilled script from `ideScript`.

### My Library

- Tab lists installed agents with one-tap **Run**.

## How to verify

1. Sign in → Marketplace → Install → Run → confirm chat tone matches agent (e.g. legal, fitness).
2. Confirm starter prompt chips appear when configured.
3. Script agent → lands on `/ide` with correct language/file.
4. Apply migration on Supabase staging; confirm download count increments via RPC.
5. Tests: `npx vitest run src/lib/marketplace/resolveAgentConfig.test.ts`

## Tests fixed during implementation

- `ChatbotPage.test.tsx` mock extended with `getUser`, `rpc`, `in`, `maybeSingle`, `delete` for marketplace hook compatibility.

## Related docs

- [06-personal-ide-and-chat.md](./06-personal-ide-and-chat.md) — IDE open from scripts  
- [05-app-builder.md](./05-app-builder.md) — Separate from marketplace scripts
