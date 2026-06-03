import { motion } from "framer-motion";
import { Check, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ThemeTemplate } from "@/lib/themes/types";

type TemplateCardProps = {
  template: ThemeTemplate;
  index: number;
  isActive: boolean;
  onApply: () => void;
  onDownload: () => void;
};

export function TemplateCard({ template, index, isActive, onApply, onDownload }: TemplateCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.8), duration: 0.45, type: "spring", stiffness: 260 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`group relative rounded-2xl border overflow-hidden ${
        isActive ? "border-primary shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : "border-border/60"
      } bg-card/80 backdrop-blur-md`}
    >
      <div
        className="h-24 flex"
        style={{
          background: `linear-gradient(135deg, ${template.preview[0]}, ${template.preview[1]}, ${template.preview[2]})`,
        }}
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">{template.name}</h3>
            <p className="text-[10px] text-muted-foreground">{template.category}</p>
          </div>
          {isActive && (
            <Badge className="bg-primary/20 text-primary border-0 text-[10px]">
              <Check className="h-3 w-3 mr-0.5" />
              Active
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
        <div className="flex gap-1.5">
          {template.preview.map((c, i) => (
            <span
              key={i}
              className="h-5 w-5 rounded-full border border-border/60 shrink-0"
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <span className="rounded-full bg-muted/50 px-2 py-0.5">{template.motion}</span>
          <span className="rounded-full bg-muted/50 px-2 py-0.5">{template.density}</span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 h-8 text-xs btn-glow gap-1" onClick={onApply}>
            <Sparkles className="h-3.5 w-3.5" />
            Apply theme
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={onDownload} aria-label="Download theme">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export default TemplateCard;
