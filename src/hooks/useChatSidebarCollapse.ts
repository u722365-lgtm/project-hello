import { useCallback, useEffect, useState } from "react";
import {
  CHAT_SIDEBAR_WIDTH_COLLAPSED,
  CHAT_SIDEBAR_WIDTH_EXPANDED,
} from "@/lib/chatSidebarNav";

const STORAGE_KEY = "shadowtalk_chat_sidebar_collapsed";

export function useChatSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const width = collapsed ? CHAT_SIDEBAR_WIDTH_COLLAPSED : CHAT_SIDEBAR_WIDTH_EXPANDED;

  return { collapsed, setCollapsed, toggle, width };
}
