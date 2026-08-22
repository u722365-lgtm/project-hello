



export type MemoryReflection = {
  category: "preference" | "skill" | "context";
  key: string;
  value: unknown;
  confidence?: number;
};

const REFLECTION_SYSTEM_PROMPT = `You are a memory extraction engine. Analyze the conversation. Return ONLY JSON array of memories learned. Each memory: {category:'preference'|'skill'|'context', key:string, value:any}. If nothing learned, return [].`;
const REFLECTION_USER_SUFFIX = `\n\nRespond with compact JSON only. No markdown, no explanation.`;

export function shouldReflect(messageCount: number): boolean {
  if (messageCount === 0) return false;
  return messageCount % 5 === 0;
}

export async function reflectOnConversation(
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<MemoryReflection[] | null> {
  if (!conversation.length) return [];
  const trimmed = conversation.slice(-20);
  const prompt = trimmed
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n") + REFLECTION_USER_SUFFIX;

  const messages: any[] = [
    { role: "system", content: REFLECTION_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  try {
    const result = await runOfflineCompletion({
      messages,
      personality: "friendly",
      isOnline: true,
    });
    if (!result) return null;
    const cleaned = result.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m: any) =>
          m &&
          typeof m.key === "string" &&
          ["preference", "skill", "context"].includes(m.category),
      )
      .map((m: any) => ({
        category: m.category,
        key: m.key,
        value: m.value,
        confidence: typeof m.confidence === "number" ? m.confidence : 0.7,
      }));
  } catch {
    return [];
  }
}
