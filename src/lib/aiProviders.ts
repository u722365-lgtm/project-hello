/**
 * Simple Lovable-only AI provider configuration.
 */

export type AiProviderId =
  | 'lovable'
  | 'shadowtalk'
  | 'google'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'groq'
  | 'gemini'
  | 'ollama'
  | '';

/** Legacy alias used across chat components. */
export type AIProvider = AiProviderId;

export interface AiProviderOption {
  id: AiProviderId;
  name: string;
  description: string;
  keyPlaceholder: string;
  docsUrl: string;
  keyHint?: string;
  defaultModel?: string;
}

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
  {
    id: 'lovable',
    name: 'ShadowTalk Pro (platform)',
    description: 'Built-in ShadowTalk cloud AI',
    keyPlaceholder: '',
    docsUrl: '',
    defaultModel: 'google/gemini-2.5-flash',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Bring your own OpenRouter key',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    defaultModel: 'openai/gpt-4o-mini',
  },
  {
    id: 'google',
    name: 'Google AI Studio',
    description: 'Bring your own Gemini key',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-2.5-flash',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Bring your own OpenAI key',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Bring your own Claude key',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-3-5-sonnet-latest',
  },
];

export interface AiConfig {
  preferredProvider: AiProviderId | null;
  useCustomKey: boolean;
  configuredAt?: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  preferredProvider: 'lovable',
  useCustomKey: false,
};
