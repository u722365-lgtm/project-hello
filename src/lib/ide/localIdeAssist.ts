import { buildWorkspacePrompt } from "@/lib/jules/buildWorkspacePrompt";
import type { JulesWorkspaceFile } from "@/lib/jules/types";

export async function runLocalIdeAssist(
  instruction: string,
  files: JulesWorkspaceFile[],
  activeFileName?: string,
  isCodeAction = true,
): Promise<string> {
  const systemPrompt = isCodeAction
    ? "You are a code assistant inside an IDE. Respond ONLY with updated code. No markdown fences, no explanations."
    : "You are a code assistant. Provide a clear, helpful explanation.";

  const userContent =
    files.length > 1
      ? buildWorkspacePrompt(instruction, files, activeFileName)
      : `${instruction}\n\n${files[0]?.content ?? ""}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userContent },
  ];

  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || "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";
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    throw new Error(`IDE Assist failed: ${res.statusText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}
