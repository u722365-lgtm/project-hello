/**
 * BYOK — Bring Your Own Key module
 * 
 * Encrypted key storage + multi-provider support for power users.
 * When BYOK is active, requests go directly from user's browser to
 * their chosen provider, costing $0 from the shared free pool.
 */

export { encryptAndStoreKey, decryptKey, removeStoredKey, listStoredKeyProviders, getKeyMetadata, maskKey } from './crypto';
export type { EncryptedKeyData } from './crypto';

export { BYOK_PROVIDERS, getByokProvider, isValidKeyForProvider } from './providers';
export type { ByokProviderId, ByokProviderConfig, ByokModel } from './providers';

export { byokChatStream, byokChatComplete } from './client';
export type { ByokStreamOptions, ByokStreamResult } from './client';
