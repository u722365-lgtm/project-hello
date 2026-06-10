/** Whether this document can use SharedArrayBuffer / WebContainer. */
export function isCrossOriginIsolated(): boolean {
  return typeof globalThis.crossOriginIsolated === "boolean" && globalThis.crossOriginIsolated;
}

export function isWebContainerEnvironment(): boolean {
  return isCrossOriginIsolated() && typeof SharedArrayBuffer !== "undefined";
}

export const COMPUTER_FRAME_PATH = "/computer-frame.html";
