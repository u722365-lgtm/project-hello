import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, User, Zap, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { useChatSettings } from "@/hooks/useChatSettings";
import { AI_PROVIDER_OPTIONS } from "@/lib/aiProviders";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { isLearningEnabled } from "@/lib/autoImprove/learningConsent";

export function SettingsHero() {
  const { user } = useAuth();
  const { preferences } = useChatSettings();
  const { staggerItem } = useSettingsMotion();

  const email = user?.email ?? "";
  const name =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    email.split("@")[0] ||
    "ShadowTalk user";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? "";

  const providerLabels: Record<string, string> = {
    lovable: "ShadowTalk Pro",
    shadowtalk: "ShadowTalk Sovereign",
    gemini: "Gemini",
    openrouter: "OpenRouter",
    kimi: "Kimi",
  };
  const providerLabel =
    providerLabels[preferences.defaultProvider] ??
    AI_PROVIDER_OPTIONS.find((p) => p.id === preferences.defaultProvider)?.name ??
    preferences.defaultProvider;

  return (
    <motion.section
      variants={staggerItem}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/80 to-secondary/5 p-5 sm:p-6 mb-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_55%)] pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <Avatar className="h-14 w-14 ring-2 ring-primary/40 ring-offset-2 ring-offset-background shrink-0">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
            {name[0]?.toUpperCase() ?? "S"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold truncate">{name}</h2>
            <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">
              Workspace
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-border/50 px-2.5 py-1">
              <Bot className="h-3 w-3 text-primary" />
              {providerLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-border/50 px-2.5 py-1 capitalize">
              <Zap className="h-3 w-3 text-amber-400" />
              {preferences.defaultPersonality}
            </span>
            {isLearningEnabled() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-emerald-400">
                Learning on
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch shrink-0">
          <Button asChild size="sm" className="btn-glow rounded-xl">
            <Link to="/chatbot">
              <MessageSquare className="h-4 w-4 mr-2" />
              Open chat
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl border-border/60">
            <Link to="/profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
