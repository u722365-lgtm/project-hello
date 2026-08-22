/** True when an on-device model is loaded in memory and can answer chat. */
export function isLocalInferenceReady(): boolean {
  return false;
}

/** True when a model download/load is in progress. */
export function isLocalInferenceLoading(): boolean {
  return false;
}

export const LOCAL_MODEL_READY_EVENT = "shadowtalk-local-model-ready";

export function dispatchLocalModelReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOCAL_MODEL_READY_EVENT));
}
