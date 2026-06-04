/** Session flags for one-click encrypted + anonymous chat mode */

export const CHAT_PRIVATE_MODE_KEY = "shadowtalk_chat_private_mode";
export const CHAT_ANONYMOUS_UI_KEY = "shadowtalk_chat_anonymous_ui";

export function isChatPrivateModeActive(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(CHAT_PRIVATE_MODE_KEY) === "true";
}

export function setChatPrivateModeActive(active: boolean): void {
  if (typeof sessionStorage === "undefined") return;
  if (active) {
    sessionStorage.setItem(CHAT_PRIVATE_MODE_KEY, "true");
  } else {
    sessionStorage.removeItem(CHAT_PRIVATE_MODE_KEY);
  }
}

export function isChatAnonymousUiActive(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(CHAT_ANONYMOUS_UI_KEY) === "true";
}

export function setChatAnonymousUiActive(active: boolean): void {
  if (typeof sessionStorage === "undefined") return;
  if (active) {
    sessionStorage.setItem(CHAT_ANONYMOUS_UI_KEY, "true");
  } else {
    sessionStorage.removeItem(CHAT_ANONYMOUS_UI_KEY);
  }
}
