import { Instagram, Linkedin, type LucideIcon } from "lucide-react";

/** Founder social profiles — single source of truth for site-wide links */
export const FOUNDER_SOCIAL = {
  instagram: {
    url: "https://www.instagram.com/shadowtalk_ai",
    handle: "@shadowtalk_ai",
    label: "Instagram",
  },
  linkedin: {
    url: "https://www.linkedin.com/in/zain-ahmed-917b6b3a6",
    label: "LinkedIn",
    name: "Zain Ahmed",
  },
} as const;

export type SocialLinkItem = {
  icon: LucideIcon;
  href: string;
  label: string;
};

/** Instagram + LinkedIn only — use in footer, contact, about, etc. */
export const SOCIAL_LINKS: readonly SocialLinkItem[] = [
  {
    icon: Instagram,
    href: FOUNDER_SOCIAL.instagram.url,
    label: FOUNDER_SOCIAL.instagram.label,
  },
  {
    icon: Linkedin,
    href: FOUNDER_SOCIAL.linkedin.url,
    label: FOUNDER_SOCIAL.linkedin.label,
  },
];

/** schema.org Organization `sameAs` */
export const SOCIAL_SAME_AS = SOCIAL_LINKS.map((s) => s.href);
