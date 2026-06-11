import { useCallback, useEffect, useRef, useState } from "react";
import {
  approveJulesPlan,
  createJulesSession,
  getJulesSession,
  listJulesActivities,
  sendJulesMessage,
} from "@/lib/jules/julesClient";
import { buildWorkspacePrompt } from "@/lib/jules/buildWorkspacePrompt";
import {
  applyJulesChangesToFiles,
  getLatestActivityTitle,
} from "@/lib/jules/parseJulesPatch";
import type { JulesActivity, JulesSession, JulesSessionState, JulesWorkspaceFile } from "@/lib/jules/types";
import type { ParsedFileChange } from "@/lib/jules/types";

const TERMINAL_STATES: JulesSessionState[] = ["COMPLETED", "FAILED"];
const POLL_MS = 4000;

export interface UseJulesAgentOptions {
  apiKey: string;
  mode: "workspace" | "github";
  githubSource?: string;
  githubBranch?: string;
  files: JulesWorkspaceFile[];
  activeFileName?: string;
}

export function useJulesAgent({
  apiKey,
  mode,
  githubSource,
  githubBranch,
  files,
  activeFileName,
}: UseJulesAgentOptions) {
  const [session, setSession] = useState<JulesSession | null>(null);
  const [activities, setActivities] = useState<JulesActivity[]>([]);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ParsedFileChange[]>([]);
  const lastActivityTimeRef = useRef<string | undefined>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionId = session?.id ?? session?.name?.replace(/^sessions\//, "");

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!apiKey || !sessionId) return null;
    const updated = await getJulesSession(apiKey, sessionId);
    setSession(updated);
    return updated;
  }, [apiKey, sessionId]);

  const refreshActivities = useCallback(async () => {
    if (!apiKey || !sessionId) return [];
    const newActs = await listJulesActivities(apiKey, sessionId, lastActivityTimeRef.current);
    if (newActs.length > 0) {
      const last = newActs[newActs.length - 1];
      if (last.createTime) lastActivityTimeRef.current = last.createTime;
      setActivities((prev) => {
        const ids = new Set(prev.map((a) => a.id ?? a.name));
        const merged = [...prev];
        for (const act of newActs) {
          const key = act.id ?? act.name;
          if (key && !ids.has(key)) merged.push(act);
        }
        return merged;
      });
      const title = getLatestActivityTitle(newActs);
      if (title) setStatusLine(title);
    }
    return newActs;
  }, [apiKey, sessionId]);

  const pollOnce = useCallback(async () => {
    if (!apiKey || !sessionId) return;
    try {
      const updated = await refreshSession();
      await refreshActivities();

      const state = updated?.state;
      if (state && TERMINAL_STATES.includes(state)) {
        stopPolling();
        if (state === "COMPLETED") {
          const allActs = await listJulesActivities(apiKey, sessionId);
          setActivities(allActs);
          const changes = applyJulesChangesToFiles(
            allActs,
            files.map((f) => ({ name: f.name, content: f.content })),
          );
          setPendingChanges(changes);
          setStatusLine(
            changes.length > 0
              ? `Done — ${changes.length} file${changes.length === 1 ? "" : "s"} ready to apply`
              : "Session completed — review on Jules or check PR link",
          );
        } else {
          setStatusLine("Session failed — check activities for details");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Polling failed");
      stopPolling();
    }
  }, [apiKey, sessionId, refreshSession, refreshActivities, stopPolling, files]);

  const startPolling = useCallback(() => {
    stopPolling();
    setIsPolling(true);
    void pollOnce();
    pollRef.current = setInterval(() => void pollOnce(), POLL_MS);
  }, [pollOnce, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startSession = useCallback(
    async (task: string, title?: string) => {
      if (!apiKey.trim()) {
        setError("Add your Jules API key in settings (jules.google.com/settings)");
        return;
      }
      if (!task.trim()) {
        setError("Enter a task for Jules");
        return;
      }

      setIsStarting(true);
      setError(null);
      setPendingChanges([]);
      setActivities([]);
      lastActivityTimeRef.current = undefined;

      try {
        const prompt =
          mode === "workspace"
            ? buildWorkspacePrompt(task, files, activeFileName)
            : task.trim();

        const created = await createJulesSession({
          apiKey,
          prompt,
          title: title ?? task.slice(0, 80),
          source: mode === "github" ? githubSource : undefined,
          branch: mode === "github" ? githubBranch : undefined,
        });

        setSession(created);
        setStatusLine(created.state === "QUEUED" ? "Queued — Jules is starting…" : `State: ${created.state}`);
        startPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start Jules session");
      } finally {
        setIsStarting(false);
      }
    },
    [apiKey, mode, githubSource, githubBranch, files, activeFileName, startPolling],
  );

  const approvePlan = useCallback(async () => {
    if (!apiKey || !sessionId) return;
    try {
      await approveJulesPlan(apiKey, sessionId);
      setStatusLine("Plan approved — Jules is working…");
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve plan");
    }
  }, [apiKey, sessionId, startPolling]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!apiKey || !sessionId || !message.trim()) return;
      try {
        await sendJulesMessage(apiKey, sessionId, message.trim());
        setStatusLine("Message sent — waiting for Jules…");
        startPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [apiKey, sessionId, startPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    setSession(null);
    setActivities([]);
    setStatusLine(null);
    setError(null);
    setPendingChanges([]);
    lastActivityTimeRef.current = undefined;
  }, [stopPolling]);

  return {
    session,
    sessionId,
    activities,
    statusLine,
    isStarting,
    isPolling,
    error,
    pendingChanges,
    startSession,
    approvePlan,
    sendMessage,
    reset,
    setError,
    clearPendingChanges: () => setPendingChanges([]),
  };
}
