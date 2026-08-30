import { useCallback } from "react";
import { useShadowToolBridge } from "@/hooks/useShadowToolBridge";
import type { ChatMode } from "@/components/chat/ModeSelector";
import { SHADOWTALK_SELF_KNOWLEDGE_BRIEF } from "@/lib/shadowTalkProductKnowledge";
import { turboComplete } from "@/lib/turbo/turboEngine";

export interface ChatToolRouterMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  toolExecution?: {
    tool: string;
    status: "pending" | "running" | "complete" | "error" | "confirm";
    params?: Record<string, string>;
    result?: string;
  };
}

export interface RunChatTurnParams {
  msgContent: string;
  messages: ChatToolRouterMessage[];
  personality: string;
  chatMode: ChatMode;
  attachment?: { type: string; data: string; mimeType: string };
  onMessagesUpdate: (updater: (prev: ChatToolRouterMessage[]) => ChatToolRouterMessage[]) => void;
  saveAssistant: ((content: string) => Promise<void>);
  signal?: AbortSignal;
}

export function useChatToolRouter(handlers: Parameters<typeof useShadowToolBridge>[0]) {
  const toolBridge = useShadowToolBridge(handlers);

  const streamChat = useCallback(
    async (
      chatMessages: Array<{ role: string; content: string }>,
      personality: string,
      chatMode: string,
      _bodyExtras: Record<string, unknown>,
      onMessagesUpdate: RunChatTurnParams["onMessagesUpdate"],
      saveAssistant: (content: string) => Promise<void>,
      _signal?: AbortSignal
    ) => {
      const aiMessageId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }));
      const lastUserMsg = [...chatMessages].reverse().find(m => m.role === "user")?.content ?? "";

      const result = await turboComplete(
        `You are ShadowTalk AI. Be ${personality || 'friendly'} and helpful. Mode: ${chatMode}. Use markdown formatting.`,
        lastUserMsg,
        {
          onDelta: (accumulated) => {
            onMessagesUpdate((prev) => {
              const exists = prev.find((m) => m.id === aiMessageId);
              if (exists) {
                return prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: accumulated } : m
                );
              }
              return [
                ...prev,
                {
                  id: aiMessageId,
                  type: "ai",
                  content: accumulated,
                  timestamp: new Date(),
                },
              ];
            });
          },
        },
      );

      const assistantContent = result.content;
      if (assistantContent) await saveAssistant(assistantContent);
      return assistantContent;
    },
    []
  );

  const runChatTurn = useCallback(
    async (params: RunChatTurnParams) => {
      const { msgContent, messages, personality, chatMode, attachment, onMessagesUpdate, saveAssistant, signal } =
        params;

      if (
        /\b(what is shadowtalk|about shadowtalk|tell me about (yourself|shadowtalk)|who (made|created|built) you|your (features|pricing|plans)|shadowtalk (features|pricing|plans))\b/i.test(
          msgContent
        )
      ) {
        const about = `${SHADOWTALK_SELF_KNOWLEDGE_BRIEF}\n\nAsk a specific question (e.g. "How do missions work?" or "What's in Elite?") for more detail.`;
        onMessagesUpdate((prev) => [
          ...prev,
          { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })), type: "ai", content: about, timestamp: new Date() },
        ]);
        await saveAssistant(about);
        return;
      }

            if (/\b(what tools|list tools|what can you do|show (me )?features|available tools)\b/i.test(msgContent)) {
        const help = toolBridge.listAvailableTools();
        onMessagesUpdate((prev) => [
          ...prev,
          { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })), type: "ai", content: help, timestamp: new Date() },
        ]);
        return;
      }

      const toolRun = await toolBridge.runDetectedTool(msgContent, {
        personality,
        mode: chatMode,
        attachment,
      });

      if (toolRun.handled && toolRun.skipNormalChat && toolRun.assistantContent) {
        onMessagesUpdate((prev) => [
          ...prev,
          {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })),
            type: "ai",
            content: toolRun.assistantContent!,
            timestamp: new Date(),
            imageUrl: toolRun.imageUrl,
            toolExecution: toolRun.tool
              ? { tool: toolRun.tool, status: "complete", result: toolRun.assistantContent }
              : undefined,
          },
        ]);
        await saveAssistant(toolRun.assistantContent);
        return;
      }

      const chatMessages = messages
        .filter((m) => m.id !== "welcome" && m.content)
        .map((m) => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));
      chatMessages.push({ role: "user", content: msgContent });

      const bodyExtras: Record<string, unknown> = { ...(toolRun.chatBodyExtras || {}) };
      if (chatMode === "research" && !bodyExtras.deepResearch) {
        bodyExtras.webSearch = true;
        bodyExtras.searchQuery = msgContent;
      }

      if (toolRun.handled && toolRun.assistantContent && !toolRun.skipNormalChat) {
        onMessagesUpdate((prev) => [
          ...prev,
          {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })),
            type: "ai",
            content: toolRun.assistantContent!,
            timestamp: new Date(),
            toolExecution: toolRun.tool ? { tool: toolRun.tool, status: "complete" } : undefined,
          },
        ]);
      }

      await streamChat(chatMessages, personality, chatMode, bodyExtras, onMessagesUpdate, saveAssistant, signal);
    },
    [streamChat, toolBridge]
  );

  return { runChatTurn, listAvailableTools: toolBridge.listAvailableTools };
}
