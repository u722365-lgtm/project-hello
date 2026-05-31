import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import {
  getEndowmentMessage,
  getLossAversionMessage,
  NUDGE_THRESHOLDS,
  RECOMMENDED_MONTHLY_PLAN,
} from "@/lib/conversionPsychology";

export type NudgeIntensity = "none" | "soft" | "strong" | "blocking";

export function useSubscriptionNudge(dailyMessagesUsed: number, conversationCount = 0) {
  const { userPlan } = useAuth();
  const { getDailyMessageLimit, isProOrHigher } = useFeatureGating();

  return useMemo(() => {
    if (isProOrHigher || userPlan !== "free") {
      return {
        intensity: "none" as NudgeIntensity,
        shouldShowBanner: false,
        shouldBlockSend: false,
        limit: Infinity,
        used: dailyMessagesUsed,
        remaining: Infinity,
        recommendedPlan: RECOMMENDED_MONTHLY_PLAN,
        headline: "",
        subline: "",
      };
    }

    const limit = getDailyMessageLimit();
    const remaining = Math.max(0, limit - dailyMessagesUsed);
    const ratio = limit > 0 ? dailyMessagesUsed / limit : 0;

    let intensity: NudgeIntensity = "none";
    if (ratio >= NUDGE_THRESHOLDS.block) intensity = "blocking";
    else if (ratio >= NUDGE_THRESHOLDS.strong) intensity = "strong";
    else if (ratio >= NUDGE_THRESHOLDS.soft) intensity = "soft";

    const shouldShowBanner = intensity !== "none";
    const shouldBlockSend = intensity === "blocking";

    const headline =
      intensity === "blocking"
        ? "Daily limit reached"
        : intensity === "strong"
          ? "Almost at your free limit"
          : "You're on a roll";

    const subline =
      intensity === "blocking"
        ? getLossAversionMessage(dailyMessagesUsed, limit)
        : `${getLossAversionMessage(dailyMessagesUsed, limit)} ${getEndowmentMessage(conversationCount)}`;

    return {
      intensity,
      shouldShowBanner,
      shouldBlockSend,
      limit,
      used: dailyMessagesUsed,
      remaining,
      recommendedPlan: RECOMMENDED_MONTHLY_PLAN,
      headline,
      subline,
    };
  }, [
    conversationCount,
    dailyMessagesUsed,
    getDailyMessageLimit,
    isProOrHigher,
    userPlan,
  ]);
}
