import type { AppBuilderIntent, AppPlatform } from "./types";

const MOBILE_HINT =
  /\b(mobile\s+app|ios\s+app|android\s+app|phone\s+app|pwa|installable\s+app|app\s+for\s+(iphone|android|mobile))\b/i;

const WEB_HINT =
  /\b(web\s+app|website|web\s+site|web\s+application|landing\s+page|saas\s+app|dashboard\s+app|browser\s+app)\b/i;

const BUILD_VERB =
  /\b(build|create|make|generate|scaffold|develop|design)\b/i;

const FULL_APP =
  /\b(entire|full|complete|whole|production[- ]ready|multi[- ]page|full[- ]stack)?\s*(app|application|project|site)\b/i;

const APP_NOUN = /\b(app|application|website|web\s*app|mobile\s*app)\b/i;

/**
 * Detect when the user wants a full web or mobile app (not a single code snippet).
 */
export function detectAppBuilderIntent(message: string): AppBuilderIntent | null {
  const trimmed = message.trim();
  if (trimmed.length < 12) return null;

  const hasBuildIntent =
    (BUILD_VERB.test(trimmed) && APP_NOUN.test(trimmed)) ||
    FULL_APP.test(trimmed) ||
    /\bbuild\s+me\s+(a\s+)?\w+/i.test(trimmed);

  if (!hasBuildIntent) return null;

  let platform: AppPlatform = "web";
  if (MOBILE_HINT.test(trimmed)) platform = "mobile";
  else if (WEB_HINT.test(trimmed)) platform = "web";
  else if (/\bmobile\b/i.test(trimmed) && !/\bweb\b/i.test(trimmed)) platform = "mobile";

  let confidence = 72;
  if (FULL_APP.test(trimmed)) confidence += 12;
  if (BUILD_VERB.test(trimmed) && APP_NOUN.test(trimmed)) confidence += 8;
  if (platform === "mobile" && MOBILE_HINT.test(trimmed)) confidence += 6;
  if (platform === "web" && WEB_HINT.test(trimmed)) confidence += 6;

  return { platform, confidence: Math.min(confidence, 98) };
}
