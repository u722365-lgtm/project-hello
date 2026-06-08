import { motion } from "framer-motion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  MessageSquare,
  BarChart3,
  Crown,
  Zap,
  MessageSquareHeart,
  ArrowRight,
} from "lucide-react";
import { adminQuickActions } from "./adminNav";
import { AdminAnimatedCard } from "./AdminAnimatedCard";
import { useAdminMotion } from "@/hooks/useAdminMotion";
import type { LucideIcon } from "lucide-react";

export type AdminStats = {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  activeSubscribers: number;
  proSubscribers: number;
  eliteSubscribers: number;
  totalFeedback: number;
  pendingFeedback: number;
};

type Props = {
  stats: AdminStats;
  loading: boolean;
  onNavigate: (section: string) => void;
};

const StatCard = ({
  title,
  icon: Icon,
  loading,
  children,
}: {
  title: string;
  icon: LucideIcon;
  loading: boolean;
  children: React.ReactNode;
}) => {
  const { shimmerSweep, shouldAnimateAmbient } = useAdminMotion();

  return (
    <AdminAnimatedCard>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <motion.div
          animate={shouldAnimateAmbient ? { rotate: [0, 8, -8, 0] } : undefined}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
        >
          <Icon className="h-4 w-4 text-primary/70" />
        </motion.div>
      </CardHeader>
      <CardContent className="relative overflow-hidden">
        {!loading && shouldAnimateAmbient && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            animate={shimmerSweep}
          />
        )}
        {loading ? <Skeleton className="h-8 w-20" /> : children}
      </CardContent>
    </AdminAnimatedCard>
  );
};

export function AdminDashboard({ stats, loading, onNavigate }: Props) {
  const { variants, reduced, shouldAnimateAmbient } = useAdminMotion();

  return (
    <motion.div
      className="space-y-6"
      variants={variants.staggerList}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={variants.staggerItem}>
        <motion.h2
          className="text-2xl font-bold tracking-tight"
          initial={reduced ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Welcome back
        </motion.h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage ShadowTalk users, releases, monitoring, and platform configuration.
        </p>
      </motion.div>

      <motion.div
        variants={variants.staggerList}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div variants={variants.staggerItem}>
          <StatCard title="Total users" icon={Users} loading={loading}>
            <motion.p
              className="text-2xl font-bold"
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {stats.totalUsers}
            </motion.p>
          </StatCard>
        </motion.div>
        <motion.div variants={variants.staggerItem}>
          <StatCard title="Conversations" icon={MessageSquare} loading={loading}>
            <motion.p
              className="text-2xl font-bold"
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
            >
              {stats.totalConversations}
            </motion.p>
          </StatCard>
        </motion.div>
        <motion.div variants={variants.staggerItem}>
          <StatCard title="Messages" icon={BarChart3} loading={loading}>
            <motion.p
              className="text-2xl font-bold"
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
            >
              {stats.totalMessages}
            </motion.p>
          </StatCard>
        </motion.div>
        <motion.div variants={variants.staggerItem}>
          <StatCard title="Active subscribers" icon={Crown} loading={loading}>
            <div className="flex flex-wrap items-center gap-2">
              <motion.p
                className="text-2xl font-bold"
                initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.15 }}
              >
                {stats.activeSubscribers}
              </motion.p>
              <Badge variant="secondary" className="text-xs">
                <Zap className="mr-1 h-3 w-3" />
                {stats.proSubscribers} Pro
              </Badge>
              <Badge className="bg-gradient-primary text-xs">
                <Crown className="mr-1 h-3 w-3" />
                {stats.eliteSubscribers} Elite
              </Badge>
            </div>
          </StatCard>
        </motion.div>
      </motion.div>

      {stats.pendingFeedback > 0 && (
        <motion.div
          variants={variants.staggerItem}
          initial={reduced ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={reduced ? undefined : { scale: 1.01 }}
        >
          <AdminAnimatedCard className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={shouldAnimateAmbient ? { rotate: [0, -10, 10, 0] } : undefined}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                >
                  <MessageSquareHeart className="h-5 w-5 text-amber-500" />
                </motion.div>
                <p className="text-sm">
                  <span className="font-semibold">{stats.pendingFeedback}</span> feedback items need review.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onNavigate("feedback")}>
                Review now
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </AdminAnimatedCard>
        </motion.div>
      )}

      <motion.div variants={variants.staggerItem}>
        <h3 className="mb-3 text-sm font-semibold">Quick actions</h3>
        <motion.div
          variants={variants.staggerList}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {adminQuickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.section} variants={variants.staggerItem} custom={index}>
                <motion.div whileHover={reduced ? undefined : { y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="relative h-auto w-full overflow-hidden py-4 flex flex-col items-start gap-2 border-border/70 bg-card/50 text-left backdrop-blur-sm hover:border-primary/30 hover:bg-card/80"
                    onClick={() => onNavigate(action.section)}
                  >
                    {shouldAnimateAmbient && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent"
                        animate={{
                          x: ["-100%", "200%"],
                          transition: { duration: 3, repeat: Infinity, repeatDelay: 2 + index * 0.3 },
                        }}
                      />
                    )}
                    <motion.span
                      animate={shouldAnimateAmbient ? { scale: [1, 1.1, 1] } : undefined}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: index * 0.5 }}
                    >
                      <Icon className="relative z-10 h-5 w-5 text-primary" />
                    </motion.span>
                    <span className="relative z-10 font-medium">{action.label}</span>
                  </Button>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
