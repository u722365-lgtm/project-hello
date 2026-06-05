import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMode } from "@/components/chat/ModeSelector";
import { AIProvider } from "@/components/chat/ProviderSelector";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatToolbar } from "@/components/chat/ChatToolbar";
import { ChatIconRail } from "@/components/chat/ChatIconRail";
import { ChatShadowSidebar } from "@/components/chat/ChatShadowSidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ImageGenerator } from "@/components/chat/ImageGenerator";
import { DeepResearchPanel } from "@/components/chat/DeepResearchPanel";
import { CommandPalette } from "@/components/chat/CommandPalette";

const ShadowTalkLive = lazy(() =>
  import("@/components/chat/ShadowTalkLive").then((m) => ({ default: m.ShadowTalkLive })),
);
const ShadowBrowser = lazy(() =>
  import("@/components/chat/ShadowBrowser").then((m) => ({ default: m.ShadowBrowser })),
);
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineChatHistory } from "@/hooks/useOfflineChatHistory";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useGuestUsage, GUEST_LIMITS } from "@/hooks/useGuestUsage";
import { useToolOrchestrator } from "@/hooks/useToolOrchestrator";
import { useAgenticToolDispatch } from "@/hooks/useAgenticToolDispatch";
import { detectShadowExecutionFromChat } from "@/lib/execution/inferFromChat";
import { ChatAmbientBackground } from "@/components/chat/ChatAmbientBackground";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatMainPanel } from "@/components/chat/ChatMainPanel";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import { useChatSidebarCollapse } from "@/hooks/useChatSidebarCollapse";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatMobileNavDrawer } from "@/components/chat/ChatMobileNavDrawer";
import { useShadowMemoryContext } from "@/contexts/ShadowMemoryContext";
import { useIntelligenceHub } from "@/hooks/useIntelligenceHub";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { useMarketplace } from "@/hooks/useMarketplace";
import { resolveAgentRuntime } from "@/lib/marketplace/resolveAgentConfig";
import { prependAgentSystemPrompt } from "@/lib/marketplace/applyAgentToChat";
import {
  clearActiveMarketplaceAgent,
  getActiveMarketplaceSession,
  setActiveMarketplaceAgent,
} from "@/lib/marketplace/activeAgentSession";
import { MarketplaceAgentBanner } from "@/components/chat/MarketplaceAgentBanner";
import type { MarketplaceAgent, MarketplaceAgentRuntime } from "@/lib/marketplace/types";
import { runOfflineCompletion } from "@/lib/offline/runOfflineCompletion";
import { prewarmFastestLocalPath, warmHardwareProfile } from "@/lib/hardwareIntelligence";
import { runLocalChat, isAnyLocalModelReady } from "@/lib/offline/localChat";
import type { RouterMessage } from "@/lib/offline/hybridRouter";
import { decideRoute } from "@/lib/offline/hybridRouter";
import { useCustomApiKeys } from "@/hooks/useCustomApiKeys";
import { stringifyChatBody } from "@/lib/chatRequest";
import { ByokProviderKeyDialog } from "@/components/chat/ByokProviderKeyDialog";
import {
  buildChatProviderPayload,
  hasStoredKeyForProvider,
  resolveActiveUiProvider,
} from "@/lib/chatProviderBridge";
import { loadCustomAiConfig, saveCustomAiConfig } from "@/lib/customApiKeys";
import {
  getGuestArchivedIds,
  isConversationArchived,
  setGuestArchivedIds,
} from "@/lib/chatArchive";
import { CHAT_COMMAND_NAV_ROUTES } from "@/lib/chatCommandRoutes";
import { useChatSpeech } from "@/hooks/useChatSpeech";
import { OfflineToolsPanel } from "@/components/chat/OfflineToolsPanel";
import { useAutoBrowse } from "@/components/chat/BrowseActivityPanel";
import { ChatUpgradeNudge } from "@/components/monetization/ChatUpgradeNudge";
import { UpgradePrompt } from "@/components/monetization/UpgradePrompt";
import { useSubscriptionNudge } from "@/hooks/useSubscriptionNudge";
import { CHAT_LIMIT_TOAST } from "@/lib/conversionCopy";
import { getDailyMessageCount, incrementDailyMessageCount } from "@/lib/dailyMessageCounter";
import { openProjectInIde, saveIdePayload } from "@/lib/idePayloadStorage";
import { detectAppBuilderIntent, generateAppProject } from "@/lib/appBuilder";
import { useShadowTalkModel } from "@/hooks/useShadowTalkModel";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import { ReferralNudgeBanner } from "@/components/growth/ReferralNudgeBanner";
import { ShareResultDialog } from "@/components/growth/ShareResultDialog";
import { ShareWinBanner } from "@/components/growth/ShareWinBanner";
import { recordSuccessfulChatSession } from "@/lib/growth/sessionMilestones";
import {
  buildChatShareSubtitle,
  buildChatShareTitle,
  isShareWorthyReply,
  recordChatShareBannerShown,
  shouldShowChatShareBanner,
} from "@/lib/growth/selfMarketing";
import { useUserReferralCode } from "@/hooks/useUserReferralCode";
import { useChatSettings } from "@/hooks/useChatSettings";
import { useE2EE } from "@/hooks/useE2EE";
import { useChatPrivateMode } from "@/hooks/useChatPrivateMode";
import {
  getChatFetchHeaders,
  getChatFunctionUrl,
  isSupabaseConfigured,
  DESKTOP_ENV_SETUP_HINT,
  formatChatFetchError,
} from "@/lib/supabaseEnv";
import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import { desktopChatStream } from "@/lib/desktopChatFetch";
// Types
interface Message { 
  id: string; 
  type: "user" | "ai"; 
  content: string; 
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
  imageUrl?: string;
  toolExecution?: { tool: string; status: string; result?: string; params?: Record<string, string> };
}
type Conversation = {
  id: string;
  title: string;
  created_at: string;
  archived_at?: string | null;
};
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

function parseSseContentLines(
  lines: string[],
  assistantContent: string,
): string {
  let content = assistantContent;
  for (const line of lines) {
    if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
    try {
      const data = JSON.parse(line.slice(6));
      const delta = data.choices?.[0]?.delta?.content;
      if (delta) content += delta;
    } catch {
      /* ignore malformed SSE chunk */
    }
  }
  return content;
}

const ChatbotPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userPlan, signOut, checkSubscription, isOffline } = useAuth();
  const { toast } = useToast();
  
  // Hooks
  const { checkAccess, isElite, isProOrHigher } = useFeatureGating();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackConversationCreated } = useUsageTracking();
  const { getOfflineSession } = useOfflineAuth();
  const toolOrchestrator = useToolOrchestrator();
  const { dispatchDetection, goToExecute } = useAgenticToolDispatch();
  const gemmaOffline = useGemmaOffline();
  const sovereignModel = useShadowTalkModel();
  const { getAgentById, agents: marketplaceAgents, loading: marketplaceCatalogLoading } = useMarketplace();
  const [activeMarketplaceAgent, setActiveMarketplaceAgentState] = useState<MarketplaceAgent | null>(null);
  const marketplaceRuntimeRef = useRef<MarketplaceAgentRuntime | null>(null);
  const { aiConfig, hasVerifiedKey, keys, switchToPlatformDefault, setDefault, refresh: refreshApiKeys } =
    useCustomApiKeys();
  
  // State
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyChats, setDailyChats] = useState(() => getDailyMessageCount());
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const nudge = useSubscriptionNudge(
    dailyChats,
    conversations.filter((c) => !c.archived_at).length,
  );
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [personality, setPersonality] = useState<Personality>("friendly");
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const [aiProvider, setAiProvider] = useState<AIProvider>("lovable");
  const { preferences: chatPreferences, isLoading: chatPrefsLoading } = useChatSettings();
  const e2ee = useE2EE();
  const chatPrivate = useChatPrivateMode(e2ee);
  const appliedChatDefaults = useRef(false);
  const [byokDialogOpen, setByokDialogOpen] = useState(false);
  const [pendingByokProvider, setPendingByokProvider] = useState<AIProvider | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar, width: sidebarWidth } =
    useChatSidebarCollapse();
  const isMobile = useIsMobile();
  const historyPanelLeft = isMobile ? 0 : sidebarWidth;
  const [isListening, setIsListening] = useState(false);
  const { isSpeaking, speakingMessageId, speakMessage } = useChatSpeech();
  const [selectedFile, setSelectedFile] = useState<{ type: 'image' | 'file'; data: string; name: string; mimeType: string } | null>(null);
  
  // Modals
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showOfflineTools, setShowOfflineTools] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [chatShareOffer, setChatShareOffer] = useState<{ title: string; subtitle?: string } | null>(null);
  const [chatShareDialogOpen, setChatShareDialogOpen] = useState(false);
  const referralCode = useUserReferralCode();
  const [guestArchivedIds, setGuestArchivedIdsState] = useState<Set<string>>(() =>
    getGuestArchivedIds(),
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useGeoLocation();

  useEffect(() => {
    warmHardwareProfile();
    prewarmFastestLocalPath();
  }, []);

  useEffect(() => {
    if (keys.length === 0 && !aiConfig.useCustomKey && loadCustomAiConfig().usePlatformDefault) return;
    setAiProvider(resolveActiveUiProvider(keys, aiConfig));
  }, [keys, aiConfig.useCustomKey, aiConfig.preferredProvider]);

  const hasKeyForProvider = useCallback(
    (p: AIProvider) => hasStoredKeyForProvider(p, keys),
    [keys],
  );

  const handleProviderChange = useCallback(
    async (next: AIProvider) => {
      if (next === "lovable") {
        await switchToPlatformDefault();
        saveCustomAiConfig({ ...loadCustomAiConfig(), usePlatformDefault: true, apiKey: "" });
        setAiProvider("lovable");
        return;
      }

      if (!hasStoredKeyForProvider(next, keys)) {
        setPendingByokProvider(next);
        setByokDialogOpen(true);
        return;
      }

      setAiProvider(next);
      const serverId = next === "gemini" ? "google" : next === "openrouter" ? "openrouter" : null;
      if (serverId && keys.some((k) => k.provider === serverId && k.verified_at)) {
        await setDefault(serverId);
      }
    },
    [keys, setDefault, switchToPlatformDefault],
  );

  const handleByokSaved = useCallback(
    async (saved: AIProvider) => {
      setAiProvider(saved);
      await refreshApiKeys();
      setPendingByokProvider(null);
    },
    [refreshApiKeys],
  );

  useEffect(() => {
    if (chatPrefsLoading || appliedChatDefaults.current) return;
    appliedChatDefaults.current = true;
    setAiProvider(chatPreferences.defaultProvider);
    setPersonality(chatPreferences.defaultPersonality as Personality);
    setChatMode(chatPreferences.defaultMode);
  }, [chatPrefsLoading, chatPreferences]);

  useEffect(() => {
    const prompt = searchParams.get("q");
    if (prompt?.trim()) {
      setMessage(prompt.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      void loadConversation(convId);
    }
  }, [searchParams]);

  const activateMarketplaceAgent = useCallback((agent: MarketplaceAgent) => {
    const runtime = resolveAgentRuntime(agent);
    if (!runtime) return;
    setActiveMarketplaceAgent(agent);
    setActiveMarketplaceAgentState(agent);
    marketplaceRuntimeRef.current = runtime;
    if (runtime.chatMode) setChatMode(runtime.chatMode);
    if (runtime.personality) setPersonality(runtime.personality);
    setCurrentConversationId(null);
    setMessages([
      {
        id: "agent-welcome",
        type: "ai",
        content: runtime.welcomeMessage ?? `**${agent.name}** is now active. Ask anything in this specialty.`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    const agentId = searchParams.get("agent") ?? getActiveMarketplaceSession()?.agentId;
    if (!agentId) {
      setActiveMarketplaceAgentState(null);
      marketplaceRuntimeRef.current = null;
      return;
    }

    const fromCatalog = getAgentById(agentId);
    if (fromCatalog) {
      activateMarketplaceAgent(fromCatalog);
      return;
    }

    if (marketplaceCatalogLoading) return;

    void supabase
      .from("marketplace_agents")
      .select("*")
      .eq("id", agentId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) activateMarketplaceAgent(data as MarketplaceAgent);
      });
  }, [searchParams, marketplaceAgents, marketplaceCatalogLoading, getAgentById, activateMarketplaceAgent]);

  const clearMarketplaceAgentSession = useCallback(() => {
    setActiveMarketplaceAgentState(null);
    marketplaceRuntimeRef.current = null;
    clearActiveMarketplaceAgent();
  }, []);

  useEffect(() => {
    const offlineSession = getOfflineSession();
    if (user || offlineSession) {
      loadConversations();
      checkSubscription();
      if (isElite) requestPermission();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const conversationIsArchived = (conv: Conversation) =>
    isConversationArchived(conv.id, conv.archived_at, guestArchivedIds);

  const loadConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (data && !error) {
      const rows = await Promise.all(
        data.map(async (c) => ({
          ...c,
          title: await chatPrivate.resolveDisplayText(c.title || "Untitled"),
          archived_at: (c as Conversation).archived_at ?? null,
        })),
      );
      setConversations(rows);
      const active = rows.filter(
        (c) => !isConversationArchived(c.id, c.archived_at, guestArchivedIds),
      );
      if (active.length > 0 && !currentConversationId) {
        loadConversation(active[0].id);
      } else if (active.length === 0) {
        setMessages([{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }]);
      }
    }
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data && !error) {
      const loadedMessages: Message[] = await Promise.all(
        data.map(async (m) => ({
          id: m.id,
          type: m.role === "user" ? "user" : "ai",
          content: await chatPrivate.resolveDisplayText(m.content),
          timestamp: new Date(m.created_at),
        })),
      );
      setMessages(
        loadedMessages.length === 0
          ? [{ id: "welcome", type: "ai", content: getWelcomeMessage(), timestamp: new Date() }]
          : loadedMessages,
      );
    }
  };

  const getWelcomeMessage = () => {
    return "👋 Welcome back! Your neural workspace is ready.";
  };

  const welcomeMessage = (): Message => ({
    id: "welcome",
    type: "ai",
    content: getWelcomeMessage(),
    timestamp: new Date(),
  });

  const isGuestConversationId = (id: string | null) =>
    !!id && (id.startsWith("guest-") || !user);

  const resetToNewChat = () => {
    setCurrentConversationId(null);
    setMessages([welcomeMessage()]);
    setMessage("");
    setSelectedFile(null);
    clearMarketplaceAgentSession();
  };

  const handleNewChat = () => {
    resetToNewChat();
    setShowSidebar(false);
    toast({ title: "New chat", description: "Started a fresh conversation." });
  };

  const handleClearCurrentChat = async () => {
    const convId = currentConversationId;
    if (!convId) {
      resetToNewChat();
      return;
    }

    if (isGuestConversationId(convId)) {
      resetToNewChat();
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      const guestConvId = `guest-${Date.now()}`;
      setCurrentConversationId(guestConvId);
      setConversations([{ id: guestConvId, title: "Guest Conversation", created_at: new Date().toISOString() }]);
      toast({ title: "Chat cleared" });
      return;
    }

    if (!user) return;

    const { error: msgError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", convId)
      .eq("user_id", user.id);

    if (msgError) {
      const { error: convError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", convId)
        .eq("user_id", user.id);
      if (convError) {
        toast({ title: "Could not clear chat", description: convError.message, variant: "destructive" });
        return;
      }
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      resetToNewChat();
    } else {
      await supabase
        .from("conversations")
        .update({ title: "New Chat", updated_at: new Date().toISOString() })
        .eq("id", convId)
        .eq("user_id", user.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: "New Chat" } : c)),
      );
      setMessages([welcomeMessage()]);
    }

    toast({ title: "Chat cleared", description: "Messages in this conversation were removed." });
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (isGuestConversationId(conversationId)) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (currentConversationId === conversationId) resetToNewChat();
      return;
    }

    if (!user) return;

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    const wasActive = currentConversationId === conversationId;
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
  };

  const switchAfterArchive = (archivedId: string, guestArchiveSet = guestArchivedIds) => {
    if (currentConversationId !== archivedId) return;
    const active = conversations.filter(
      (c) =>
        c.id !== archivedId &&
        !isConversationArchived(c.id, c.archived_at, guestArchiveSet),
    );
    if (active.length > 0) {
      void loadConversation(active[0].id);
    } else {
      resetToNewChat();
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    const archivedAt = new Date().toISOString();

    if (isGuestConversationId(conversationId)) {
      const next = new Set(guestArchivedIds);
      next.add(conversationId);
      setGuestArchivedIdsState(next);
      setGuestArchivedIds(next);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, archived_at: archivedAt } : c)),
      );
      switchAfterArchive(conversationId, next);
      toast({ title: "Chat archived", description: "Find it under Archived in history." });
      return;
    }

    if (!user) return;

    const { error } = await supabase
      .from("conversations")
      .update({ archived_at: archivedAt } as never)
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Could not archive", description: error.message, variant: "destructive" });
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, archived_at: archivedAt } : c)),
    );
    switchAfterArchive(conversationId);
    toast({ title: "Chat archived", description: "Find it under Archived in history." });
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    if (isGuestConversationId(conversationId)) {
      const next = new Set(guestArchivedIds);
      next.delete(conversationId);
      setGuestArchivedIdsState(next);
      setGuestArchivedIds(next);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, archived_at: null } : c)),
      );
      toast({ title: "Chat restored", description: "Moved back to your active chats." });
      return;
    }

    if (!user) return;

    const { error } = await supabase
      .from("conversations")
      .update({ archived_at: null } as never)
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Could not restore", description: error.message, variant: "destructive" });
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, archived_at: null } : c)),
    );
    toast({ title: "Chat restored", description: "Moved back to your active chats." });
  };

  const handleClearAllChats = async () => {
    if (!user) {
      const guestConvId = `guest-${Date.now()}`;
      setConversations([{ id: guestConvId, title: "Guest Conversation", created_at: new Date().toISOString() }]);
      setCurrentConversationId(guestConvId);
      setMessages([
        {
          id: "welcome",
          type: "ai",
          content: "👋 Welcome to ShadowTalk AI! Your neural workspace is ready for guest access.",
          timestamp: new Date(),
        },
      ]);
      setShowSidebar(false);
      toast({ title: "All chats cleared" });
      return;
    }

    const { error } = await supabase.from("conversations").delete().eq("user_id", user.id);

    if (error) {
      toast({ title: "Could not delete chats", description: error.message, variant: "destructive" });
      return;
    }

    setConversations([]);
    resetToNewChat();
    setShowSidebar(false);
    toast({ title: "All chats deleted", description: "Your conversation history was cleared." });
  };

  const ensureConversation = async (): Promise<string | null> => {
    if (!user) return currentConversationId;
    if (currentConversationId) return currentConversationId;

    const titleToSave = chatPrivate.active
      ? await chatPrivate.wrapForStorage("New Chat")
      : "New Chat";
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: titleToSave })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Could not start chat", description: "Try again in a moment.", variant: "destructive" });
      return null;
    }

    setCurrentConversationId(data.id);
    const displayTitle = chatPrivate.active
      ? "Private Chat"
      : (await chatPrivate.resolveDisplayText(data.title || "New Chat")) || "New Chat";
    setConversations((prev) => [
      { id: data.id, title: displayTitle, created_at: data.created_at },
      ...prev,
    ]);
    return data.id;
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant', conversationId: string) => {
    if (!user || !conversationId) return null;

    const contentToSave = await chatPrivate.wrapForStorage(content);
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, user_id: user.id, content: contentToSave, role, personality })
      .select().single();
    
    if (role === 'user' && messages.length <= 1) {
      const titlePlain = content.trim().split(/\s+/).slice(0, 3).join(' ').slice(0, 25) || 'New Chat';
      const title = await chatPrivate.wrapForStorage(titlePlain);
      await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', conversationId);
      const displayTitle = chatPrivate.active
        ? "Private Chat"
        : titlePlain;
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: displayTitle } : c));
    }
    return data;
  };

  const handleEnableChatEncryption = async () => {
    let conversationId = currentConversationId;
    if (user && !conversationId) {
      conversationId = await ensureConversation();
    }
    if (!conversationId && !user) {
      const guestConvId = `guest-${Date.now()}`;
      setCurrentConversationId(guestConvId);
      setConversations((prev) => [
        { id: guestConvId, title: "Private Chat", created_at: new Date().toISOString() },
        ...prev,
      ]);
      conversationId = guestConvId;
    }
    if (!conversationId) return;

    const ok = await chatPrivate.enablePrivateMode({
      conversationId,
      messages: messages.filter((m) => m.id !== "welcome"),
      isGuest: isGuestConversationId(conversationId),
    });
    if (!ok) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, title: "Private Chat" } : c,
      ),
    );
    if (user && !isGuestConversationId(conversationId)) {
      await loadConversation(conversationId);
    }
  };

  const runChatCompletion = useCallback(
    async (
      chatMessages: Array<{ role: string; content: string }>,
      conversationId: string,
      chatFlags?: {
        webSearch?: boolean;
        searchQuery?: string;
        deepResearch?: boolean;
        researchQuery?: string;
      },
    ): Promise<string | undefined> => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let augmented = prependAgentSystemPrompt(chatMessages, marketplaceRuntimeRef.current);
      const lastUser =
        [...chatMessages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";

      if (aiProvider === "shadowtalk" && sovereignModel.enabled && lastUser) {
        const learned = await sovereignModel.getLearnedSystemPrompt(lastUser);
        if (learned) {
          augmented = [{ role: "system", content: learned }, ...augmented];
        }
      }

      const routerMessages: RouterMessage[] = augmented.map((m) => ({
        role: m.role as RouterMessage["role"],
        content: m.content,
      }));

      const route = decideRoute(routerMessages, navigator.onLine);
      const useLocal =
        route.target === "local" || (aiProvider === "shadowtalk" && isAnyLocalModelReady());
      if (useLocal) {
        if (!isAnyLocalModelReady()) {
          prewarmFastestLocalPath();
        }

        const aiMessageId = crypto.randomUUID();
        let assistantContent = "";

        const streamToken = (token: string) => {
          assistantContent += token;
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === aiMessageId);
            if (exists) {
              return prev.map((m) =>
                m.id === aiMessageId ? { ...m, content: assistantContent } : m,
              );
            }
            return [
              ...prev,
              { id: aiMessageId, type: "ai", content: assistantContent, timestamp: new Date() },
            ];
          });
        };

        const offline = await runOfflineCompletion({
          messages: routerMessages,
          personality,
          isOnline: navigator.onLine,
          onToken: streamToken,
          gemmaChat: gemmaOffline.chatLocal,
        });

        if (offline?.content) {
          if (!assistantContent) {
            streamToken(offline.content);
          }
          if (user) {
            await saveMessage(offline.content, "assistant", conversationId);
          }
          return assistantContent || offline.content;
        }

        if (isAnyLocalModelReady()) {
          try {
            const { content } = await runLocalChat(routerMessages, streamToken);
            if (content && user) {
              await saveMessage(content, "assistant", conversationId);
            }
            return assistantContent || content;
          } catch (e) {
            console.warn("[Chat] Local turbo path failed, using cloud:", e);
          }
        }
      }

      const chatUrl = getChatFunctionUrl();
      if (!chatUrl || !isSupabaseConfigured()) {
        throw new Error(
          `Chat is not configured for this build. ${DESKTOP_ENV_SETUP_HINT}`,
        );
      }

      const { data: { session } } = await supabase.auth.getSession();
      const requestBody = stringifyChatBody({
        messages: augmented,
        personality,
        mode: chatMode,
        ...buildChatProviderPayload(aiProvider, aiConfig, keys),
        ...(chatFlags?.webSearch
          ? { webSearch: true, searchQuery: chatFlags.searchQuery }
          : {}),
        ...(chatFlags?.deepResearch
          ? { deepResearch: true, researchQuery: chatFlags.researchQuery }
          : {}),
      });

      const raiseChatHttpError = async (status: number, rawBody: string) => {
        let detail = "Chat request failed";
        let needsByok = false;
        try {
          const errJson = JSON.parse(rawBody);
          detail = typeof errJson.error === "string" ? errJson.error : detail;
          needsByok = errJson?.needsByok === true || errJson?.code === "PLATFORM_CREDITS_EXHAUSTED";
        } catch {
          detail = rawBody || detail;
        }
        if (status === 402 && needsByok) {
          setPendingByokProvider("openrouter");
          setByokDialogOpen(true);
          toast({
            title: "Add your API key to keep chatting",
            description: "Platform credits are exhausted. Paste your own provider key — takes ~2 minutes and uses your free tier.",
          });
        }
        throw new Error(detail);
      };

      const aiMessageId = crypto.randomUUID();
      let assistantContent = "";

      // SPEED: coalesce setMessages calls to one per frame so streaming
      // doesn't trigger a full React reconcile on every SSE chunk.
      let pendingContent: string | null = null;
      let rafId: number | null = null;
      const flushAssistant = () => {
        rafId = null;
        if (pendingContent === null) return;
        const content = pendingContent;
        pendingContent = null;
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === aiMessageId);
          if (exists) {
            return prev.map((m) =>
              m.id === aiMessageId ? { ...m, content } : m,
            );
          }
          return [
            ...prev,
            { id: aiMessageId, type: "ai", content, timestamp: new Date() },
          ];
        });
      };
      const pushAssistant = (content: string) => {
        assistantContent = content;
        pendingContent = content;
        if (rafId === null) {
          rafId = typeof requestAnimationFrame !== "undefined"
            ? requestAnimationFrame(flushAssistant)
            : (setTimeout(flushAssistant, 16) as unknown as number);
        }
      };
      const finalizeAssistant = () => {
        if (rafId !== null) {
          if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(rafId);
          else clearTimeout(rafId as unknown as number);
          rafId = null;
        }
        if (pendingContent !== null) flushAssistant();
      };

      if (isShadowTalkDesktop()) {
        let lineBuffer = "";
        const end = await desktopChatStream(
          chatUrl,
          requestBody,
          session?.access_token,
          controller.signal,
          (chunk) => {
            lineBuffer += chunk;
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop() ?? "";
            const next = parseSseContentLines(lines, assistantContent);
            if (next !== assistantContent) pushAssistant(next);
          },
        );
        if (!end.ok) {
          await raiseChatHttpError((end as unknown as { status?: number }).status ?? 500, (end as unknown as { body?: string }).body);
        }
      } else {
        const resp = await fetch(chatUrl, {
          method: "POST",
          headers: getChatFetchHeaders(session?.access_token),
          signal: controller.signal,
          body: requestBody,
        });

        if (!resp.ok) {
          await raiseChatHttpError(resp.status, await resp.text().catch(() => ""));
        }

        const contentType = resp.headers.get("content-type") || "";
        if (!contentType.includes("text/event-stream")) {
          await raiseChatHttpError(resp.status, await resp.text().catch(() => ""));
        }

        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";
          const next = parseSseContentLines(lines, assistantContent);
          if (next !== assistantContent) pushAssistant(next);
        }
      }

      finalizeAssistant();
      // SPEED: don't block UI on DB write — fire and forget.
      if (assistantContent && user) {
        void saveMessage(assistantContent, "assistant", conversationId).catch((e) =>
          console.warn("[chat] saveMessage(assistant) failed", e),
        );
      }
      if (assistantContent.trim().length > 0) {
        recordSuccessfulChatSession();
      }
      return assistantContent || undefined;
    },
    [aiProvider, aiConfig, keys, chatMode, personality, user, gemmaOffline.chatLocal, sovereignModel],
  );

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    toast({ title: "Stopped", description: "Generation cancelled." });
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    const target = messages[index];
    if (!target || target.type !== "user") return;

    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, content: trimmed } : m)),
    );

    if (user && currentConversationId && !isGuestConversationId(currentConversationId)) {
      await supabase
        .from("messages")
        .update({ content: trimmed })
        .eq("id", target.id)
        .eq("user_id", user.id);
    }
    toast({ title: "Message updated" });
  };

  const handleRegenerateMessage = async (index: number) => {
    const target = messages[index];
    if (!target || target.type !== "ai" || isLoading) return;

    const prior = messages.slice(0, index);
    const chatMessages = prior
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      }));

    if (chatMessages.length === 0) return;

    const conversationId = user ? await ensureConversation() : currentConversationId;
    if (!conversationId) return;

    setMessages(prior);
    setIsLoading(true);

    try {
      await runChatCompletion(chatMessages, conversationId);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Regeneration failed.";
      toast({ title: "Regeneration failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isLoading) return;

    if (!isProOrHigher && nudge.shouldBlockSend) {
      setUpgradeOpen(true);
      toast({
        title: CHAT_LIMIT_TOAST.title,
        description: CHAT_LIMIT_TOAST.description,
        variant: "destructive",
      });
      return;
    }

    const conversationId = user ? await ensureConversation() : currentConversationId;
    if (!conversationId) return;

    const msgContent = message;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: msgContent,
      timestamp: new Date(),
      attachment: selectedFile || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setSelectedFile(null);
    setIsLoading(true);
    // SPEED: persist user message in the background; don't block the AI call on a DB write.
    if (user) void saveMessage(msgContent, "user", conversationId).catch((e) =>
      console.warn("[chat] saveMessage(user) failed", e),
    );

    if (!isProOrHigher) {
      setDailyChats(incrementDailyMessageCount());
    }

    const chatMessages = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      }));
    chatMessages.push({ role: "user", content: msgContent });

    const execHint = detectShadowExecutionFromChat(msgContent);
    if (execHint.use && execHint.autoRoute) {
      goToExecute(msgContent, execHint.deliverableType);
      const label =
        execHint.deliverableType === "strategy_report"
          ? "Strategy report"
          : execHint.deliverableType === "research_brief"
            ? "Research brief"
            : "Shadow Execution";
      const routeMsg = `**${label}** fits this request better than a single chat reply — opening the execution workspace with your goal pre-filled. I'll run a visible plan with live web research and a saved deliverable.`;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "ai",
          content: routeMsg,
          timestamp: new Date(),
          toolExecution: {
            tool: "shadow_execution",
            status: "complete",
            params: { goal: msgContent, mode: execHint.deliverableType },
            result: label,
          },
        },
      ]);
      if (user) void saveMessage(routeMsg, "assistant", conversationId).catch(() => {});
      setIsLoading(false);
      return;
    }

    const toolOutcome = dispatchDetection(msgContent, {
      openDeepResearch: (q) => {
        setShowDeepResearch(true);
        if (q) setMessage(q);
      },
      openImageGenerator: () => setShowImageGenerator(true),
      openAgenticRunner: (g) => goToExecute(g, "general"),
      openBrowser: () => setShowShadowBrowser(true),
      openShadowLive: () => setShowShadowTalkLive(true),
      openMissionControl: () => goToExecute(msgContent, "general"),
      openShadowExecution: (g, mode) => goToExecute(g, mode),
      setPendingMessage: (text) => setMessage(text),
      appendAssistantMessage: (content, toolExecution) => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "ai",
            content,
            timestamp: new Date(),
            toolExecution,
          },
        ]);
        if (user) void saveMessage(content, "assistant", conversationId).catch(() => {});
      },
    });

    if (toolOutcome.handled) {
      const flags = (toolOutcome as unknown as { chatFlags?: { webSearch?: boolean; searchQuery?: string; deepResearch?: boolean; researchQuery?: string; decodeImage?: boolean; imageDataUrl?: string } }).chatFlags;
      if (flags?.webSearch || flags?.deepResearch) {
        try {
          const assistantReply = await runChatCompletion(
            chatMessages,
            conversationId,
            flags,
          );
          if (assistantReply && isShareWorthyReply(assistantReply) && shouldShowChatShareBanner()) {
            setChatShareOffer({
              title: buildChatShareTitle(msgContent, assistantReply),
              subtitle: buildChatShareSubtitle(msgContent),
            });
            recordChatShareBannerShown();
          }
        } catch (err) {
          if (!(err instanceof DOMException && err.name === "AbortError")) {
            const msg = formatChatFetchError(err);
            toast({ title: "Message failed", description: msg, variant: "destructive" });
          }
        }
      }
      setIsLoading(false);
      return;
    }

    const toolDetection = toolOrchestrator.detectTool(msgContent);
    const appIntent =
      detectAppBuilderIntent(msgContent) ??
      (toolDetection.tool === "app_builder"
        ? {
            platform: (toolDetection.params?.platform === "mobile" ? "mobile" : "web") as
              | "web"
              | "mobile",
            confidence: toolDetection.confidence,
          }
        : null);

    if (appIntent && appIntent.confidence >= 50) {
      const platform = appIntent.platform;
      const statusId = crypto.randomUUID();
      const platformLabel = platform === "mobile" ? "mobile" : "web";
      setMessages((prev) => [
        ...prev,
        {
          id: statusId,
          type: "ai",
          content: `Building your **${platformLabel} app** in the Code IDE — generating HTML, CSS, and JavaScript…`,
          timestamp: new Date(),
          toolExecution: { tool: "app_builder", status: "running" },
        },
      ]);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const project = await generateAppProject({
          prompt: msgContent,
          platform,
          accessToken: session?.access_token,
          personality,
          mode: "code",
          providerPayload: buildChatProviderPayload(aiProvider, aiConfig, keys),
        });

        openProjectInIde(
          {
            title: project.title,
            platform: project.platform,
            files: project.files,
          },
          { openPreview: true },
        );

        const summary =
          `**${project.title}** is ready in the Code IDE (${project.files.length} files).\n\n` +
          `${project.description || `A ${platformLabel} app based on your request.`}\n\n` +
          `Use **Preview** to run it live` +
          (platform === "mobile" ? " — switch to the **Mobile** viewport (375px) for the best view." : ".") +
          `\n\nAsk me to add features, new screens, or connect a backend anytime.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusId
              ? {
                  ...m,
                  content: summary,
                  toolExecution: { tool: "app_builder", status: "complete", result: project.title },
                }
              : m,
          ),
        );
        if (user) await saveMessage(summary, "assistant", conversationId);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "App generation failed.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusId
              ? {
                  ...m,
                  content: `Could not generate the app: ${errMsg}. Try again or open the IDE to start from a template.`,
                  toolExecution: { tool: "app_builder", status: "error" },
                }
              : m,
          ),
        );
        toast({ title: "App builder failed", description: errMsg, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const assistantReply = await runChatCompletion(chatMessages, conversationId);
      if (aiProvider === "shadowtalk" && sovereignModel.enabled) {
        void sovereignModel.learnFromTurn(msgContent, assistantReply);
      }
      if (assistantReply && isShareWorthyReply(assistantReply) && shouldShowChatShareBanner()) {
        setChatShareOffer({
          title: buildChatShareTitle(msgContent, assistantReply),
          subtitle: buildChatShareSubtitle(msgContent),
        });
        recordChatShareBannerShown();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = formatChatFetchError(err);
      toast({ title: "Message failed", description: msg, variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "ai", content: msg, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmptyChat = messages.filter((m) => m.id !== "welcome").length === 0;
  const hasActiveChat = messages.some((m) => m.id !== "welcome");
  const userDisplayName = chatPrivate.anonymousUi
    ? "Anonymous"
    : user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const userInitials = chatPrivate.anonymousUi
    ? "?"
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : "G";

  const handleConfirmTool = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      const te = msg?.toolExecution;
      if (!te?.params?.goal) return;
      const mode = (te.params.mode as "general" | "strategy_report" | "research_brief" | "content_pack") || "general";
      goToExecute(te.params.goal, mode);
    },
    [messages, goToExecute],
  );

  const openChatShare = useCallback(
    (assistantContent: string, userPrompt?: string) => {
      const lastUser =
        userPrompt ??
        [...messages].reverse().find((m) => m.type === "user" && m.id !== "welcome")?.content ??
        "";
      setChatShareOffer({
        title: buildChatShareTitle(lastUser, assistantContent),
        subtitle: buildChatShareSubtitle(lastUser),
      });
      setChatShareDialogOpen(true);
    },
    [messages],
  );

  const handleExport = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        conversationId: currentConversationId,
        personality,
        mode: chatMode,
        sharedVia: BRAND.fullName,
        inviteUrl: "https://www.shadowtalk-ai.com/chatbot?utm_source=export&utm_medium=json&utm_campaign=chat_export",
        messages: messages.map((m) => ({
          role: m.type,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shadowtalk-history-${currentConversationId || "chat"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Downloaded chat history JSON." });
    } catch {
      toast({ title: "Export failed", description: "Could not export chat history.", variant: "destructive" });
    }
  };

  const handleCommandAction = (action: string) => {
    setShowCommandPalette(false);

    const navPath = CHAT_COMMAND_NAV_ROUTES[action];
    if (navPath) {
      navigate(navPath);
      return;
    }

    switch (action) {
      case "new-chat":
        handleNewChat();
        return;
      case "deep-research":
        setShowDeepResearch(true);
        return;
      case "image":
        setShowImageGenerator(true);
        return;
      case "voice":
        setShowShadowTalkLive(true);
        return;
      case "browser":
        setShowShadowBrowser(true);
        return;
      case "missions":
      case "agentic":
      case "cognitive-loop":
        navigate("/execute");
        return;
      case "offline-tools":
      case "offline":
        setShowOfflineTools(true);
        return;
      case "vision":
        setShowCommandPalette(true);
        return;
      case "bunker": {
        const enabled = localStorage.getItem("shadowtalk_bunker_mode") === "true";
        localStorage.setItem("shadowtalk_bunker_mode", enabled ? "false" : "true");
        window.dispatchEvent(
          new CustomEvent("shadowtalk-bunker-changed", { detail: { enabled: !enabled } }),
        );
        toast({
          title: !enabled ? "Bunker mode enabled" : "Bunker mode disabled",
          description: !enabled
            ? "Background model downloads can run when configured in Profile."
            : "Background downloads paused.",
        });
        return;
      }
      case "wordle":
        setMessage("Let's play Wordle — pick a 5-letter word and give me hints.");
        toast({ title: "Wordle", description: "Prompt added to the chat input." });
        return;
      default:
        toast({
          title: "Try the chat tools menu",
          description: "Open Tools (⊞) in the header for more actions.",
        });
    }
  };

  const chatInputProps = {
    message,
    onMessageChange: setMessage,
    onSend: handleSendMessage,
    onKeyPress: (e: React.KeyboardEvent) => e.key === "Enter" && handleSendMessage(),
    isLoading,
    isListening,
    onToggleVoice: () => setShowShadowTalkLive(true),
    onOpenImageGenerator: () => setShowImageGenerator(true),
    onStopGeneration: handleStopGeneration,
    selectedFile,
    onFileSelect: setSelectedFile,
    chatMode,
    onModeChange: setChatMode,
    personality,
    layout: "composer" as const,
    aiProvider,
    onProviderChange: handleProviderChange,
    hasKeyForProvider,
  };

  return (
    <div className="shadowtalk-chat-shell min-h-screen neural-bg settings-scroll-smooth">
      <SEOHead meta={PAGE_SEO.chatbot} />
      <ChatAmbientBackground />
      <motion.div
        className="shadowtalk-chat-main flex h-screen w-full relative overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SETTINGS_SPRING}
      >
        <ChatShadowSidebar
          userInitials={userInitials}
          userDisplayName={userDisplayName}
          onNewChat={handleNewChat}
          onOpenHistory={() => setShowSidebar(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
        <ChatIconRail
          userInitials={userInitials}
          onNewChat={handleNewChat}
          onOpenHistory={() => setShowSidebar(true)}
          onOpenTools={() => setToolsMenuOpen(true)}
          onOpenSettings={() => navigate("/settings")}
          onOpenNav={() => setShowMobileNav(true)}
        />
        <ChatMobileNavDrawer
          open={showMobileNav}
          onClose={() => setShowMobileNav(false)}
          userInitials={userInitials}
          userDisplayName={userDisplayName}
          onNewChat={handleNewChat}
          onOpenHistory={() => setShowSidebar(true)}
        />
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.button
                type="button"
                aria-label="Close history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed top-0 right-0 bottom-0 z-40 bg-background/75 backdrop-blur-md"
                style={{ left: historyPanelLeft }}
                onClick={() => setShowSidebar(false)}
              />
              <motion.div
                initial={{ x: -320, opacity: 0.6 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={SETTINGS_SPRING}
                className="fixed top-0 bottom-0 z-50 shadow-elevated"
                style={{ left: historyPanelLeft }}
              >
                <ConversationSidebar
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  isArchived={conversationIsArchived}
                  onCreateNew={handleNewChat}
                  onSelect={(id) => {
                    loadConversation(id);
                    setShowSidebar(false);
                  }}
                  onDelete={handleDeleteConversation}
                  onArchive={handleArchiveConversation}
                  onUnarchive={handleUnarchiveConversation}
                  onClearAll={handleClearAllChats}
                  onClearCurrent={handleClearCurrentChat}
                  onOpenSettings={() => {
                    setShowSidebar(false);
                    navigate("/settings");
                  }}
                  onOpenWorkspace={() => {
                    setShowSidebar(false);
                    navigate("/workspace");
                  }}
                  onClose={() => setShowSidebar(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <ChatMainPanel>
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...SETTINGS_SPRING }}
            className="shadowtalk-chat-top-label hidden md:block"
          >
            {BRAND.tagline}
          </motion.p>
          <ChatToolbar
            hasActiveChat={hasActiveChat}
            conversationCount={conversations.length}
            onNewChat={handleNewChat}
            onOpenHistory={() => setShowSidebar(true)}
            onClearChat={handleClearCurrentChat}
            onDeleteAllChats={handleClearAllChats}
            encryptionActive={chatPrivate.active}
            encryptionBusy={chatPrivate.busy}
            onEnableEncryption={handleEnableChatEncryption}
            onDisableEncryption={chatPrivate.disablePrivateMode}
          />
          {chatPrivate.active && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 md:mx-6 mb-2 flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              End-to-end encrypted · Anonymous session
            </motion.div>
          )}
          <ChatHeader
            variant="minimal"
            userPlan={userPlan}
            personality={personality}
            onPersonalityChange={setPersonality}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onExport={handleExport}
            onManageSubscription={() => navigate("/billing")}
            onSignOut={signOut}
            onOpenAnalytics={() => navigate("/analytics")}
            onOpenScriptAutomation={() => navigate("/workspace?panel=automation")}
            onOpenStealthVault={() => navigate("/vault")}
            onOpenAgentWorkflows={() => navigate("/agent-architecture")}
            onOpenModelFineTuning={() => navigate("/personal-llm")}
            onOpenWhiteLabelBranding={() => navigate("/enterprise-license")}
            onOpenGeminiAnalytics={() => navigate("/analytics")}
            onOpenCanvas={() => navigate("/ide")}
            onOpenDeepResearch={() => setShowDeepResearch(true)}
            onOpenGoogleIntegration={() => navigate("/profile?tab=linked")}
            onOpenAgenticRunner={() => navigate("/execute")}
            onOpenVisualReasoning={() => setShowCommandPalette(true)}
            onOpenCreativeSynthesis={() => navigate("/studio")}
            onOpenImageGenerator={() => setShowImageGenerator(true)}
            onOpenShadowTalkLive={() => setShowShadowTalkLive(true)}
            onOpenBrowser={() => setShowShadowBrowser(true)}
            aiProvider={aiProvider}
            onProviderChange={handleProviderChange}
            hasKeyForProvider={hasKeyForProvider}
            maxChats="∞"
            dailyChats={dailyChats}
            toolsMenuOpen={toolsMenuOpen}
            onToolsMenuOpenChange={setToolsMenuOpen}
          />
          <ChatUpgradeNudge
            open={nudge.shouldShowBanner && !nudgeDismissed}
            intensity={nudge.intensity}
            headline={nudge.headline}
            subline={nudge.subline}
            used={nudge.used}
            limit={nudge.limit}
            recommendedPlan={nudge.recommendedPlan}
            onDismiss={() => setNudgeDismissed(true)}
          />
          <ReferralNudgeBanner />
          <UpgradePrompt
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            limitReached={nudge.shouldBlockSend}
            requiredPlan="premium"
          />
          <div className={`flex-1 overflow-hidden relative flex flex-col ${isEmptyChat ? "justify-center" : ""}`}>
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.99, filter: "blur(4px)" }}
                  transition={SETTINGS_SPRING}
                  className="flex-1 flex flex-col justify-center"
                >
                  <ChatEmptyState
                    userDisplayName={userDisplayName}
                    onSelectPrompt={setMessage}
                    apiConnectedLabel={
                      hasVerifiedKey && aiConfig.useCustomKey
                        ? `${aiConfig.preferredProvider} API connected`
                        : null
                    }
                  >
                    <ChatInput {...chatInputProps} isEmptyState />
                  </ChatEmptyState>
                </motion.div>
              ) : (
                <motion.div
                  key="thread"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={SETTINGS_SPRING}
                  className="h-full flex flex-col overflow-hidden"
                >
                  {activeMarketplaceAgent && marketplaceRuntimeRef.current && (
                    <MarketplaceAgentBanner
                      agentName={activeMarketplaceAgent.name}
                      runtime={marketplaceRuntimeRef.current}
                      onClear={clearMarketplaceAgentSession}
                      onStarterSelect={(p) => setMessage(p)}
                    />
                  )}
                  <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    showSuggestions={false}
                    personality={personality}
                    userPlan={userPlan}
                    speakingMessageId={speakingMessageId}
                    isSpeaking={isSpeaking}
                    onSelectPrompt={setMessage}
                    onEdit={handleEditMessage}
                    onRegenerate={handleRegenerateMessage}
                    onTextToSpeech={speakMessage}
                    onOpenCodeCanvas={(code, language) => {
                      saveIdePayload({ code, language: language || "javascript" });
                      navigate("/ide");
                    }}
                    onOpenIDE={(code, language) => {
                      saveIdePayload({ code, language });
                      navigate("/ide");
                    }}
                    onLaunchWebsite={(code) => {
                      saveIdePayload({ code, language: "html", openPreview: true });
                      navigate("/ide");
                    }}
                    onOpenInBrowser={(url) => {
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                      else setShowShadowBrowser(true);
                    }}
                    onShareReply={(content) => openChatShare(content)}
                    onConfirmTool={handleConfirmTool}
                    messagesEndRef={messagesEndRef}
                    layout="gemini"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isEmptyChat && (
            <>
              <ShareWinBanner
                visible={Boolean(chatShareOffer && !chatShareDialogOpen)}
                title={chatShareOffer?.title ?? ""}
                subtitle={chatShareOffer?.subtitle}
                referralCode={referralCode}
                onOpenShareDialog={() => setChatShareDialogOpen(true)}
                onDismiss={() => setChatShareOffer(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SETTINGS_SPRING}
                className="shadowtalk-chat-input-dock"
              >
                <div className="shadowtalk-chat-input-shell w-full">
                  <ChatInput {...chatInputProps} />
                </div>
              </motion.div>
            </>
          )}
          <ShareResultDialog
            open={chatShareDialogOpen}
            onOpenChange={(open) => {
              setChatShareDialogOpen(open);
              if (!open) setChatShareOffer(null);
            }}
            kind="chat"
            title={chatShareOffer?.title ?? "Built with ShadowTalk AI"}
            subtitle={chatShareOffer?.subtitle}
            referralCode={referralCode}
          />
        </ChatMainPanel>
      {showImageGenerator && <ImageGenerator onClose={() => setShowImageGenerator(false)} onImageGenerated={(url) => setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: '🎨 Generated image', timestamp: new Date(), imageUrl: url }])} />}
      {showDeepResearch && <DeepResearchPanel isOpen={showDeepResearch} onClose={() => setShowDeepResearch(false)} onInsertToChat={(c) => setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: c, timestamp: new Date() }])} />}
      {showOfflineTools && (
        <OfflineToolsPanel
          isOpen={showOfflineTools}
          onClose={() => setShowOfflineTools(false)}
          onInsertToChat={(text) => {
            setMessage(text);
            setShowOfflineTools(false);
            toast({ title: "Inserted into chat", description: "Edit the prompt and send when ready." });
          }}
        />
      )}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} onAction={handleCommandAction} />
      {showShadowTalkLive && (
        <Suspense fallback={null}>
          <ShadowTalkLive
            isOpen={showShadowTalkLive}
            onClose={() => setShowShadowTalkLive(false)}
            onInsertToChat={(content) => setMessage(content)}
          />
        </Suspense>
      )}
      {showShadowBrowser && (
        <Suspense fallback={null}>
          <ShadowBrowser
            isOpen={showShadowBrowser}
            onClose={() => setShowShadowBrowser(false)}
            onInsertToChat={(content) => setMessage(content)}
          />
        </Suspense>
      )}
      <ByokProviderKeyDialog
        open={byokDialogOpen}
        onOpenChange={setByokDialogOpen}
        provider={pendingByokProvider}
        onSaved={handleByokSaved}
      />
      </motion.div>
    </div>
  );
};
export default ChatbotPage;
