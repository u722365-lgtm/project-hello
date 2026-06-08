/**
 * Bundled Ollama lifecycle — auto-start on desktop launch, seed models, first-run pull.
 */

import { spawn, type ChildProcess } from 'child_process';
import { access, cp, mkdir, readFile, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import {
  DEFAULT_BUNDLED_MODEL,
  FALLBACK_BUNDLED_MODEL,
  getBundledOllamaLayout,
} from './ollamaPaths';
import { probeOllamaStatus, pullOllamaModel, setOllamaConfig } from './ollamaSidecar';

export type OllamaBootstrapState = {
  bundledBinaryPresent: boolean;
  managedProcess: boolean;
  reachable: boolean;
  models: string[];
  defaultModel: string;
  modelsPath: string;
  seeding: boolean;
  pulling: boolean;
  message?: string;
  error?: string;
};

type BundledManifest = {
  defaultModel?: string;
  fallbackModel?: string;
  version?: string;
};

let managedProcess: ChildProcess | null = null;
let weStartedOllama = false;
let bootstrapPromise: Promise<OllamaBootstrapState> | null = null;
let pullingDefault = false;

function getUserModelsPath(): string {
  return join(app.getPath('userData'), 'ollama-models');
}

function getSeedFlagPath(): string {
  return join(app.getPath('userData'), 'ollama-seed-complete.json');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readManifest(manifestPath: string): Promise<BundledManifest> {
  try {
    const raw = await readFile(manifestPath, 'utf-8');
    return JSON.parse(raw) as BundledManifest;
  } catch {
    return { defaultModel: DEFAULT_BUNDLED_MODEL, fallbackModel: FALLBACK_BUNDLED_MODEL };
  }
}

async function seedBundledModelsIfNeeded(
  bundledModelsDir: string,
  userModelsDir: string,
): Promise<void> {
  const flag = await getSeedFlagPath();
  if (await fileExists(flag)) return;
  if (!(await fileExists(bundledModelsDir))) {
    await writeFile(flag, JSON.stringify({ seededAt: Date.now(), source: 'none' }));
    return;
  }

  await mkdir(userModelsDir, { recursive: true });
  await cp(bundledModelsDir, userModelsDir, { recursive: true, force: false }).catch(() => {
    /* partial copy ok */
  });
  await writeFile(flag, JSON.stringify({ seededAt: Date.now(), source: bundledModelsDir }));
}

async function waitForOllama(maxMs = 30_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const status = await probeOllamaStatus();
    if (status.reachable) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

export async function startManagedOllamaIfNeeded(): Promise<{
  started: boolean;
  binary?: string;
  error?: string;
}> {
  const existing = await probeOllamaStatus();
  if (existing.reachable) {
    return { started: false };
  }

  const layout = getBundledOllamaLayout(process.resourcesPath, process.platform, process.arch);
  if (!(await fileExists(layout.binary))) {
    return { started: false, error: 'Bundled Ollama binary not found' };
  }

  const userModels = getUserModelsPath();
  await mkdir(userModels, { recursive: true });
  await seedBundledModelsIfNeeded(layout.bundledModels, userModels);

  const env = {
    ...process.env,
    OLLAMA_HOST: '127.0.0.1:11434',
    OLLAMA_MODELS: userModels,
  };

  managedProcess = spawn(layout.binary, ['serve'], {
    env,
    stdio: 'ignore',
    detached: false,
  });
  weStartedOllama = true;

  managedProcess.on('exit', () => {
    managedProcess = null;
    weStartedOllama = false;
  });

  const ok = await waitForOllama();
  if (!ok) {
    return { started: false, binary: layout.binary, error: 'Ollama failed to start' };
  }

  setOllamaConfig({ baseUrl: 'http://127.0.0.1:11434' });
  return { started: true, binary: layout.binary };
}

export async function ensureDefaultModelPulled(
  onProgress?: (status: string, percent?: number) => void,
): Promise<{ ok: boolean; model: string; error?: string }> {
  if (pullingDefault) {
    return { ok: false, model: DEFAULT_BUNDLED_MODEL, error: 'Pull already in progress' };
  }

  const status = await probeOllamaStatus();
  if (!status.reachable) {
    return { ok: false, model: DEFAULT_BUNDLED_MODEL, error: 'Ollama not reachable' };
  }

  const layout = getBundledOllamaLayout(process.resourcesPath, process.platform, process.arch);
  const manifest = await readManifest(layout.manifest);
  const preferred = manifest.defaultModel ?? DEFAULT_BUNDLED_MODEL;
  const fallback = manifest.fallbackModel ?? FALLBACK_BUNDLED_MODEL;

  const hasPreferred = status.models.some(
    (m) => m === preferred || m.startsWith(`${preferred}:`),
  );
  if (hasPreferred) {
    setOllamaConfig({ model: preferred });
    return { ok: true, model: preferred };
  }

  pullingDefault = true;
  try {
    let result = await pullOllamaModel(preferred, onProgress);
    if (!result.ok) {
      onProgress?.(`Retrying with ${fallback}…`);
      result = await pullOllamaModel(fallback, onProgress);
      if (result.ok) {
        setOllamaConfig({ model: fallback });
        return { ok: true, model: fallback };
      }
      return { ok: false, model: preferred, error: result.error };
    }
    setOllamaConfig({ model: preferred });
    return { ok: true, model: preferred };
  } finally {
    pullingDefault = false;
  }
}

export async function bootstrapBundledOllama(options?: {
  pullDefaultModel?: boolean;
  onProgress?: (status: string, percent?: number) => void;
}): Promise<OllamaBootstrapState> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const layout = getBundledOllamaLayout(process.resourcesPath, process.platform, process.arch);
    const manifest = await readManifest(layout.manifest);
    const defaultModel = manifest.defaultModel ?? DEFAULT_BUNDLED_MODEL;
    const bundledBinaryPresent = await fileExists(layout.binary);
    const userModels = getUserModelsPath();

    let message = bundledBinaryPresent
      ? 'Bundled Ollama runtime detected'
      : 'Using system Ollama (install from ollama.com if missing)';

    const start = await startManagedOllamaIfNeeded();
    if (start.error && !start.started) {
      const probe = await probeOllamaStatus();
      if (!probe.reachable) {
        return {
          bundledBinaryPresent,
          managedProcess: false,
          reachable: false,
          models: [],
          defaultModel,
          modelsPath: userModels,
          seeding: false,
          pulling: false,
          message,
          error: start.error,
        };
      }
    }

    if (start.started) {
      message = 'Started bundled Ollama server';
    }

    const status = await probeOllamaStatus();
    let pulling = false;

    if (options?.pullDefaultModel && status.reachable && status.models.length === 0) {
      pulling = true;
      const pull = await ensureDefaultModelPulled(options.onProgress);
      pulling = false;
      if (pull.ok) {
        message = `Default model ready: ${pull.model}`;
      } else if (pull.error) {
        return {
          bundledBinaryPresent,
          managedProcess: weStartedOllama,
          reachable: status.reachable,
          models: status.models,
          defaultModel: pull.model,
          modelsPath: userModels,
          seeding: false,
          pulling: false,
          message,
          error: pull.error,
        };
      }
    }

    const finalStatus = await probeOllamaStatus();
    return {
      bundledBinaryPresent,
      managedProcess: weStartedOllama,
      reachable: finalStatus.reachable,
      models: finalStatus.models,
      defaultModel: finalStatus.activeModel || defaultModel,
      modelsPath: userModels,
      seeding: false,
      pulling,
      message,
    };
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

export function stopManagedOllama(): void {
  if (weStartedOllama && managedProcess) {
    managedProcess.kill();
    managedProcess = null;
    weStartedOllama = false;
  }
}

export async function getOllamaBootstrapSnapshot(): Promise<OllamaBootstrapState> {
  const layout = getBundledOllamaLayout(process.resourcesPath, process.platform, process.arch);
  const manifest = await readManifest(layout.manifest);
  const status = await probeOllamaStatus();
  return {
    bundledBinaryPresent: await fileExists(layout.binary),
    managedProcess: weStartedOllama,
    reachable: status.reachable,
    models: status.models,
    defaultModel: manifest.defaultModel ?? DEFAULT_BUNDLED_MODEL,
    modelsPath: getUserModelsPath(),
    seeding: false,
    pulling: pullingDefault,
    message: status.reachable ? 'Ollama ready' : status.error,
  };
}
