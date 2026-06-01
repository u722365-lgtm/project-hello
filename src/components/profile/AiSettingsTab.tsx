import { ChatAIPreferencesCard } from "./ChatAIPreferencesCard";
import { CustomInstructionsProfileCard } from "./CustomInstructionsProfileCard";
import { OfflineAISettings } from "./OfflineAISettings";
import { ShadowTalkModelPanel } from "./ShadowTalkModelPanel";

import { SettingsStagger } from "@/components/settings/SettingsStagger";

export function AiSettingsTab() {
  return (
    <SettingsStagger className="space-y-6">
      <ChatAIPreferencesCard />
      <CustomInstructionsProfileCard />
      <OfflineAISettings />
      <ShadowTalkModelPanel />
    </SettingsStagger>
  );
}
