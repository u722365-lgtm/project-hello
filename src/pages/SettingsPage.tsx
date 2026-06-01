import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsGeneralSection } from "@/components/settings/SettingsGeneralSection";
import { SettingsDefaultModelsCard } from "@/components/settings/SettingsDefaultModelsCard";
import { CustomInstructionsProfileCard } from "@/components/profile/CustomInstructionsProfileCard";
import { ChatAIPreferencesCard } from "@/components/profile/ChatAIPreferencesCard";
import { OfflineAISettings } from "@/components/profile/OfflineAISettings";
import { ShadowTalkModelPanel } from "@/components/profile/ShadowTalkModelPanel";
import { AutoImproveInsights } from "@/components/autoImprove/AutoImproveInsights";
import { PrivacyDataCard } from "@/components/profile/PrivacyDataCard";
import { CustomApiKeysPanel } from "@/components/profile/CustomApiKeysPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { isLearningEnabled, setLearningEnabled } from "@/lib/autoImprove/learningConsent";
import { useState } from "react";
import { DesktopAppSettings } from "@/components/desktop/DesktopAppSettings";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings, desc: "Theme, language, sounds" },
  { id: "personalization", label: "Personalization", icon: Sparkles, desc: "Instructions & tone" },
  { id: "chat", label: "Chat behavior", icon: MessageSquare, desc: "Sending, timestamps, routing" },
  { id: "models", label: "Models & AI", icon: Bot, desc: "Provider, offline, sovereign" },
  { id: "data", label: "Data controls", icon: Database, desc: "Learning & privacy" },
  { id: "connections", label: "Connections", icon: Link2, desc: "API keys & integrations" },
  { id: "account", label: "Account", icon: User, desc: "Profile, billing, security" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const VALID = new Set(SECTIONS.map((s) => s.id));

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [learningEnabled, setLearningEnabledState] = useState(isLearningEnabled());

  const section = (() => {
    const s = searchParams.get("section") || "general";
    return VALID.has(s as SectionId) ? (s as SectionId) : "general";
  })();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chatbot")} aria-label="Back to chat">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <p className="hidden sm:block text-sm text-muted-foreground ml-2">
            Customize ShadowTalk like ChatGPT, Claude, or Gemini
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="lg:w-56 shrink-0">
            <ul className="space-y-1 sticky top-20">
              {SECTIONS.map((item) => {
                const active = section === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ section: item.id }, { replace: true })}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        active
                          ? "bg-primary/15 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{item.label}</span>
                        <span className="block text-[10px] text-muted-foreground truncate">{item.desc}</span>
                      </span>
                      {active && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="flex-1 min-w-0 pb-16">
            {section === "general" && <SettingsGeneralSection />}

            {section === "personalization" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Personalization</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Custom instructions and default style for every conversation
                  </p>
                </div>
                <SettingsDefaultModelsCard />
                <CustomInstructionsProfileCard />
              </div>
            )}

            {section === "chat" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Chat behavior</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keyboard, display, and how messages are routed
                  </p>
                </div>
                <ChatAIPreferencesCard />
              </div>
            )}

            {section === "models" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Models & AI</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    On-device models, hardware acceleration, and sovereign learning
                  </p>
                </div>
                <SettingsDefaultModelsCard />
                <OfflineAISettings />
                <ShadowTalkModelPanel />
                <DesktopAppSettings />
              </div>
            )}

            {section === "data" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Data controls</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learning, analytics consent, and local data
                  </p>
                </div>
                <AutoImproveInsights />
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Adaptive learning</CardTitle>
                    <CardDescription>
                      On-device behavior learning (separate from analytics cookies)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                      <p className="text-sm font-medium">Enable adaptive learning</p>
                      <Switch
                        checked={learningEnabled}
                        onCheckedChange={(v) => {
                          setLearningEnabled(v);
                          setLearningEnabledState(v);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <PrivacyDataCard />
              </div>
            )}

            {section === "connections" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Connections</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    API keys and linked services (Google, GitHub, Slack, WhatsApp)
                  </p>
                </div>
                <CustomApiKeysPanel />
                <Card className="glass border-border/50">
                  <CardContent className="pt-6 flex flex-wrap gap-3">
                    <Button asChild variant="secondary">
                      <Link to="/profile?tab=linked">Manage linked accounts</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/developers">Developer integrations</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Profile, subscription, security, and notifications
                  </p>
                </div>
                <Card className="glass border-border/50 divide-y divide-border/40">
                  {[
                    { label: "Profile & avatar", href: "/profile?tab=profile", desc: "Name, bio, photo" },
                    { label: "Notifications", href: "/profile?tab=notifications", desc: "Email & alerts" },
                    { label: "Security & 2FA", href: "/profile?tab=security", desc: "Password, API vault" },
                    { label: "Billing & plan", href: "/profile?tab=billing", desc: "Subscription & credits" },
                    { label: "Activity history", href: "/profile?tab=activity", desc: "Past conversations" },
                  ].map((row) => (
                    <Link
                      key={row.href}
                      to={row.href}
                      className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{row.label}</p>
                        <p className="text-xs text-muted-foreground">{row.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
