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

  it("ShadowScale growth engine and admin Growth Command wired", () => {
    expect(readSrc("App.tsx")).toContain("ShadowScaleEngine");
    expect(readSrc("App.tsx")).toContain("ShadowScaleGrowthBanner");
    expect(readSrc("components/shadowScale/ShadowScaleEngine.tsx")).toContain("startShadowScaleEngine");
    expect(readSrc("components/admin/GrowthCommandPanel.tsx")).toContain("Growth Command");
    expect(readSrc("components/admin/GrowthCommandPanel.tsx")).toContain("run_worker_only");
    expect(readSrc("components/admin/adminNav.ts")).toContain("growth-command");
    expect(readSrc("App.tsx")).toContain("AnnouncementBanner");
  });
});
