# ShadowTalk desktop installers (website hosting)

End users download installers from:

- https://www.shadowtalk-ai.com/downloads/shadowtalk-setup.exe
- https://www.shadowtalk-ai.com/downloads/shadowtalk-setup.dmg
- https://www.shadowtalk-ai.com/downloads/shadowtalk-setup.AppImage

**Until you run the steps below, those URLs return 404** — the download page will fall back to GitHub Releases if a release exists there.

## You must build the .exe yourself (on Windows)

ShadowTalk does not ship pre-built installers in git. On a **Windows** computer:

```bash
git clone https://github.com/zain836/shadowtalk-ai-903ca615.git
cd shadowtalk-ai-903ca615
npm install
npm run desktop:install
npm run desktop:make
npm run desktop:stage
```

- `desktop:make` creates `electron/dist/shadowtalk-setup.exe`
- `desktop:stage` copies it to `public/downloads/shadowtalk-setup.exe` and sets `manifest.json` → `available: true`

Then **deploy** the site (Vercel/Netlify/etc.) so `public/downloads/` goes live.

You do **not** send the .exe to Cursor or an AI agent — publish via git deploy or [GitHub Releases](https://github.com/zain836/shadowtalk-ai-903ca615/releases).

### Alternative: GitHub Releases only

Push a tag `v1.0.1` — CI (`.github/workflows/desktop-release.yml`) can attach `shadowtalk-setup.exe`. The downloads page will link to GitHub automatically if the website copy is missing.

Installer binaries are gitignored; only `manifest.json` is tracked in git.
