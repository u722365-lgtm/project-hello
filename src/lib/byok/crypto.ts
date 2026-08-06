/**
 * BYOK Encryption — AES-GCM 256-bit encryption for API keys stored in browser.
 * 
 * Keys are encrypted with a user-derived key (from a device fingerprint + secret)
 * before being stored in localStorage. This prevents casual reading of keys
 * from DevTools or localStorage dumps.
 * 
 * Security model:
 *   - Encryption key derived from device fingerprint via PBKDF2
 *   - AES-256-GCM provides authenticated encryption
 *   - Each key gets a unique IV (nonce)
 *   - If fingerprint changes, keys become unreadable (user re-enters them)
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const STORAGE_PREFIX = 'shadowtalk_encrypted_key_';

// Device fingerprint — stable per browser/device but not user-specific
function getDeviceFingerprint(): string {
  const nav = navigator as any;
  const parts = [
    nav.userAgent || '',
    nav.language || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    (nav.hardwareConcurrency || 0).toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  ];
  return parts.join('||');
}

// Derive a stable encryption key from device fingerprint
async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // Add a static salt component so the key is deterministic per device
  const baseMaterial = 'ShadowTalkBYOKVault::' + getDeviceFingerprint();
  const salt = encoder.encode('ST-BYOK-SALT-v1');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(baseMaterial),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Serialize CryptoKey params for storage alongside ciphertext
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export interface EncryptedKeyData {
  /** Base64-encoded IV */
  iv: string;
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Provider ID for lookup */
  provider: string;
  /** Timestamp when key was saved */
  savedAt: string;
}

/**
 * Encrypt an API key and store it in localStorage.
 */
export async function encryptAndStoreKey(
  provider: string,
  apiKey: string,
): Promise<void> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoder.encode(apiKey)
  );

  const data: EncryptedKeyData = {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
    provider,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_PREFIX + provider, JSON.stringify(data));
}

/**
 * Decrypt and retrieve an API key from localStorage.
 * Returns null if not found or decryption fails.
 */
export async function decryptKey(provider: string): Promise<string | null> {
  const raw = localStorage.getItem(STORAGE_PREFIX + provider);
  if (!raw) return null;

  try {
    const data: EncryptedKeyData = JSON.parse(raw);
    const key = await deriveKey();
    const iv = new Uint8Array(base64ToArrayBuffer(data.iv));
    const ciphertext = base64ToArrayBuffer(data.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed — key was encrypted on a different device or fingerprint changed
    console.warn(`[BYOK] Failed to decrypt key for ${provider}. It may need to be re-entered.`);
    return null;
  }
}

/**
 * Remove an encrypted key from localStorage.
 */
export function removeStoredKey(provider: string): void {
  localStorage.removeItem(STORAGE_PREFIX + provider);
}

/**
 * List all providers that have encrypted keys stored.
 */
export function listStoredKeyProviders(): string[] {
  const providers: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      providers.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return providers;
}

/**
 * Get metadata (provider, savedAt) for a stored key without decrypting.
 */
export function getKeyMetadata(provider: string): { provider: string; savedAt: string } | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + provider);
  if (!raw) return null;
  try {
    const data: EncryptedKeyData = JSON.parse(raw);
    return { provider: data.provider, savedAt: data.savedAt };
  } catch {
    return null;
  }
}

/**
 * Mask a key for display: sk-abc...xyz
 */
export function maskKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
