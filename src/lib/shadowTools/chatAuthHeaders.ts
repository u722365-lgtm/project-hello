type ChatAuthHeadersOptions = {
  accessToken?: string;
  fallbackKey?: string;
};

export function chatAuthHeaders({
  accessToken,
  fallbackKey = import.meta.env.VITE_API_KEY,
}: ChatAuthHeadersOptions): Record<string, string> {
  const token = accessToken || fallbackKey || "";
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}
