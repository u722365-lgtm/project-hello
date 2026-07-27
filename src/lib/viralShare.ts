let viralCount = 0;

export function buildInAppSharePayload(): {
  text: string;
  url: string;
  utm: { source: string; medium: string; campaign: string };
} {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shadowtalk-ai.com";
  const url = new URL(base + "/chatbot");
  url.searchParams.set("utm_source", "in-app-share");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "viral_chat");
  viralCount += 1;
  return {
    text: `I'm using ShadowTalk AI - local, private, free`,
    url: url.toString(),
    utm: { source: "in-app-share", medium: "social", campaign: "viral_chat" },
  };
}

export function getViralShareLinks(payload: ReturnType<typeof buildInAppSharePayload>) {
  const encodedText = encodeURIComponent(payload.text);
  const encodedUrl = encodeURIComponent(payload.url);
  return {
    copy: `${payload.text} ${payload.url}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}

export function getViralShareCount(): number {
  return viralCount;
}
