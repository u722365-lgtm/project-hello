import { useState, useEffect, useMemo } from "react";
import { supabaseLoose } from "@/integrations/supabase/loose";
import { useAuth } from "@/components/AuthProvider";
import type { MemoryRecordLike } from "@/lib/memory/promptInjector";
import { loadGuestMemories, upsertGuestMemory, deleteGuestMemory } from "@/lib/memory/guestMemoryStore";
import { getActiveMemories, setMemoryToggle, isMemoryEnabled } from "@/lib/memory/agentMemories";

type MemoryRecord = MemoryRecordLike & {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  source?: string;
};

const CATEGORIES = ["preference", "skill", "context"] as const;
type Category = (typeof CATEGORIES)[number];

export function MemoryDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MemoryRecord | null>(null);
  const [form, setForm] = useState({ category: "preference" as Category, key: "", value: "" });
  const [error, setError] = useState<string | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(() => isMemoryEnabled());

  useEffect(() => {
    setMemoryEnabled(isMemoryEnabled());
  }, []);

  useEffect(() => {
    if (!memoryEnabled) {
      setItems([]);
      return;
    }
    if (user) {
      void loadRemoteMemories();
    } else {
      setItems(loadGuestMemories() as MemoryRecord[]);
    }
  }, [user, memoryEnabled]);

  async function loadRemoteMemories() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("user_memories")
      .select("*")
      .order("confidence", { ascending: false });
    if (error) setError(error.message);
    else setItems((data ?? []) as MemoryRecord[]);
    setLoading(false);
  }

  function toggleMemory() {
    const next = !memoryEnabled;
    setMemoryToggle(next);
    setMemoryEnabled(next);
  }

  async function persistRemote(record: MemoryRecord) {
    const payload = {
      user_id: user.id,
      category: record.category,
      key: record.key,
      value: record.value,
      confidence: record.confidence ?? 0.7,
      source: record.source ?? "manual",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseLoose.from("user_memories").upsert(
      record.id ? { id: record.id, ...payload } : payload,
      { onConflict: "id" }
    );
    if (error) throw new Error(error.message);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (!form.key.trim()) throw new Error("Key is required.");
      const parsed =
        form.value.trim().startsWith("[") || form.value.trim().startsWith("{")
          ? JSON.parse(form.value)
          : form.value;
      const record: MemoryRecord = editing
        ? { ...editing, category: form.category, key: form.key, value: parsed }
        : { category: form.category, key: form.key, value: parsed };

      if (user) {
        await persistRemote(record);
        await loadRemoteMemories();
      } else {
        const saved = upsertGuestMemory(record as never);
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === saved.id);
          const next = [...prev];
          if (idx >= 0) next[idx] = saved as MemoryRecord;
          else next.push(saved as MemoryRecord);
          return next;
        });
      }
      setEditing(null);
      setForm({ category: "preference", key: "", value: "" });
    } catch (err: any) {
      setError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: MemoryRecord) {
    setSaving(true);
    setError(null);
    try {
      if (user && m.id) {
        const { error } = await supabaseLoose.from("user_memories").delete().eq("id", m.id);
        if (error) throw new Error(error.message);
      } else if (m.id) {
        deleteGuestMemory(m.id);
      }
      setItems((prev) => prev.filter((item) => item.id !== m.id));
    } catch (err: any) {
      setError(err?.message ?? "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => {
    const groups: Record<string, MemoryRecord[]> = {};
    for (const item of items) {
      const category = item.category ?? "context";
      groups[category] = groups[category] ? [...groups[category], item] : [item];
    }
    return groups;
  }, [items]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Agent Memory</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {user ? "Cloud-backed learning from your chats." : "Guest local memory"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMemory}
            className={`rounded-xl border px-3 py-2 text-sm hover:border-zinc-500 ${
              memoryEnabled ? "border-emerald-600 text-emerald-200" : "border-zinc-700 text-zinc-200"
            }`}
          >
            {memoryEnabled ? "Memory ON" : "Memory OFF"}
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setForm({ category: "preference", key: "", value: "" });
            }}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500"
          >
            New memory
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</div>}
      {loading && <div className="mt-4 text-sm text-zinc-400">Loading memories...</div>}

      <form
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs text-zinc-400">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-400">
            Key
            <input
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              placeholder="e.g. tone"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Value
            <input
              value={typeof form.value === "string" ? String(form.value) : ""}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="JSON or string"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {editing ? "Editing memory" : "Create a new memory"}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-900 hover:bg-white disabled:opacity-60"
          >
            {saving ? "Saving..." : editing ? "Update" : "Save"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-6">
        {CATEGORIES.map((category) => {
          const group = grouped[category] ?? [];
          if (!group.length) return null;
          return (
            <section key={category}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">{category}</h2>
              <ul className="mt-2 space-y-2">
                {group.map((item) => (
                  <li
                    key={item.id ?? `${item.category}-${item.key}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                  >
                    <div>
                      <div className="text-sm text-zinc-100">{item.key}</div>
                      <pre className="mt-1 max-w-md overflow-x-auto text-xs text-zinc-300">
                        {JSON.stringify(item.value, null, 2)}
                      </pre>
                      <div className="mt-1 text-[10px] text-zinc-500">
                        confidence: {(item.confidence ?? 0.7).toFixed(2)}
                        {item.source ? ` · source: ${item.source}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(item);
                          setForm({
                            category: (item.category as Category) ?? "preference",
                            key: item.key ?? "",
                            value:
                              typeof item.value === "string"
                                ? item.value
                                : JSON.stringify(item.value ?? {}, null, 2),
                          });
                        }}
                        className="text-xs text-zinc-300 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function requireAuth() {
  // Dynamic require avoids circular auth imports in some test trees
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@/components/AuthProvider");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return mod.useAuth();
}
