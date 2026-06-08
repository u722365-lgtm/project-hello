/** Pure path helpers for bundled Ollama layout (mirrors electron/src/ollamaPaths.ts). */

export const DEFAULT_BUNDLED_MODEL = 'qwen2.5:7b';
export const FALLBACK_BUNDLED_MODEL = 'phi3:mini';

export function resolveOllamaPlatformKey(platform: NodeJS.Platform, arch: string): string {
  if (platform === 'win32') {
    return arch === 'arm64' ? 'win32-arm64' : 'win32-x64';
  }
  if (platform === 'darwin') {
    return `darwin-${arch}`;
  }
  return `linux-${arch}`;
}

export function ollamaBinaryName(platform: NodeJS.Platform): string {
  return platform === 'win32' ? 'ollama.exe' : 'ollama';
}

export function getBundledOllamaLayout(resourcesPath: string, platform: NodeJS.Platform, arch: string) {
  const platformKey = resolveOllamaPlatformKey(platform, arch);
  const binDir = `${resourcesPath}/ollama/bin/${platformKey}`;
  const binary = `${binDir}/${ollamaBinaryName(platform)}`;
  const bundledModels = `${resourcesPath}/ollama/models`;
  const manifest = `${resourcesPath}/ollama/manifest.json`;
  return { platformKey, binDir, binary, bundledModels, manifest };
}
