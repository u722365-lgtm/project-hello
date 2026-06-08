import { supabase } from "@/integrations/supabase/client";
import {
  isSelfHealRemoteEnabled,
  shouldIgnoreCapturedError,
} from "@/lib/selfHealing/selfHealConfig";
import { probeSelfHealEndpoint } from "@/lib/selfHealing/probeSelfHeal";
import { applyRuntimeProposal } from "@/lib/selfHealing/autoRecover";

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
    if (!err?.message || typeof err.message !== "string") return;
    if (shouldIgnoreCapturedError(err.message, err.source_file)) return;


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

    const queue = readQueue();
    if (queue.some((q) => q.fingerprint === fp)) return;
    if (recentlySent(fp)) return;

    queue.push(captured);
    writeQueue(queue);

    if (isSelfHealRemoteEnabled()) {
      void flush();
    }
  } catch {
    /* never throw from capture */
  }
}

let flushing = false;
let consecutiveFailures = 0;
const MAX_FAILURES = 3;
const FAILURE_COOLDOWN_MS = 10 * 60_000;

export async function flush(): Promise<void> {
  if (flushing) return;
  if (!isSelfHealRemoteEnabled()) return;
  if (consecutiveFailures >= MAX_FAILURES) return;
  flushing = true;
  try {
    const queue = readQueue();
    if (queue.length === 0) return;
    const next = queue.shift()!;
    writeQueue(queue);

    try {
      const { data, error } = await supabase.functions.invoke("self-heal", { body: next });
      if (error || data?.ok === false) {
        consecutiveFailures += 1;
        if (consecutiveFailures < MAX_FAILURES) {
          const q = readQueue();
          q.unshift(next);
          writeQueue(q);
        }
      } else {
        consecutiveFailures = 0;
        markSent(next.fingerprint);
        const proposal = data?.proposal as
          | { id?: string; runtime_handler?: unknown; patch_strategy?: string; status?: string }
          | undefined;
        if (proposal) applyRuntimeProposal(proposal);
      }
    } catch {
      consecutiveFailures += 1;
      if (consecutiveFailures < MAX_FAILURES) {
        const q = readQueue();
        q.unshift(next);
        writeQueue(q);
      }
    }
  } finally {
    flushing = false;
    if (readQueue().length > 0 && consecutiveFailures < MAX_FAILURES && isSelfHealRemoteEnabled()) {
      setTimeout(() => void flush(), 2000);
    }
  }
}

let installed = false;

/** Passive listeners only — never patches fetch or console (prevents blank-screen cascades) */
export function installGlobalErrorCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    if (shouldIgnoreCapturedError(e.message || "", e.filename)) return;
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
    if (shouldIgnoreCapturedError(message)) return;
    capture({
      kind: "promise",
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

/** Probe edge function after app paint; only then enable remote reporting */
export function scheduleSelfHealBootstrap() {
  if (typeof window === "undefined") return;

  const run = () => {
    void probeSelfHealEndpoint().then((ok) => {
      if (ok) void flush();
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 8000 });
  } else {
    window.setTimeout(run, 5000);
  }
}
