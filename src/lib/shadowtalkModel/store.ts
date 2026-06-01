import { openDB, type IDBPDatabase } from "idb";
import type { CorpusItem, ShadowTalkModelState } from "./types";
import { CORPUS_STORE, EMPTY_MODEL_STATE, META_KEY, META_STORE, SHADOWTALK_MODEL_DB } from "./types";

async function db(): Promise<IDBPDatabase> {
  return openDB(SHADOWTALK_MODEL_DB, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(CORPUS_STORE)) {
        database.createObjectStore(CORPUS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE);
      }
    },
  });
}

export async function loadModelState(): Promise<ShadowTalkModelState> {
  const database = await db();
  const raw = await database.get(META_STORE, META_KEY);
  if (!raw || typeof raw !== "object") return { ...EMPTY_MODEL_STATE };
  return { ...EMPTY_MODEL_STATE, ...(raw as ShadowTalkModelState) };
}

export async function saveModelState(state: ShadowTalkModelState): Promise<void> {
  const database = await db();
  await database.put(META_STORE, state, META_KEY);
}

export async function addCorpusItem(item: CorpusItem): Promise<void> {
  const database = await db();
  await database.put(CORPUS_STORE, item);
}

export async function getAllCorpusItems(): Promise<CorpusItem[]> {
  const database = await db();
  return database.getAll(CORPUS_STORE);
}

export async function updateCorpusClusterIds(updates: { id: string; clusterId: number }[]): Promise<void> {
  const database = await db();
  const tx = database.transaction(CORPUS_STORE, "readwrite");
  for (const u of updates) {
    const item = await tx.store.get(u.id);
    if (item) {
      item.clusterId = u.clusterId;
      await tx.store.put(item);
    }
  }
  await tx.done;
}

export async function clearCorpusOnly(): Promise<void> {
  const database = await db();
  await database.clear(CORPUS_STORE);
}

export async function clearShadowTalkModel(): Promise<void> {
  const database = await db();
  await database.clear(CORPUS_STORE);
  await database.put(META_STORE, { ...EMPTY_MODEL_STATE }, META_KEY);
}
