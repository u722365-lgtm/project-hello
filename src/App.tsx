import { useState, useEffect, lazy, Suspense, createContext } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import FeedbackAutoPrompt from "@/components/FeedbackAutoPrompt";
import MobileViewportFix from "@/components/MobileViewportFix";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { AppError } from "@/lib/AppError";
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

import CommandPalette from "@/components/CommandPalette";
import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useReferralCapture } from "./hooks/useReferralTracking";
import PersistedAuthRedirect from "@/components/PersistedAuthRedirect";
import WorkspacePathRemember from "@/components/WorkspacePathRemember";
import { GrowthBanners } from "@/components/GrowthBanners";
import { OAuthReturnHandler } from "@/components/OAuthReturnHandler";
import { OAuthRedirectHandler } from "@/components/OAuthRedirectHandler";

export const CommandPaletteContext = createContext<{ open: () => void }>({ open: () => {} });
// Critical path pages - loaded immediately
const RootRoute = lazy(() => import("@/components/RootRoute"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { NotificationPermissionRequester } from "@/components/notifications/NotificationPermissionRequester";
import { UpdateNotificationProvider } from "@/components/notifications/UpdateNotificationProvider";
import { NetworkTransitionOverlay } from "@/components/chat/NetworkTransitionOverlay";
import { PushIntelligencePanel } from "@/components/chat/PushIntelligencePanel";
 
// Lazy loaded core pages
const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
 const AuthDesignGalleryPage = lazy(() => import("./pages/AuthDesignGalleryPage"));
 const AuthDesignPreviewPage = lazy(() => import("./pages/AuthDesignPreviewPage"));
 const SharedAnswerPage = lazy(() => import("./pages/SharedAnswerPage"));
 const SessionsPage = lazy(() => import("./pages/SessionsPage"));
 const PricingPage = lazy(() => import("./pages/PricingPage"));
 const DocsPage = lazy(() => import("./pages/DocsPage"));
 const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
 const PrivateAiHubPage = lazy(() => import("./pages/PrivateAiHubPage"));
 // const StrategyAgentPage = lazy(() => import("./pages/StrategyAgentPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const DeveloperPortalPage = lazy(() => import("./pages/DeveloperPortalPage"));
const OrgAdminPage = lazy(() => import("./pages/OrgAdminPage"));
const IntegrationsHubPage = lazy(() => import("./pages/IntegrationsHubPage"));
const BillingDashboardPage = lazy(() => import("./pages/BillingDashboardPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const ModelPlaygroundPage = lazy(() => import("./pages/ModelPlaygroundPage"));
const ShadowTwinSettingsPage = lazy(() => import("./pages/ShadowTwinSettingsPage"));
const PublicShadowTwinChat = lazy(() => import("./pages/PublicShadowTwinChat"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ShadowMemoryPage = lazy(() => import("./pages/ShadowMemoryPage"));
const CyberCommandPage = lazy(() => import("./pages/CyberCommandPage"));
const PrivacyScorePage = lazy(() => import("./pages/PrivacyScorePage"));
const TrustPage = lazy(() => import("./pages/TrustPage"));
const KnowledgeGraphPage = lazy(() => import("./pages/KnowledgeGraphPage"));
const SecurityAuditPage = lazy(() => import("./pages/SecurityAuditPage"));
const DataInsightsPage = lazy(() => import("./pages/DataInsightsPage"));
const DeepResearchPage = lazy(() => import("./pages/DeepResearchPage"));

// Production Company, Support & Legal Pages
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const CaseStudiesPage = lazy(() => import("./pages/CaseStudiesPage"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const GDPRPage = lazy(() => import("./pages/GDPRPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

const AutoImproveEngine = lazy(() => import("@/components/autoImprove/AutoImproveEngine"));
const PWABanner = lazy(() => import("./components/PWABanner"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
const CustomerSupportWidget = lazy(() => import("./components/CustomerSupportWidget"));
const ShadowMemoryTracker = lazy(() => import("./components/ShadowMemoryTracker"));
const JourneyTracker = lazy(() => import("./components/JourneyTracker").then(m => ({ default: m.JourneyTracker })));
const VoiceCommandSystem = lazy(() => import("./components/VoiceCommandSystem"));
const ShadowScaleEngine = lazy(() =>
  import("./components/shadowScale/ShadowScaleEngine").then((m) => ({ default: m.ShadowScaleEngine })),
);

const OnboardingFlow = lazy(() => import("./components/OnboardingFlow"));

 // Configure React Query with production-ready settings
 const queryClient = new QueryClient({
   queryCache: new QueryCache({
     onError: (error) => {
       const appErr = AppError.fromUnknown(error, 'Failed to fetch data');
       if (appErr.isOperational) {
         import('sonner').then(({ toast }) => toast.error(appErr.message));
       }
     }
   }),
   mutationCache: new MutationCache({
     onError: (error) => {
       const appErr = AppError.fromUnknown(error, 'Action failed');
       if (appErr.isOperational) {
         import('sonner').then(({ toast }) => toast.error(appErr.message));
       }
     }
   }),
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
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Suspense fallback={<PageLoader />}><PageTransition><RootRoute /></PageTransition></Suspense>} />
          <Route path="/auth" element={<Suspense fallback={<PageLoader />}><PageTransition><AuthPage /></PageTransition></Suspense>} />
          
          {/* Core App Routes */}
          <Route path="/chatbot" element={<Suspense fallback={<PageLoader />}><ChatbotPage /></Suspense>} />
          <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          <Route path="/templates" element={<PageTransition><TemplatesPage /></PageTransition>} />
          <Route path="/shadow-twin" element={<PageTransition><ShadowTwinSettingsPage /></PageTransition>} />
          <Route path="/t/:username" element={<Suspense fallback={<PageLoader />}><PublicShadowTwinChat /></Suspense>} />
          
          <Route path="/auth/designs" element={<Suspense fallback={<PageLoader />}><PageTransition><AuthDesignGalleryPage /></PageTransition></Suspense>} />
          <Route path="/auth/preview/:designId" element={<Suspense fallback={<PageLoader />}><PageTransition><AuthDesignPreviewPage /></PageTransition></Suspense>} />
          <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
          <Route path="/s/:slug" element={<Suspense fallback={<PageLoader />}><SharedAnswerPage /></Suspense>} />
          <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
          <Route path="/changelog" element={<PageTransition><ChangelogPage /></PageTransition>} />
          <Route path="/workspace" element={<PageTransition><WorkspacePage /></PageTransition>} />
          <Route path="/business-memory" element={<Navigate to="/workspace" replace />} />
          <Route path="/analytics" element={<PageTransition><AnalyticsPage /></PageTransition>} />
          <Route path="/shadow-memory" element={<PageTransition><ShadowMemoryPage /></PageTransition>} />
          <Route path="/insights" element={<Navigate to="/analytics" replace />} />
          <Route path="/sessions" element={<Suspense fallback={<PageLoader />}><PageTransition><SessionsPage /></PageTransition></Suspense>} />
          <Route path="/private-ai" element={<PageTransition><PrivateAiHubPage /></PageTransition>} />
          
          {/* Enterprise SaaS Routes */}
          <Route path="/developers" element={<PageTransition><DeveloperPortalPage /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><OrgAdminPage /></PageTransition>} />
          <Route path="/integrations" element={<PageTransition><IntegrationsHubPage /></PageTransition>} />
          <Route path="/billing" element={<PageTransition><BillingDashboardPage /></PageTransition>} />
          <Route path="/audit-logs" element={<PageTransition><AuditLogsPage /></PageTransition>} />
          <Route path="/studio" element={<PageTransition><ModelPlaygroundPage /></PageTransition>} />
          <Route path="/cyber" element={<PageTransition><CyberCommandPage /></PageTransition>} />
          <Route path="/privacy-score" element={<PageTransition><PrivacyScorePage /></PageTransition>} />
          <Route path="/trust" element={<PageTransition><TrustPage /></PageTransition>} />
          <Route path="/knowledge-graph" element={<PageTransition><KnowledgeGraphPage /></PageTransition>} />
          <Route path="/security-audit" element={<PageTransition><SecurityAuditPage /></PageTransition>} />
          <Route path="/data-insights" element={<PageTransition><DataInsightsPage /></PageTransition>} />
          <Route path="/deep-research" element={<PageTransition><DeepResearchPage /></PageTransition>} />

          {/* Company, Support, Legal & Status Pages */}
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="/help" element={<PageTransition><HelpCenterPage /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />
          <Route path="/case-studies" element={<PageTransition><CaseStudiesPage /></PageTransition>} />
          <Route path="/status" element={<PageTransition><StatusPage /></PageTransition>} />
          <Route path="/gdpr" element={<PageTransition><GDPRPage /></PageTransition>} />
          <Route path="/cookies" element={<PageTransition><CookiePolicyPage /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />

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
    
    // Seed enterprise data if tables are empty

    const hasSeenBoot = sessionStorage.getItem('shadowtalk-booted');
    if (hasSeenBoot || shouldSkipBootScreen()) {
      setShowBootScreen(false);
      setHasBooted(true);
    }

    const enableChrome = () => setDeferredChrome(true);
    if (typeof window.requestIdleCallback === "function") {
      const chromeId = window.requestIdleCallback(enableChrome, { timeout: 4000 });
      const cleanupChrome = () => window.cancelIdleCallback(chromeId);

      return () => {
        cleanupChrome();
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
              <ShadowMemoryProvider>
              <AutoImproveProvider>
              <ThemeTemplateProvider>
              <CommandPaletteContext.Provider value={{ open: () => setCmdOpen(true) }}>
              {showBootScreen && !hasBooted && (
                <BootScreen onComplete={handleBootComplete} />
              )}
              <Toaster />
              <Sonner />
              <FeedbackAutoPrompt />
               <BrowserRouter>
                 <MobileViewportFix />
                 <UpdateNotificationProvider />
                 <NetworkTransitionOverlay />
                 <PushIntelligencePanel />
                 <SiteMotionProvider>
                   <SitePageShell>
                     <GlobalScrollReveal />
                     <PersistedAuthRedirect />
                     <OAuthRedirectHandler />
                     <OAuthReturnHandler />
                     <WorkspacePathRemember />
                      <NotificationPermissionRequester />
                     <GrowthBanners />
                     <AnimatedRoutes />
                     <BackToHomeButton />
                   </SitePageShell>
                 </SiteMotionProvider>
                 <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
                  {deferredChrome && (
                    <Suspense fallback={null}>

                      <OnboardingFlow />
                      <ShadowMemoryTracker />
                      <JourneyTracker />
                      <AutoImproveEngine />
                      <ShadowScaleEngine />
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
