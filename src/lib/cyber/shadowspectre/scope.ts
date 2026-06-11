import type { AuthorizationContext } from "./types";
import { SHADOWSPECTRE_SCOPE_KEY, SHADOWSPECTRE_TERMS_KEY } from "./constants";

export function getShadowSpectreScope(): AuthorizationContext | null {
  try {
    const raw = localStorage.getItem(SHADOWSPECTRE_SCOPE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthorizationContext;
  } catch {
    return null;
  }
}

export function saveShadowSpectreScope(scope: AuthorizationContext): void {
  localStorage.setItem(
    SHADOWSPECTRE_SCOPE_KEY,
    JSON.stringify({ ...scope, acceptedAt: scope.acceptedAt ?? new Date().toISOString() }),
  );
}

export function clearShadowSpectreScope(): void {
  localStorage.removeItem(SHADOWSPECTRE_SCOPE_KEY);
}

export function hasAcceptedShadowSpectreTerms(): boolean {
  return localStorage.getItem(SHADOWSPECTRE_TERMS_KEY) === "1";
}

export function acceptShadowSpectreTerms(): void {
  localStorage.setItem(SHADOWSPECTRE_TERMS_KEY, "1");
}
