/**
 * Canonical founder identity — disambiguates Zain Ahmed (ShadowTalk AI)
 * from other public figures with similar names in Pakistan.
 */

export const FOUNDER_CANONICAL = {
  "@id": "https://www.shadowtalk-ai.com/#zain-ahmed-shadowtalk",
  name: "Zain Ahmed",
  alternateName: [
    "Zain Ahmed — ShadowTalk AI",
    "Zain Ahmed (ShadowTalk)",
    "Zain Ahmed founder of ShadowTalk",
    "Zain Ahmed AI founder Karachi",
  ],
  jobTitle: "Founder & Lead Architect",
  additionalJobTitle: "AI Solutions Engineer",
  worksFor: {
    "@type": "Organization",
    name: "ShadowTalk AI",
    url: "https://www.shadowtalk-ai.com",
  },
  description:
    "Zain Ahmed is the founder and lead architect of ShadowTalk AI, a sovereign local-first AI workspace from Karachi, Pakistan. He builds encrypted chat, offline on-device LLM pipelines, and agentic developer tools — not fashion, theatre, or entertainment.",
  location: {
    city: "Karachi",
    region: "Sindh",
    country: "Pakistan",
  },
  founded: "2024-02",
  age: 17,
  linkedin: "https://www.linkedin.com/in/zain-ahmed-917b6b3a6",
  instagram: "https://www.instagram.com/shadowtalk_ai",
  instagramHandle: "@shadowtalk_ai",
  email: "shadowtalk68@gmail.com",
  github: "https://github.com/zain836/shadowtalk-ai-903ca615",
  /** Primary entity URL for "Zain Ahmed" name searches — exact-match slug */
  canonicalProfileUrl: "https://www.shadowtalk-ai.com/zain-ahmed.html",
  profilePages: [
    "https://www.shadowtalk-ai.com/zain-ahmed",
    "https://www.shadowtalk-ai.com/zain-ahmed.html",
    "https://www.shadowtalk-ai.com/founder-zain-ahmed.html",
    "https://www.shadowtalk-ai.com/about",
    "https://www.shadowtalk-ai.com/facts",
    "https://www.shadowtalk-ai.com/facts.html",
    "https://www.shadowtalk-ai.com/answers",
  ],
  knowsAbout: [
    "Artificial Intelligence",
    "Local-first software",
    "On-device LLM inference",
    "End-to-end encryption",
    "Agentic AI systems",
    "Privacy-preserving AI",
  ],
} as const;

/** People often confused with Zain Ahmed (ShadowTalk) in search — do NOT attribute ShadowTalk to them. */
export const FOUNDER_NOT_THE_SAME_AS = [
  {
    name: "Zain Ahmad",
    note: "Co-founder of luxury streetwear brand Rastah; Forbes 30 Under 30; not affiliated with ShadowTalk AI.",
    domain: "fashion / streetwear",
  },
  {
    name: "Zain Ahmed",
    note: "Artistic director at NAPA (National Academy of Performing Arts), Karachi; theatre and performing arts; not affiliated with ShadowTalk AI.",
    domain: "theatre / performing arts",
  },
] as const;

export const FOUNDER_SEARCH_PHRASES = [
  "Zain Ahmed",
  "Zain Ahmed ShadowTalk AI",
  "Zain Ahmed founder of ShadowTalk",
  "Zain Ahmed ShadowTalk founder Karachi",
  "Zain Ahmed AI solutions engineer Pakistan",
  "Zain Ahmed AI founder Pakistan",
  "founder of shadowtalk-ai.com",
] as const;
