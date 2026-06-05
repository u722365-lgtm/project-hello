import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "shadowtalk_self_heal_queue";
const SENT_KEY = "shadowtalk_self_heal_sent";
const MAX_QUEUE = 50;
const DEDUP_WINDOW_MS = 60_000;

type ErrorKind = "runtime" | "promise" | "react" | "api" | "edge" | "rls" | "console" | "build";

export interface CapturedError {
  kind: ErrorKind;
  message: string;
  stack?: string;
  source_file?: string;
  line_number?: number;
  column_number?: number;
  url?: string;
  route?: string;
  context?: Record<string, unknown>;
  fingerprint: string;
  user_agent?: string;
  capturedAt: number;
}

function fingerprint(parts: (string | number | undefined)[]): string {
  const raw = parts.filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `fp_${(h >>> 0).toString(36)}`;
}

function readQueue(): CapturedError[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeQueue(q: CapturedError[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
}

function recentlySent(fp: string): boolean {
  try {
    const sent = JSON.parse(localStorage.getItem(SENT_KEY) ?? "{}") as Record<string, number>;
    const ts = sent[fp];
    return typeof ts === "number" && Date.now() - ts < DEDUP_WINDOW_MS;
  } catch {
    return false;
  }
}

function markSent(fp: string) {
  try {
    const sent = JSON.parse(localStorage.getItem(SENT_KEY) ?? "{}") as Record<string, number>;
    sent[fp] = Date.now();
    // Trim old
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const k of Object.keys(sent)) if (sent[k] < cutoff) delete sent[k];
    localStorage.setItem(SENT_KEY, JSON.stringify(sent));
  } catch {
    /* ignore */
  }
}

export function capture(err: Omit<CapturedError, "fingerprint" | "capturedAt" | "user_agent" | "url" | "route"> & {
  fingerprint?: string;
}) {
  try {
    const route = typeof window !== "undefined" ? window.location.pathname : undefined;
    const url = typeof window !== "undefined" ? window.location.href : undefined;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    const fp =
      err.fingerprint ??
      fingerprint([err.kind, err.message, err.source_file, err.line_number]);

    const captured: CapturedError = {
      ...err,
      fingerprint: fp,
      user_agent: ua,
      url,
      route,
      capturedAt: Date.now(),
    };

    if (recentlySent(fp)) return;
    markSent(fp);

    const queue = readQueue();
    queue.push(captured);
    writeQueue(queue);

    void flush();
  } catch {
    /* never throw from capture */
  }
}

let flushing = false;
export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const queue = readQueue();
    if (queue.length === 0) return;
    const next = queue.shift()!;
    writeQueue(queue);

    try {
      const { error } = await supabase.functions.invoke("self-heal", { body: next });
      if (error) {
        // Re-queue on failure
        const q = readQueue();
        q.unshift(next);
        writeQueue(q);
      }
    } catch {
      const q = readQueue();
      q.unshift(next);
      writeQueue(q);
    }
  } finally {
    flushing = false;
    // Chain next
    if (readQueue().length > 0) {
      setTimeout(() => void flush(), 1500);
    }
  }
}

let installed = false;
export function installGlobalErrorCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    capture({
      kind: "runtime",
      message: e.message || "Unknown error",
      stack: e.error?.stack,
      source_file: e.filename,
      line_number: e.lineno,
      column_number: e.colno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";
    capture({
      kind: "promise",
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  // Console warning/error capture
  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const msg = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ").slice(0, 1000);
      if (msg && !msg.includes("[self-heal]")) {
        capture({ kind: "console", message: msg, context: { level: "error" } });
      }
    } catch {
      /* ignore */
    }
    origError(...args);
  };
  console.warn = (...args: unknown[]) => {
    try {
      const msg = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ").slice(0, 1000);
      if (msg) capture({ kind: "console", message: msg, context: { level: "warn" } });
    } catch {
      /* ignore */
    }
    origWarn(...args);
  };

  // Patch fetch for API/edge/RLS error capture
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    try {
      const res = await origFetch(input as RequestInfo, init);
      if (!res.ok && res.status >= 400) {
        let body = "";
        try {
          body = (await res.clone().text()).slice(0, 500);
        } catch {
          /* ignore */
        }
        const isSupabase = url.includes("supabase.co");
        const isEdge = url.includes("/functions/v1/");
        const isRLS = body.toLowerCase().includes("row-level security") || body.toLowerCase().includes("rls");
        capture({
          kind: isRLS ? "rls" : isEdge ? "edge" : isSupabase ? "api" : "api",
          message: `HTTP ${res.status} ${url.split("?")[0]}`,
          context: { status: res.status, body },
        });
      }
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch failed";
      capture({
        kind: "api",
        message: `Network: ${msg} ${url.split("?")[0]}`,
        stack: e instanceof Error ? e.stack : undefined,
      });
      throw e;
    }
  };

  // Initial flush
  setTimeout(() => void flush(), 3000);

  // Periodic flush
  setInterval(() => void flush(), 30_000);
}
