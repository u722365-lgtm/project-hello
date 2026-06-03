import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  Droplets,
  Palette,
  RefreshCw,
  Save,
  Shuffle,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useThemeTemplates } from "@/contexts/ThemeTemplateContext";
import type { ThemeTemplate } from "@/lib/themes/types";
import {
  DEFAULT_CUSTOM_FORM,
  QUICK_START_PRESETS,
  addCustomThemeToLibrary,
  applyHarmony,
  buildTemplateFromForm,
  contrastRatio,
  formFromTemplate,
  getContrastLabel,
  importThemeFromFile,
  loadCustomThemeDraft,
  randomizeForm,
  saveCustomThemeDraft,
  type ColorHarmony,
  type CustomThemeFormState,
} from "@/lib/themes/customTheme";
import { applyThemeTemplate } from "@/lib/themes/applyTheme";
import { downloadThemeTemplate } from "@/lib/themes/downloadTheme";
import { getThemeTemplateById } from "@/lib/themes/generateTemplates";
import { publishAutoImproveEvent } from "@/lib/autoImprove/eventBus";

type CustomThemeDesignerProps = {
  onSaved?: (themes: ThemeTemplate[]) => void;
  seedTemplateId?: string | null;
  /** Loaded when user clicks Edit from My Themes */
  initialForm?: CustomThemeFormState | null;
  editingThemeId?: string | null;
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-border cursor-pointer bg-transparent shrink-0"
          aria-label={`${label} color`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs h-10"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export function CustomThemeDesigner({
  onSaved,
  seedTemplateId,
  initialForm,
  editingThemeId,
}: CustomThemeDesignerProps) {
  const { toast } = useToast();
  const { applyTemplate, activeTemplateId } = useThemeTemplates();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CustomThemeFormState>(() => loadCustomThemeDraft() ?? DEFAULT_CUSTOM_FORM);

  const previewTemplate = useMemo(() => buildTemplateFromForm(form, "custom-preview"), [form]);
  const contrast = useMemo(
    () => getContrastLabel(contrastRatio(form.primary, form.background)),
    [form.primary, form.background],
  );

  const patch = useCallback((partial: Partial<CustomThemeFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...partial };
      saveCustomThemeDraft(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!seedTemplateId) return;
    const base = getThemeTemplateById(seedTemplateId);
    if (base) {
      const next = formFromTemplate(base);
      setForm(next);
      saveCustomThemeDraft(next);
    }
  }, [seedTemplateId]);

  useEffect(() => {
    if (!initialForm) return;
    setForm(initialForm);
    saveCustomThemeDraft(initialForm);
  }, [initialForm]);

  const handlePreview = () => {
    applyThemeTemplate(previewTemplate);
    toast({ title: "Live preview", description: "Tweaking colors — save or apply when ready." });
  };

  const handleApply = () => {
    const template = buildTemplateFromForm(form, editingThemeId ?? undefined);
    applyTemplate(template);
    void publishAutoImproveEvent("theme_apply", { templateId: template.id, category: "Custom" });
    toast({ title: "Custom theme applied", description: template.name });
  };

  const handleDownload = () => {
    downloadThemeTemplate(buildTemplateFromForm(form));
    toast({ title: "Theme downloaded", description: "JSON pack saved to your device." });
  };

  const handleSaveLibrary = () => {
    const template = buildTemplateFromForm(form, editingThemeId ?? undefined);
    const lib = addCustomThemeToLibrary(template);
    onSaved?.(lib);
    toast({ title: "Saved to My Themes", description: `${template.name} is in your library.` });
  };

  const handleHarmony = (harmony: ColorHarmony) => {
    const { secondary, accent } = applyHarmony(form.primary, harmony);
    patch({ secondary, accent });
    toast({ title: "Palette harmony", description: `${harmony} colors applied from primary.` });
  };

  const handleImport = async (file: File) => {
    const template = await importThemeFromFile(file);
    if (!template) {
      toast({ variant: "destructive", title: "Invalid theme file", description: "Use a ShadowTalk theme JSON export." });
      return;
    }
    setForm(formFromTemplate(template));
    toast({ title: "Theme imported", description: "Edit and apply when ready." });
  };

  const duplicateActive = () => {
    if (!activeTemplateId) return;
    const t = getThemeTemplateById(activeTemplateId);
    if (t) patch(formFromTemplate(t));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-xl overflow-hidden"
    >
      <div className="p-6 sm:p-8 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Badge className="mb-2 gap-1 border-primary/30">
              <Palette className="h-3.5 w-3.5" />
              Custom designer
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Design your own theme</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Full control over brand colors, motion, density, and corner radius — with live preview,
              harmony tools, contrast checks, import/export, and one-click apply site-wide.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => patch(randomizeForm(form))}>
              <Shuffle className="h-4 w-4" />
              Randomize
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={duplicateActive}>
              <Copy className="h-4 w-4" />
              From active
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 lg:divide-x divide-border/50">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Theme name</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Quick starts</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_START_PRESETS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => patch({ ...form, ...p.form, name: p.label })}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Wand2 className="h-3.5 w-3.5" />
              Color harmony (from primary)
            </p>
            <div className="flex flex-wrap gap-2">
              {(["analogous", "complementary", "triadic", "split", "monochrome"] as ColorHarmony[]).map((h) => (
                <Button key={h} type="button" variant="outline" size="sm" className="text-xs h-8 capitalize" onClick={() => handleHarmony(h)}>
                  {h}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorField label="Primary" value={form.primary} onChange={(primary) => patch({ primary })} />
            <ColorField label="Secondary" value={form.secondary} onChange={(secondary) => patch({ secondary })} />
            <ColorField label="Accent" value={form.accent} onChange={(accent) => patch({ accent })} />
            <ColorField label="Background" value={form.background} onChange={(background) => patch({ background })} />
            <ColorField label="Foreground text" value={form.foreground} onChange={(foreground) => patch({ foreground })} />
            <ColorField label="Success" value={form.success} onChange={(success) => patch({ success })} />
            <ColorField label="Warning" value={form.warning} onChange={(warning) => patch({ warning })} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Corner radius ({form.radiusRem}rem)</Label>
              <Slider
                value={[form.radiusRem]}
                min={0.375}
                max={1.25}
                step={0.125}
                onValueChange={([v]) => patch({ radiusRem: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Motion</Label>
              <Select value={form.motion} onValueChange={(motion) => patch({ motion: motion as CustomThemeFormState["motion"] })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Density</Label>
              <Select value={form.density} onValueChange={(density) => patch({ density: density as CustomThemeFormState["density"] })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Primary on background contrast:</span>
            <Badge variant={contrast.ok ? "default" : "destructive"}>{contrast.label}</Badge>
            <span className="font-mono text-muted-foreground">{contrastRatio(form.primary, form.background).toFixed(2)}:1</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-muted/10 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
          <div
            className="rounded-2xl border border-border/60 p-5 space-y-4 min-h-[280px]"
            style={{
              background: `hsl(${previewTemplate.tokens.background})`,
              color: `hsl(${previewTemplate.tokens.foreground})`,
              borderRadius: `${previewTemplate.radiusRem}rem`,
            }}
          >
            <div className="flex gap-2">
              {previewTemplate.preview.map((c, i) => (
                <span key={i} className="h-8 flex-1 rounded-lg border border-white/10" style={{ background: c }} />
              ))}
            </div>
            <p className="text-lg font-semibold" style={{ color: `hsl(${previewTemplate.tokens.primary})` }}>
              {form.name}
            </p>
            <p className="text-sm opacity-80">{form.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  background: `hsl(${previewTemplate.tokens.primary})`,
                  color: `hsl(${previewTemplate.tokens.primaryForeground})`,
                  borderRadius: `${previewTemplate.radiusRem}rem`,
                }}
              >
                Primary button
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg border"
                style={{
                  borderColor: `hsl(${previewTemplate.tokens.border})`,
                  color: `hsl(${previewTemplate.tokens.secondary})`,
                  borderRadius: `${previewTemplate.radiusRem}rem`,
                }}
              >
                Secondary
              </button>
            </div>
            <div
              className="p-3 rounded-xl border text-sm"
              style={{
                background: `hsl(${previewTemplate.tokens.card})`,
                borderColor: `hsl(${previewTemplate.tokens.border})`,
                borderRadius: `${previewTemplate.radiusRem}rem`,
              }}
            >
              Card surface — chat panels and settings use these tokens.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-1.5" onClick={handlePreview}>
              <RefreshCw className="h-4 w-4" />
              Preview live
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="secondary" className="gap-1.5" onClick={handleSaveLibrary}>
              <Save className="h-4 w-4" />
              Save to My Themes
            </Button>
            <Button className="btn-glow gap-1.5" onClick={handleApply}>
              <Sparkles className="h-4 w-4" />
              Apply theme
            </Button>
          </div>
          {activeTemplateId === previewTemplate.id && (
            <p className="text-xs text-center text-primary flex items-center justify-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Previewing on site now
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default CustomThemeDesigner;
