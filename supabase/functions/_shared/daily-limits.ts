/** Mirrors src/lib/productClaims.ts — keep limits aligned for server enforcement */
export const FREE_TIER_DAILY = {
  messages: 5000,
  fileUploads: 20,
  codeGenerations: 20,
  imageGenerations: 20,
  documentGenerations: 20,
  webSearches: 20,
  deepResearch: 5,
  voiceSessions: 3,
} as const;

export type DailyLimitAction = keyof typeof FREE_TIER_DAILY;

const UNLIMITED = Number.POSITIVE_INFINITY;

export const DAILY_LIMITS: Record<string, Record<DailyLimitAction, number>> = {
  free: { ...FREE_TIER_DAILY },
  pro: {
    messages: UNLIMITED,
    fileUploads: 50,
    codeGenerations: UNLIMITED,
    imageGenerations: 20,
    documentGenerations: 100,
    webSearches: 50,
    deepResearch: 20,
    voiceSessions: UNLIMITED,
  },
  premium: {
    messages: UNLIMITED,
    fileUploads: UNLIMITED,
    codeGenerations: UNLIMITED,
    imageGenerations: 50,
    documentGenerations: UNLIMITED,
    webSearches: UNLIMITED,
    deepResearch: 50,
    voiceSessions: UNLIMITED,
  },
  elite: {
    messages: UNLIMITED,
    fileUploads: UNLIMITED,
    codeGenerations: UNLIMITED,
    imageGenerations: UNLIMITED,
    documentGenerations: UNLIMITED,
    webSearches: UNLIMITED,
    deepResearch: UNLIMITED,
    voiceSessions: UNLIMITED,
  },
  lifetime: {
    messages: UNLIMITED,
    fileUploads: UNLIMITED,
    codeGenerations: UNLIMITED,
    imageGenerations: UNLIMITED,
    documentGenerations: UNLIMITED,
    webSearches: UNLIMITED,
    deepResearch: UNLIMITED,
    voiceSessions: UNLIMITED,
  },
  enterprise: {
    messages: UNLIMITED,
    fileUploads: UNLIMITED,
    codeGenerations: UNLIMITED,
    imageGenerations: UNLIMITED,
    documentGenerations: UNLIMITED,
    webSearches: UNLIMITED,
    deepResearch: UNLIMITED,
    voiceSessions: UNLIMITED,
  },
};

const DB_COLUMNS: Record<DailyLimitAction, string> = {
  messages: "messages",
  fileUploads: "file_uploads",
  codeGenerations: "code_generations",
  imageGenerations: "image_generations",
  documentGenerations: "document_generations",
  webSearches: "web_searches",
  deepResearch: "deep_research",
  voiceSessions: "voice_sessions",
};

export function getDailyLimit(plan: string, action: DailyLimitAction): number {
  const limits = DAILY_LIMITS[plan] ?? DAILY_LIMITS.free;
  return limits[action] ?? DAILY_LIMITS.free[action];
}

export async function resolveUserPlan(supabase: any, userId: string): Promise<string> {
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("subscription_tier, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    subscriber?.subscription_tier &&
    subscriber.subscription_tier !== "free" &&
    subscriber.subscription_status === "active"
  ) {
    return subscriber.subscription_tier;
  }
  return "free";
}

export interface DailyUsageResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}

/** Check limit and increment usage atomically (best-effort) for authenticated users */
export async function checkAndIncrementDailyUsage(
  supabase: any,
  userId: string,
  action: DailyLimitAction = "messages"
): Promise<DailyUsageResult> {
  const plan = await resolveUserPlan(supabase, userId);
  const limit = getDailyLimit(plan, action);

  if (limit === UNLIMITED) {
    return { allowed: true, current: 0, limit: UNLIMITED, plan };
  }

  const today = new Date().toISOString().split("T")[0];
  const column = DB_COLUMNS[action];

  const { data: row, error: readError } = await supabase
    .from("daily_usage")
    .select(`id, ${column}`)
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  if (readError) {
    console.error("[Daily Limits] Read error:", readError);
    return { allowed: true, current: 0, limit, plan };
  }

  const current = (row as Record<string, number> | null)?.[column] ?? 0;

  if (current >= limit) {
    return { allowed: false, current, limit, plan };
  }

  const next = current + 1;
  const now = new Date().toISOString();

  if (row?.id) {
    const { error: updateError } = await supabase
      .from("daily_usage")
      .update({ [column]: next, updated_at: now })
      .eq("id", row.id);

    if (updateError) {
      console.error("[Daily Limits] Update error:", updateError);
    }
  } else {
    const { error: insertError } = await supabase.from("daily_usage").insert({
      user_id: userId,
      usage_date: today,
      [column]: next,
      updated_at: now,
    });

    if (insertError) {
      console.error("[Daily Limits] Insert error:", insertError);
    }
  }

  return { allowed: true, current: next, limit, plan };
}
