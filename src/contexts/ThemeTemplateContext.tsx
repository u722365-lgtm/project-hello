import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { THEME_TEMPLATES, getThemeTemplateById } from "@/lib/themes/generateTemplates";
import {
  applyThemeTemplate,
  clearAppliedTheme,
  getActiveThemeId,
  restoreStoredTheme,
} from "@/lib/themes/applyTheme";
import { downloadThemeTemplate } from "@/lib/themes/downloadTheme";
import type { ThemeTemplate } from "@/lib/themes/types";
import { publishAutoImproveEvent } from "@/lib/autoImprove/eventBus";

type ThemeTemplateContextValue = {
  templates: ThemeTemplate[];
  activeTemplateId: string | null;
  activeTemplate: ThemeTemplate | null;
  applyTemplate: (template: ThemeTemplate) => void;
  downloadTemplate: (template: ThemeTemplate) => void;
  resetTheme: () => void;
};

const ThemeTemplateContext = createContext<ThemeTemplateContextValue | null>(null);

export function ThemeTemplateProvider({ children }: { children: ReactNode }) {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(() => getActiveThemeId());

  useEffect(() => {
    restoreStoredTheme();
    setActiveTemplateId(getActiveThemeId());
  }, []);

  const applyTemplate = useCallback((template: ThemeTemplate) => {
    applyThemeTemplate(template);
    setActiveTemplateId(template.id);
    void publishAutoImproveEvent("theme_apply", { templateId: template.id, category: template.category });
  }, []);

  const downloadTemplate = useCallback((template: ThemeTemplate) => {
    downloadThemeTemplate(template);
    void publishAutoImproveEvent("template_browse", { action: "download", templateId: template.id });
  }, []);

  const resetTheme = useCallback(() => {
    clearAppliedTheme();
    setActiveTemplateId(null);
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      templates: THEME_TEMPLATES,
      activeTemplateId,
      activeTemplate: activeTemplateId ? getThemeTemplateById(activeTemplateId) ?? null : null,
      applyTemplate,
      downloadTemplate,
      resetTheme,
    }),
    [activeTemplateId, applyTemplate, downloadTemplate, resetTheme],
  );

  return <ThemeTemplateContext.Provider value={value}>{children}</ThemeTemplateContext.Provider>;
}

export function useThemeTemplates() {
  const ctx = useContext(ThemeTemplateContext);
  if (!ctx) throw new Error("useThemeTemplates must be used within ThemeTemplateProvider");
  return ctx;
}
