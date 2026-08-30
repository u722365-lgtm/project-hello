import { useState, useCallback, useRef } from "react";
import {
  getGuestArchivedIds,
  isConversationArchived,
  setGuestArchivedIds as persistGuestArchivedIds,
} from "@/lib/chatArchive";
import { hasChattedBefore } from "@/lib/growth/firstVisit";
import { getSuccessfulSessionCount } from "@/lib/growth/sessionMilestones";
import { recordFunnelEvent } from "@/lib/growth/funnelEvents";

// ---------------------------------------------------------------------------
// Shared types — these are duplicated from ChatbotPage.tsx. Once the
// integration lands, ChatbotPage.tsx should import them from here instead.
// ---------------------------------------------------------------------------

/** A single chat message displayed in the conversation. */
export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  attachment?: {
    type: "image" | "file";
    data: string;
    name: string;
    mimeType: string;
  };
  imageUrl?: string;
  toolExecution?: {
    tool: string;
    status: string;
    result?: string;
    params?: Record<string, string>;
  };
}

/** A conversation row returned from the backend. */
export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  archived_at?: string | null;
};

/** The personality flavour applied to AI replies. */
export type Personality =
  | "friendly"
  | "sarcastic"
  | "professional"
  | "creative"
  | "meticulous"
  | "curious"
  | "diplomatic"
  | "witty"
  | "pragmatic"
  | "inquisitive"
  | "spicy";

// ---------------------------------------------------------------------------
// Params required by the hook from the parent component.
// ---------------------------------------------------------------------------

/** Minimal shape of the authenticated user object the hook needs. */
export type ConversationUser = {
  id: string;
} | null;

/**
 * Public API returned by `useChatPrivateMode` — only the surface that this
 * hook actually depends on.
 */
export type ChatPrivateModeApi = {
  /** Whether private/E2EE mode is currently active. */
  active: boolean;
  /** Decrypt a stored string back to plaintext (if encrypted). */
  resolveDisplayText: (raw: string) => Promise<string>;
  /** Encrypt a plaintext string for storage (no-op when private mode is off). */
  wrapForStorage: (plaintext: string) => Promise<string>;
};

/** Shape of the toast function returned by `useToast`. */
export type ToastFn = (props: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
}) => { id: string; dismiss: () => void; update: (props: Record<string, unknown>) => void };

/** Parameters passed into the hook from the parent page component. */
export interface UseConversationManagerParams {
  /** The current authenticated user, or `null` for guests. */
  user: ConversationUser;
  /** Whether the current session is an anonymous guest session. */
  isAnonymous: boolean;
  /** Supabase client for database operations. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backend: any;
  /** Private-mode crypto helpers. */
  chatPrivate: ChatPrivateModeApi;
  /** Toast notification helper. */
  toast: ToastFn;
  /** State setter for the current message list. */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** The current message list (read for title generation in `saveMessage`). */
  messages: Message[];
  /** Reset any active marketplace agent session. */
  resetMarketplaceSession: () => void;
  /** Current AI personality (used when persisting messages). */
  personality: Personality;
  /** State setter for the chat input text. */
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  /** State setter for the selected file attachment. */
  setSelectedFile: React.Dispatch<
    React.SetStateAction<
      | { type: "image" | "file"; data: string; name: string; mimeType: string }
      | null
    >
  >;
  /** State setter for the sidebar visibility flag. */
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseConversationManagerReturn {
  /** The full list of conversations (active + archived). */
  conversations: Conversation[];
  /** Setter for `conversations` — exposed for direct manipulation. */
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  /** The ID of the currently viewed conversation, or `null`. */
  currentConversationId: string | null;
  /** Guest-only archive ID set (persisted in localStorage). */
  guestArchivedIds: Set<string>;
  /** Check whether a specific conversation is archived. */
  conversationIsArchived: (conv: Conversation) => boolean;
  /** Fetch all conversations for the authenticated user from the backend. */
  loadConversations: () => Promise<void>;
  /** Load a single conversation and its messages by ID. */
  loadConversation: (conversationId: string) => Promise<void>;
  /** Return a context-aware welcome string. */
  getWelcomeMessage: () => string;
  /** Return a full welcome `Message` object. */
  welcomeMessage: () => Message;
  /** Returns `true` when the given ID belongs to a guest / local conversation. */
  isGuestConversationId: (id: string | null) => boolean;
  /** Reset the UI to a blank new-chat state. */
  resetToNewChat: () => void;
  /** Start a fresh chat (calls `resetToNewChat` + shows sidebar + toasts). */
  handleNewChat: () => void;
  /** Clear all messages inside the current conversation. */
  handleClearCurrentChat: () => Promise<void>;
  /** Permanently delete a conversation by ID. */
  handleDeleteConversation: (conversationId: string) => Promise<void>;
  /** Archive a conversation by ID. */
  handleArchiveConversation: (conversationId: string) => Promise<void>;
  /** Un-archive (restore) a conversation by ID. */
  handleUnarchiveConversation: (conversationId: string) => Promise<void>;
  /** Delete every conversation for the current user. */
  handleClearAllChats: () => Promise<void>;
  /** Ensure a backend conversation row exists; returns its ID or `null`. */
  ensureConversation: () => Promise<string | null>;
  /** Resolve a usable conversation ID (guest or authenticated). */
  resolveConversationId: () => Promise<string | null>;
  /** Persist a single message to the backend. */
  saveMessage: (
    content: string,
    role: "user" | "assistant",
    conversationId: string,
  ) => Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * `useConversationManager` encapsulates all conversation lifecycle logic:
 * loading, creating, archiving, deleting, and persisting messages.
 *
 * It was extracted from `ChatbotPage.tsx` to reduce that component's surface
 * area and make the conversation state machine testable in isolation.
 */
export function useConversationManager({
  user,
  isAnonymous,
  backend,
  chatPrivate,
  toast,
  setMessages,
  messages,
  resetMarketplaceSession,
  personality,
  setMessage,
  setSelectedFile,
  setShowSidebar,
}: UseConversationManagerParams): UseConversationManagerReturn {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [guestArchivedIds, setGuestArchivedIdsState] = useState<Set<string>>(
    () => getGuestArchivedIds(),
  );

  /**
   * Stale closure guard — keeps a ref to the latest `currentConversationId`
   * so that callbacks which close over state can read the fresh value.
   */
  const currentConversationIdRef = useRef(currentConversationId);
  currentConversationIdRef.current = currentConversationId;

  /** Ref to the latest `conversations` array for the same reason. */
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  /** Ref to the latest `guestArchivedIds` set. */
  const guestArchivedIdsRef = useRef(guestArchivedIds);
  guestArchivedIdsRef.current = guestArchivedIds;

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Determine whether a conversation should be treated as archived.
   *
   * For authenticated users the `archived_at` column is the source of truth.
   * For guests we fall back to a `Set<string>` persisted in `localStorage`.
   */
  const conversationIsArchived = useCallback(
    (conv: Conversation): boolean =>
      isConversationArchived(conv.id, conv.archived_at, guestArchivedIdsRef.current),
    // No deps needed — the ref always gives us the fresh value.
    [],
  );

  /**
   * Return a context-aware welcome string depending on whether the visitor
   * has chatted before.
   */
  const getWelcomeMessage = useCallback((): string => {
    if (!hasChattedBefore() && getSuccessfulSessionCount() === 0) {
      return "👋 Welcome to ShadowTalk! Tap a prompt below or type a message — I'll reply in seconds.";
    }
    return "👋 Welcome back! Your neural workspace is ready.";
  }, []);

  /**
   * Build a full welcome `Message` object using the context-aware text.
   */
  const welcomeMessage = useCallback((): Message => ({
    id: "welcome",
    type: "ai",
    content: getWelcomeMessage(),
    timestamp: new Date(),
  }), [getWelcomeMessage]);

  /**
   * Returns `true` when the given ID belongs to a guest or local
   * conversation that is not backed by a real database row.
   */
  const isGuestConversationId = useCallback(
    (id: string | null): boolean => !!id && (id.startsWith("guest-") || !user),
    [user],
  );

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);

  /**
   * Fetch every conversation for the authenticated user from the backend,
   * decrypt titles when E2EE is active, and auto-select the first active
   * conversation if none is selected yet. Uses onSnapshot for real-time updates.
   */
  const loadConversations = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    // Clear previous listener if any
    if (unsubscribeConversationsRef.current) {
      unsubscribeConversationsRef.current();
      unsubscribeConversationsRef.current = null;
    }

    try {
      const sub = backend.from("conversations").onSnapshot(
        { filter: { field: "user_id", op: "==", value: user.id } },
        async (snapshot) => {
          const rows = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const c = doc.data as Record<string, unknown>;
              return {
                ...c,
                id: doc.id,
                title: await chatPrivate.resolveDisplayText(
                  (c.title as string) || "Untitled",
                ),
                archived_at: (c as Conversation).archived_at ?? null,
              };
            }),
          );
          
          // Sort by updated_at desc
          rows.sort((a, b) => {
            const timeA = new Date((a.updated_at as string) || (a.created_at as string) || 0).getTime();
            const timeB = new Date((b.updated_at as string) || (b.created_at as string) || 0).getTime();
            return timeB - timeA;
          });

          setConversations(rows as Conversation[]);

          const activeConvs = rows.filter(
            (c) =>
              !isConversationArchived(
                c.id,
                c.archived_at,
                guestArchivedIdsRef.current,
              ),
          );

          if (activeConvs.length > 0 && !currentConversationIdRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            void loadConversation(activeConvs[0].id);
          } else if (activeConvs.length === 0) {
            setMessages([
              {
                id: "welcome",
                type: "ai",
                content: getWelcomeMessage(),
                timestamp: new Date(),
              },
            ]);
          }
        },
        (err) => {
          console.error("Conversations snapshot error:", err);
        }
      );
      unsubscribeConversationsRef.current = sub.unsubscribe;
    } catch (err) {
      console.error("Conversations listen setup error:", err);
    }
  }, [user, backend, chatPrivate, setMessages, getWelcomeMessage]);

  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  /**
   * Load a single conversation by its ID: switch to it, fetch its messages
   * from the backend, decrypt them if needed, and populate the message list.
   * Uses onSnapshot for real-time updates.
   */
  const loadConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      setCurrentConversationId(conversationId);
      
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }

      try {
        const sub = backend.from("messages").onSnapshot(
          { filter: { field: "conversation_id", op: "==", value: conversationId } },
          async (snapshot) => {
            const msgs = snapshot.docs.map(d => ({ ...d.data, id: d.id })) as Record<string, unknown>[];
            // Sort by created_at asc
            msgs.sort((a, b) => {
              const timeA = new Date((a.created_at as string) || 0).getTime();
              const timeB = new Date((b.created_at as string) || 0).getTime();
              return timeA - timeB;
            });
            
            const loadedMessages: Message[] = await Promise.all(
              msgs.map(async (m) => ({
                id: m.id as string,
                type: (m.role === "user" ? "user" : "ai") as Message["type"],
                content: await chatPrivate.resolveDisplayText(m.content as string),
                timestamp: new Date(m.created_at as string),
              })),
            );
            
            setMessages(
              loadedMessages.length === 0
                ? [
                    {
                      id: "welcome",
                      type: "ai",
                      content: getWelcomeMessage(),
                      timestamp: new Date(),
                    },
                  ]
                : loadedMessages,
            );
          },
          (err) => {
            console.error("Messages snapshot error:", err);
          }
        );
        unsubscribeMessagesRef.current = sub.unsubscribe;
      } catch (err) {
        console.error("Messages listen setup error:", err);
      }
    },
    [backend, chatPrivate, setMessages, getWelcomeMessage],
  );

  // -----------------------------------------------------------------------
  // Reset / new chat
  // -----------------------------------------------------------------------

  /**
   * Reset the UI to a blank new-chat state: clear the current conversation
   * selection, show a welcome message, empty the input, and deactivate any
   * marketplace agent.
   */
  const resetToNewChat = useCallback((): void => {
    setCurrentConversationId(null);
    setMessages([welcomeMessage()]);
    setMessage("");
    setSelectedFile(null);
    resetMarketplaceSession();
  }, [setMessages, setMessage, setSelectedFile, resetMarketplaceSession, welcomeMessage]);

  /** Start a completely new chat and show a confirmation toast. */
  const handleNewChat = useCallback((): void => {
    resetToNewChat();
    setShowSidebar(false);
    toast({ title: "New chat", description: "Started a fresh conversation." });
  }, [resetToNewChat, setShowSidebar, toast]);

  // -----------------------------------------------------------------------
  // Clear / delete
  // -----------------------------------------------------------------------

  /**
   * Clear all messages inside the current conversation.
   *
   * - For guests: the conversation is removed from the local list and a new
   *   guest conversation is created.
   * - For authenticated users: messages are deleted from the DB. If the
   *   delete succeeds the conversation is kept (with a reset title); if it
   *   fails the entire conversation row is removed as a fallback.
   */
  const handleClearCurrentChat = useCallback(async (): Promise<void> => {
    const convId = currentConversationIdRef.current;
    if (!convId) {
      resetToNewChat();
      return;
    }

    if (isGuestConversationId(convId)) {
      resetToNewChat();
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      const guestConvId = `guest-${Date.now()}`;
      setCurrentConversationId(guestConvId);
      setConversations([
        {
          id: guestConvId,
          title: "Guest Conversation",
          created_at: new Date().toISOString(),
        },
      ]);
      toast({ title: "Chat cleared" });
      return;
    }

    if (!user) return;

    const { error: msgError } = await backend
      .from("messages")
      .delete()
      .eq("conversation_id", convId)
      .eq("user_id", user.id);

    if (msgError) {
      // Messages table delete failed — try removing the whole conversation.
      const { error: convError } = await backend
        .from("conversations")
        .delete()
        .eq("id", convId)
        .eq("user_id", user.id);

      if (convError) {
        toast({
          title: "Could not clear chat",
          description: convError.message,
          variant: "destructive",
        });
        return;
      }

      setConversations((prev) => prev.filter((c) => c.id !== convId));
      resetToNewChat();
    } else {
      // Messages deleted — keep the conversation row but reset its title.
      await backend
        .from("conversations")
        .update({
          title: "New Chat",
          updated_at: new Date().toISOString(),
        })
        .eq("id", convId)
        .eq("user_id", user.id);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, title: "New Chat" } : c,
        ),
      );
      setMessages([welcomeMessage()]);
    }

    toast({
      title: "Chat cleared",
      description: "Messages in this conversation were removed.",
    });
    setShowSidebar(false);
  }, [
    user,
    backend,
    resetToNewChat,
    isGuestConversationId,
    toast,
    welcomeMessage,
    setShowSidebar,
  ]);

  /**
   * Permanently delete a conversation and, if it was the active one,
   * switch to the next available conversation or reset to a new chat.
   */
  const handleDeleteConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      if (isGuestConversationId(conversationId)) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversationIdRef.current === conversationId) {
          resetToNewChat();
        }
        return;
      }

      if (!user) return;

      const { error } = await backend
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const wasActive = currentConversationIdRef.current === conversationId;

      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== conversationId);
        if (wasActive) {
          if (next.length > 0) {
            void loadConversation(next[0].id);
          } else {
            resetToNewChat();
          }
        }
        return next;
      });

      toast({ title: "Conversation deleted" });
    },
    [user, backend, isGuestConversationId, resetToNewChat, loadConversation, toast],
  );

  // -----------------------------------------------------------------------
  // Archive / unarchive
  // -----------------------------------------------------------------------

  /**
   * After archiving a conversation, if it was the active one, switch to
   * the next active conversation or reset to a new chat.
   *
   * Accepts an optional `guestArchiveSet` so callers can pass the *just-
   * updated* set rather than the stale state value.
   */
  const switchAfterArchive = useCallback(
    (
      archivedId: string,
      guestArchiveSet: Set<string> = guestArchivedIdsRef.current,
    ): void => {
      if (currentConversationIdRef.current !== archivedId) return;

      const active = conversationsRef.current.filter(
        (c) =>
          c.id !== archivedId &&
          !isConversationArchived(c.id, c.archived_at, guestArchiveSet),
      );

      if (active.length > 0) {
        void loadConversation(active[0].id);
      } else {
        resetToNewChat();
      }
    },
    [loadConversation, resetToNewChat],
  );

  /**
   * Archive a conversation so it no longer appears in the active list.
   *
   * Guest conversations use a `localStorage`-backed `Set`. Authenticated
   * conversations set `archived_at` on the database row.
   */
  const handleArchiveConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      const archivedAt = new Date().toISOString();

      if (isGuestConversationId(conversationId)) {
        const next = new Set(guestArchivedIdsRef.current);
        next.add(conversationId);
        setGuestArchivedIdsState(next);
        persistGuestArchivedIds(next);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, archived_at: archivedAt }
              : c,
          ),
        );
        switchAfterArchive(conversationId, next);
        toast({
          title: "Chat archived",
          description: "Find it under Archived in history.",
        });
        return;
      }

      if (!user) return;

      const { error } = await backend
        .from("conversations")
        .update({ archived_at: archivedAt } as never)
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Could not archive",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, archived_at: archivedAt }
            : c,
        ),
      );
      switchAfterArchive(conversationId);
      toast({
        title: "Chat archived",
        description: "Find it under Archived in history.",
      });
    },
    [user, backend, isGuestConversationId, switchAfterArchive, toast],
  );

  /**
   * Un-archive (restore) a conversation back to the active list.
   */
  const handleUnarchiveConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      if (isGuestConversationId(conversationId)) {
        const next = new Set(guestArchivedIdsRef.current);
        next.delete(conversationId);
        setGuestArchivedIdsState(next);
        persistGuestArchivedIds(next);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, archived_at: null }
              : c,
          ),
        );
        toast({
          title: "Chat restored",
          description: "Moved back to your active chats.",
        });
        return;
      }

      if (!user) return;

      const { error } = await backend
        .from("conversations")
        .update({ archived_at: null } as never)
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Could not restore",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, archived_at: null }
            : c,
        ),
      );
      toast({
        title: "Chat restored",
        description: "Moved back to your active chats.",
      });
    },
    [user, backend, isGuestConversationId, toast],
  );

  // -----------------------------------------------------------------------
  // Clear all
  // -----------------------------------------------------------------------

  /**
   * Delete every conversation for the current user (or reset the guest
   * state) and start from a clean slate.
   */
  const handleClearAllChats = useCallback(async (): Promise<void> => {
    if (!user) {
      // Guest path: just reset everything locally.
      const guestConvId = `guest-${Date.now()}`;
      setConversations([
        {
          id: guestConvId,
          title: "Guest Conversation",
          created_at: new Date().toISOString(),
        },
      ]);
      setCurrentConversationId(guestConvId);
      setMessages([
        {
          id: "welcome",
          type: "ai",
          content:
            "👋 Welcome to ShadowTalk AI! Your neural workspace is ready for guest access.",
          timestamp: new Date(),
        },
      ]);
      setShowSidebar(false);
      toast({ title: "All chats cleared" });
      return;
    }

    const { error } = await backend
      .from("conversations")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Could not delete chats",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations([]);
    resetToNewChat();
    setShowSidebar(false);
    toast({
      title: "All chats deleted",
      description: "Your conversation history was cleared.",
    });
  }, [user, backend, setMessages, resetToNewChat, setShowSidebar, toast]);

  // -----------------------------------------------------------------------
  // Conversation creation
  // -----------------------------------------------------------------------

  /**
   * Ensure a backend conversation row exists for the current session.
   *
   * - If a `currentConversationId` is already set, it is returned as-is.
   * - For anonymous / device-only users a local-only ID is created.
   * - For authenticated users a new row is inserted into the `conversations`
   *   table.
   *
   * Returns the conversation ID, or `null` on failure.
   */
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (!user) return currentConversationIdRef.current;
    if (currentConversationIdRef.current) return currentConversationIdRef.current;

    // Anonymous / device-only path — no DB row needed.
    if (!user || isAnonymous) {
      const localId = `local-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }))}`;
      setCurrentConversationId(localId);
      setConversations((prev) => [
        {
          id: localId,
          title: "Private Chat",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      return localId;
    }

    // Authenticated path — create a real DB conversation.
    const titleToSave = chatPrivate.active
      ? await chatPrivate.wrapForStorage("New Chat")
      : "New Chat";

    const { data, error } = await backend
      .from("conversations")
      .insert({ user_id: user.id, title: titleToSave })
      .select()
      .single();

    if (error || !data) {
      toast({
        title: "Could not start chat",
        description: "Try again in a moment.",
        variant: "destructive",
      });
      return null;
    }

    setCurrentConversationId(data.id);

    const displayTitle = chatPrivate.active
      ? "Private Chat"
      : (await chatPrivate.resolveDisplayText(
          data.title || "New Chat",
        )) || "New Chat";

    setConversations((prev) => [
      { id: data.id, title: displayTitle, created_at: data.created_at },
      ...prev,
    ]);

    return data.id;
  }, [user, isAnonymous, backend, chatPrivate, toast]);

  /**
   * Resolve a usable conversation ID for sending a message.
   *
   * For authenticated users this delegates to `ensureConversation` and
   * records a funnel event on failure. For guests it lazily creates a
   * guest-scoped ID.
   */
  const resolveConversationId = useCallback(async (): Promise<string | null> => {
    const hasRealUser = user && !isAnonymous;

    if (hasRealUser) {
      const id = await ensureConversation();
      if (!id) {
        toast({
          title: "Could not start chat",
          description: "Check your connection and try again.",
          variant: "destructive",
        });
        recordFunnelEvent("send_blocked", "ensure_conversation_failed");
      }
      return id;
    }

    if (currentConversationIdRef.current) {
      return currentConversationIdRef.current;
    }

    const guestConvId = `guest-${Date.now()}`;
    setCurrentConversationId(guestConvId);
    setConversations((prev) => [
      {
        id: guestConvId,
        title: "Guest Conversation",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    return guestConvId;
  }, [user, isAnonymous, ensureConversation, toast]);

  // -----------------------------------------------------------------------
  // Message persistence
  // -----------------------------------------------------------------------

  /**
   * Persist a single message to the backend `messages` table.
   *
   * - Respects the device-only pledge — skips cloud persistence when
     *   `shouldPersistChatToCloud()` returns `false`.
   * - Encrypts content via `chatPrivate.wrapForStorage` when E2EE is active.
   * - On the first user message in a conversation, auto-generates a title
   *   from the message content.
   *
   * Returns the inserted row data, or `null` if the message was not
   * persisted.
   */
  const saveMessage = useCallback(
    async (
      content: string,
      role: "user" | "assistant",
      conversationId: string,
    ): Promise<unknown> => {
      if (!user || !conversationId) return null;

      const contentToSave = await chatPrivate.wrapForStorage(content);

      const { data } = await backend
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content: contentToSave,
          role,
          personality,
        })
        .select()
        .single();

      // Auto-title: on the very first user message, derive a short title.
      if (role === "user" && messages.length <= 1) {
        const titlePlain =
          content
            .trim()
            .split(/\s+/)
            .slice(0, 3)
            .join(" ")
            .slice(0, 25) || "New Chat";
        const title = await chatPrivate.wrapForStorage(titlePlain);
        await backend
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        const displayTitle = chatPrivate.active ? "Private Chat" : titlePlain;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, title: displayTitle } : c,
          ),
        );
      }

      return data;
    },
    [user, backend, chatPrivate, personality, messages, setConversations],
  );

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    conversations,
    setConversations,
    currentConversationId,
    guestArchivedIds,
    conversationIsArchived,
    loadConversations,
    loadConversation,
    getWelcomeMessage,
    welcomeMessage,
    isGuestConversationId,
    resetToNewChat,
    handleNewChat,
    handleClearCurrentChat,
    handleDeleteConversation,
    handleArchiveConversation,
    handleUnarchiveConversation,
    handleClearAllChats,
    ensureConversation,
    resolveConversationId,
    saveMessage,
  };
}
