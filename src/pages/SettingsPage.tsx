import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsAmbientBackground } from "@/components/settings/SettingsAmbientBackground";
import { SettingsNav, type SettingsNavSection } from "@/components/settings/SettingsNav";
import {
  SettingsSectionPanels,
  type SettingsSectionId,
} from "@/components/settings/SettingsSectionPanels";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { isLearningEnabled, setLearningEnabled } from "@/lib/autoImprove/learningConsent";

const SECTIONS: readonly SettingsNavSection[] = [
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
    const s = searchParams.get("section") || "general";
    return VALID.has(s) ? (s as SettingsSectionId) : "general";
  })();

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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
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
        className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
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
          <div className="flex items-center gap-2.5">
            <motion.span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/30"
              animate={
                shouldAnimateAmbient
                  ? { boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 24px hsl(var(--primary)/0.25)", "0 0 0px hsl(var(--primary)/0)"] }
                  : undefined
              }
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Settings className="h-4 w-4 text-primary" />
            </motion.span>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                <span className="gradient-text">Settings</span>
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Neural workspace preferences
              </p>
            </div>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground ml-auto max-w-md text-right">
            Customize ShadowTalk — theme, models, chat, and privacy in one place
          </p>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl relative">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <SettingsNav sections={SECTIONS} activeId={section} onSelect={selectSection} />

          <main className="flex-1 min-w-0 pb-20">
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
                  learningEnabled={learningEnabled}
                  onLearningChange={(v) => {
                    setLearningEnabled(v);
                    setLearningEnabledState(v);
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
