import { backend } from "@/integrations/local/client";

const API_URL = '' as const;

export interface PublishAnswerInput {
  prompt: string;
  answer: string;
  title?: string;
  model?: string;
  source?: "chat" | "strategy";
}

export interface PublishedAnswer {
  slug: string;
  url: string;
  ogImageUrl: string;
}

export async function publishSharedAnswer(input: PublishAnswerInput): Promise<PublishedAnswer> {
  const { data, error } = await backend.functions.invoke("share-answer", { body: input });
  if (error) throw new Error(error.message);
  if (!data?.ok || !data?.slug) throw new Error(data?.error ?? "Failed to publish");
  const slug: string = data.slug;
  const base = typeof window !== "undefined" ? window.location.origin : "https://shadowtalk-ai.com";
  return {
    slug,
    url: `${base}/s/${slug}?utm_source=shared_answer&utm_medium=viral`,
    ogImageUrl: '',
  };
}
