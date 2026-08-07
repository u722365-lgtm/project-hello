type ChatAuthHeadersOptions = {
  accessToken?: string;
  fallbackKey?: string;
};

export function chatAuthHeaders({
  accessToken,
  fallbackKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_API_KEY as string | undefined),
}: ChatAuthHeadersOptions): Record<string, string> {
  const token = accessToken || fallbackKey || "";
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}