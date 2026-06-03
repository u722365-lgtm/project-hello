import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout, Palette, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutoImproveContext } from "@/contexts/AutoImproveContext";
import { useThemeTemplates } from "@/contexts/ThemeTemplateContext";
import { getThemeTemplateById } from "@/lib/themes/generateTemplates";
import { applyUiUxTweak } from "@/lib/autoImprove/analyzeUiUx";
import { isThemeUiUxSuggestion, type UiUxSuggestion } from "@/lib/autoImprove/uiUxTypes";

type UiUxSuggestionPanelProps = {
  suggestions: UiUxSuggestion[];
  onDismiss: (id: string) => void;
};

export function UiUxSuggestionPanel({ suggestions, onDismiss }: UiUxSuggestionPanelProps) {
  const navigate = useNavigate();
  const { applyTemplate } = useThemeTemplates();

  if (suggestions.length === 0) return null;

  const top = suggestions[0];
  const themeSuggestions = suggestions.filter(isThemeUiUxSuggestion);
  const displaySuggestions = themeSuggestions.length > 0 ? [themeSuggestions[0], ...suggestions.filter((s) => s.id !== themeSuggestions[0].id)] : suggestions;
  const shown = displaySuggestions[0];

  const handleApply = () => {
    if (shown.suggestedTemplateId) {
      const tpl = getThemeTemplateById(shown.suggestedTemplateId);
      if (tpl) {
        applyTemplate(tpl);
        onDismiss(shown.id);
        return;
      }
    }
    if (shown.tweak) applyUiUxTweak(shown.tweak);
    if (shown.id === "browse-templates") navigate("/templates");
    onDismiss(shown.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-36 right-4 z-[60] max-w-sm"
    >
      <div className="rounded-2xl border border-secondary/40 bg-card/95 backdrop-blur-xl shadow-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
            <Layout className="h-4 w-4" />
            UI/UX suggestion
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDismiss(shown.id)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm font-medium text-foreground">{shown.title}</p>
        <p className="text-xs text-muted-foreground">{shown.description}</p>
        <p className="text-[10px] text-muted-foreground/80 italic">{shown.reason}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleApply}>
            <Palette className="h-3.5 w-3.5" />
            {shown.suggestedTemplateId ? "Apply theme" : "Apply tweak"}
          </Button>
          {shown.suggestedTemplateId && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                navigate("/templates");
                onDismiss(shown.id);
              }}
            >
              Browse templates
            </Button>
          )}
        </div>
        {displaySuggestions.length > 1 && !shown.suggestedTemplateId && (
          <ul className="text-[10px] text-muted-foreground space-y-1 pt-1 border-t border-border/50">
            {displaySuggestions.slice(1, 3).map((s) => (
              <li key={s.id} className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                {s.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export default UiUxSuggestionPanel;
