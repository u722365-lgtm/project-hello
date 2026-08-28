import { backend } from "@/integrations/local/client";
import { hasAnalyticsConsent } from "./consent";

const LAST_FETCH_KEY = "shadowtalk_daily_insights_date";

export async function maybeFetchDailyInsights(userId: string): Promise<void> {
  if (!hasAnalyticsConsent()) return;

  const today = new Date().toISOString().split("T")[0];
  if (localStorage.getItem(LAST_FETCH_KEY) === today) return;
  if (localStorage.getItem("shadowtalk_insights_synthesizing") === "true") return;

  localStorage.setItem("shadowtalk_insights_synthesizing", "true");
  // Dispatch a custom event to notify listeners
  window.dispatchEvent(new Event("insights_synthesis_started"));

  try {
    const { data: memories } = await backend
      .from("ai_memories")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: recentMessages } = await backend
      .from("messages")
      .select("content, role")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    const recent_topics = (recentMessages || [])
      .filter((m) => m.role === "user")
      .map((m) => String(m.content).slice(0, 80))
      .slice(0, 5);

    const url = '';
    const { data: sessionData } = await backend.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("No token");

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        memories: memories || [],
        recent_topics,
      }),
    });

    if (!resp.ok) throw new Error("Fetch failed");

    const payload = (await resp.json()) as { insights?: Array<{ title: string; content: string; category: string }> };
    const insights = payload.insights || [];

    for (const ins of insights.slice(0, 3)) {
      await backend.from("daily_insights").insert({
        user_id: userId,
        title: ins.title?.slice(0, 120) || "Insight",
        content: ins.content?.slice(0, 2000) || "",
        category: ins.category || "productivity",
        source: "auto_improve",
        is_read: false,
        is_pinned: false,
        metadata: { generator: "generate-insights" },
      });
    }

    localStorage.setItem(LAST_FETCH_KEY, today);
  } finally {
    localStorage.removeItem("shadowtalk_insights_synthesizing");
    window.dispatchEvent(new Event("insights_synthesis_finished"));
  }
}
