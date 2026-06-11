export const SHADOWSPECTRE_MODEL = "google/gemini-2.5-pro";
export const SHADOWSPECTRE_FALLBACK_MODEL = "google/gemini-2.5-flash";

export const SHADOWSPECTRE_SCOPE_KEY = "shadowspectre_auth_scope";
export const SHADOWSPECTRE_TERMS_KEY = "shadowspectre_terms_accepted";

export const SHADOWSPECTRE_HEADS = [
  "general",
  "recon",
  "exploit",
  "blue",
  "ir",
  "intel",
  "report",
  "grc",
  "harden",
] as const;
