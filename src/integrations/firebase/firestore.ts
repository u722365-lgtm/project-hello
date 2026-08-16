/**
 * Firestore → PostgREST-style query builder.
 *
 * Supports the subset of the Supabase query API the app uses:
 *   select / insert / update / upsert / delete
 *   eq neq gt gte lt lte in is like ilike contains match filter or not
 *   order limit range single maybeSingle count
 *
 * Anything Firestore can't express server-side is applied in memory after the
 * fetch, so call sites behave the same.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy as fsOrderBy,
  query as fsQuery,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { fbDb } from './app';

type Row = Record<string, any>;
type Op =
  | { kind: 'where'; field: string; op: string; value: any }
  | { kind: 'order'; field: string; ascending: boolean }
  | { kind: 'limit'; value: number };

interface Result<T = any> {
  data: T;
  error: Error | null;
  count: number | null;
  status: number;
  statusText: string;
}

const ok = <T,>(data: T, count: number | null = null): Result<T> => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: 'OK',
});
const fail = (error: Error): Result<null> => ({
  data: null,
  error,
  count: null,
  status: 400,
  statusText: 'Bad Request',
});

function normalize(id: string, data: Row): Row {
  const out: Row = { id, ...data };
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === 'object' && typeof (v as any).toDate === 'function') {
      out[k] = (v as any).toDate().toISOString();
    }
  }
  return out;
}

/** Firestore-native operators; everything else is filtered in memory. */
const FS_OPS: Record<string, any> = {
  eq: '==',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  in: 'in',
  contains: 'array-contains-any',
};

function matchesLocal(row: Row, op: Op & { kind: 'where' }): boolean {
  const val = row[op.field];
  switch (op.op) {
    case 'eq':
      return val === op.value;
    case 'neq':
      return val !== op.value;
    case 'gt':
      return val > op.value;
    case 'gte':
      return val >= op.value;
    case 'lt':
      return val < op.value;
    case 'lte':
      return val <= op.value;
    case 'in':
      return Array.isArray(op.value) && op.value.includes(val);
    case 'is':
      return op.value === null ? val == null : val === op.value;
    case 'like':
    case 'ilike': {
      const pattern = String(op.value).replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${pattern}$`, op.op === 'ilike' ? 'i' : '').test(String(val ?? ''));
    }
    case 'contains': {
      const needles = Array.isArray(op.value) ? op.value : [op.value];
      if (Array.isArray(val)) return needles.some((n) => val.includes(n));
      if (val && typeof val === 'object')
        return Object.entries(op.value ?? {}).every(([k, v]) => (val as Row)[k] === v);
      return false;
    }
    default:
      return true;
  }
}

class FirestoreQuery<T = any> implements PromiseLike<Result<any>> {
  private ops: Op[] = [];
  private mode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private singleMode: 'none' | 'single' | 'maybe' = 'none';
  private countOnly = false;
  private conflictKey: string | null = null;
  private rangeSpec: { from: number; to: number } | null = null;

  constructor(private table: string) {}

  // ---- terminal-ish builders -------------------------------------------
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.mode === 'select') this.mode = 'select';
    if (opts?.count && opts?.head) this.countOnly = true;
    return this;
  }
  insert(values: Row | Row[]) {
    this.mode = 'insert';
    this.payload = values;
    return this;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.mode = 'upsert';
    this.payload = values;
    this.conflictKey = opts?.onConflict?.split(',')[0]?.trim() || 'id';
    return this;
  }
  update(values: Row) {
    this.mode = 'update';
    this.payload = values;
    return this;
  }
  delete() {
    this.mode = 'delete';
    return this;
  }

  // ---- filters ---------------------------------------------------------
  private push(field: string, op: string, value: any) {
    this.ops.push({ kind: 'where', field, op, value });
    return this;
  }
  eq(f: string, v: any) { return this.push(f, 'eq', v); }
  neq(f: string, v: any) { return this.push(f, 'neq', v); }
  gt(f: string, v: any) { return this.push(f, 'gt', v); }
  gte(f: string, v: any) { return this.push(f, 'gte', v); }
  lt(f: string, v: any) { return this.push(f, 'lt', v); }
  lte(f: string, v: any) { return this.push(f, 'lte', v); }
  in(f: string, v: any[]) { return this.push(f, 'in', v); }
  is(f: string, v: any) { return this.push(f, 'is', v); }
  like(f: string, v: string) { return this.push(f, 'like', v); }
  ilike(f: string, v: string) { return this.push(f, 'ilike', v); }
  contains(f: string, v: any) { return this.push(f, 'contains', v); }
  match(obj: Row) {
    for (const [k, v] of Object.entries(obj)) this.push(k, 'eq', v);
    return this;
  }
  filter(f: string, op: string, v: any) {
    return this.push(f, op.replace(/^(eq|neq|gt|gte|lt|lte|in|is|like|ilike|cs)$/, (m) => (m === 'cs' ? 'contains' : m)), v);
  }
  not(f: string, op: string, v: any) {
    return this.push(f, op === 'is' ? 'neq' : 'neq', v);
  }
  /** `or()` is not expressible in Firestore — treated as no filter. */
  or(_expr: string) { return this; }
  order(field: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.ops.push({ kind: 'order', field, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.ops.push({ kind: 'limit', value: n });
    return this;
  }
  range(from: number, to: number) {
    this.rangeSpec = { from, to };
    return this;
  }
  single() {
    this.singleMode = 'single';
    return this;
  }
  maybeSingle() {
    this.singleMode = 'maybe';
    return this;
  }
  throwOnError() { return this; }
  abortSignal(_s?: AbortSignal) { return this; }
  returns() { return this; }
  csv() { return this; }

  // ---- execution -------------------------------------------------------
  private async runSelect(): Promise<Result<any>> {
    const wheres = this.ops.filter((o) => o.kind === 'where') as (Op & { kind: 'where' })[];
    const orders = this.ops.filter((o) => o.kind === 'order') as (Op & { kind: 'order' })[];
    const lim = (this.ops.find((o) => o.kind === 'limit') as any)?.value as number | undefined;

    const constraints: QueryConstraint[] = [];
    const local: (Op & { kind: 'where' })[] = [];
    let inequalityField: string | null = null;

    for (const w of wheres) {
      const fsOp = FS_OPS[w.op];
      const isInequality = ['gt', 'gte', 'lt', 'lte', 'neq'].includes(w.op);
      if (!fsOp || w.value === undefined || (isInequality && inequalityField && inequalityField !== w.field)) {
        local.push(w);
        continue;
      }
      if (isInequality) inequalityField = w.field;
      constraints.push(
        where(w.field, fsOp, w.op === 'contains' && !Array.isArray(w.value) ? [w.value] : w.value),
      );
    }

    const canOrderServerSide = orders.length > 0 && (!inequalityField || inequalityField === orders[0].field);
    if (canOrderServerSide) {
      for (const o of orders) constraints.push(fsOrderBy(o.field, o.ascending ? 'asc' : 'desc'));
    }
    if (lim && local.length === 0) constraints.push(fsLimit(lim));

    const ref = collection(fbDb(), this.table);

    if (this.countOnly) {
      const snap = await getCountFromServer(fsQuery(ref, ...constraints));
      return ok([], snap.data().count);
    }

    const snap = await getDocs(fsQuery(ref, ...constraints));
    let rows = snap.docs.map((d) => normalize(d.id, d.data() as Row));

    for (const w of local) rows = rows.filter((r) => matchesLocal(r, w));

    if (!canOrderServerSide) {
      for (const o of [...orders].reverse()) {
        rows.sort((a, b) => {
          const av = a[o.field];
          const bv = b[o.field];
          if (av === bv) return 0;
          const cmp = av > bv || av == null ? 1 : -1;
          return o.ascending ? cmp : -cmp;
        });
      }
    }

    const total = rows.length;
    if (this.rangeSpec) rows = rows.slice(this.rangeSpec.from, this.rangeSpec.to + 1);
    else if (lim) rows = rows.slice(0, lim);

    if (this.singleMode !== 'none') {
      if (rows.length === 0) {
        if (this.singleMode === 'maybe') return ok(null, 0);
        const e = new Error('No rows found');
        (e as any).code = 'PGRST116';
        return fail(e);
      }
      return ok(rows[0], total);
    }
    return ok(rows, total);
  }

  private async runInsert(): Promise<Result<any>> {
    const values = Array.isArray(this.payload) ? this.payload : [this.payload!];
    const written: Row[] = [];
    for (const v of values) {
      const body = { created_at: serverTimestamp(), ...v };
      if (v?.id) {
        await setDoc(doc(fbDb(), this.table, String(v.id)), body as any, { merge: false });
        written.push({ ...v, id: String(v.id) });
      } else {
        const ref = await addDoc(collection(fbDb(), this.table), body as any);
        written.push({ ...v, id: ref.id });
      }
    }
    const data = this.singleMode !== 'none' ? written[0] ?? null : written;
    return ok(data, written.length);
  }

  private async runUpsert(): Promise<Result<any>> {
    const values = Array.isArray(this.payload) ? this.payload : [this.payload!];
    const written: Row[] = [];
    for (const v of values) {
      const key = this.conflictKey && v[this.conflictKey] != null ? String(v[this.conflictKey]) : null;
      if (key && this.conflictKey === 'id') {
        await setDoc(doc(fbDb(), this.table, key), { updated_at: serverTimestamp(), ...v } as any, {
          merge: true,
        });
        written.push({ ...v, id: key });
        continue;
      }
      if (key) {
        const snap = await getDocs(
          fsQuery(collection(fbDb(), this.table), where(this.conflictKey!, '==', v[this.conflictKey!]), fsLimit(1)),
        );
        if (!snap.empty) {
          await setDoc(snap.docs[0].ref, { updated_at: serverTimestamp(), ...v } as any, { merge: true });
          written.push({ ...v, id: snap.docs[0].id });
          continue;
        }
      }
      const ref = await addDoc(collection(fbDb(), this.table), {
        created_at: serverTimestamp(),
        ...v,
      } as any);
      written.push({ ...v, id: ref.id });
    }
    const data = this.singleMode !== 'none' ? written[0] ?? null : written;
    return ok(data, written.length);
  }

  private async matchingDocs() {
    const probe = new FirestoreQuery(this.table);
    probe.ops = this.ops.filter((o) => o.kind !== 'limit');
    const res = await probe.runSelect();
    const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    return rows as Row[];
  }

  private async runUpdate(): Promise<Result<any>> {
    const rows = await this.matchingDocs();
    const updated: Row[] = [];
    for (const r of rows) {
      await updateDoc(doc(fbDb(), this.table, String(r.id)), {
        updated_at: serverTimestamp(),
        ...(this.payload as Row),
      } as any);
      updated.push({ ...r, ...(this.payload as Row) });
    }
    const data = this.singleMode !== 'none' ? updated[0] ?? null : updated;
    return ok(data, updated.length);
  }

  private async runDelete(): Promise<Result<any>> {
    const rows = await this.matchingDocs();
    for (const r of rows) await deleteDoc(doc(fbDb(), this.table, String(r.id)));
    const data = this.singleMode !== 'none' ? rows[0] ?? null : rows;
    return ok(data, rows.length);
  }

  private async execute(): Promise<Result<any>> {
    try {
      switch (this.mode) {
        case 'insert':
          return await this.runInsert();
        case 'upsert':
          return await this.runUpsert();
        case 'update':
          return await this.runUpdate();
        case 'delete':
          return await this.runDelete();
        default:
          return await this.runSelect();
      }
    } catch (err: any) {
      console.warn(`[firestore:${this.table}]`, err?.code || err?.message || err);
      return fail(err instanceof Error ? err : new Error(String(err)));
    }
  }

  then<TResult1 = Result<any>, TResult2 = never>(
    onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
  catch(onrejected?: (reason: any) => any) {
    return this.execute().catch(onrejected);
  }
  finally(cb?: () => void) {
    return this.execute().finally(cb);
  }
}

export function createFirestoreFrom() {
  return (table: string) => new FirestoreQuery(table) as any;
}

/** Read a single document by id (used by helpers that need direct access). */
export async function getDocumentById(table: string, id: string) {
  const snap = await getDoc(doc(fbDb(), table, id));
  return snap.exists() ? normalize(snap.id, snap.data() as Row) : null;
}
