# ShadowTalk CLI

Sovereign local-first AI in your terminal. Alias: `st`.

## Install

From the repo root:

```bash
npm run cli:install
npm run cli:build
npm link --prefix cli
```

Or run without linking:

```bash
npm run cli:dev -- chat "Hello"
```

## Requirements

- **Node.js 18+**
- **Ollama** running locally for chat and IDE commands (`ollama serve`)

## Commands

| Command | Description |
|---------|-------------|
| `st chat "message"` | One-shot chat (streams to stdout) |
| `st chat -i` | Interactive REPL |
| `st chat -f file.ts "review this"` | Chat with file context |
| `st ollama status` | Check Ollama and models |
| `st ollama pull qwen2.5:7b` | Pull a model |
| `st ollama use <model>` | Set default model |
| `st ide ask "add tests" --dir .` | On-device code assist for a folder |
| `st sovereign` | Privacy / routing status (JSON) |
| `st config list` | Show `~/.shadowtalk/config.json` |

## Privacy

**Device-only pledge is ON by default.** Chat and IDE data stay on your machine via Ollama. Cloud AI is blocked unless you explicitly opt in:

```bash
st config set pledge.deviceOnly false
st config set pledge.cloudOptIn true
```

Set ShadowTalk backend env vars for cloud (only when opted in):

```bash
export SHADOWTALK_SUPABASE_URL=https://api.shadowtalk-ai.com
export SHADOWTALK_ANON_KEY=eyJ...
export SHADOWTALK_ACCESS_TOKEN=eyJ...  # optional, for authenticated chat
```

## Config

Config file: `~/.shadowtalk/config.json`
