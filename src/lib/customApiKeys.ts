/**
 * Lovable-only AI configuration stored locally on device.
 */

export type CustomAiProviderId = 'lovable';

export type CustomAiKeysConfig = {
  provider: CustomAiProviderId;
  apiKey: string;
  model?: string;
  usePlatformDefault: boolean;
  setupDismissed: boolean;
};

export const CUSTOM_AI_STORAGE_KEY = 'shadowtalk_custom_ai_keys';

export const AI_PROVIDER_OPTIONS: {
  id: CustomAiProviderId;
  label: string;
  description: string;
  keyPlaceholder: string;
  keyHint: string;
  defaultModel: string;
  docsUrl: string;
}[] = [
  {
    id: 'lovable',
    label: 'ShadowTalk Pro (platform)',
    description: 'Use built-in ShadowTalk cloud AI',
    keyPlaceholder: '',
    keyHint: '',
    defaultModel: 'google/gemini-2.5-flash',
    docsUrl: '',
  },
];

export const DEFAULT_CUSTOM_AI_CONFIG: CustomAiKeysConfig = {
  provider: 'lovable',
  apiKey: '',
  model: '',
  usePlatformDefault: true,
  setupDismissed: false,
};

export function loadCustomAiConfig(): CustomAiKeysConfig {
  try {
    const raw = localStorage.getItem(CUSTOM_AI_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<CustomAiKeysConfig>;
    return {
      ...DEFAULT_CUSTOM_AI_CONFIG,
      ...parsed,
      provider: (parsed.provider as CustomAiProviderId) || DEFAULT_CUSTOM_AI_CONFIG.provider,
    };
  } catch {
    return { ...DEFAULT_CUSTOM_AI_CONFIG };
  }
}

export function saveCustomKeysConfig(config: CustomAiKeysConfig): void {
  localStorage.setItem(CUSTOM_AI_STORAGE_KEY, JSON.stringify(config));
}

export function mergeChatRequestBody(
  base: Record<string, unknown>,
  _config: CustomAiKeysConfig,
): Record<string, unknown> {
  return base;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••';
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export function hasActiveCustomKey(_config: CustomAiKeysConfig): boolean {
  return false;
}

export function shouldShowApiKeysSetup(_config: CustomAiKeysConfig): boolean {
  return false;
}

export const saveCustomAiConfig = saveCustomKeysConfig;
