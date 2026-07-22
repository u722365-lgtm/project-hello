import type {
  TauriLocalAuth,
  TauriOllamaClient,
  TauriSecureStore,
  TauriWhatsAppLocalBridge,
  TauriMediaPipeline,
} from "@/lib/tauri/types";

declare global {
  namespace Window {
    interface TauriInvokeOptions {
      args?: Record<string, unknown>;
    }

    interface TauriWindowBridge {
      invoke<T = unknown>(cmd: string, args?: TauriInvokeOptions): Promise<T>;
    }

    interface TauriRuntime {
      invoke?: Window["TauriWindowBridge"]["invoke"];
      [key: string]: unknown;
    }

    interface TauriBackends {
      localAuth?: TauriLocalAuth;
      ollamaClient?: TauriOllamaClient;
      secureStore?: TauriSecureStore;
      whatsappLocalBridge?: TauriWhatsAppLocalBridge;
      mediaPipeline?: TauriMediaPipeline;
    }

    interface TauriGlobal {
      __TAURI__?: TauriRuntime;
      shadowtalkBackends?: TauriBackends;
    }
  }
}

export {};
