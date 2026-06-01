import { useCallback } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import {
  CHAT_PREFERENCES_KEY,
  DEFAULT_CHAT_PREFERENCES,
  type ChatPreferences,
} from "@/lib/chatSettings";

export function useChatSettings() {
  const { value, save, isLoading, isSaving } = useUserSettings<ChatPreferences>(
    CHAT_PREFERENCES_KEY,
    DEFAULT_CHAT_PREFERENCES,
  );

  const preferences = value ?? DEFAULT_CHAT_PREFERENCES;

  const updatePreferences = useCallback(
    async (patch: Partial<ChatPreferences>) => {
      const next = { ...preferences, ...patch };
      await save(next);
      return next;
    },
    [preferences, save],
  );

  return {
    preferences,
    updatePreferences,
    isLoading,
    isSaving,
  };
}
