# Bundled Ollama (Phase 4 — Tier D)

ShadowTalk desktop can ship with a bundled Ollama runtime for out-of-the-box sovereign AI.

## Layout

```
ollama/
  manifest.json
  bin/
    linux-x64/ollama
    linux-arm64/ollama
    darwin-arm64/ollama
    darwin-x64/ollama
    win32-x64/ollama.exe
    win32-arm64/ollama.exe
  models/          # optional pre-pulled models (manifests + blobs)
```

## Stage before building installers

```bash
npm run desktop:stage-ollama
npm run desktop:make
```

Set `STAGE_OLLAMA_MODEL=1` to also pull the default model during staging (~4–5 GB for qwen2.5:7b, or use phi3:mini for smaller builds).

Without `bin/`, the app falls back to system Ollama or prompts the user to install from https://ollama.com/download.
