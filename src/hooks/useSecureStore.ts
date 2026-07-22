import { useState, useCallback, useEffect } from 'react';
import { getSecureStore, type SecureStore } from '@/lib/secureStore';

export function useSecureStore(): { store: SecureStore | null; initialized: boolean } {
  const [initialized, setInitialized] = useState(false);
  const [store, setStore] = useState<SecureStore | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSecureStore().then((s) => {
      if (!cancelled) {
        setStore(s);
        setInitialized(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { store, initialized };
}
