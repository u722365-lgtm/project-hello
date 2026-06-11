import { useCallback, useState } from "react";
import { runLocalIdeAssist } from "@/lib/ide/localIdeAssist";
import type { JulesWorkspaceFile } from "@/lib/jules/types";
import type { ParsedFileChange } from "@/lib/jules/types";

export function useLocalCodeAgent(files: JulesWorkspaceFile[], activeFileName?: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const runTask = useCallback(
    async (task: string, isCodeAction = true) => {
      if (!task.trim()) {
        setError("Enter a task for the on-device agent");
        return;
      }
      setIsRunning(true);
      setError(null);
      setStatusLine("Running on-device model…");
      try {
        const result = await runLocalIdeAssist(task, files, activeFileName, isCodeAction);
        setLastResult(result);
        setStatusLine("Complete — review and apply below");
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "On-device agent failed");
        setStatusLine(null);
      } finally {
        setIsRunning(false);
      }
    },
    [files, activeFileName],
  );

  const pendingChanges: ParsedFileChange[] = lastResult
    ? [{ path: activeFileName ?? files[0]?.name ?? "output.txt", content: lastResult, isNew: false }]
    : [];

  const reset = useCallback(() => {
    setStatusLine(null);
    setError(null);
    setLastResult(null);
  }, []);

  return {
    isRunning,
    statusLine,
    error,
    lastResult,
    pendingChanges,
    runTask,
    reset,
    setError,
    clearPendingChanges: () => setLastResult(null),
  };
}
