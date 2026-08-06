import { toast } from "@/hooks/use-toast";
import { reflectOnConversation, shouldReflect, type MemoryReflection } from "@/lib/memory/reflectionEngine";
import { loadGuestMemories, upsertGuestMemory } from "@/lib/memory/guestMemoryStore";
import { backendLoose } from "@/integrations/local/loose";
import type { MemoryRecord } from "@/lib/memory/guestMemoryStore";

type ChatCompletionMessage = { role: string; content: unknown };

function safeLoadGuestMemories(): MemoryRecord[] {
  try {
    const records = loadGuestMemories();
    return records.map((r) => ({
      category: (r.category as MemoryRecord["category"]) ?? "context",
      key: r.key ?? "memory",
      value: r.value,
      confidence: typeof r.confidence === "number" ? r.confidence : 0.7,
      source: r.source,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  } catch {
    return [];
  }
}

let memoryToggleRaw = true;
export function setMemoryToggle(value: boolean) {
  memoryToggleRaw = value;
}
export function isMemoryEnabled() {
  return memoryToggleRaw;
}

export async function getActiveMemories(user: { id?: string } | null = null): Promise<MemoryRecord[]> {
  if (!isMemoryEnabled()) return [];
  if (user?.id) {
    try {
      const { data, error } = await backendLoose.from("user_memories").select("*").eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as MemoryRecord[];
    } catch {
      return [];
    }
  }
  return safeLoadGuestMemories();
}

export async function persistMemories(
  user: { id?: string } | null,
  reflections: MemoryReflection[],
) {
  if (!reflections.length) return;

  if (user?.id) {
    for (const m of reflections) {
      const payload = {
        user_id: user.id,
        category: m.category,
        key: m.key,
        value: m.value,
        confidence: m.confidence ?? 0.7,
        source: "reflection",
        updated_at: new Date().toISOString(),
      };
      await backendLoose
        .from("user_memories")
        .upsert(payload, { onConflict: "user_id,category,key" });
    }
    return;
  }

  for (const m of reflections) {
    upsertGuestMemory({
      category: m.category,
      key: m.key,
      value: m.value,
      confidence: m.confidence ?? 0.7,
    });
  }
}

export async function maybeReflectAndPersist(
  state: {
    user?: { id?: string } | null;
    isAnonymous?: boolean;
  },
  messages: ChatCompletionMessage[],
) {
  const needReflect = shouldReflect(messages.length);
  const effectiveUser = state.user ?? (!state.isAnonymous ? { id: state.user?.id } : null);
  if (!needReflect) return;
  const conversation = messages
    .map((m) => ({ role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user", content: typeof m.content === "string" ? m.content : "" }))
    .filter((m) => m.content?.trim());
  const reflections = await reflectOnConversation(conversation);
  if (!reflections) return;
  await persistMemories(effectiveUser, reflections);
}
