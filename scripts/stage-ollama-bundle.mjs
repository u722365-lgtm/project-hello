#!/usr/bin/env node
/**
 * Downloads Ollama binary for the current OS/arch into electron/resources/ollama/bin/
 * Optional: STAGE_OLLAMA_MODEL=1 pulls default model into resources/ollama/models
 */
import { execSync, spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OLLAMA_RES = join(ROOT, 'electron/resources/ollama');
const VERSION = process.env.OLLAMA_VERSION || 'v0.30.6';
const STAGE_HOST = '127.0.0.1:11435';

function platformKey() {
  const { platform, arch } = process;
  if (platform === 'win32') return arch === 'arm64' ? 'win32-arm64' : 'win32-x64';
  if (platform === 'darwin') return `darwin-${arch}`;
  return `linux-${arch}`;
}

function assetName() {
  const key = platformKey();
  if (key.startsWith('win32')) return `ollama-windows-${key.includes('arm64') ? 'arm64' : 'amd64'}.zip`;
  if (key.startsWith('darwin')) return 'ollama-darwin.tgz';
  return `ollama-linux-${process.arch}.tar.zst`;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function waitForOllama(binaryPath, env, maxMs = 60_000) {
  const base = `http://${STAGE_HOST}`;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${base}/api/tags`);
      if (res.ok) return true;
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Ollama did not become ready within ${maxMs}ms (${binaryPath})`);
}

function stopServeProcess(proc) {
  if (!proc?.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid, 'SIGTERM');
    }
  } catch {
    try {
      proc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const release = await fetch(`https://api.github.com/repos/ollama/ollama/releases/tags/${VERSION}`);
  if (!release.ok) throw new Error(`Release ${VERSION} not found`);
  const json = await release.json();
  const name = assetName();
  const asset = json.assets?.find((a) => a.name === name);
  if (!asset) throw new Error(`Asset ${name} not found in ${VERSION}`);

  const binRoot = join(OLLAMA_RES, 'bin', platformKey());
  mkdirSync(binRoot, { recursive: true });
  const archive = join(binRoot, asset.name);
  console.log(`Downloading ${asset.name}…`);
  await download(asset.browser_download_url, archive);

  const binaryName = process.platform === 'win32' ? 'ollama.exe' : 'ollama';
  const binaryPath = join(binRoot, binaryName);

  if (name.endsWith('.zip')) {
    execSync(`unzip -o "${archive}" -d "${binRoot}"`, { stdio: 'inherit' });
  } else if (name.endsWith('.tgz')) {
    execSync(`tar -xzf "${archive}" -C "${binRoot}"`, { stdio: 'inherit' });
  } else if (name.endsWith('.tar.zst')) {
    execSync(`tar --zstd -xf "${archive}" -C "${binRoot}"`, { stdio: 'inherit' });
  }

  try {
    const found = execSync(`find "${binRoot}" -name '${binaryName}' -type f | head -1`, {
      encoding: 'utf-8',
    }).trim();
    if (found && found !== binaryPath) {
      execSync(`cp "${found}" "${binaryPath}" && chmod +x "${binaryPath}"`);
    } else if (existsSync(binaryPath)) {
      execSync(`chmod +x "${binaryPath}"`);
    }
  } catch {
    if (existsSync(binaryPath)) execSync(`chmod +x "${binaryPath}"`);
  }

  const manifestPath = join(OLLAMA_RES, 'manifest.json');
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
    : {};
  manifest.version = VERSION.replace(/^v/, '');
  manifest.stagedAt = new Date().toISOString();
  manifest.platform = platformKey();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Ollama binary staged: ${binaryPath}`);

  if (process.env.STAGE_OLLAMA_MODEL === '1' && existsSync(binaryPath)) {
    const modelsDir = join(OLLAMA_RES, 'models');
    mkdirSync(modelsDir, { recursive: true });
    const model = process.env.STAGE_OLLAMA_MODEL_NAME || manifest.defaultModel || 'phi3:mini';
    console.log(`Pulling model ${model} into ${modelsDir} (this may take a while)…`);

    const env = {
      ...process.env,
      OLLAMA_MODELS: modelsDir,
      OLLAMA_HOST: STAGE_HOST,
    };

    const serveProc = spawn(binaryPath, ['serve'], {
      env,
      stdio: 'ignore',
      detached: process.platform !== 'win32',
    });

    try {
      await waitForOllama(binaryPath, env);
      execSync(`"${binaryPath}" pull ${model}`, { env, stdio: 'inherit' });
      manifest.bundledModels = [model];
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`Model staged: ${model}`);
    } finally {
      stopServeProcess(serveProc);
    }
  }

  console.log('Done. Run npm run desktop:make to include in the installer.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
