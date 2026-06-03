# ShadowTalk desktop installers (website hosting)

End users download installers from:

- https://www.shadowtalk-ai.com/downloads/shadowtalk-setup.exe
- https://www.shadowtalk-ai.com/downloads/shadowtalk-setup.dmg
- https://www.shadowtalk-ai.com/downloads/shadowtalk-setup.AppImage

## Publish a new release

On each target OS (or CI):

```bash
npm install
npm run desktop:make
npm run desktop:stage
```

`desktop:stage` copies branded installers from `electron/dist/` into this folder and updates `manifest.json`.

Then deploy the site (installers ship with `public/`).

Installer binaries are gitignored; only `manifest.json` is tracked until you deploy from a machine that ran `desktop:stage`.
