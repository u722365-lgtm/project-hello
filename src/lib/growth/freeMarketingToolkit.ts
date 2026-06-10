/** Zero-cost marketing — copy/paste posts, no paid APIs */

export type SocialPlatform = "tiktok" | "instagram" | "linkedin" | "whatsapp" | "twitter";

export interface MarketingPost {
  id: string;
  hook: string;
  body: string;
  hashtags: string;
  cta: string;
}

const CHECKOUT = "https://www.shadowtalk-ai.com/founder-access?plan=pro";
const SITE = "https://www.shadowtalk-ai.com";

export const FREE_MARKETING_POSTS: MarketingPost[] = [
  {
    id: "privacy-hook",
    hook: "ChatGPT remembers everything. ShadowTalk doesn't.",
    body: `Private AI chat built in Karachi 🇵🇰 — offline-friendly, JazzCash checkout, no Stripe needed.\n\nTry free: ${SITE}\nPro: Rs 1,499/mo`,
    hashtags: "#AI #Privacy #Pakistan #Startup #ShadowTalk",
    cta: CHECKOUT,
  },
  {
    id: "student",
    hook: "Rs 1,499 for private AI — cheaper than most phone packages.",
    body: `Homework, code, ideas — without feeling watched.\n\nShadowTalk AI · Built by a 17-year-old founder.\n${CHECKOUT}`,
    hashtags: "#StudentLife #AI #Karachi #EdTech",
    cta: CHECKOUT,
  },
  {
    id: "offline",
    hook: "Good experience with offline access — real user, 5/5 ⭐",
    body: `ShadowTalk works on limited data. Built for Pakistan, used globally.\n\n${SITE}`,
    hashtags: "#OfflineAI #Pakistan #BuildInPublic",
    cta: SITE,
  },
  {
    id: "founder",
    hook: "I'm 17. Stripe said no. So I built JazzCash checkout.",
    body: `Building ShadowTalk AI — privacy-first chat from Karachi.\nGoogle ranks us #1 for our name.\n\nSupport the build: ${CHECKOUT}`,
    hashtags: "#Founder #BuildInPublic #ShadowTalk #Karachi",
    cta: CHECKOUT,
  },
  {
    id: "developer",
    hook: "Paste code without feeding the entire internet.",
    body: `ShadowTalk = private AI workspace. Agents, stealth mode, local options.\n\n${SITE}/chatbot`,
    hashtags: "#DevTools #Privacy #AI",
    cta: `${SITE}/chatbot`,
  },
  {
    id: "podcast",
    hook: "Why we built AI that forgets on purpose — Episode 1 drops soon.",
    body: `ShadowTalk podcast: privacy, Pakistan payments, building alone at 17.\n\n${SITE}/about`,
    hashtags: "#Podcast #AI #Pakistan",
    cta: `${SITE}/about`,
  },
  {
    id: "referral",
    hook: "Tag a friend who still uses normal AI for private stuff.",
    body: `ShadowTalk — private AI chat. Free to try.\n\n${SITE}`,
    hashtags: "#ShadowTalk #Referral #AI",
    cta: SITE,
  },
];

export function getDailyMarketingPost(refCode?: string | null): MarketingPost {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % FREE_MARKETING_POSTS.length;
  const post = FREE_MARKETING_POSTS[dayIndex];
  if (!refCode) return post;
  return {
    ...post,
    body: post.body.replace(SITE, `${SITE}?ref=${refCode}`),
    cta: post.cta.includes("?") ? `${post.cta}&ref=${refCode}` : `${post.cta}?ref=${refCode}`,
  };
}

export function formatPostForPlatform(post: MarketingPost, platform: SocialPlatform): string {
  const full = `${post.hook}\n\n${post.body}\n\n${post.hashtags}`;
  switch (platform) {
    case "twitter":
      return `${post.hook} ${post.cta}`.slice(0, 280);
    case "whatsapp":
      return `${post.hook}\n\n${post.body}`;
    case "linkedin":
      return `${post.hook}\n\n${post.body}\n\n${post.hashtags.replace(/#/g, "")}`;
    case "tiktok":
    case "instagram":
      return `${post.hook}\n\n${post.body}\n\n${post.hashtags}\n\nLink in bio 👇 ${post.cta}`;
    default:
      return full;
  }
}

export function getPlatformShareUrl(platform: SocialPlatform, text: string, url: string): string {
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encoded}%20${encodedUrl}`;
    default:
      return url;
  }
}
