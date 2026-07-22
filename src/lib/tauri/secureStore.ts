export interface TauriSecureStoreItem {
  key: string;
  value: string;
  service?: string;
  account?: string;
}

export interface TauriSecureStore {
  get(key: string): Promise<string | null>;
  set(item: TauriSecureStoreItem): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
