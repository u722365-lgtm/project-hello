const STORAGE_KEY = "shadowtalk_pending_chat_insert";

/** Queue content to insert into chat after navigating to /chatbot */
export function queueChatInsert(content: string): void {
  if (!content.trim()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, content.trim());
  } catch {
    /* ignore quota errors */
  }
}

/** Read and clear queued chat insert (call once on ChatbotPage mount) */
export function consumePendingChatInsert(): string | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value) sessionStorage.removeItem(STORAGE_KEY);
    return value;
  } catch {
    return null;
  }
}
