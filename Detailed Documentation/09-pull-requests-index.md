# Pull requests index

Central index of pull requests and major `main` commits referenced in this documentation.

---

## Core feature PRs (#46–#52)

| PR | Title / theme | Branch | Doc |
|----|---------------|--------|-----|
| [#46](https://github.com/zain836/shadowtalk-ai-903ca615/pull/46) | Personal IDE `/ide` | `cursor/wire-personal-ide-7adb` | [06](./06-personal-ide-and-chat.md) |
| [#47](https://github.com/zain836/shadowtalk-ai-903ca615/pull/47) | Subscription psychology | `cursor/subscription-psychology-7adb` | [07](./07-subscription-and-product.md) |
| [#48](https://github.com/zain836/shadowtalk-ai-903ca615/pull/48) | Startup performance | `cursor/fix-startup-performance-7adb` | [01](./01-startup-performance.md) |
| [#49](https://github.com/zain836/shadowtalk-ai-903ca615/pull/49) | WebGPU acceleration | `cursor/webgpu-acceleration-7adb` | [02](./02-webgpu-acceleration.md) |
| [#50](https://github.com/zain836/shadowtalk-ai-903ca615/pull/50) | Hardware turbo routing | `cursor/hardware-turbo-routing-7adb` | [03](./03-hardware-turbo-routing.md) |
| [#51](https://github.com/zain836/shadowtalk-ai-903ca615/pull/51) | Marketplace runnable | `cursor/marketplace-functional-7adb` | [04](./04-marketplace-functional.md) |
| [#52](https://github.com/zain836/shadowtalk-ai-903ca615/pull/52) | App Builder | `cursor/app-builder-7adb` | [05](./05-app-builder.md) |

---

## UX, auth & navigation (main)

| PR / commit | Theme | Doc |
|-------------|-------|-----|
| `45cf4ac` | `/` → chatbot, `/home` landing | [10](./10-ux-auth-and-navigation.md) |
| `0e0b198` | Persistent auto sign-in | [10](./10-ux-auth-and-navigation.md) |
| [#62](https://github.com/zain836/shadowtalk-ai-903ca615/pull/62) | Skip boot on chatbot | [10](./10-ux-auth-and-navigation.md) |
| `877cc47` | Remove Turbo badge, fix send button | [10](./10-ux-auth-and-navigation.md) |

---

## Other notable PRs

| PR | Theme |
|----|--------|
| #12–#15 | Foundation: trust, desktop, brand, agentic loop — [RELEASE.md](../RELEASE.md) |
| #38 | BYOK API key prompt |
| #40–#42 | Live metrics, stealth landing |

---

## Cloud agent branches (contextual)

Parallel agent work may exist as `cursor/<feature>-7adb`. Check GitHub [Pull Requests](https://github.com/zain836/shadowtalk-ai-903ca615/pulls) for open merges.

Examples: `cursor/desktop-app-7adb`, `cursor/offline-mode-7adb`, `cursor/gemini-neural-ui-shadowtalk-7adb`.

---

## Migrations (marketplace runtime)

```bash
supabase/migrations/20260530120000_marketplace_agent_runtime.sql
```

Apply via Supabase CLI or dashboard before DB-backed agent configs match bundled definitions.

---

## Document map

| # | File |
|---|------|
| 00–09 | See [README.md](./README.md) |
| 10 | [UX, auth & navigation](./10-ux-auth-and-navigation.md) |
| 11 | [Complete route reference](./11-complete-route-reference.md) |

**Hub:** [DOCUMENTATION.md](../DOCUMENTATION.md)
