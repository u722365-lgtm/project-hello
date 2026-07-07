import { useState, useEffect, lazy, Suspense, createContext } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { PageLoader } from "@/components/PageLoader";
import { SiteMotionProvider } from "@/components/motion/SiteMotionProvider";
import SitePageShell from "@/components/motion/SitePageShell";
import GlobalScrollReveal from "@/components/motion/GlobalScrollReveal";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import { SecurityProvider } from "@/components/SecurityProvider";
import { ShadowMemoryProvider } from "@/contexts/ShadowMemoryContext";
import { AutoImproveProvider } from "@/contexts/AutoImproveContext";
import { ThemeTemplateProvider } from "@/contexts/ThemeTemplateContext";
import { StealthKillSwitchProvider } from "@/contexts/StealthKillSwitchContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import BootScreen from "@/components/BootScreen";
import { shouldSkipBootScreen } from "@/lib/skipBootScreen";
import { ensureDeviceOnlyPledgeDefaults } from "@/lib/privacy/deviceOnlyPledge";

ensureDeviceOnlyPledgeDefaults();
import CommandPalette from "@/components/CommandPalette";
import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useReferralCapture } from "./hooks/useReferralTracking";
import PersistedAuthRedirect from "@/components/PersistedAuthRedirect";
import WorkspacePathRemember from "@/components/WorkspacePathRemember";
import { OAuthReturnHandler } from "@/components/OAuthReturnHandler";

export const CommandPaletteContext = createContext<{ open: () => void }>({ open: () => {} });
 // Critical path pages - loaded immediately
 import Index from "./pages/Index";
 import RootRoute from "@/components/RootRoute";
 import AuthPage from "./pages/AuthPage";
 import AuthDesignGalleryPage from "./pages/AuthDesignGalleryPage";
 import AuthDesignPreviewPage from "./pages/AuthDesignPreviewPage";
 const BackendFlowsPage = lazy(() => import("./pages/BackendFlowsPage"));
 const NotFound = lazy(() => import("./pages/NotFound"));
 const SharedAnswerPage = lazy(() => import("./pages/SharedAnswerPage"));
 import SessionsPage from "./pages/SessionsPage";
 import SelfHealingPage from "./pages/SelfHealingPage";
 import { SelfHealingProvider } from "./components/selfHealing/SelfHealingProvider";
import { NotificationPermissionRequester } from "@/components/notifications/NotificationPermissionRequester";
import { UpdateNotificationProvider } from "@/components/notifications/UpdateNotificationProvider";
import { AutonomousAgentEngine } from "@/components/autonomy/AutonomousAgentEngine";
import { MissionSchedulerEngine } from "@/components/autonomy/MissionSchedulerEngine";
import { ScriptSchedulerEngine } from "@/components/autonomy/ScriptSchedulerEngine";
import { GoalPursuitEngine } from "@/components/autonomy/GoalPursuitEngine";
import { SelfHealingErrorBoundary } from "@/components/selfHealing/SelfHealingErrorBoundary";
import { NetworkTransitionOverlay } from "@/components/chat/NetworkTransitionOverlay";
import { PushIntelligencePanel } from "@/components/chat/PushIntelligencePanel";
 
 // Lazy loaded pages - code splitting for better performance
 const PricingPage = lazy(() => import("./pages/PricingPage"));
 const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
 const AdminPage = lazy(() => import("./pages/AdminPage"));
 const DocsPage = lazy(() => import("./pages/DocsPage"));
 const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
 const ChatRoomsPage = lazy(() => import("./pages/ChatRoomsPage"));
 const CollaborativeRoom = lazy(() => import("./pages/CollaborativeRoom"));
 const ProfilePage = lazy(() => import("./pages/ProfilePage"));
 const SettingsPage = lazy(() => import("./pages/SettingsPage"));
 const APIPage = lazy(() => import("./pages/APIPage"));
 const EnterpriseSettingsPage = lazy(() => import("./pages/EnterpriseSettingsPage"));
 const AboutPage = lazy(() => import("./pages/AboutPage"));
 const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
 const FAQPage = lazy(() => import("./pages/FAQPage"));
 const ContactPage = lazy(() => import("./pages/ContactPage"));
 const StatusPage = lazy(() => import("./pages/StatusPage"));
 const BlogPage = lazy(() => import("./pages/BlogPage"));
 const CareersPage = lazy(() => import("./pages/CareersPage"));
 const PressPage = lazy(() => import("./pages/PressPage"));
 const FactsPage = lazy(() => import("./pages/FactsPage"));
const AnswersPage = lazy(() => import("./pages/AnswersPage"));
const ZainAhmedPage = lazy(() => import("./pages/ZainAhmedPage"));
const VsPage = lazy(() => import("./pages/VsPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const LearnTopicPage = lazy(() => import("./pages/LearnTopicPage"));
const GoogleSeoHubPage = lazy(() => import("./pages/GoogleSeoHubPage"));
 const ComputerModePage = lazy(() => import("./pages/ComputerModePage"));
 const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
 const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
 const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
 const GDPRPage = lazy(() => import("./pages/GDPRPage"));
 const MonetizationPage = lazy(() => import("./pages/MonetizationPage"));
 const FounderAccessPage = lazy(() => import("./pages/FounderAccessPage"));
 const StrategyAgentPage = lazy(() => import("./pages/StrategyAgentPage"));
  const IdePage = lazy(() => import("./pages/IdePage"));
  const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
  const DevelopersPage = lazy(() => import("./pages/DevelopersPage"));
  const ContentForgePage = lazy(() => import("./pages/ContentForgePage"));
  const VideoStudioPage = lazy(() => import("./pages/VideoStudioPage"));
  const WorkspaceHubPage = lazy(() => import("./pages/WorkspaceHubPage"));
  const ResearchHubPage = lazy(() => import("./pages/ResearchHubPage"));
  const InsightsHubPage = lazy(() => import("./pages/InsightsHubPage"));
  const SecurityHubPage = lazy(() => import("./pages/SecurityHubPage"));
   const MissionControlPage = lazy(() => import("./pages/MissionControlPage"));
 const ExecutePage = lazy(() => import("./pages/ExecutePage"));
   const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const StrategyLabPage = lazy(() => import("./pages/StrategyLabPage"));
const SovereignDataPage = lazy(() => import("./pages/SovereignDataPage"));
const SovereignWalletPage = lazy(() => import("./pages/SovereignWalletPage"));
const GhostAdsPage = lazy(() => import("./pages/GhostAdsPage"));
const EnterpriseLicensePage = lazy(() => import("./pages/EnterpriseLicensePage"));
const TransparencyPage = lazy(() => import("./pages/TransparencyPage"));
const CommandCenterPage = lazy(() => import("./pages/CommandCenterPage"));
const CompetitivePage = lazy(() => import("./pages/CompetitivePage"));
const AgentArchitecturePage = lazy(() => import("./pages/AgentArchitecturePage"));
const ComplianceDashboardPage = lazy(() => import("./pages/ComplianceDashboardPage"));
const AutoImproveEngine = lazy(() => import("@/components/autoImprove/AutoImproveEngine"));
const PersonalLLMPage = lazy(() => import("./pages/PersonalLLMPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const DownloadsPage = lazy(() => import("./pages/DownloadsPage"));
const WhatsAppContactsPage = lazy(() => import("./pages/WhatsAppContactsPage"));
const PWABanner = lazy(() => import("./components/PWABanner"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
const CustomerSupportWidget = lazy(() => import("./components/CustomerSupportWidget"));
const ShadowMemoryTracker = lazy(() => import("./components/ShadowMemoryTracker"));
const JourneyTracker = lazy(() => import("./components/JourneyTracker").then(m => ({ default: m.JourneyTracker })));
const VoiceCommandSystem = lazy(() => import("./components/VoiceCommandSystem"));
const ShadowHealEngine = lazy(() =>
  import("./components/shadowHeal/ShadowHealEngine").then((m) => ({ default: m.ShadowHealEngine })),
);
const ShadowScaleEngine = lazy(() =>
  import("./components/shadowScale/ShadowScaleEngine").then((m) => ({ default: m.ShadowScaleEngine })),
);
const AnnouncementBanner = lazy(() =>
  import("./components/AnnouncementBanner").then((m) => ({ default: m.AnnouncementBanner })),
);
const ShadowScaleGrowthBanner = lazy(() =>
  import("./components/shadowScale/ShadowScaleGrowthBanner").then((m) => ({ default: m.ShadowScaleGrowthBanner })),
);
const MarketingDailyBanner = lazy(() =>
  import("./components/growth/MarketingDailyBanner").then((m) => ({ default: m.MarketingDailyBanner })),
);
const OfflineBootstrapBanner = lazy(() =>
  import("./components/offline/OfflineBootstrapBanner").then((m) => ({ default: m.OfflineBootstrapBanner })),
);
const OnboardingFlow = lazy(() => import("./components/OnboardingFlow"));
// ElevenLabs Agent ID is now configured via the backend secret ELEVENLABS_AGENT_ID

 // Configure React Query with production-ready settings
 const queryClient = new QueryClient({
   defaultOptions: {
     queries: {
       staleTime: 1000 * 60 * 5, // 5 minutes
       gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
       retry: (failureCount, error: unknown) => {
         // Don't retry on 4xx errors except 429
         if (error && typeof error === 'object' && 'status' in error) {
           const status = (error as { status: number }).status;
           if (status >= 400 && status < 500 && status !== 429) {
             return false;
           }
         }
         return failureCount < 3;
       },
       retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
     },
     mutations: {
       retry: false,
     },
   },
 });
 

const AnimatedRoutes = () => {
  const location = useLocation();
  useReferralCapture();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><RootRoute /></PageTransition>} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/auth/designs" element={<PageTransition><AuthDesignGalleryPage /></PageTransition>} />
          <Route path="/auth/preview/:designId" element={<PageTransition><AuthDesignPreviewPage /></PageTransition>} />
          <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
          {/* Chat workspace: no PageTransition — avoids opacity-0 flash and flex height collapse */}
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/flows" element={<PageTransition><BackendFlowsPage /></PageTransition>} />
          <Route path="/whatsapp" element={<PageTransition><WhatsAppContactsPage /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
          <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
          <Route path="/changelog" element={<PageTransition><ChangelogPage /></PageTransition>} />
          <Route path="/rooms" element={<PageTransition><ChatRoomsPage /></PageTransition>} />
          <Route path="/rooms/:roomId" element={<PageTransition><CollaborativeRoom /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          <Route path="/api" element={<PageTransition><APIPage /></PageTransition>} />
          <Route path="/insights" element={<PageTransition><InsightsHubPage /></PageTransition>} />
          <Route path="/analytics" element={<Navigate to="/insights?tab=usage" replace />} />
          <Route path="/data-insights" element={<Navigate to="/insights?tab=behavior" replace />} />
          <Route path="/shadow-memory" element={<Navigate to="/insights?tab=activity" replace />} />
          <Route path="/enterprise" element={<PageTransition><EnterpriseSettingsPage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
          <Route path="/help" element={<PageTransition><HelpCenterPage /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="/status" element={<PageTransition><StatusPage /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />
          <Route path="/careers" element={<PageTransition><CareersPage /></PageTransition>} />
          <Route path="/press" element={<PageTransition><PressPage /></PageTransition>} />
          <Route path="/facts" element={<PageTransition><FactsPage /></PageTransition>} />
          <Route path="/answers" element={<PageTransition><AnswersPage /></PageTransition>} />
          <Route path="/zain-ahmed-fahad-patel" element={<PageTransition><ZainAhmedPage /></PageTransition>} />
          <Route path="/zain-ahmed" element={<Navigate to="/zain-ahmed-fahad-patel" replace />} />
          <Route path="/founder" element={<Navigate to="/zain-ahmed-fahad-patel" replace />} />
          <Route path="/discover" element={<PageTransition><DiscoverPage /></PageTransition>} />
          <Route path="/google-seo" element={<PageTransition><GoogleSeoHubPage /></PageTransition>} />
          <Route path="/learn/:slug" element={<PageTransition><LearnTopicPage /></PageTransition>} />
          <Route path="/vs/:slug" element={<PageTransition><VsPage /></PageTransition>} />
          <Route path="/computer" element={<PageTransition><ComputerModePage /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
          <Route path="/cookies" element={<PageTransition><CookiePolicyPage /></PageTransition>} />
          <Route path="/gdpr" element={<PageTransition><GDPRPage /></PageTransition>} />
          <Route path="/billing" element={<PageTransition><MonetizationPage /></PageTransition>} />
          <Route path="/founder-access" element={<PageTransition><FounderAccessPage /></PageTransition>} />
          <Route path="/lifetime-deal" element={<Navigate to="/pricing" replace />} />
          <Route path="/execute" element={<PageTransition><ExecutePage /></PageTransition>} />
          <Route path="/strategy" element={<PageTransition><StrategyAgentPage /></PageTransition>} />
          <Route path="/workspace" element={<PageTransition><WorkspaceHubPage /></PageTransition>} />
          <Route path="/business-memory" element={<Navigate to="/workspace?tab=explore" replace />} />
          <Route path="/ide" element={<PageTransition><IdePage /></PageTransition>} />
          <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
          <Route path="/developers" element={<PageTransition><DevelopersPage /></PageTransition>} />
          <Route path="/security" element={<PageTransition><SecurityHubPage /></PageTransition>} />
          <Route path="/vault" element={<Navigate to="/security?tab=vault" replace />} />
          <Route path="/privacy-score" element={<Navigate to="/security?tab=score" replace />} />
          <Route path="/security-audit" element={<Navigate to="/security?tab=audit" replace />} />
          <Route path="/trust" element={<Navigate to="/security?tab=trust" replace />} />
          <Route path="/cyber" element={<Navigate to="/security?tab=cyber" replace />} />
          <Route path="/forge" element={<PageTransition><ContentForgePage /></PageTransition>} />
          <Route path="/video-studio" element={<PageTransition><VideoStudioPage /></PageTransition>} />
          <Route path="/presentations" element={<Navigate to="/forge?mode=slides" replace />} />
          <Route path="/missioncontrol" element={<PageTransition><MissionControlPage /></PageTransition>} />
          <Route path="/referral" element={<PageTransition><ReferralPage /></PageTransition>} />
          <Route path="/research" element={<PageTransition><ResearchHubPage /></PageTransition>} />
          <Route path="/knowledge" element={<Navigate to="/research?tab=knowledge" replace />} />
          <Route path="/deep-research" element={<Navigate to="/research?tab=investigate" replace />} />
          <Route path="/knowledge-graph" element={<Navigate to="/research?tab=knowledge" replace />} />
          <Route path="/strategy-lab" element={<PageTransition><StrategyLabPage /></PageTransition>} />
          <Route path="/sovereign-data" element={<PageTransition><SovereignDataPage /></PageTransition>} />
          <Route path="/wallet" element={<PageTransition><SovereignWalletPage /></PageTransition>} />
          <Route path="/ghost-ads" element={<PageTransition><GhostAdsPage /></PageTransition>} />
          <Route path="/offline-license" element={<PageTransition><EnterpriseLicensePage /></PageTransition>} />
          <Route path="/enterprise-license" element={<Navigate to="/offline-license" replace />} />
          <Route path="/transparency" element={<PageTransition><TransparencyPage /></PageTransition>} />
          <Route path="/studio" element={<Navigate to="/forge?mode=studio" replace />} />
          <Route path="/command-center" element={<PageTransition><CommandCenterPage /></PageTransition>} />
          <Route path="/competitive" element={<PageTransition><CompetitivePage /></PageTransition>} />
          <Route path="/agents" element={<PageTransition><AgentArchitecturePage /></PageTransition>} />
          <Route path="/compliance" element={<PageTransition><ComplianceDashboardPage /></PageTransition>} />
          <Route path="/personal-llm" element={<PageTransition><PersonalLLMPage /></PageTransition>} />
          <Route path="/templates" element={<PageTransition><TemplatesPage /></PageTransition>} />
          <Route path="/theme" element={<Navigate to="/templates?tab=custom" replace />} />
          <Route path="/themes" element={<Navigate to="/templates" replace />} />
          <Route path="/downloads" element={<PageTransition><DownloadsPage /></PageTransition>} />
          <Route path="/download" element={<Navigate to="/downloads" replace />} />
          <Route path="/sessions" element={<PageTransition><SessionsPage /></PageTransition>} />
          <Route path="/self-healing" element={<PageTransition><SelfHealingPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const App = () => {
  const skipBoot = shouldSkipBootScreen();
  const [showBootScreen, setShowBootScreen] = useState(() => !skipBoot);
  const [hasBooted, setHasBooted] = useState(() => skipBoot);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [deferredChrome, setDeferredChrome] = useState(false);

  useEffect(() => {
    import("@/lib/shadowMode").then(({ initShadowMode }) => initShadowMode());
    import("@/lib/profilePreferences").then(({ initProfileUiPreferences }) => initProfileUiPreferences());
    import("@/lib/themes/applyTheme").then(({ restoreStoredTheme }) => restoreStoredTheme());

    const hasSeenBoot = sessionStorage.getItem('shadowtalk-booted');
    if (hasSeenBoot || shouldSkipBootScreen()) {
      setShowBootScreen(false);
      setHasBooted(true);
    }

    const enableChrome = () => setDeferredChrome(true);
    if (typeof window.requestIdleCallback === "function") {
      const chromeId = window.requestIdleCallback(enableChrome, { timeout: 4000 });
      const cleanupChrome = () => window.cancelIdleCallback(chromeId);

      const resumeOffline = () => {
        void import('@/lib/offline/bootstrapLocalModel').then(({ bootstrapCachedLocalModel }) =>
          bootstrapCachedLocalModel().catch((e) => console.warn('[Offline] bootstrap failed', e)),
        );
      };

      const offlineId = window.requestIdleCallback(resumeOffline, { timeout: 12000 });
      return () => {
        cleanupChrome();
        window.cancelIdleCallback(offlineId);
      };
    }

    const t = window.setTimeout(enableChrome, 1500);
    return () => window.clearTimeout(t);
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('shadowtalk-booted', 'true');
    setShowBootScreen(false);
    setHasBooted(true);
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} storageKey="shadowtalk-ui-theme">
          <TooltipProvider>
            <AuthProvider>
              <StealthKillSwitchProvider>
              <SecurityProvider>
              <SelfHealingProvider>
              <ShadowMemoryProvider>
              <AutoImproveProvider>
              <ThemeTemplateProvider>
              <CommandPaletteContext.Provider value={{ open: () => setCmdOpen(true) }}>
              {showBootScreen && !hasBooted && (
                <BootScreen onComplete={handleBootComplete} />
              )}
              <Toaster />
              <Sonner />
               <BrowserRouter>
                 <UpdateNotificationProvider />
                 <NetworkTransitionOverlay />
                 <PushIntelligencePanel />
                 <SelfHealingErrorBoundary>
                 <SiteMotionProvider>
                   <SitePageShell>
                     <GlobalScrollReveal />
                     <PersistedAuthRedirect />
                     <OAuthReturnHandler />
                     <WorkspacePathRemember />
                      <NotificationPermissionRequester />
                     <Suspense fallback={null}>
                       <AnnouncementBanner />
                       <MarketingDailyBanner />
                       <ShadowScaleGrowthBanner />
                     </Suspense>
                     <AnimatedRoutes />
                     <BackToHomeButton />
                   </SitePageShell>
                 </SiteMotionProvider>
                 </SelfHealingErrorBoundary>
                 <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
                  {deferredChrome && (
                    <Suspense fallback={null}>
                      <OfflineBootstrapBanner />
                      <OnboardingFlow />
                      <ShadowMemoryTracker />
                      <JourneyTracker />
                      <AutoImproveEngine />
                      <ShadowHealEngine />
                      <ShadowScaleEngine />
                      <AutonomousAgentEngine />
                      <MissionSchedulerEngine />
                      <ScriptSchedulerEngine />
                      <GoalPursuitEngine />
                      <VoiceCommandSystem />
                      <PWABanner />
                      <CookieConsent />
                      <CustomerSupportWidget />
                    </Suspense>
                  )}
               </BrowserRouter>
              </CommandPaletteContext.Provider>
              </ThemeTemplateProvider>
              </AutoImproveProvider>
              </ShadowMemoryProvider>
              </SelfHealingProvider>
              </SecurityProvider>
              </StealthKillSwitchProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
