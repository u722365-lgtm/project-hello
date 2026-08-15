/**
 * useChatModals
 *
 * Extracts every modal, panel, drawer, and overlay boolean from ChatbotPage
 * into a single co-located hook so the page component stays focused on
 * chat logic (sending, routing, persistence).
 *
 * Groups are named semantically so consumers can destructure only what they
 * need:  toolPanels, securityPanels, shareState, layoutState, …
 */

import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import type { ChatMode } from "@/components/chat/ModeSelector";
import {
  CHAT_COMMAND_MODAL_ACTIONS,
  CHAT_COMMAND_NAV_ROUTES,
} from "@/lib/chatCommandRoutes";
import {
  buildChatShareTitle,
  buildChatShareSubtitle,
} from "@/lib/growth/selfMarketing";

// ─── Types ───────────────────────────────────────────────────────────

export interface ChatShareOffer {
  title: string;
  subtitle?: string;
  prompt?: string;
  answer?: string;
}

export type SignInPromptReason = "chats" | "images" | "deepResearch" | "general";

export type ShadowSpectreHead = string;

/** Message shape matching the one used inside ChatbotPage. */
export interface ChatMessage {
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

/** File attachment currently selected in the chat input. */
export type FileAttachment = ChatMessage["attachment"];

/** Parameters the hook needs from the host component. */
export interface UseChatModalsParams {
  navigate: (path: string) => void;
  message: string;
  handleNewChat: () => void;
  toast: {
    (opts: { title: string; description?: string; variant?: "destructive" }): void;
  };
  setChatMode: Dispatch<SetStateAction<ChatMode>>;
  messages: ChatMessage[];
  currentConversationId: string | null;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null;
  selectedFile: FileAttachment;
  setSelectedFile: Dispatch<SetStateAction<FileAttachment>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  saveMessage: (
    content: string,
    role: "user" | "assistant",
    conversationId: string,
  ) => Promise<unknown | null>;
  insertAssistantToChat: (content: string) => void;
  setMessage: Dispatch<SetStateAction<string>>;
}

// ─── Grouped state return types ──────────────────────────────────────

export interface ToolPanelState {
  showImageGenerator: boolean;
  showMusicGenerator: boolean;
  showWordle: boolean;
  showGoogleIntegration: boolean;
  showDeepResearch: boolean;
  showShadowTalkLive: boolean;
  showShadowBrowser: boolean;
  showCommandPalette: boolean;
  showOfflineTools: boolean;
  showCognitiveLoop: boolean;
  showMultiModel: boolean;
  showCreativeSynthesis: boolean;
  showVisualReasoning: boolean;
  showImageDecoder: boolean;
  showDailyPlanner: boolean;
  showPlanetaryActions: boolean;
  showScreenAgent: boolean;
  showVisionAgent: boolean;
  showIntelligenceHub: boolean;
  showKnowledgeVault: boolean;
  showAgenticRunner: boolean;
  showAgentWorkflows: boolean;
  showGeminiAnalytics: boolean;
  showDataOrganizer: boolean;
  showUncensoredArena: boolean;
  showShadowCowork: boolean;
  showAnalytics: boolean;
  showBrowseActivity: boolean;
}

export interface ToolPanelSetters {
  setShowImageGenerator: Dispatch<SetStateAction<boolean>>;
  setShowMusicGenerator: Dispatch<SetStateAction<boolean>>;
  setShowWordle: Dispatch<SetStateAction<boolean>>;
  setShowGoogleIntegration: Dispatch<SetStateAction<boolean>>;
  setShowDeepResearch: Dispatch<SetStateAction<boolean>>;
  setShowShadowTalkLive: Dispatch<SetStateAction<boolean>>;
  setShowShadowBrowser: Dispatch<SetStateAction<boolean>>;
  setShowCommandPalette: Dispatch<SetStateAction<boolean>>;
  setShowOfflineTools: Dispatch<SetStateAction<boolean>>;
  setShowCognitiveLoop: Dispatch<SetStateAction<boolean>>;
  setShowMultiModel: Dispatch<SetStateAction<boolean>>;
  setShowCreativeSynthesis: Dispatch<SetStateAction<boolean>>;
  setShowVisualReasoning: Dispatch<SetStateAction<boolean>>;
  setShowImageDecoder: Dispatch<SetStateAction<boolean>>;
  setShowDailyPlanner: Dispatch<SetStateAction<boolean>>;
  setShowPlanetaryActions: Dispatch<SetStateAction<boolean>>;
  setShowScreenAgent: Dispatch<SetStateAction<boolean>>;
  setShowVisionAgent: Dispatch<SetStateAction<boolean>>;
  setShowIntelligenceHub: Dispatch<SetStateAction<boolean>>;
  setShowKnowledgeVault: Dispatch<SetStateAction<boolean>>;
  setShowAgenticRunner: Dispatch<SetStateAction<boolean>>;
  setShowAgentWorkflows: Dispatch<SetStateAction<boolean>>;
  setShowGeminiAnalytics: Dispatch<SetStateAction<boolean>>;
  setShowDataOrganizer: Dispatch<SetStateAction<boolean>>;
  setShowUncensoredArena: Dispatch<SetStateAction<boolean>>;
  setShowShadowCowork: Dispatch<SetStateAction<boolean>>;
  setShowAnalytics: Dispatch<SetStateAction<boolean>>;
  setShowBrowseActivity: Dispatch<SetStateAction<boolean>>;
}

export interface SecurityPanelState {
  showShadowSpectrePanel: boolean;
  showShadowSpectreTerms: boolean;
  shadowSpectreHead: ShadowSpectreHead;
  showSignInPrompt: boolean;
  signInPromptReason: SignInPromptReason;
  showInterimCloudConsent: boolean;
}

export interface SecurityPanelSetters {
  setShowShadowSpectrePanel: Dispatch<SetStateAction<boolean>>;
  setShowShadowSpectreTerms: Dispatch<SetStateAction<boolean>>;
  setShadowSpectreHead: Dispatch<SetStateAction<ShadowSpectreHead>>;
  setShowSignInPrompt: Dispatch<SetStateAction<boolean>>;
  setSignInPromptReason: Dispatch<SetStateAction<SignInPromptReason>>;
  setShowInterimCloudConsent: Dispatch<SetStateAction<boolean>>;
}

export interface ShareState {
  chatShareOffer: ChatShareOffer | null;
  chatShareDialogOpen: boolean;
  chatShareCustomLink: string | null;
}

export interface ShareSetters {
  setChatShareOffer: Dispatch<SetStateAction<ChatShareOffer | null>>;
  setChatShareDialogOpen: Dispatch<SetStateAction<boolean>>;
  setChatShareCustomLink: Dispatch<SetStateAction<string | null>>;
}

export interface MusicState {
  musicPrompt: string;
  musicAutoGenerate: boolean;
}

export interface MusicSetters {
  setMusicPrompt: Dispatch<SetStateAction<string>>;
  setMusicAutoGenerate: Dispatch<SetStateAction<boolean>>;
}

export interface CognitiveState {
  cognitiveQuery: string;
}

export interface CognitiveSetters {
  setCognitiveQuery: Dispatch<SetStateAction<string>>;
}

export interface LayoutState {
  showSidebar: boolean;
  showMobileNav: boolean;
  toolsMenuOpen: boolean;
}

export interface LayoutSetters {
  setShowSidebar: Dispatch<SetStateAction<boolean>>;
  setShowMobileNav: Dispatch<SetStateAction<boolean>>;
  setToolsMenuOpen: Dispatch<SetStateAction<boolean>>;
}

/** Flat return shape — every individual setter is available. */
export interface UseChatModalsReturn
  extends ToolPanelState,
    ToolPanelSetters,
    SecurityPanelState,
    SecurityPanelSetters,
    ShareState,
    ShareSetters,
    MusicState,
    MusicSetters,
    CognitiveState,
    CognitiveSetters,
    LayoutState,
    LayoutSetters {
  /** Dispatch a command-palette action string. */
  handleCommandAction: (action: string) => void;
  /** Open the share dialog for a specific assistant reply. */
  openChatShare: (assistantContent: string, userPrompt?: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useChatModals(params: UseChatModalsParams): UseChatModalsReturn {
  // Only destructure the params actually consumed by this hook.
  // Remaining params (user, currentConversationId, selectedFile, setSelectedFile,
  // setMessages, saveMessage, insertAssistantToChat) are kept in the interface so
  // the hook signature matches the host component's API surface, making future
  // extensions safe without a signature break.
  const {
    navigate,
    message,
    handleNewChat,
    toast,
    setChatMode,
    messages,
  } = params;

  // ── Tool panels ────────────────────────────────────────────────────

  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showMusicGenerator, setShowMusicGenerator] = useState(false);
  const [showWordle, setShowWordle] = useState(false);
  const [showGoogleIntegration, setShowGoogleIntegration] = useState(false);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showOfflineTools, setShowOfflineTools] = useState(false);
  const [showCognitiveLoop, setShowCognitiveLoop] = useState(false);
  const [showMultiModel, setShowMultiModel] = useState(false);
  const [showCreativeSynthesis, setShowCreativeSynthesis] = useState(false);
  const [showVisualReasoning, setShowVisualReasoning] = useState(false);
  const [showImageDecoder, setShowImageDecoder] = useState(false);
  const [showDailyPlanner, setShowDailyPlanner] = useState(false);
  const [showPlanetaryActions, setShowPlanetaryActions] = useState(false);
  const [showScreenAgent, setShowScreenAgent] = useState(false);
  const [showVisionAgent, setShowVisionAgent] = useState(false);
  const [showIntelligenceHub, setShowIntelligenceHub] = useState(false);
  const [showKnowledgeVault, setShowKnowledgeVault] = useState(false);
  const [showAgenticRunner, setShowAgenticRunner] = useState(false);
  const [showAgentWorkflows, setShowAgentWorkflows] = useState(false);
  const [showGeminiAnalytics, setShowGeminiAnalytics] = useState(false);
  const [showDataOrganizer, setShowDataOrganizer] = useState(false);
  const [showUncensoredArena, setShowUncensoredArena] = useState(false);
  const [showShadowCowork, setShowShadowCowork] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBrowseActivity, setShowBrowseActivity] = useState(false);

  // ── Security / gated panels ────────────────────────────────────────

  const [showShadowSpectrePanel, setShowShadowSpectrePanel] = useState(false);
  const [showShadowSpectreTerms, setShowShadowSpectreTerms] = useState(false);
  const [shadowSpectreHead, setShadowSpectreHead] =
    useState<ShadowSpectreHead>("general");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInPromptReason, setSignInPromptReason] =
    useState<SignInPromptReason>("chats");
  const [showInterimCloudConsent, setShowInterimCloudConsent] = useState(false);

  // ── Share ───────────────────────────────────────────────────────────

  const [chatShareOffer, setChatShareOffer] = useState<ChatShareOffer | null>(
    null,
  );
  const [chatShareDialogOpen, setChatShareDialogOpen] = useState(false);
  const [chatShareCustomLink, setChatShareCustomLink] = useState<
    string | null
  >(null);

  // ── Music extra state ───────────────────────────────────────────────

  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicAutoGenerate, setMusicAutoGenerate] = useState(false);

  // ── Cognitive loop extra state ──────────────────────────────────────

  const [cognitiveQuery, setCognitiveQuery] = useState("");

  // ── Layout / navigation drawers ─────────────────────────────────────

  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────

  const openChatShare = useCallback(
    (assistantContent: string, userPrompt?: string) => {
      const lastUser =
        userPrompt ??
        [...messages]
          .reverse()
          .find((m) => m.type === "user" && m.id !== "welcome")?.content ??
        "";
      const title = buildChatShareTitle(lastUser, assistantContent);
      setChatShareOffer({
        title,
        subtitle: buildChatShareSubtitle(lastUser),
        prompt: lastUser,
        answer: assistantContent,
      });
      setChatShareCustomLink(null);
      setChatShareDialogOpen(true);

      // Publish a public /s/:slug URL in the background so the dialog can
      // upgrade the copy-link and social buttons to point to the shareable page.
      void (async () => {
        try {
          const mod = await import("@/lib/growth/publishSharedAnswer");
          const published = await mod.publishSharedAnswer({
            prompt: lastUser || "AI conversation",
            answer: assistantContent,
            title,
            source: "chat",
          });
          setChatShareCustomLink(published.url);
        } catch {
          // silent: dialog falls back to default share link
        }
      })();
    },
    [messages],
  );

  /**
   * Dispatch a command-palette action string.
   *
   * Handles all modal-opening actions, navigation routes, and special
   * commands. Actions that are not recognised as modal actions are
   * forwarded through `CHAT_COMMAND_NAV_ROUTES` or fall through to a
   * helpful toast.
   */
  const handleCommandAction = useCallback(
    (action: string) => {
      setShowCommandPalette(false);

      // If the action is not a known in-page modal, try route navigation.
      if (!CHAT_COMMAND_MODAL_ACTIONS.has(action)) {
        const navPath = CHAT_COMMAND_NAV_ROUTES[action];
        if (navPath) {
          navigate(navPath);
          return;
        }
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
        case "music":
          setMusicPrompt(message.trim());
          setMusicAutoGenerate(false);
          setShowMusicGenerator(true);
          return;
        case "google":
          setShowGoogleIntegration(true);
          return;
        case "shadowspectre":
          setChatMode("shadowspectre");
          setShowShadowSpectrePanel(true);
          return;
        case "voice":
          setShowShadowTalkLive(true);
          return;
        case "browser":
          setShowShadowBrowser(true);
          return;
        case "missions":
          navigate("/execute");
          return;
        case "agentic":
          setShowAgenticRunner(true);
          return;
        case "agent-workflows":
          setShowAgentWorkflows(true);
          return;
        case "analytics":
          setShowAnalytics(true);
          return;
        case "gemini-analytics":
          setShowGeminiAnalytics(true);
          return;
        case "organize":
          setShowDataOrganizer(true);
          return;
        case "knowledge-vault":
        case "knowledge-vault-modal":
          setShowKnowledgeVault(true);
          return;
        case "uncensored-arena":
          setShowUncensoredArena(true);
          return;
        case "shadow-cowork":
          setShowShadowCowork(true);
          return;
        case "offline-tools":
        case "offline":
          setShowOfflineTools(true);
          return;
        case "multi-model":
          setShowMultiModel(true);
          return;
        case "creative":
          setShowCreativeSynthesis(true);
          return;
        case "vision":
        case "camera":
          setShowVisualReasoning(true);
          return;
        case "image-decoder":
          setShowImageDecoder(true);
          return;
        case "planner":
          setShowDailyPlanner(true);
          return;
        case "eco":
          setShowPlanetaryActions(true);
          return;
        case "screen-agent":
          setShowScreenAgent(true);
          return;
        case "vision-agent":
          setShowVisionAgent(true);
          return;
        case "cognitive-loop":
          setCognitiveQuery(
            message.trim() ||
              "Analyze this decision from multiple expert perspectives.",
          );
          setShowCognitiveLoop(true);
          return;
        case "memory":
        case "memory-panel":
        case "intelligence-hub":
          setShowIntelligenceHub(true);
          return;
        case "bunker": {
          const enabled =
            localStorage.getItem("shadowtalk_bunker_mode") === "true";
          localStorage.setItem(
            "shadowtalk_bunker_mode",
            enabled ? "false" : "true",
          );
          window.dispatchEvent(
            new CustomEvent("shadowtalk-bunker-changed", {
              detail: { enabled: !enabled },
            }),
          );
          toast({
            title: !enabled
              ? "Bunker mode enabled"
              : "Bunker mode disabled",
            description: !enabled
              ? "Background model downloads can run when configured in Profile."
              : "Background downloads paused.",
          });
          return;
        }
        case "wordle":
          setShowWordle(true);
          return;
        case "branching":
          handleNewChat();
          toast({
            title: "New conversation branch",
            description:
              "Started a fresh thread — explore an alternate path from here.",
          });
          return;
        default:
          toast({
            title: "Try the chat tools menu",
            description:
              "Open Tools (⊞) in the header for more actions.",
          });
      }
    },
    [
      navigate,
      message,
      handleNewChat,
      toast,
      setChatMode,
    ],
  );

  // ── Return ──────────────────────────────────────────────────────────

  return {
    // Tool panel booleans
    showImageGenerator,
    showMusicGenerator,
    showWordle,
    showGoogleIntegration,
    showDeepResearch,
    showShadowTalkLive,
    showShadowBrowser,
    showCommandPalette,
    showOfflineTools,
    showCognitiveLoop,
    showMultiModel,
    showCreativeSynthesis,
    showVisualReasoning,
    showImageDecoder,
    showDailyPlanner,
    showPlanetaryActions,
    showScreenAgent,
    showVisionAgent,
    showIntelligenceHub,
    showKnowledgeVault,
    showAgenticRunner,
    showAgentWorkflows,
    showGeminiAnalytics,
    showDataOrganizer,
    showUncensoredArena,
    showShadowCowork,
    showAnalytics,
    showBrowseActivity,

    // Tool panel setters
    setShowImageGenerator,
    setShowMusicGenerator,
    setShowWordle,
    setShowGoogleIntegration,
    setShowDeepResearch,
    setShowShadowTalkLive,
    setShowShadowBrowser,
    setShowCommandPalette,
    setShowOfflineTools,
    setShowCognitiveLoop,
    setShowMultiModel,
    setShowCreativeSynthesis,
    setShowVisualReasoning,
    setShowImageDecoder,
    setShowDailyPlanner,
    setShowPlanetaryActions,
    setShowScreenAgent,
    setShowVisionAgent,
    setShowIntelligenceHub,
    setShowKnowledgeVault,
    setShowAgenticRunner,
    setShowAgentWorkflows,
    setShowGeminiAnalytics,
    setShowDataOrganizer,
    setShowUncensoredArena,
    setShowShadowCowork,
    setShowAnalytics,
    setShowBrowseActivity,

    // Security / gated panels
    showShadowSpectrePanel,
    showShadowSpectreTerms,
    shadowSpectreHead,
    showSignInPrompt,
    signInPromptReason,
    showInterimCloudConsent,

    // Security / gated setters
    setShowShadowSpectrePanel,
    setShowShadowSpectreTerms,
    setShadowSpectreHead,
    setShowSignInPrompt,
    setSignInPromptReason,
    setShowInterimCloudConsent,

    // Share state
    chatShareOffer,
    chatShareDialogOpen,
    chatShareCustomLink,

    // Share setters
    setChatShareOffer,
    setChatShareDialogOpen,
    setChatShareCustomLink,

    // Music
    musicPrompt,
    musicAutoGenerate,
    setMusicPrompt,
    setMusicAutoGenerate,

    // Cognitive loop
    cognitiveQuery,
    setCognitiveQuery,

    // Layout / navigation
    showSidebar,
    showMobileNav,
    toolsMenuOpen,
    setShowSidebar,
    setShowMobileNav,
    setToolsMenuOpen,

    // Handlers
    handleCommandAction,
    openChatShare,
  };
}

export default useChatModals;
