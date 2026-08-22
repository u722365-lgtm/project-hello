
import { buildWorkspacePrompt } from "@/lib/jules/buildWorkspacePrompt";
import type { JulesWorkspaceFile } from "@/lib/jules/types";
import { DEVICE_ONLY_BLOCKED_MESSAGE } from "@/lib/privacy/deviceOnlyPledge";

export async function runLocalIdeAssist(
  instruction: string,
  files: JulesWorkspaceFile[],
  activeFileName?: string,
  isCodeAction = true,
): Promise<string> {
    throw new Error(`${DEVICE_ONLY_BLOCKED_MESSAGE} Open Settings → Offline AI to download a model.`);

  const systemPrompt = isCodeAction
    ? "You are a code assistant inside an offline IDE. Respond ONLY with updated code. No markdown fences, no explanations."
    : "You are a code assistant. Provide a clear, helpful explanation.";

  const userContent =
    files.length > 1
      ? buildWorkspacePrompt(instruction, files, activeFileName)
      : `${instruction}\n\n${files[0]?.content ?? ""}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userContent },
  ];

  const { content } = await null;
  return content.trim();
}
