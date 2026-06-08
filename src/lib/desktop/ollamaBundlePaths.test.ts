import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUNDLED_MODEL,
  FALLBACK_BUNDLED_MODEL,
  getBundledOllamaLayout,
  ollamaBinaryName,
  resolveOllamaPlatformKey,
} from './ollamaBundlePaths';

describe('ollamaBundlePaths', () => {
  it('resolves platform keys for common targets', () => {
    expect(resolveOllamaPlatformKey('linux', 'x64')).toBe('linux-x64');
    expect(resolveOllamaPlatformKey('darwin', 'arm64')).toBe('darwin-arm64');
    expect(resolveOllamaPlatformKey('win32', 'x64')).toBe('win32-x64');
    expect(resolveOllamaPlatformKey('win32', 'arm64')).toBe('win32-arm64');
  });

  it('uses .exe on Windows', () => {
    expect(ollamaBinaryName('win32')).toBe('ollama.exe');
    expect(ollamaBinaryName('linux')).toBe('ollama');
  });

  it('builds bundled layout paths', () => {
    const layout = getBundledOllamaLayout('/app/resources', 'linux', 'x64');
    expect(layout.platformKey).toBe('linux-x64');
    expect(layout.binary).toBe('/app/resources/ollama/bin/linux-x64/ollama');
    expect(layout.manifest).toBe('/app/resources/ollama/manifest.json');
  });

  it('exposes default model constants', () => {
    expect(DEFAULT_BUNDLED_MODEL).toBe('qwen2.5:7b');
    expect(FALLBACK_BUNDLED_MODEL).toBe('phi3:mini');
  });
});
