# ShadowTalk Desktop

ShadowTalk ships as installable desktop software via **Capacitor + Electron** (`electron/`).

## What the desktop app adds

- **Native file picker** — open documents from anywhere on disk in chat
- **Native save dialog** — export conversations to `.md`, `.txt`, or `.json`
- **System notifications** — agent and task alerts in the OS tray
- **System tray** — keep ShadowTalk running in the background
- **Launch at login** — optional auto-start (Profile → Preferences → Desktop app)
- **Dedicated app data folder** — offline models, vault exports, and caches under Electron `userData`
- **Larger default window** — 1280×860 workspace layout
- **Bundled Ollama (Tier D)** — optional sovereign runtime in the installer; auto-starts on launch when staged

## Build installers

```bash
npm install
npm run desktop:install   # electron/ dependencies
npm run desktop:stage-ollama   # optional: bundle Ollama binary for current OS
npm run desktop:make      # build web app + package installers
```

Set `STAGE_OLLAMA_MODEL=1` when staging to also pre-pull the default model (~4.5 GB for qwen2.5:7b). Without staging, desktop falls back to system Ollama from https://ollama.com/download.

Verify compile without launching a window:

```bash
npm run desktop:verify
```

Installers are written to `electron/dist/` (Windows `.exe`, macOS `.dmg`, Linux AppImage when enabled).

## Run in development

```bash
npm run desktop:start
```

## Publish to users

1. Run `npm run desktop:make` on each target OS (Windows CI: `.github/workflows/desktop-release.yml` on tag `v*`).
2. Stage installers for the website:

   ```bash
   npm run desktop:stage
   ```

   This copies branded files into `public/downloads/`:

   - `shadowtalk-setup.exe` (Windows)
   - `shadowtalk-setup.dmg` (macOS)
   - `shadowtalk-setup.AppImage` (Linux)

3. Deploy the site. Users download from **https://www.shadowtalk-ai.com/downloads** (direct URLs under `/downloads/`).
4. Optionally attach the same files to **GitHub Releases** for mirrors.

### Auto-update (optional)

Desktop builds **do not** check GitHub for updates by default (avoids crash when no release exists). After you publish `v1.0.0` on GitHub Releases, rebuild with:

```bash
set SHADOWTALK_AUTO_UPDATE=1
npm run desktop:make:publish
```

Or use `npm run desktop:make` for installs without auto-update.

### Production-ready desktop (end users)

After `npm run desktop:make`, ship **`electron/dist/shadowtalk-setup.exe`**. End users only need to:

1. Install the `.exe`
2. Open ShadowTalk → **Settings** → sign in (same email as the website)
3. Chat in the main workspace

No Supabase CLI, `.env`, or `supabase deploy` is required on user PCs when using the configured cloud backend. Chat uses a native IPC path (no browser CORS) plus automatic CORS header fixes for web fetches.

### "Failed to fetch" in desktop chat

1. **Reinstall** the latest `shadowtalk-setup.exe` from your build (must include commit with desktop chat IPC).
2. **Sign in** inside the app (Settings), not only in the browser.
3. **Owner-only (optional):** deploy backend edge functions from the project's cloud backend — this is unnecessary if you run with a self-hosted Supabase endpoint via `.env`.
4. **Custom Supabase project** — Copy `env.example` → `.env` with your URL/anon key, then `npm run desktop:make`.

## Configuration

- Root `capacitor.config.ts` — app id `com.shadowtalk.ai`, Electron tray/splash
- `electron/electron-builder.config.json` — installer branding and targets
- Native bridge: `window.shadowtalkDesktop` (see `src/lib/desktopBridge.ts`)
