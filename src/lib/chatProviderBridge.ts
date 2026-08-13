import type { AIProvider } from "@/components/chat/ProviderSelector";
import type { AiProviderId } from "@/lib/aiProviders";
import {
  type CustomAiKeysConfig,
  type CustomAiProviderId,
  loadCustomAiConfig,
  hasActiveCustomKey,
} from "@/lib/customApiKeys";
import { isTurboAvailable } from "@/lib/turbo";
import type { UserProviderKeyRow } from "@/hooks/useCustomApiKeys";

/**
 * Turbo is handled client-side via direct Groq/OpenRouter fetch.
 * When the UI selects 'turbo', the edge function is never called.
 * This function maps UI providers to what the edge function expects.
 */
export function toServerProvider(ui: AIProvider): AiProviderId | null {
  if (ui === 'turbo') return null; // Turbo bypasses the edge function
  return 'shadowtalk';
}

export function toUiProvider(server: AiProviderId): AIProvider | null {
  return 'shadowtalk';
}

export function isByokProvider(provider: AIProvider): boolean {
  return provider === 'turbo';
}

export function hasStoredKeyForProvider(
  provider: AIProvider,
  _keys: UserProviderKeyRow[],
  _localConfig: CustomAiKeysConfig = {
    provider: 'turbo',
    apiKey: '',
    usePlatformDefault: true,
    setupDismissed: false,
    model: '',
  },
): boolean {
  if (provider === 'turbo') return isTurboAvailable();
  return true;
}

export function resolveActiveUiProvider(
  _keys: UserProviderKeyRow[],
  _aiConfig: { useCustomKey: boolean; preferredProvider: AiProviderId | null },
  _localConfig: CustomAiKeysConfig = {
    provider: 'turbo',
    apiKey: '',
    usePlatformDefault: true,
    setupDismissed: false,
    model: '',
  },
): AIProvider {
  return 'turbo';
}

export function toCustomAiProviderId(provider: AIProvider): CustomAiProviderId {
  return (provider ?? 'turbo') as CustomAiProviderId;
}

export function buildChatProviderPayload(
  _uiProvider: AIProvider,
  _aiConfig: { useCustomKey: boolean; preferredProvider: AiProviderId | null },
  _keys: UserProviderKeyRow[],
): Record<string, unknown> {
  return {};
}
