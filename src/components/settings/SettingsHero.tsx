import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, User, Zap, Bot, Sparkles } from "lucide-react";
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
  const { staggerItem, staggerList, reduced, spring } = useSettingsMotion();

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
    : "OpenRouter",
    kimi: "Kimi",
  };
  const providerLabel =
    providerLabels[preferences.defaultProvider] ??
    AI_PROVIDER_OPTIONS.find((p) => p.id === preferences.defaultProvider)?.name ??
    preferences.defaultProvider;

  const badges: { icon: typeof Bot; label: string; className: string }[] = [
    { icon: Bot, label: providerLabel, className: "" },
    { icon: Zap, label: preferences.defaultPersonality, className: "capitalize" },
  ];
  if (isLearningEnabled()) {
    badges.push({
      icon: Sparkles,
      label: "Learning on",
      className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    });
  }

  return (
    <motion.section
      variants={staggerItem}
      className="relative overflow-hidden rounded-2xl p-[1px] mb-6"
    >
      {!reduced && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-80"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)), hsl(var(--primary)))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/12 via-background/95 to-secondary/8 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.2),transparent_60%)] pointer-events-none" />
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        >
          <motion.div variants={staggerItem} whileHover={{ scale: 1.04 }} transition={spring}>
            <Avatar className="h-16 w-16 ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-[0_0_32px_hsl(var(--primary)/0.25)]">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback className="bg-primary/25 text-primary text-xl font-bold">
                {name[0]?.toUpperCase() ?? "S"}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <motion.div variants={staggerItem} className="flex-1 min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight truncate">{name}</h2>
              <Badge
                variant="outline"
                className="text-[10px] border-primary/40 bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
              >
                Workspace
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {badges.map((b, i) => (
                <motion.span
                  key={b.label}
                  variants={staggerItem}
                  custom={i}
                  whileHover={{ scale: 1.04, y: -1 }}
                  transition={spring}
                  className={`inline-flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/50 px-3 py-1.5 backdrop-blur-sm ${b.className}`}
                >
                  <b.icon className="h-3 w-3 text-primary shrink-0" />
                  {b.label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch shrink-0">
            <Button asChild size="sm" className="btn-glow rounded-xl h-10">
              <Link to="/chatbot">
                <MessageSquare className="h-4 w-4 mr-2" />
                Open chat
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl h-10 border-border/60 hover:border-primary/40">
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
