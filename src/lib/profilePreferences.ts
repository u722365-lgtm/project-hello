export const UI_COMPACT_KEY = "shadowtalk_ui_compact";
export const UI_SOUND_KEY = "shadowtalk_ui_sound";
export const UI_LANGUAGE_KEY = "shadowtalk_ui_language";
export const CHAT_ENTER_TO_SEND_KEY = "shadowtalk_chat_enter_to_send";
export const CHAT_SHOW_TIMESTAMPS_KEY = "shadowtalk_chat_show_timestamps";
export const NOTIF_PRODUCT_UPDATES_KEY = "shadowtalk_notif_product_updates";
export const NOTIF_SECURITY_ALERTS_KEY = "shadowtalk_notif_security_alerts";
export const NOTIF_WEEKLY_DIGEST_KEY = "shadowtalk_notif_weekly_digest";

function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const raw = localStorage.getItem(key);
  if (raw === null) return defaultValue;
  return raw === "1" || raw === "true";
}

function writeBool(key: string, value: boolean): void {
  localStorage.setItem(key, value ? "1" : "0");
}

export function getUiCompactMode(): boolean {
  return readBool(UI_COMPACT_KEY, false);
}

export function setUiCompactMode(enabled: boolean): void {
  writeBool(UI_COMPACT_KEY, enabled);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("shadowtalk-compact", enabled);
  }
}

export function getUiSoundEnabled(): boolean {
  return readBool(UI_SOUND_KEY, true);
}

export function setUiSoundEnabled(enabled: boolean): void {
  writeBool(UI_SOUND_KEY, enabled);
}

export function getUiLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(UI_LANGUAGE_KEY) || "en";
}

export function setUiLanguage(code: string): void {
  localStorage.setItem(UI_LANGUAGE_KEY, code);
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
}

export function getChatEnterToSend(): boolean {
  return readBool(CHAT_ENTER_TO_SEND_KEY, true);
}

export function setChatEnterToSend(enabled: boolean): void {
  writeBool(CHAT_ENTER_TO_SEND_KEY, enabled);
}

export function getChatShowTimestamps(): boolean {
  return readBool(CHAT_SHOW_TIMESTAMPS_KEY, true);
}

export function setChatShowTimestamps(enabled: boolean): void {
  writeBool(CHAT_SHOW_TIMESTAMPS_KEY, enabled);
}

export function getNotifProductUpdates(): boolean {
  return readBool(NOTIF_PRODUCT_UPDATES_KEY, true);
}

export function setNotifProductUpdates(enabled: boolean): void {
  writeBool(NOTIF_PRODUCT_UPDATES_KEY, enabled);
}

export function getNotifSecurityAlerts(): boolean {
  return readBool(NOTIF_SECURITY_ALERTS_KEY, true);
}

export function setNotifSecurityAlerts(enabled: boolean): void {
  writeBool(NOTIF_SECURITY_ALERTS_KEY, enabled);
}

export function getNotifWeeklyDigest(): boolean {
  return readBool(NOTIF_WEEKLY_DIGEST_KEY, false);
}

export function setNotifWeeklyDigest(enabled: boolean): void {
  writeBool(NOTIF_WEEKLY_DIGEST_KEY, enabled);
}

export function initProfileUiPreferences(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("shadowtalk-compact", getUiCompactMode());
  document.documentElement.lang = getUiLanguage();
}
