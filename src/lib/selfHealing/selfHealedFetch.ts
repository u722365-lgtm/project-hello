import { withSelfHeal } from "@/lib/selfHealing/autoRecover";

/** fetch() wrapped with approved self-heal retry/fallback handlers */
export async function selfHealedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return withSelfHeal(() => fetch(input, init), {
    label: typeof input === "string" ? input : input.toString(),
  });
}

/** supabase.functions.invoke with self-heal retry */
export async function invokeWithSelfHeal<T = unknown>(
  invoke: () => Promise<{ data: T; error: Error | null }>,
): Promise<{ data: T; error: Error | null }> {
  return withSelfHeal(invoke);
}
