const LS_KEY = "shadowtalk_user_memories";

export type GuestMemory = {
  id?: string;
  category?: "preference" | "skill" | "context";
  key?: string;
  value?: unknown;
  confidence?: number;
  source?: string;
  created_at?: string;
  updated_at?: string;
};

export type MemoryRecord = GuestMemory & {
  user_id?: string;
};

function logSlowStorage(
  _label: string,
  start: number,
  data: unknown,
): void {
  const elapsed = performance.now() - start;
  if (elapsed > 300) {
    console.warn(`[SlowStorage] ${_label} took ${Math.round(elapsed)}ms`, data);
  }
}

function now(): string {
  return new Date().toISOString();
}

function coerceRecord(input: unknown): MemoryRecord {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  const category = source.category;
  return {
    ...(source.id !== undefined ? { id: String(source.id) } : {}),
    ...(source.user_id !== undefined ? { user_id: String(source.user_id) } : {}),
    ...(category ? { category: String(category) as MemoryRecord["category"] } : {}),
    ...(source.key !== undefined ? { key: String(source.key) } : {}),
    ...(source.value !== undefined ? { value: source.value } : {}),
    ...(source.confidence !== undefined ? { confidence: Number(source.confidence) } : {}),
    ...(source.source !== undefined ? { source: String(source.source) } : {}),
    ...(source.created_at !== undefined ? { created_at: String(source.created_at) } : {}),
    ...(source.updated_at !== undefined ? { updated_at: String(source.updated_at) } : {}),
  };
}

function readRawRecords(): MemoryRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => coerceRecord(item));
  } catch {
    return [];
  }
}

function writeRawRecords(records: MemoryRecord[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(records));
}

export function loadGuestMemories(): MemoryRecord[] {
  const t0 = performance.now();
  try {
    const records = readRawRecords();
    logSlowStorage("loadGuestMemories", t0, records);
    return records;
  } catch (err) {
    console.error("[guestMemoryStore] load failed:", err);
    return [];
  }
}

function generateGuestId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function upsertGuestMemory(record: MemoryRecord): MemoryRecord {
  const t0 = performance.now();
  const nowIso = now();
  const existingIndex = readRawRecords().findIndex(
    (item) => item.id && item.id === record.id,
  );
  const updated: MemoryRecord = {
    ...record,
    id: record.id || generateGuestId(),
    category: record.category || "context",
    confidence: typeof record.confidence === "number" ? record.confidence : 0.7,
    source: record.source || "reflection",
    created_at: record.created_at || nowIso,
    updated_at: nowIso,
  };

  const records = readRawRecords();
  if (existingIndex >= 0) {
    records[existingIndex] = updated;
  } else {
    records.push(updated);
  }
  writeRawRecords(records);
  logSlowStorage("upsertGuestMemory", t0, updated);
  return updated;
}

export function deleteGuestMemory(id: string): void {
  const t0 = performance.now();
  writeRawRecords(readRawRecords().filter((item) => item.id !== id));
  logSlowStorage("deleteGuestMemory", t0, { id });
}
