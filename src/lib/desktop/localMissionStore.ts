/**
 * Local mission persistence for sovereign desktop (IndexedDB).
 */

import { openDB, type IDBPDatabase } from "idb";
import type { Mission, MissionStep, MissionDeliverableType } from "@/hooks/useMissions";

const DB_NAME = "shadowtalk-sovereign-missions";
const STORE = "missions";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

const LOCAL_USER = "local-desktop";

export async function createLocalMission(
  title: string,
  goal: string,
  options?: {
    description?: string;
    priority?: number;
    auto_approve?: boolean;
    scheduled_at?: string;
    deliverable_type?: MissionDeliverableType;
    business_idea?: Record<string, unknown>;
  },
): Promise<Mission> {
  const now = new Date().toISOString();
  const mission: Mission = {
    id: `local-mission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: LOCAL_USER,
    title,
    goal,
    description: options?.description,
    deliverable_type: options?.deliverable_type ?? "general",
    business_idea: options?.business_idea ?? null,
    status: "queued",
    priority: options?.priority ?? 0,
    progress: 0,
    steps: [],
    current_step: 0,
    auto_approve: options?.auto_approve ?? true,
    notify_on_complete: false,
    retry_count: 0,
    max_retries: 2,
    scheduled_at: options?.scheduled_at,
    created_at: now,
    updated_at: now,
  };
  const db = await getDb();
  await db.put(STORE, mission);
  return mission;
}

export async function updateLocalMission(
  missionId: string,
  updates: Partial<Mission> & { steps?: MissionStep[] },
): Promise<void> {
  const db = await getDb();
  const existing = (await db.get(STORE, missionId)) as Mission | undefined;
  if (!existing) return;
  const merged: Mission = {
    ...existing,
    ...updates,
    steps: updates.steps ?? existing.steps,
    updated_at: new Date().toISOString(),
  };
  await db.put(STORE, merged);
}

export async function listLocalMissions(): Promise<Mission[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE)) as Mission[];
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLocalMission(id: string): Promise<Mission | undefined> {
  const db = await getDb();
  return (await db.get(STORE, id)) as Mission | undefined;
}

export async function listDueLocalMissions(): Promise<Mission[]> {
  const now = Date.now();
  const missions = await listLocalMissions();
  return missions.filter((m) => {
    if (m.status !== "queued") return false;
    if (!m.scheduled_at) return true;
    return new Date(m.scheduled_at).getTime() <= now;
  });
}
