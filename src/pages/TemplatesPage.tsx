import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Search, Sparkles, Wand2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useThemeTemplates } from "@/contexts/ThemeTemplateContext";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";
import { THEME_TEMPLATES } from "@/lib/themes/generateTemplates";
import { publishAutoImproveEvent } from "@/lib/autoImprove/eventBus";

const CATEGORIES = [...new Set(THEME_TEMPLATES.map((t) => t.category))];

const TemplatesPage = () => {
  const { templates, activeTemplateId, applyTemplate, downloadTemplate } = useThemeTemplates();
  const { variants, hoverLift, isMobile } = useLandingMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  useEffect(() => {
    void publishAutoImproveEvent("template_browse", { action: "gallery_open" });
  }, []);

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

  return (
    <>
      <SEOHead
        meta={{
          title: "UI Templates — 100 ShadowTalk Themes",
          description:
            "Browse 100 animated UI/UX themes for ShadowTalk. Download JSON packs and apply site-wide with one click.",
          keywords: ["ShadowTalk themes", "UI templates", "dark themes", "AI workspace"],
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
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <Badge className="mb-4 gap-1.5 border-primary/30 bg-primary/10">
              <LayoutGrid className="h-3.5 w-3.5" />
              {templates.length} templates
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
              <span className="gradient-text">ShadowTalk</span> UI Library
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Download any theme pack, then hit <strong className="text-foreground">Apply theme</strong> to
              restyle the entire website — colors, density, and motion in one shot.
            </p>
          </motion.div>

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
            transition={{ delay: 0.2 }}
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

          <motion.p
            className="text-center text-xs text-muted-foreground mb-6"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="inline h-3.5 w-3.5 mr-1 text-primary" />
            Adaptive learning may suggest templates based on how you use ShadowTalk
          </motion.p>

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
        </div>
      </div>
    </>
  );
};

export default TemplatesPage;
