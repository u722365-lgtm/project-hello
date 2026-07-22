import { detectRuntimePlatform } from "@/lib/tauri/runtimePlatform";
import type { ChatApi } from "./chat";
import type { TauriOllamaClient } from "@/lib/tauri/types";

export interface ServerApi {
  health(): Promise<{ ok: boolean; platform: string }>;
}

function getBackends() {
  return (typeof window !== 'undefined' ? (window as any).shadowtalkBackends : undefined) || {};
}

export async function server(): Promise<ServerApi> {
  const platform = detectRuntimePlatform();
  if (platform === 'tauri') {
    const client = getBackends().ollamaClient as TauriOllamaClient | undefined;
    if (client) {
      return {
        health: async () => ({ ok: true, platform: 'tauri-ollama' }),
      };
    }
  }

  const { getChatFunctionUrl, getChatFetchHeaders } = await import('@/lib/supabaseEnv');
  const url = getChatFunctionUrl();
  return {
    health: async () => {
      if (!url) return { ok: false, platform: 'supabase' };
      try {
        const res = await fetch(`${url}/health`, {
          method: 'GET',
          headers: getChatFetchHeaders(),
        });
        return { ok: res.ok, platform: 'supabase' };
      } catch {
        return { ok: false, platform: 'supabase' };
      }
    },
  };
}
