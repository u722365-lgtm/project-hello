import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  Download,
  Settings,
  MessageSquarePlus,
  History,
  Plus,
  ShieldCheck,
  Zap,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMainPanel } from "@/components/chat/ChatMainPanel";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { useChatSidebarCollapse } from "@/hooks/useChatSidebarCollapse";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  archived_at?: string | null;
}

// ─── Action Card Data ─────────────────────────────────────────────────────────

const ACTION_CARDS = [
  {
    icon: ShieldCheck,
    title: "Security Audit",
    description: "Scan code for vulnerabilities",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
    prompt: "Run a security audit on this code and check for vulnerabilities, exposed secrets, and injection flaws.",
  },
  {
    icon: Zap,
    title: "Refactor Code",
    description: "Optimize speed & structure",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5 hover:bg-amber-500/10",
    prompt: "Refactor this code for better performance, cleaner structure, and modern best practices.",
  },
  {
    icon: Search,
    title: "Deep Research",
    description: "Analyze architecture & dependencies",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5 hover:bg-blue-500/10",
    prompt: "Analyze this architecture in depth — dependencies, tradeoffs, security posture, and scalability.",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Panel toggles
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sidebar
  const { collapsed, toggle: toggleSidebar } = useChatSidebarCollapse();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const isArchived = useCallback((c: Conversation) => Boolean(c.archived_at), []);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const createNewChat = useCallback(() => {
    const id = generateId();
    const newConv: Conversation = {
      id,
      title: "New chat",
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(id);
    setMessages([]);
    setShowHistory(false);
    setShowMobileMenu(false);
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      setCurrentConversationId(id);
      setShowHistory(false);
      setShowMobileMenu(false);
      // In a real app, load messages from storage here.
      setMessages([]);
    },
    [],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    },
    [currentConversationId],
  );

  const archiveConversation = useCallback(
    (id: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, archived_at: new Date().toISOString() } : c)),
      );
    },
    [],
  );

  const unarchiveConversation = useCallback(
    (id: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, archived_at: null } : c)),
      );
    },
    [],
  );

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
    setMessages([]);
  }, []);

  const clearCurrentChat = useCallback(() => {
    setMessages([]);
    setShowClearConfirm(false);
  }, []);

  // ─── Send Message ─────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!message.trim() || isLoading) return;

    let convId = currentConversationId;

    // Auto-create conversation on first message
    if (!convId) {
      const id = generateId();
      const title = message.trim().slice(0, 60) + (message.length > 60 ? "..." : "");
      const newConv: Conversation = {
        id,
        title,
        created_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(id);
      convId = id;
    }

    // Update title if it's still default
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId && c.title === "New chat"
          ? { ...c, title: message.trim().slice(0, 60) }
          : c,
      ),
    );

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: message.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    // Simulate assistant response (replace with real AI call)
    setTimeout(() => {
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content:
          "I'm ShadowTalk Core v2. Your message has been received. In production, this connects to the AI inference pipeline. For now, this is a UI scaffold for the refactored chat experience.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1200);
  }, [message, isLoading, currentConversationId]);

  const handleActionCardClick = useCallback(
    (prompt: string) => {
      setMessage(prompt);
    },
    [],
  );

  // ─── Export Log ────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (messages.length === 0) return;
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}]\n${m.content}\n`)
      .join("\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadowtalk-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // ─── Scroll to bottom on new messages ──────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMessages = messages.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* ─── Top Bar (48px Glass Bar) ─────────────────────────────────────── */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl z-40">
        {/* Left: Menu + Model Selector */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileMenu((v) => !v)}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          {/* Model Selector Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800/60 bg-zinc-900/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span className="text-xs font-semibold tracking-tight text-zinc-200">
              ShadowTalk Core v2
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            aria-label="Clear chat"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            aria-label="Export log"
            title="Export log"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ─── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* ─── Sidebar ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!collapsed && !isMobile && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 flex flex-col h-full border-r border-zinc-800/60 bg-zinc-950 overflow-hidden"
            >
              <SidebarContent
                onNewChat={createNewChat}
                onOpenHistory={() => setShowHistory(true)}
                onOpenSettings={() => navigate("/settings")}
                onNavigate={() => setShowMobileMenu(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ─── Mobile Menu Overlay ──────────────────────────────────────── */}
        <AnimatePresence>
          {showMobileMenu && isMobile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setShowMobileMenu(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col bg-zinc-950 border-r border-zinc-800/60"
              >
                <SidebarContent
                  onNewChat={() => {
                    createNewChat();
                    setShowMobileMenu(false);
                  }}
                  onOpenHistory={() => {
                    setShowMobileMenu(false);
                    setShowHistory(true);
                  }}
                  onOpenSettings={() => {
                    setShowMobileMenu(false);
                    navigate("/settings");
                  }}
                  onNavigate={() => setShowMobileMenu(false)}
                  mobile
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Center Content ────────────────────────────────────────────── */}
        <ChatMainPanel>
          {hasMessages ? (
            /* ─── Messages View ──────────────────────────────────────────── */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" && "justify-end",
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="shrink-0 h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-emerald-400">S</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-zinc-800/80 text-zinc-100"
                            : "bg-zinc-900/60 border border-zinc-800/40 text-zinc-300",
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="shrink-0 h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-zinc-400">Y</span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="shrink-0 h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-emerald-400">S</span>
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-800/40 rounded-2xl px-4 py-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              className="h-2 w-2 rounded-full bg-zinc-500"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ─── Input (messages view) ────────────────────────────────── */}
              <div className="shrink-0 pb-6 pt-2 px-4">
                <ChatInputDock
                  message={message}
                  onMessageChange={setMessage}
                  onSend={handleSend}
                  isLoading={isLoading}
                  onToggleVoice={() => setIsListening((v) => !v)}
                  isListening={isListening}
                />
              </div>
            </div>
          ) : (
            /* ─── Empty State ─────────────────────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-2xl mx-auto text-center"
              >
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl font-black text-emerald-400">S</span>
                  </div>
                </div>

                {/* Heading */}
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 mb-2">
                  What can I help you build or audit today?
                </h1>
                <p className="text-sm text-zinc-500 mb-10">
                  ShadowTalk Core v2 — Sovereign AI Assistant
                </p>

                {/* Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                  {ACTION_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <motion.button
                        key={card.title}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleActionCardClick(card.prompt)}
                        className={cn(
                          "text-left rounded-xl border p-4 transition-colors duration-200",
                          card.border,
                          card.bg,
                        )}
                      >
                        <Icon className={cn("h-5 w-5 mb-2.5", card.color)} />
                        <div className="text-sm font-semibold text-zinc-200 mb-0.5">
                          {card.title}
                        </div>
                        <div className="text-xs text-zinc-500">{card.description}</div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Input (empty state) */}
                <ChatInputDock
                  message={message}
                  onMessageChange={setMessage}
                  onSend={handleSend}
                  isLoading={isLoading}
                  onToggleVoice={() => setIsListening((v) => !v)}
                  isListening={isListening}
                />
              </motion.div>
            </div>
          )}
        </ChatMainPanel>
      </div>

      {/* ─── History Sidebar Overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[min(100vw,340px)]"
            >
              <ConversationSidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                isArchived={isArchived}
                onCreateNew={() => {
                  createNewChat();
                  setShowHistory(false);
                }}
                onSelect={(id) => {
                  selectConversation(id);
                  setShowHistory(false);
                }}
                onDelete={deleteConversation}
                onArchive={archiveConversation}
                onUnarchive={unarchiveConversation}
                onClearAll={() => {
                  clearAllConversations();
                  setShowHistory(false);
                }}
                onClearCurrent={clearCurrentChat}
                onOpenSettings={() => {
                  setShowHistory(false);
                  navigate("/settings");
                }}
                onClose={() => setShowHistory(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Clear Confirm Dialog ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6"
            >
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">Clear this chat?</h3>
              <p className="text-xs text-zinc-500 mb-5">
                This will remove all messages in the current conversation.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 rounded-lg border border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={clearCurrentChat}
                  className="px-4 py-2 text-xs font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar Content ─────────────────────────────────────────────────────────

function SidebarContent({
  onNewChat,
  onOpenHistory,
  onOpenSettings,
  onNavigate,
  mobile = false,
}: {
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onNavigate: () => void;
  mobile?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="shrink-0 p-3 space-y-1 border-b border-zinc-800/40">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          New Chat
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
        >
          <History className="h-4 w-4" />
          Chat History
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: Settings */}
      <div className="shrink-0 p-3 border-t border-zinc-800/40">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Input Dock ──────────────────────────────────────────────────────────────

function ChatInputDock({
  message,
  onMessageChange,
  onSend,
  isLoading,
  onToggleVoice,
  isListening,
}: {
  message: string;
  onMessageChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onToggleVoice: () => void;
  isListening: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(message.trim());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors duration-200",
          "border-zinc-800/80 bg-zinc-900/90",
          "focus-within:border-emerald-500/50",
        )}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ShadowTalk anything..."
          className="flex-1 min-h-[24px] max-h-[160px] resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none leading-relaxed"
          rows={1}
          disabled={isLoading}
          aria-label="Chat message"
        />

        <div className="flex items-center gap-1 shrink-0">
          {/* Voice toggle */}
          <button
            type="button"
            onClick={onToggleVoice}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
              isListening
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60",
            )}
            aria-label={isListening ? "Stop listening" : "Voice input"}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend || isLoading}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200",
              canSend && !isLoading
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-zinc-800/60 text-zinc-600",
            )}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 text-center mt-2 select-none">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  );
}
