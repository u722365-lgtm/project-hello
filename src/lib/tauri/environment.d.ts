import type {
  TauriLocalAuth,
  TauriOllamaClient,
  TauriSecureStore,
  TauriWhatsAppLocalBridge,
  TauriMediaPipeline,
} from "@/lib/tauri/types";

declare global {
  namespace Window {
    // Injected by Tauri Rust backend via window.__TAURI_INVOKE_HANDLERS__ or direct JS bindings.
    interface TauriBackends {
      localAuth?: TauriLocalAuth;
      ollamaClient?: TauriOllamaClient;
      secureStore?: TauriSecureStore;
      whatsappLocalBridge?: TauriWhatsAppLocalBridge;
      mediaPipeline?: TauriMediaPipeline;
    }

    // Top-level marker added during app bootstrap when running in Tauri.
    interface TauriGlobal {
      __TAURI__?: unknown;
      shadowtalkBackends?: TauriBackends;
    }
  }
}

export {};
