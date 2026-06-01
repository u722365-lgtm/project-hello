/** Light haptic tick when changing settings sections (mobile / supported devices). */
export function settingsHapticTick() {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(6);
  } catch {
    /* ignore */
  }
}
