import type { PersonalShadowTalkModel } from "./types";

const MAX_FEW_SHOT = 8;

/**
 * Build the personal-model system block injected at inference (cloud + offline).
 * This is prompt-level personal training — your examples + persona, applied every reply.
 */
export function buildPersonalModelSystemBlock(
  model: PersonalShadowTalkModel,
  userQuery?: string,
): string {
  const parts: string[] = [
    `# Personally trained ShadowTalk model: "${model.name}"`,
    model.systemPrompt.trim(),
    `Personality baseline: ${model.basePersonality}.`,
    "You are not a generic assistant — you are this user's trained ShadowTalk instance.",
  ];

  const examples = pickRelevantExamples(model, userQuery, MAX_FEW_SHOT);
  if (examples.length > 0) {
    parts.push(
      "## Your training examples (match tone, structure, and depth):\n" +
        examples
          .map(
            (ex, i) =>
              `### Example ${i + 1}\nUser: ${ex.userMessage}\nAssistant: ${ex.assistantResponse}`,
          )
          .join("\n\n"),
    );
  }

  parts.push(
    "When answering, prefer patterns from the examples above. Stay accurate about ShadowTalk product facts.",
  );

  return parts.join("\n\n");
}

function pickRelevantExamples(
  model: PersonalShadowTalkModel,
  userQuery: string | undefined,
  max: number,
) {
  const all = model.trainingExamples;
  if (all.length === 0) return [];
  if (!userQuery?.trim()) return all.slice(-max);

  const q = userQuery.toLowerCase();
  const qWords = q.split(/\s+/).filter((w) => w.length > 3);

  const scored = all.map((ex) => {
    const hay = `${ex.userMessage} ${ex.assistantResponse}`.toLowerCase();
    let score = 0;
    for (const w of qWords) {
      if (hay.includes(w)) score += 1;
    }
    return { ex, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, max);
  if (top.length > 0) return top.map((s) => s.ex);
  return all.slice(-max);
}

export function prependPersonalModelToMessages<T extends { role: string; content: unknown }>(
  messages: T[],
  model: PersonalShadowTalkModel | null,
  userQuery?: string,
): T[] {
  if (!model) return messages;

  const block = buildPersonalModelSystemBlock(model, userQuery);
  const withoutPersonal = messages.filter(
    (m) =>
      m.role !== "system" ||
      (typeof m.content === "string" && !m.content.includes("Personally trained ShadowTalk model")),
  );

  return [
    { role: "system", content: block } as unknown as T,
    ...withoutPersonal,
  ];
}
