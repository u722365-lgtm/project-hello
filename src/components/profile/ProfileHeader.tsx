import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Save, Loader2, Crown, Settings } from "lucide-react";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

interface ProfileHeaderProps {
  displayName: string;
  email: string;
  avatarUrl: string;
  userPlan: string;
  isSaving: boolean;
  onSave: () => void;
  onSignOut: () => void;
}

export const ProfileHeader = ({
  displayName,
  email,
  avatarUrl,
  userPlan,
  isSaving,
  onSave,
  onSignOut,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { headerReveal, spring, shouldAnimateAmbient } = useSettingsMotion();

  const planColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground border-border/50",
    pro: "bg-primary/15 text-primary border-primary/30",
    elite: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    enterprise: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  return (
    <motion.header
      variants={headerReveal}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl"
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
      <div className="container mx-auto px-4 py-3 max-w-6xl flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} transition={spring}>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <motion.div
            className="flex items-center gap-3 min-w-0"
            whileHover={{ scale: 1.01 }}
            transition={spring}
          >
            <Avatar className="h-11 w-11 ring-2 ring-primary/40 ring-offset-2 ring-offset-background shrink-0">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {displayName?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold truncate">
                  <span className="gradient-text">{displayName || "Profile"}</span>
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize shrink-0 ${planColors[userPlan] || planColors.free}`}
                >
                  {userPlan !== "free" && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                  {userPlan}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
            <Link to="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="rounded-xl text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
            <Button onClick={onSave} disabled={isSaving} size="sm" className="btn-glow rounded-xl">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </motion.div>
        </div>
      </div>
      {shouldAnimateAmbient && (
        <motion.div
          className="absolute left-0 right-0 bottom-0 h-px pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
          }}
        />
      )}
    </motion.header>
  );
};
