import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterSettingsCatalog } from "@/lib/settingsCatalog";
import type { SettingsSectionId } from "@/lib/settingsTypes";

interface SettingsSearchProps {
  onNavigate: (section: SettingsSectionId) => void;
  className?: string;
}

export function SettingsSearch({ onNavigate, className }: SettingsSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = filterSettingsCatalog(query);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (section: SettingsSectionId) => {
    onNavigate(section);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search settings…"
          className="pl-9 pr-16 h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary/40"
          aria-label="Search settings"
          aria-expanded={open && results.length > 0}
          aria-controls="settings-search-results"
        />
        <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
          ⌘K
        </kbd>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 sm:hidden p-1 text-muted-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && query.trim() && results.length > 0 && (
          <motion.ul
            id="settings-search-results"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-elevated overflow-hidden py-1"
          >
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => pick(item.section)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
