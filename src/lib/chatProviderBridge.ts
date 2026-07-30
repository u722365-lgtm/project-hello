import type { AIProvider } from "@/components/chat/ProviderSelector";
import type { AiProviderId } from "@/lib/aiProviders";
import {
  type CustomAiKeysConfig,
  type CustomAiProviderId,
  loadCustomAiConfig,
  hasActiveCustomKey,
} from "@/lib/customApiKeys";
import type { UserProviderKeyRow } from "@/hooks/useCustomApiKeys";

export function toServerProvider(_ui: AIProvider): AiProviderId | null {
  return "lovable";
}

export function toUiProvider(_server: AiProviderId): AIProvider | null {
  return "lovable";
}

export function isByokProvider(_provider: AIProvider): boolean {
  return false;
}

export function hasStoredKeyForProvider(
  _provider: AIProvider,
  _keys: UserProviderKeyRow[],
  _localConfig: CustomAiKeysConfig = {
    provider: "lovable",
    apiKey: "",
    usePlatformDefault: true,
    setupDismissed: false,
    model: "",
  },
): boolean {
  return true;
}

export function resolveActiveUiProvider(
  _keys: UserProviderKeyRow[],
  _aiConfig: { useCustomKey: boolean; preferredProvider: AiProviderId | null },
  _localConfig: CustomAiKeysConfig = {
    provider: "lovable",
    apiKey: "",
    usePlatformDefault: true,
    setupDismissed: false,
    model: "",
  },
): AIProvider {
  return "lovable";
}

export function toCustomAiProviderId(provider: AIProvider): CustomAiProviderId {
  return "lovable";
}

export function buildChatProviderPayload(
  _uiProvider: AIProvider,
  _aiConfig: { useCustomKey: boolean; preferredProvider: AiProviderId | null },
  _keys: UserProviderKeyRow[],
): Record<string, unknown> {
  return {};
}
