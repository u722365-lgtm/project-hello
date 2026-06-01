import {
  Plus,
  MessageSquare,
  Trash2,
  Trash,
  Search,
  BookOpen,
  Layers,
  Archive,
  ArchiveRestore,
  Settings2,
  ArrowLeft,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  archived_at?: string | null;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  isArchived: (conversation: Conversation) => boolean;
  onCreateNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onClearAll: () => void;
  onClearCurrent?: () => void;
  onOpenSettings: () => void;
  onOpenWorkspace?: () => void;
  onClose?: () => void;
}

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  isArchived,
  onCreateNew,
  onSelect,
  onDelete,
  onArchive,
  onUnarchive,
  onClearAll,
  onClearCurrent,
  onOpenSettings,
  onOpenWorkspace,
  onClose,
}: ConversationSidebarProps) => {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { spring, staggerItem, staggerList } = useSettingsMotion();

  const activeConversations = conversations.filter((c) => !isArchived(c));
  const archivedConversations = conversations.filter((c) => isArchived(c));
  const visibleConversations = showArchivedView ? archivedConversations : activeConversations;

  const filtered = visibleConversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce(
    (acc, conv) => {
      const date = new Date(conv.created_at);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let group = "Earlier";
      if (days === 0) group = "Today";
      else if (days === 1) group = "Yesterday";
      else if (days < 7) group = "Last 7 days";
      else if (days < 30) group = "Last 30 days";

      if (!acc[group]) acc[group] = [];
      acc[group].push(conv);
      return acc;
    },
    {} as Record<string, Conversation[]>,
  );

  const groupOrder = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Earlier"];

  return (
    <motion.div
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      transition={SETTINGS_SPRING}
      className="w-[min(100vw,300px)] sm:w-[300px] shrink-0 flex flex-col h-full glass-strong border-r border-border/50 shadow-elevated"
    >
      <div className="relative shrink-0 p-4 border-b border-border/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight">
                {showArchivedView ? "Archived" : "Chat history"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeConversations.length} active
              {archivedConversations.length > 0 && ` · ${archivedConversations.length} archived`}
            </p>
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-xl shrink-0"
              aria-label="Close history"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative mt-4 space-y-2">
          {showArchivedView ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchivedView(false)}
              className="w-full h-9 rounded-xl justify-start gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back to chats
            </Button>
          ) : (
            <motion.div whileTap={{ scale: 0.98 }} transition={spring}>
              <Button
                onClick={() => {
                  settingsHapticTick();
                  onCreateNew();
                }}
                className="w-full h-10 rounded-xl btn-glow gap-2 font-medium"
              >
                <Plus className="h-4 w-4" /> New chat
              </Button>
            </motion.div>
          )}
          {!showArchivedView && onClearCurrent && currentConversationId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCurrent}
              className="w-full h-8 rounded-lg text-xs text-muted-foreground"
            >
              <Trash className="h-3.5 w-3.5 mr-2" /> Clear this chat
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <motion.div variants={staggerList} initial="hidden" animate="visible" className="pb-4 space-y-6 pt-2">
          {!showArchivedView && onOpenWorkspace && (
            <motion.div variants={staggerItem} className="px-2">
              <button
                type="button"
                onClick={() => {
                  settingsHapticTick();
                  onOpenWorkspace();
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left border border-primary/25 bg-primary/10 hover:bg-primary/15 transition-colors"
              >
                <Layers className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">Project workspace</span>
                <BookOpen className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </button>
            </motion.div>
          )}

          {filtered.length === 0 && (
            <motion.p variants={staggerItem} className="px-4 text-sm text-muted-foreground text-center py-8">
              {showArchivedView ? "No archived chats." : "No conversations yet — start a new chat."}
            </motion.p>
          )}

          <LayoutGroup id="conversation-list">
            {groupOrder.map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;
              return (
                <motion.div key={group} variants={staggerItem} className="space-y-1">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((conv) => {
                      const isActive = currentConversationId === conv.id;
                      const isHovered = hoveredId === conv.id;
                      const archived = isArchived(conv);
                      return (
                        <motion.div
                          key={conv.id}
                          layout
                          onMouseEnter={() => setHoveredId(conv.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="relative"
                        >
                          <motion.button
                            type="button"
                            onClick={() => {
                              settingsHapticTick();
                              onSelect(conv.id);
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            className={cn(
                              "relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="conversation-active-pill"
                                className="absolute inset-0 rounded-xl bg-primary/12 border border-primary/25"
                                transition={spring}
                              />
                            )}
                            <MessageSquare
                              className={cn(
                                "relative z-10 h-4 w-4 shrink-0",
                                isActive ? "text-primary" : "opacity-50",
                              )}
                            />
                            <span
                              className={cn(
                                "relative z-10 flex-1 text-[13px] truncate",
                                isActive && "font-medium",
                              )}
                            >
                              {conv.title || "Untitled chat"}
                            </span>
                            <AnimatePresence>
                              {(isHovered || isActive) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.85 }}
                                  transition={{ duration: 0.15 }}
                                  className="relative z-10 flex items-center gap-0.5"
                                >
                                  {archived ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-lg"
                                      title="Restore"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUnarchive(conv.id);
                                      }}
                                    >
                                      <ArchiveRestore className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-lg"
                                      title="Archive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onArchive(conv.id);
                                      }}
                                    >
                                      <Archive className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:text-destructive"
                                    title="Delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(conv.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </LayoutGroup>
        </motion.div>
      </ScrollArea>

      <div className="shrink-0 p-4 border-t border-border/40 space-y-3 bg-background/40">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setShowArchivedView(true);
            }}
            className={cn(
              "h-9 rounded-xl text-xs justify-start",
              showArchivedView && "bg-primary/10 text-foreground",
            )}
          >
            <Archive className="h-3.5 w-3.5 mr-1" />
            Archived
            {archivedConversations.length > 0 && (
              <span className="ml-auto tabular-nums opacity-70">{archivedConversations.length}</span>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              settingsHapticTick();
              onOpenSettings();
            }}
            className="h-9 rounded-xl text-xs justify-start"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Settings
          </Button>
        </div>

        {conversations.length > 2 && (
          <motion.div
            animate={
              searchFocused
                ? { boxShadow: "0 0 0 2px hsl(var(--primary) / 0.25)" }
                : { boxShadow: "0 0 0 0px transparent" }
            }
            className="relative rounded-xl"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={showArchivedView ? "Search archived…" : "Search chats…"}
              className="h-10 pl-9 rounded-xl bg-muted/30 border-border/50 text-sm"
            />
          </motion.div>
        )}

        {!showArchivedView && conversations.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                Clear all chats
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong border-border rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every conversation. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearAll}
                  className="rounded-xl bg-destructive text-destructive-foreground"
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </motion.div>
  );
};
