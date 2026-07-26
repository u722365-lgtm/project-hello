export type BotSignal = {
  isBot: boolean;
  reason?: string;
};

const BOT_UA_PATTERNS = [
  /headless/i,
  /phantom/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /python/i,
  /requests/i,
  /curl/i,
  /wget/i,
  /scraper/i,
  /spider/i,
  /crawler/i,
  /bot/i,
  /slurp/i,
  /mediapartners/i,
  /adsbot/i,
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex/i,
  /sogou/i,
];

const BOT_LANGUAGES = new Set([
  'zh',
  'zh-CN',
  'zh-TW',
  'zh-HK',
]);

const BOT_HEADERS = new Set([
  'x-forwarded-for',
  'cf-connecting-ip',
]);

export function detectBotLikely(): BotSignal {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { isBot: false };
  }

  const ua = navigator.userAgent || '';
  const matched = BOT_UA_PATTERNS.find((r) => r.test(ua));
  if (matched) {
    return { isBot: true, reason: 'ua_pattern' };
  }

  const lang = (navigator.language || '').toLowerCase();
  if (BOT_LANGUAGES.has(lang) && ua.toLowerCase().includes('chrome')) {
    return { isBot: true, reason: 'lang_pattern' };
  }

  return { isBot: false };
}
