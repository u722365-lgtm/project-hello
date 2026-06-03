import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, Paintbrush, Search, Sparkles, Wand2, FolderOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeTemplates } from "@/contexts/ThemeTemplateContext";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { CustomThemeDesigner } from "@/components/templates/CustomThemeDesigner";
import { MyCustomThemesPanel } from "@/components/templates/MyCustomThemesPanel";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";
import { THEME_TEMPLATES } from "@/lib/themes/generateTemplates";
import { publishAutoImproveEvent } from "@/lib/autoImprove/eventBus";
import {
  formFromTemplate,
  loadCustomThemesLibrary,
  saveCustomThemeDraft,
  type CustomThemeFormState,
} from "@/lib/themes/customTheme";
import type { ThemeTemplate } from "@/lib/themes/types";

const CATEGORIES = [...new Set(THEME_TEMPLATES.map((t) => t.category))];

const TAB_VALUES = new Set(["gallery", "custom", "mine"]);

const TemplatesPage = () => {
  const { templates, activeTemplateId, applyTemplate, downloadTemplate } = useThemeTemplates();
  const { variants, hoverLift, isMobile } = useLandingMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(() =>
    tabParam && TAB_VALUES.has(tabParam) ? tabParam : "gallery",
  );
  const [customLibrary, setCustomLibrary] = useState(() => loadCustomThemesLibrary());
  const [designerSeed, setDesignerSeed] = useState<string | null>(null);
  const [designerInitialForm, setDesignerInitialForm] = useState<CustomThemeFormState | null>(null);
  const [designerEditingId, setDesignerEditingId] = useState<string | null>(null);

  useEffect(() => {
    void publishAutoImproveEvent("template_browse", { action: "gallery_open" });
  }, []);

  useEffect(() => {
    if (tabParam && TAB_VALUES.has(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [tabParam, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [templates, query, category]);

  const handleEditCustom = (template: ThemeTemplate) => {
    const form: CustomThemeFormState = {
      ...formFromTemplate(template),
      name: template.name,
      description: template.description,
    };
    saveCustomThemeDraft(form);
    setDesignerInitialForm(form);
    setDesignerEditingId(template.id);
    setDesignerSeed(null);
    setTab("custom");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void publishAutoImproveEvent("template_browse", { action: "edit_custom", templateId: template.id });
  };

  return (
    <>
      <SEOHead
        meta={{
          title: "UI Templates — 100 Themes + Custom Designer",
          description:
            "Browse 100 ShadowTalk themes or design your own with harmony tools, contrast checks, import/export, and site-wide apply.",
          keywords: ["ShadowTalk themes", "custom theme", "UI designer", "dark themes"],
          canonical: "https://www.shadowtalk-ai.com/templates",
        }}
      />
      <div className="min-h-screen bg-background neural-bg relative overflow-hidden">
        <Navigation />
        <LandingAmbientOrb
          className={`absolute top-20 left-1/4 ${isMobile ? "w-[300px] h-[300px] blur-[90px]" : "w-[600px] h-[400px] blur-[150px]"} bg-primary/15 rounded-full`}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          duration={8}
        />
        <LandingAmbientOrb
          className={`absolute bottom-0 right-0 ${isMobile ? "w-[280px] h-[280px] blur-[80px]" : "w-[500px] h-[500px] blur-[140px]"} bg-secondary/10 rounded-full`}
          animate={{ y: [0, -30, 0] }}
          duration={10}
        />

        <div className="container mx-auto px-4 pt-24 pb-20 relative z-10">
          <motion.div
            variants={variants.fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto mb-8"
          >
            <Badge className="mb-4 gap-1.5 border-primary/30 bg-primary/10">
              <LayoutGrid className="h-3.5 w-3.5" />
              {templates.length} presets + custom designer
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
              <span className="gradient-text">ShadowTalk</span> UI Library
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Pick a preset, or design your own palette with harmony tools, contrast checks, and live preview —
              then apply across the entire site.
            </p>
          </motion.div>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v);
              if (v !== "custom") setDesignerInitialForm(null);
              setSearchParams(v === "gallery" ? {} : { tab: v }, { replace: true });
            }}
            className="max-w-6xl mx-auto"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 glass-subtle">
              <TabsTrigger value="gallery" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Paintbrush className="h-4 w-4" />
                Custom design
              </TabsTrigger>
              <TabsTrigger value="mine" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                My themes
                {customLibrary.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {customLibrary.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="mt-0">
              <CustomThemeDesigner
                seedTemplateId={designerSeed}
                initialForm={designerInitialForm}
                editingThemeId={designerEditingId}
                onSaved={(lib) => {
                  setCustomLibrary(lib);
                  setDesignerEditingId(null);
                }}
              />
              <p className="text-center text-xs text-muted-foreground mt-6">
                Tip: duplicate any gallery theme via &quot;From active&quot; after applying a preset, then customize here.
              </p>
            </TabsContent>

            <TabsContent value="mine" className="mt-0">
              <MyCustomThemesPanel
                themes={customLibrary}
                onChange={setCustomLibrary}
                onEdit={handleEditCustom}
                activeTemplateId={activeTemplateId}
              />
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <motion.div
                variants={variants.fadeSlideUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto mb-8"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates…"
                    className="pl-9 glass-subtle"
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() => {
                    void publishAutoImproveEvent("template_browse", { action: "filter_reset" });
                    setCategory("all");
                    setQuery("");
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                  Reset filters
                </Button>
              </motion.div>

              <motion.div
                className="flex flex-wrap justify-center gap-2 mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  size="sm"
                  variant={category === "all" ? "default" : "outline"}
                  onClick={() => setCategory("all")}
                >
                  All
                </Button>
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={category === cat ? "default" : "outline"}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </motion.div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <motion.p
                  className="text-center text-xs text-muted-foreground"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="inline h-3.5 w-3.5 mr-1 text-primary" />
                  Want your own look? Design a custom theme.
                </motion.p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => {
                    setTab("custom");
                    setSearchParams({ tab: "custom" }, { replace: true });
                  }}
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  Custom design
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filtered.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isActive={activeTemplateId === template.id}
                    onApply={() => applyTemplate(template)}
                    onDownload={() => downloadTemplate(template)}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <motion.div
                  whileHover={hoverLift}
                  className="text-center py-16 text-muted-foreground glass-subtle rounded-2xl"
                >
                  No templates match your search.
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default TemplatesPage;
