# Pull requests index

Central index of pull requests referenced in this documentation initiative.

| PR | Title / theme | Branch | Base | Status (doc snapshot) |
|----|---------------|--------|------|------------------------|
| [#46](https://github.com/zain836/shadowtalk-ai-903ca615/pull/46) | Wire Personal IDE to `/ide` | `cursor/wire-personal-ide-7adb` | `main` | Merged |
| [#47](https://github.com/zain836/shadowtalk-ai-903ca615/pull/47) | Subscription psychology / Premium focus | `cursor/subscription-psychology-7adb` | `main` | Merged |
| [#48](https://github.com/zain836/shadowtalk-ai-903ca615/pull/48) | Startup performance | `cursor/fix-startup-performance-7adb` | `main` | See repo |
| [#49](https://github.com/zain836/shadowtalk-ai-903ca615/pull/49) | WebGPU acceleration | `cursor/webgpu-acceleration-7adb` | `main` | See repo |
| [#50](https://github.com/zain836/shadowtalk-ai-903ca615/pull/50) | Hardware turbo routing | `cursor/hardware-turbo-routing-7adb` | `main` | See repo |
| [#51](https://github.com/zain836/shadowtalk-ai-903ca615/pull/51) | Marketplace fully runnable | `cursor/marketplace-functional-7adb` | `main` | See repo |
| [#52](https://github.com/zain836/shadowtalk-ai-903ca615/pull/52) | App Builder (web + mobile) | `cursor/app-builder-7adb` | `main` | Draft PR |

## Commits on the performance → app builder line (git)

Recent ancestry on feature branches (newest first):

```
b189e71 feat: generate full web and mobile apps from chat
7f0f6e0 feat: make marketplace agents fully runnable
8570a14 feat: hardware-aware turbo routing for fastest chat path
f456cc6 feat: unify WebGPU acceleration for on-device AI
44caa84 fix: reduce startup lag on open
```

## Other notable merged PRs (same repo era)

| PR | Theme |
|----|--------|
| #40–#42 | Live metrics, brand traction, stealth landing |
| #38 | BYOK API key prompt |
| #36 | Dark theme restore |

## Cloud agent branch registry (contextual)

Multiple parallel agent branches exist for future work, for example:

- `cursor/agentic-chat-7adb`
- `cursor/desktop-app-7adb`
- `cursor/offline-mode-7adb`
- `cursor/unified-chat-tools-7adb`

These are **not** fully documented here unless merged; check GitHub for open PRs.

## Applying database changes

For marketplace download RPC and `agent_config` column:

```bash
# Apply via Supabase CLI or dashboard
supabase/migrations/20260530120000_marketplace_agent_runtime.sql
```

Production Supabase must run migrations for DB-backed configs to match bundled definitions.

## Document map

Each PR #48–#52 has a dedicated markdown file in this folder—see [README.md](./README.md).
