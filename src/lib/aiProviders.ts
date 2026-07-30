/**
 * Simple Lovable-only AI provider configuration.
 */

export type AiProviderId = 'lovable';

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
