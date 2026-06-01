import type { Json } from "@/integrations/supabase/types";

export const NOTIFICATION_PREFS_KEY = "notification_preferences";

export interface ExtendedNotificationPrefs {
  productUpdates: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
}

export const DEFAULT_EXTENDED_NOTIF: ExtendedNotificationPrefs = {
  productUpdates: true,
  securityAlerts: true,
  weeklyDigest: false,
};

export function parseExtendedNotif(raw: Json | null | undefined): ExtendedNotificationPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_EXTENDED_NOTIF };
  }
  const o = raw as Record<string, unknown>;
  return {
    productUpdates: o.productUpdates !== false,
    securityAlerts: o.securityAlerts !== false,
    weeklyDigest: o.weeklyDigest === true,
  };
}
