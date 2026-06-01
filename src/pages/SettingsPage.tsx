import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import {
  Settings,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Bot,
  Database,
  Link2,
  User,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsAmbientBackground } from "@/components/settings/SettingsAmbientBackground";
import { SettingsNav, type SettingsNavSection } from "@/components/settings/SettingsNav";
import { SettingsSectionPanels } from "@/components/settings/SettingsSectionPanels";
import { SettingsSearch } from "@/components/settings/SettingsSearch";
import { SettingsHero } from "@/components/settings/SettingsHero";
import { SettingsBreadcrumb } from "@/components/settings/SettingsBreadcrumb";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { isLearningEnabled, setLearningEnabled } from "@/lib/autoImprove/learningConsent";
import type { SettingsSectionId } from "@/lib/settingsTypes";

const SECTIONS: readonly SettingsNavSection[] = [
  { id: "home", label: "Overview", icon: LayoutGrid, desc: "Quick access to all areas" },
  { id: "general", label: "General", icon: Settings, desc: "Theme, language, sounds" },
  { id: "personalization", label: "Personalization", icon: Sparkles, desc: "Instructions & tone" },
  { id: "chat", label: "Chat behavior", icon: MessageSquare, desc: "Sending, timestamps, routing" },
  { id: "models", label: "Models & AI", icon: Bot, desc: "Provider, offline, sovereign" },
  { id: "data", label: "Data controls", icon: Database, desc: "Learning & privacy" },
  { id: "connections", label: "Connections", icon: Link2, desc: "API keys & integrations" },
  { id: "account", label: "Account", icon: User, desc: "Profile, billing, security" },
];

const VALID = new Set(SECTIONS.map((s) => s.id));

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [learningEnabled, setLearningEnabledState] = useState(isLearningEnabled());
  const { sectionPanel, headerReveal, loadingPulse, shouldAnimateAmbient } = useSettingsMotion();

  const section = (() => {
    const s = searchParams.get("section") || "home";
    return VALID.has(s) ? (s as SettingsSectionId) : "home";
  })();

  const sectionMeta = useMemo(
    () => SECTIONS.find((s) => s.id === section) ?? SECTIONS[0],
    [section],
  );

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const selectSection = (id: string) => {
    setSearchParams({ section: id }, { replace: true });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 neural-bg">
        <SettingsAmbientBackground enabled={shouldAnimateAmbient} />
        <motion.div variants={loadingPulse} animate="animate">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
          Loading settings…
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <SettingsAmbientBackground enabled={shouldAnimateAmbient} />

      <motion.header
        variants={headerReveal}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto px-4 h-14 flex items-center gap-3 max-w-7xl">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chatbot")}
              aria-label="Back to chat"
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30"
              animate={
                shouldAnimateAmbient
                  ? {
                      boxShadow: [
                        "0 0 0px hsl(var(--primary)/0)",
                        "0 0 24px hsl(var(--primary)/0.25)",
                        "0 0 0px hsl(var(--primary)/0)",
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Settings className="h-4 w-4 text-primary" />
            </motion.span>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight truncate">
                <span className="gradient-text">Settings</span>
              </h1>
            </div>
          </div>
          <div className="hidden md:flex flex-1 max-w-sm ml-4">
            <SettingsSearch onNavigate={(s) => selectSection(s)} />
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl relative">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-[280px] shrink-0 space-y-4">
            <div className="md:hidden">
              <SettingsSearch onNavigate={(s) => selectSection(s)} />
            </div>
            <div className="hidden lg:block rounded-2xl border border-border/50 glass-strong p-4 shadow-elevated">
              <SettingsSearch onNavigate={(s) => selectSection(s)} className="mb-4" />
              <SettingsNav sections={SECTIONS} activeId={section} onSelect={selectSection} />
            </div>
            <div className="lg:hidden">
              <SettingsNav sections={SECTIONS} activeId={section} onSelect={selectSection} />
            </div>
          </aside>

          <main className="flex-1 min-w-0 pb-24">
            <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-4 sm:p-6 lg:p-8 shadow-card">
              <SettingsHero />

              {section !== "home" && (
                <SettingsBreadcrumb
                  sectionLabel={sectionMeta.label}
                  onHome={() => selectSection("home")}
                />
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  variants={sectionPanel}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SettingsSectionPanels
                    section={section}
                    sections={SECTIONS}
                    onSelectSection={selectSection}
                    learningEnabled={learningEnabled}
                    onLearningChange={(v) => {
                      setLearningEnabled(v);
                      setLearningEnabledState(v);
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-border/30 bg-background/80 backdrop-blur-xl py-2.5 pointer-events-none">
          <p className="text-center text-[11px] text-muted-foreground">
            <kbd className="font-mono px-1 rounded border border-border/50">⌘K</kbd> search ·{" "}
            <kbd className="font-mono px-1 rounded border border-border/50">Esc</kbd> clear
          </p>
        </footer>
      </div>
    </div>
  );
}
