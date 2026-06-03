import { motion } from "framer-motion";
import { Download, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ThemeTemplate } from "@/lib/themes/types";
import { useThemeTemplates } from "@/contexts/ThemeTemplateContext";
import { downloadThemeTemplate } from "@/lib/themes/downloadTheme";
import { removeCustomThemeFromLibrary } from "@/lib/themes/customTheme";
type MyCustomThemesPanelProps = {
  themes: ThemeTemplate[];
  onChange: (themes: ThemeTemplate[]) => void;
  onEdit: (template: ThemeTemplate) => void;
  activeTemplateId: string | null;
};

export function MyCustomThemesPanel({
  themes,
  onChange,
  onEdit,
  activeTemplateId,
}: MyCustomThemesPanelProps) {
  const { applyTemplate } = useThemeTemplates();

  if (themes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground glass-subtle rounded-2xl">
        No saved custom themes yet. Design one in the Custom tab and click Save to My Themes.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {themes.map((template, index) => (
        <motion.article
          key={template.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className={`rounded-2xl border p-4 ${
            activeTemplateId === template.id ? "border-primary bg-primary/5" : "border-border/60 bg-card/50"
          }`}
        >
          <div className="h-14 rounded-xl mb-3 flex gap-1 overflow-hidden">
            {template.preview.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{template.description}</p>
            </div>
            {activeTemplateId === template.id && (
              <Badge className="text-[10px] shrink-0">Active</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" className="h-8 text-xs flex-1 gap-1" onClick={() => applyTemplate(template)}>
              <Sparkles className="h-3.5 w-3.5" />
              Apply
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => onEdit(template)}>
              Edit
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => downloadThemeTemplate(template)}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-destructive"
              onClick={() => onChange(removeCustomThemeFromLibrary(template.id))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export default MyCustomThemesPanel;
