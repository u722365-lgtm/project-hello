/**
 * useBYOK — React hook for managing BYOK (Bring Your Own Key) state.
 *
 * Provides:
 *   - List of configured providers with key status
 *   - Add/remove/validate keys
 *   - Reactive state when keys are added/removed
 */

import { useState, useEffect, useCallback } from 'react';
import {
  encryptAndStoreKey,
  decryptKey,
  removeStoredKey,
  listStoredKeyProviders,
  getKeyMetadata,
  maskKey,
} from '@/lib/byok/crypto';
import { BYOK_PROVIDERS, getByokProvider, isValidKeyForProvider, type ByokProviderId, type ByokProviderConfig } from '@/lib/byok/providers';

export interface ByokProviderStatus {
  provider: ByokProviderConfig;
  hasKey: boolean;
  maskedKey: string | null;
  savedAt: string | null;
}

export interface UseBYOKReturn {
  /** All supported providers with their key status */
  providers: ByokProviderStatus[];
  /** Providers that have keys configured */
  configuredProviders: ByokProviderStatus[];
  /** Check if any BYOK key is available */
  hasAnyKey: boolean;
  /** Get decrypted key for a provider (async) */
  getKey: (providerId: ByokProviderId) => Promise<string | null>;
  /** Save a new API key for a provider */
  saveKey: (providerId: ByokProviderId, apiKey: string) => Promise<void>;
  /** Remove a stored key */
  removeKey: (providerId: ByokProviderId) => void;
  /** Validate a key format before saving */
  validateKey: (providerId: ByokProviderId, apiKey: string) => { valid: boolean; error: string };
  /** Refresh provider statuses */
  refresh: () => void;
}

export function useBYOK(): UseBYOKReturn {
  const [providers, setProviders] = useState<ByokProviderStatus[]>([]);

  const refresh = useCallback(() => {
 const storedProviders = listStoredKeyProviders();
    const statuses: ByokProviderStatus[] = BYOK_PROVIDERS.map(p => {
      const hasKey = storedProviders.includes(p.id);
      const meta = hasKey ? getKeyMetadata(p.id) : null;
      return {
        provider: p,
        hasKey,
        maskedKey: null, // Decryption is async, populated on demand
        savedAt: meta?.savedAt || null,
      };
    });
    setProviders(statuses);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const configuredProviders = providers.filter(p => p.hasKey);
  const hasAnyKey = configuredProviders.length > 0;

  const getKey = useCallback(async (providerId: ByokProviderId) => {
    return decryptKey(providerId);
  }, []);

  const saveKey = useCallback(async (providerId: ByokProviderId, apiKey: string) => {
    const trimmed = apiKey.trim();
    if (!isValidKeyForProvider(providerId, trimmed)) {
      throw new Error(`Invalid key format for ${getByokProvider(providerId)?.name || providerId}`);
    }
    await encryptAndStoreKey(providerId, trimmed);
    refresh();
  }, [refresh]);

  const removeKey = useCallback((providerId: ByokProviderId) => {
    removeStoredKey(providerId);
    refresh();
  }, [refresh]);

  const validateKey = useCallback((providerId: ByokProviderId, apiKey: string) => {
    if (!apiKey || apiKey.trim().length < 10) {
      return { valid: false, error: 'API key is too short' };
    }
    if (!isValidKeyForProvider(providerId, apiKey.trim())) {
      const provider = getByokProvider(providerId);
      const expected = provider?.keyPrefix[0] || 'valid prefix';
      return { valid: false, error: `Key should start with ${expected}` };
    }
    return { valid: true, error: '' };
  }, []);

  return {
    providers,
    configuredProviders,
    hasAnyKey,
    getKey,
    saveKey,
    removeKey,
    validateKey,
    refresh,
  };
}