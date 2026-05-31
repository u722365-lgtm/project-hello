import { formatMetricCount } from "@/lib/formatMetrics";

export interface PlatformMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  totalConversations: number;
  isLoading: boolean;
}

export type CommunityHighlight = {
  label: string;
  value: string;
  description: string;
};

export function buildCommunityHighlights(metrics: PlatformMetrics): CommunityHighlight[] {
  const usersDisplay = metrics.isLoading ? "…" : formatMetricCount(metrics.totalUsers);
  const dauDisplay = metrics.isLoading ? "…" : formatMetricCount(metrics.dailyActiveUsers);
  const convDisplay = metrics.isLoading ? "…" : formatMetricCount(metrics.totalConversations);

  return [
    {
      label: "ShadowTalk users",
      value: usersDisplay,
      description: metrics.totalUsers
        ? `${metrics.totalUsers.toLocaleString()} creators and teams on the platform.`
        : "Be among the first builders on the platform.",
    },
    {
      label: "Daily active users",
      value: dauDisplay,
      description: metrics.dailyActiveUsers
        ? "People who used ShadowTalk in the last 24 hours — from live analytics."
        : "Daily active count updates from usage analytics.",
    },
    {
      label: "AI conversations",
      value: convDisplay,
      description: metrics.totalConversations
        ? `${metrics.totalConversations.toLocaleString()} conversations stored on the platform.`
        : "Conversation count grows with every chat you start.",
    },
    {
      label: "Ship cadence",
      value: "Weekly",
      description: "Features and fixes driven by what you actually use.",
    },
  ];
}
