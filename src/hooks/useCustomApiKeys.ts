import { useCallback, useEffect, useState } from "react";
import { backend } from "@/integrations/local/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { AiConfig, AiProviderId } from "@/lib/aiProviders";
import { DEFAULT_AI_CONFIG } from "@/lib/aiProviders";

export interface UserProviderKeyRow {
  id: string;
  provider: AiProviderId;
  label: string | null;
  key_prefix: string;
  verified_at: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const BYOK_EDGE_ENABLED = import.meta.env.VITE_ENABLE_BYOK_EDGE === "1";

import { isCloudConfigured } from '@/lib/cloudEnv';
import {
  encryptAndStoreKey,
  removeStoredKey,
  listStoredKeyProviders,
  getKeyMetadata,
} from '@/lib/byok/crypto';

async function invokeKeys<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  if (!BYOK_EDGE_ENABLED) {
    throw new Error("BYOK key management is not enabled in this deployment");
  }

  if (!isCloudConfigured()) {
    if (action === "list") {
      const stored = listStoredKeyProviders();
      const keys = stored.map(p => {
        const meta = getKeyMetadata(p);
        const dateStr = meta?.savedAt || new Date().toISOString();
        return {
          provider: p as AiProviderId,
          label: "Local Key",
          key_prefix: '****',
          verified_at: dateStr,
          is_active: true,
          is_default: true,
          created_at: dateStr,
          updated_at: dateStr,
        } as UserProviderKeyRow;
      });
      return { keys, configured: { preferredProvider: keys[0]?.provider || null, useCustomKey: keys.length > 0 } } as unknown as T;
    }
    if (action === "verify") {
      const key = body?.apiKey as string;
      if (!key || key.length < 8) return { success: false, error: "API key is too short" } as unknown as T;
      return { success: true, message: "Key looks valid (local mode)" } as unknown as T;
    }
    if (action === "save") {
      const p = body?.provider as string;
      const k = body?.apiKey as string;
      await encryptAndStoreKey(p, k);
      return { success: true, message: "Key saved locally", configured: { preferredProvider: p, useCustomKey: true } } as unknown as T;
    }
    if (action === "delete") {
      const p = body?.provider as string;
      removeStoredKey(p);
      return { success: true } as unknown as T;
    }
    if (action === "set-default") {
      return { success: true } as unknown as T;
    }
  }

  const { data: session } = await backend.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Sign in required");

  const base = '';
  const url = action === "list" ? `${base}?action=list` : `${base}?action=${action}`;

  const res = await fetch(url, {
    method: action === "list" ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: "",
    },
    body: action === "list" ? undefined : JSON.stringify(body ?? {}),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json as T;
}

export function useCustomApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<UserProviderKeyRow[]>([]);
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAiConfig = useCallback(async () => {
    if (!user) {
      setAiConfig(DEFAULT_AI_CONFIG);
      return;
    }
    const { data } = await backend
      .from("user_settings")
      .select("setting_value")
      .eq("user_id", user.id)
      .eq("setting_key", "ai_config")
      .maybeSingle();

    if (data?.setting_value && typeof data.setting_value === "object") {
      setAiConfig({ ...DEFAULT_AI_CONFIG, ...(data.setting_value as unknown as AiConfig) });
    }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setKeys([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      if (!BYOK_EDGE_ENABLED) {
        setKeys([]);
      } else {
        const { keys: rows } = await invokeKeys<{ keys: UserProviderKeyRow[] }>("list");
        setKeys(rows);
      }
      await loadAiConfig();
    } catch (e) {
      console.error("[useCustomApiKeys] load failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadAiConfig]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyKey = useCallback(
    async (provider: AiProviderId, apiKey: string) => {
      if (!BYOK_EDGE_ENABLED) {
        toast({
          title: "BYOK unavailable",
          description: "API key management is not enabled on this deployment yet.",
          variant: "destructive",
        });
        return false;
      }
      setIsVerifying(true);
      try {
        const result = await invokeKeys<{ success: boolean; message?: string; error?: string }>(
          "verify",
          { provider, apiKey },
        );
        if (!result.success) {
          toast({
            title: "Verification failed",
            description: result.error || result.message || "Invalid API key",
            variant: "destructive",
          });
          return false;
        }
        toast({ title: "Key verified", description: result.message });
        return true;
      } catch (e) {
        toast({
          title: "Verification failed",
          description: e instanceof Error ? e.message : "Could not verify key",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [toast],
  );

  const saveKey = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string, setAsDefault = true) => {
      if (!BYOK_EDGE_ENABLED) {
        toast({
          title: "BYOK unavailable",
          description: "API key management is not enabled on this deployment yet.",
          variant: "destructive",
        });
        return false;
      }
      setIsSaving(true);
      try {
        const result = await invokeKeys<{
          success: boolean;
          message?: string;
          error?: string;
          key?: UserProviderKeyRow;
          configured?: AiConfig;
        }>("save", { provider, apiKey, label, setAsDefault });

        if (!result.success) {
          toast({
            title: "Could not save key",
            description: result.error || "Verification failed",
            variant: "destructive",
          });
          return false;
        }

        if (result.configured) setAiConfig(result.configured);
        toast({
          title: "API key configured",
          description: `${provider} is ready. ShadowTalk will use your key for chat.`,
        });
        await refresh();
        return true;
      } catch (e) {
        toast({
          title: "Save failed",
          description: e instanceof Error ? e.message : "Could not save API key",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [toast, refresh],
  );

  const verifyAndSave = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string) => {
      const ok = await verifyKey(provider, apiKey);
      if (!ok) return false;
      return saveKey(provider, apiKey, label, true);
    },
    [verifyKey, saveKey],
  );

  const removeKey = useCallback(
    async (provider: AiProviderId) => {
      if (!BYOK_EDGE_ENABLED) {
        toast({
          title: "BYOK unavailable",
          description: "API key management is not enabled on this deployment yet.",
          variant: "destructive",
        });
        return;
      }
      try {
        await invokeKeys("delete", { provider });
        toast({ title: "API key removed" });
        await refresh();
      } catch (e) {
        toast({
          title: "Remove failed",
          description: e instanceof Error ? e.message : "Could not remove key",
          variant: "destructive",
        });
      }
    },
    [toast, refresh],
  );

  const switchToPlatformDefault = useCallback(async () => {
    setAiConfig(DEFAULT_AI_CONFIG);
    if (!user) return true;
    try {
      const now = new Date().toISOString();
      await backend.from("user_settings").upsert(
        {
          user_id: user.id,
          setting_key: "ai_config",
          setting_value: { preferredProvider: null, useCustomKey: false },
          updated_at: now,
        },
        { onConflict: "user_id,setting_key" },
      );
      return true;
    } catch (e) {
      toast({
        title: "Could not switch provider",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  const setDefault = useCallback(
    async (provider: AiProviderId) => {
      if (!BYOK_EDGE_ENABLED) {
        toast({
          title: "BYOK unavailable",
          description: "API key management is not enabled on this deployment yet.",
          variant: "destructive",
        });
        return;
      }
      try {
        await invokeKeys("set-default", { provider });
        setAiConfig((c) => ({ ...c, preferredProvider: provider, useCustomKey: true }));
        await refresh();
        toast({ title: "Default provider updated" });
      } catch (e) {
        toast({
          title: "Update failed",
          description: e instanceof Error ? e.message : "Could not set default",
          variant: "destructive",
        });
      }
    },
    [toast, refresh],
  );

  const hasVerifiedKey = keys.some((k) => k.verified_at && k.is_active);
  const defaultKey = keys.find((k) => k.is_default) || keys.find((k) => k.verified_at);

  return {
    keys,
    aiConfig,
    isLoading,
    isVerifying,
    isSaving,
    hasVerifiedKey,
    defaultKey,
    verifyKey,
    saveKey,
    verifyAndSave,
    removeKey,
    setDefault,
    switchToPlatformDefault,
    refresh,
  };
}
