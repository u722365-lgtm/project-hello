/**
 * Runtime platform detection.
 *
 * Add Tauri detection here later without changing callers.
 */
export function detectRuntimePlatform(): 'tauri' | 'browser' | 'capacitor' | 'electron' {
  if (typeof window !== 'undefined' && (window as any)?.__TAURI__) return 'tauri';
  if (typeof window !== 'undefined' && window?.shadowtalkDesktop?.isDesktop) return 'electron';
  if (typeof window !== 'undefined' && (window as any)?.Capacitor) return 'capacitor';
  return 'browser';
}
