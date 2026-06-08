import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { adminNavGroups, findAdminNavItem, type AdminNavItem } from "./adminNav";
import { AdminAmbientBackground } from "./AdminAmbientBackground";
import { useAdminMotion } from "@/hooks/useAdminMotion";

type AdminLayoutProps = {
  activeSection: string;
  onSectionChange: (id: string) => void;
  adminEmail?: string | null;
  pendingFeedback?: number;
  pendingGrowthActions?: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  children: ReactNode;
};

function NavButton({
  item,
  isActive,
  collapsed,
  badge,
  onClick,
}: {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const { reduced, springSnappy } = useAdminMotion();
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : item.description ?? item.label}
      whileHover={reduced ? undefined : { x: collapsed ? 0 : 3, scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      className={cn(
        "relative w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {isActive && !reduced && (
        <motion.span
          layoutId="admin-nav-active"
          className="absolute inset-0 rounded-lg bg-primary/12 border border-primary/25 shadow-[0_0_20px_hsl(var(--primary)/0.12)]"
          transition={springSnappy}
        />
      )}
      {isActive && reduced && (
        <span className="absolute inset-0 rounded-lg bg-primary/10" />
      )}
      <Icon className={cn("relative z-10 h-4 w-4 shrink-0", isActive && "text-primary")} />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <motion.div
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={springSnappy}
          className="relative z-10 ml-auto"
        >
          <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
            {badge > 9 ? "9+" : badge}
          </Badge>
        </motion.div>
      )}
    </motion.button>
  );
}

function SidebarNav({
  activeSection,
  onSectionChange,
  collapsed,
  pendingFeedback,
  pendingGrowthActions = 0,
  onNavigateItem,
}: {
  activeSection: string;
  onSectionChange: (id: string) => void;
  collapsed: boolean;
  pendingFeedback: number;
  pendingGrowthActions?: number;
  onNavigateItem?: () => void;
}) {
  const { variants } = useAdminMotion();

  const pick = (item: AdminNavItem) => {
    onSectionChange(item.id);
    onNavigateItem?.();
  };

  return (
    <motion.nav
      className="flex-1 space-y-4 overflow-y-auto px-2 py-2"
      variants={variants.navGroup}
      initial="hidden"
      animate="visible"
    >
      {adminNavGroups.map((group, groupIndex) => (
        <motion.div key={group.title} variants={variants.navItem} custom={groupIndex}>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + groupIndex * 0.05 }}
              className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {group.title}
            </motion.p>
          )}
          <motion.div className="space-y-0.5" variants={variants.navGroup}>
            {group.items.map((item) => (
              <motion.div key={item.id} variants={variants.navItem}>
                <NavButton
                  item={item}
                  isActive={activeSection === item.id}
                  collapsed={collapsed}
                  badge={
                    item.badgeKey === "pendingFeedback"
                      ? pendingFeedback
                      : item.badgeKey === "pendingGrowthActions"
                        ? pendingGrowthActions
                        : undefined
                  }
                  onClick={() => pick(item)}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      ))}
    </motion.nav>
  );
}

export function AdminLayout({
  activeSection,
  onSectionChange,
  adminEmail,
  pendingFeedback = 0,
  pendingGrowthActions = 0,
  sidebarCollapsed,
  onToggleSidebar,
  children,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const current = findAdminNavItem(activeSection);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { variants, shouldAnimateAmbient, reduced, springSnappy } = useAdminMotion();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <AdminAmbientBackground disabled={!shouldAnimateAmbient} />

      {/* Desktop sidebar */}
      <motion.aside
        initial={reduced ? false : { x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: sidebarCollapsed ? 64 : 256 }}
        transition={springSnappy}
        className={cn(
          "sticky top-0 z-40 hidden h-screen flex-col border-r border-border/80 bg-sidebar/95 backdrop-blur-xl md:flex",
        )}
      >
        <motion.div
          variants={variants.headerReveal}
          initial="hidden"
          animate="visible"
          className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3"
        >
          {!sidebarCollapsed && (
            <motion.div
              className="flex min-w-0 items-center gap-2"
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={
                  shouldAnimateAmbient
                    ? {
                        boxShadow: [
                          "0 0 0px hsl(var(--primary) / 0)",
                          "0 0 20px hsl(var(--primary) / 0.35)",
                          "0 0 0px hsl(var(--primary) / 0)",
                        ],
                      }
                    : undefined
                }
                transition={{ duration: 3, repeat: Infinity }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
              >
                <Shield className="h-5 w-5 text-primary shrink-0" />
              </motion.div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold">ShadowTalk Admin</span>
                <span className="text-[10px] text-muted-foreground">Control panel</span>
              </div>
            </motion.div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onToggleSidebar}>
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </motion.div>

        <SidebarNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          collapsed={sidebarCollapsed}
          pendingFeedback={pendingFeedback}
          pendingGrowthActions={pendingGrowthActions}
        />

        <div className="shrink-0 border-t border-border p-2">
          <motion.button
            type="button"
            onClick={() => navigate("/chatbot")}
            whileHover={reduced ? undefined : { x: 2 }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
              sidebarCollapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Back to app</span>}
          </motion.button>
        </div>
      </motion.aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <motion.header
          variants={variants.headerReveal}
          initial="hidden"
          animate="visible"
          className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/80 bg-card/60 px-4 backdrop-blur-md md:px-6"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0">
                <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Admin</span>
                </div>
                <SidebarNav
                  activeSection={activeSection}
                  onSectionChange={onSectionChange}
                  collapsed={false}
                  pendingFeedback={pendingFeedback}
                  pendingGrowthActions={pendingGrowthActions}
                  onNavigateItem={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduced ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.25 }}
                className="min-w-0"
              >
                <h1 className="truncate text-lg font-semibold">{current?.label ?? "Dashboard"}</h1>
                {current?.description && (
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">{current.description}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div
            animate={shouldAnimateAmbient ? { scale: [1, 1.03, 1] } : undefined}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Badge
              variant="outline"
              className="max-w-[180px] shrink-0 truncate border-primary/30 text-xs text-primary"
            >
              {adminEmail}
            </Badge>
          </motion.div>
        </motion.header>

        <motion.div
          variants={variants.pageEnter}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-auto p-4 md:p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
