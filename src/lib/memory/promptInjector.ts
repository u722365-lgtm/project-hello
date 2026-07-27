export type MemoryRecordLike = {
  category: string;
  key: string;
  value: unknown;
  confidence?: number;
};

export type MemoryInput = MemoryRecordLike & { updated_at?: string; created_at?: string };

const MAX_CHARS = 500;

export function buildMemoryContext(memories: MemoryInput[] = []): string {
  if (!memories.length) return "";

  const sorted = [...memories]
    .filter((m) => m.key != null && m.value !== undefined)
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const lines: string[] = [];
  let chars = 0;

  for (const m of sorted) {
    const raw = JSON.stringify(m.value);
    const line = `- ${m.key}: ${raw}`;
    if (chars + line.length + 1 > MAX_CHARS && lines.length) break;
    lines.push(line);
    chars += line.length + 1;
  }

  if (!lines.length) return "";
  return `ACTIVE USER MEMORY:\n${lines.join("\n")}`;
}
