import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../..");

function readSrc(relative: string): string {
  return readFileSync(resolve(root, "src", relative), "utf-8");
}

describe("feature wiring verification", () => {
  it("App.tsx mounts global engines", () => {
    const app = readSrc("App.tsx");
    const required = [
      "UpdateNotificationProvider",
      "NetworkTransitionOverlay",
      "PushIntelligencePanel",
      "SelfHealingErrorBoundary",
      "OfflineBootstrapBanner",
      "VoiceCommandSystem",
      "AutonomousAgentEngine",
      "MissionSchedulerEngine",
      "GoalPursuitEngine",
      'path="/enterprise-license"',
    ];
    for (const token of required) {
      expect(app).toContain(token);
    }
  });

  it("ChatbotPage wires chat modals and dispatch", () => {
    const chat = readSrc("pages/ChatbotPage.tsx");
    const modals = [
      "MultiModelOrchestrator",
      "CreativeSynthesis",
      "VisualReasoning",
      "ImageDecoder",
      "DailyPlanner",
      "IntelligenceHub",
      "KnowledgeVault",
      "BrowseActivityPanel",
      "CognitiveLoopPanel",
      "dispatchDetectionAsync",
      "continueFromCritic",
      "selfHealedFetch",
      "upsertGoalsFromMessage",
      "callChatImageEdit",
      "buildVisionUserMessage",
    ];
    for (const token of modals) {
      expect(chat).toContain(token);
    }
    expect(chat).toContain('case "multi-model"');
    expect(chat).toContain('case "cognitive-loop"');
    expect(chat).toContain('navigate("/enterprise")');
  });

  it("OfflineToolsPanel includes offline sub-panels", () => {
    const panel = readSrc("components/chat/OfflineToolsPanel.tsx");
    expect(panel).toContain("OfflineResearchPanel");
    expect(panel).toContain("OfflineStrategyAgent");
    expect(panel).toContain("OfflineKnowledgeExplorer");
    expect(panel).toContain("OfflineAnalyticsPanel");
    expect(panel).toContain("OfflineDocumentUpload");
  });

  it("stub pages replaced with real components", () => {
    expect(readSrc("pages/PersonalLLMPage.tsx")).toContain("ModelFineTuning");
    expect(readSrc("pages/StrategyLabPage.tsx")).toContain("OfflineStrategyAgent");
    expect(readSrc("pages/PersonalLLMPage.tsx")).not.toContain("OfflineDisabledNotice");
  });

  it("settings exposes autonomous mode toggle", () => {
    const settings = readSrc("components/settings/SettingsSectionPanels.tsx");
    const page = readSrc("pages/SettingsPage.tsx");
    expect(settings).toContain("autonomyEnabled");
    expect(settings).toContain("Enable autonomous mode");
    expect(page).toContain("setAutonomousModeEnabled");
  });

  it("ChatToolbar shows offline indicator", () => {
    expect(readSrc("components/chat/ChatToolbar.tsx")).toContain("OfflineModeIndicator");
  });

  it("missioncontrol route preserves goal via MissionControlPage", () => {
    const app = readSrc("App.tsx");
    expect(app).toContain("MissionControlPage");
    expect(readSrc("pages/MissionControlPage.tsx")).toContain("goal");
  });

  it("settings links sessions and self-healing diagnostics", () => {
    const settings = readSrc("components/settings/SettingsSectionPanels.tsx");
    expect(settings).toContain('href: "/sessions"');
    expect(settings).toContain('href: "/self-healing"');
  });

  it("Shadow Heal Engine mounted for 24/7 healing", () => {
    const app = readSrc("App.tsx");
    expect(app).toContain("ShadowHealEngine");
    expect(readSrc("components/shadowHeal/ShadowHealEngine.tsx")).toContain("startShadowHealEngine");
  });

  it("hub pages wire insert-to-chat and script run", () => {
    expect(readSrc("pages/ResearchHubPage.tsx")).toContain("queueChatInsert");
    expect(readSrc("pages/ResearchHubPage.tsx")).toContain("onInsertToChat={handleInsertToChat}");
    expect(readSrc("pages/WorkspaceHubPage.tsx")).toContain("onRunScript={handleRunScript}");
    expect(readSrc("pages/ChatbotPage.tsx")).toContain("consumePendingChatInsert");
  });

  it("command routes include computer mode", () => {
    expect(readSrc("lib/chatCommandRoutes.ts")).toContain('computer: "/computer"');
  });

  it("ShadowSpectre model wired in chat, cyber command, and edge config", () => {
    const chat = readSrc("pages/ChatbotPage.tsx");
    expect(chat).toContain('chatMode === "shadowspectre"');
    expect(chat).toContain("streamShadowSpectre");
    expect(chat).toContain("ShadowSpectreScopeBar");
    expect(chat).toContain('case "shadowspectre"');

    expect(readSrc("components/chat/ModeSelector.tsx")).toContain('"shadowspectre"');
    expect(readSrc("components/cyber/CyberAICopilot.tsx")).toContain("streamShadowSpectre");
    expect(readSrc("lib/privacy/cloudEgressGuard.ts")).toContain("/functions/v1/shadowspectre");
    expect(readSrc("components/chat/CommandPalette.tsx")).toContain("shadowspectre");

    const config = readFileSync(resolve(root, "supabase/config.toml"), "utf-8");
    expect(config).toContain("[functions.shadowspectre]");
    expect(readFileSync(resolve(root, "supabase/functions/shadowspectre/index.ts"), "utf-8")).toContain(
      "buildShadowSpectreSystemPrompt",
    );
  });

  it("ShadowScale growth engine and admin Growth Command wired", () => {
    expect(readSrc("App.tsx")).toContain("ShadowScaleEngine");
    expect(readSrc("App.tsx")).toContain("ShadowScaleGrowthBanner");
    expect(readSrc("components/shadowScale/ShadowScaleEngine.tsx")).toContain("startShadowScaleEngine");
    expect(readSrc("components/admin/GrowthCommandPanel.tsx")).toContain("Growth Command");
    expect(readSrc("components/admin/GrowthCommandPanel.tsx")).toContain("run_worker_only");
    expect(readSrc("components/admin/adminNav.ts")).toContain("growth-command");
    expect(readSrc("App.tsx")).toContain("AnnouncementBanner");
  });

  it("AEO corpus wired for SEO and answer engines", () => {
    const app = readSrc("App.tsx");
    expect(app).toContain('path="/answers"');
    expect(app).toContain("AnswersPage");
    expect(readSrc("lib/seo.ts")).toContain("https://www.shadowtalk-ai.com/answers");
    expect(readSrc("pages/FAQPage.tsx")).toContain("AEO_ANSWER_CORPUS");
    expect(readSrc("lib/aeo/answerCorpus.ts")).toContain("AEO_ANSWER_CORPUS");

    const llms = readFileSync(resolve(root, "public/llms.txt"), "utf-8");
    expect(llms).toContain("aeo-answers.html");

    const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf-8");
    expect(sitemap).toContain("/answers");
    expect(sitemap).toContain("/aeo-answers.html");
  });

  it("Zain Ahmed founder entity wired for name-search SEO", () => {
    const app = readSrc("App.tsx");
    expect(app).toContain('path="/zain-ahmed"');
    expect(app).toContain("ZainAhmedPage");
    expect(readSrc("lib/seo.ts")).toContain("zainAhmed");
    expect(readSrc("lib/founderIdentity.ts")).toContain("zain-ahmed.html");

    const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf-8");
    expect(sitemap).toContain("/zain-ahmed.html");
    expect(sitemap).toContain('priority>1.0</priority>');

    const llms = readFileSync(resolve(root, "public/llms.txt"), "utf-8");
    expect(llms).toContain("zain-ahmed.html");
  });
});
