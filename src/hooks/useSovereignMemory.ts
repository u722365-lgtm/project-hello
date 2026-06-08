import { useCallback, useEffect, useState } from "react";
import {
  clearLocalMemories,
  countLocalMemories,
  exportLocalMemories,
  importLocalMemories,
} from "@/lib/desktop/localMemoryStore";
import {
  isSovereignMemoryEnabled,
  setSovereignMemoryEnabled,
} from "@/lib/desktop/sovereignMemoryRag";
import { isShadowTalkDesktop, getDesktopAPI } from "@/lib/desktopBridge";

export function useSovereignMemory() {
  const [enabled, setEnabled] = useState(isSovereignMemoryEnabled());
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isShadowTalkDesktop()) return;
    const n = await countLocalMemories();
    setCount(n);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    (on: boolean) => {
      setSovereignMemoryEnabled(on);
      setEnabled(on);
    },
    [],
  );

  const clear = useCallback(async () => {
    setLoading(true);
    try {
      await clearLocalMemories();
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const exportToFile = useCallback(async () => {
    const data = await exportLocalMemories();
    const api = getDesktopAPI();
    const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: data }, null, 2);
    if (api) {
      const result = await api.saveFile({
        title: "Export sovereign memory",
        defaultPath: `shadowtalk-memory-${Date.now()}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!result.canceled && result.filePath) {
        await api.writeTextFile(result.filePath, json);
        return result.filePath;
      }
    }
    return null;
  }, []);

  const importFromFile = useCallback(async () => {
    const api = getDesktopAPI();
    if (!api) return 0;
    const result = await api.openFile({
      title: "Import sovereign memory",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths[0]) return 0;
    const raw = await api.readTextFile(result.filePaths[0]);
    const parsed = JSON.parse(raw) as { entries?: unknown[] };
    const n = await importLocalMemories((parsed.entries ?? []) as Parameters<typeof importLocalMemories>[0]);
    await refresh();
    return n;
  }, [refresh]);

  return {
    available: isShadowTalkDesktop(),
    enabled,
    count,
    loading,
    toggle,
    clear,
    exportToFile,
    importFromFile,
    refresh,
  };
}
