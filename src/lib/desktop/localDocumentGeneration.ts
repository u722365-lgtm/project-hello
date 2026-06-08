import {
  getKimiDocumentSystemPrompt,
  KIMI_DOCUMENT_TYPES,
  type KimiDocumentType,
  type KimiLengthType,
  type KimiToneType,
} from "@/lib/kimiDocumentGeneration";
import { polishProfessionalMarkdown } from "@/lib/professionalDocument";
import { streamLocalAgentCompletion } from "@/lib/desktop/localAgentCompletion";
import { retrieveSovereignMemoryContext } from "@/lib/desktop/sovereignMemoryRag";

export async function streamLocalKimiDocument(options: {
  topic: string;
  docType: KimiDocumentType;
  tone: KimiToneType;
  length: KimiLengthType;
  additionalContext?: string;
  onChunk: (content: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { topic, docType, tone, length, additionalContext, onChunk, signal } = options;
  const label = KIMI_DOCUMENT_TYPES.find((d) => d.type === docType)?.label ?? "Document";
  const memory = await retrieveSovereignMemoryContext(topic);
  const userPrompt = `Produce a publication-ready ${label} for executive review.

Topic: ${topic}
${additionalContext ? `\nRequirements:\n${additionalContext}` : ""}
${memory ? `\n${memory}` : ""}

The output must be clean Markdown only — suitable for immediate export to Word or PDF.`;

  let content = "";
  await streamLocalAgentCompletion(userPrompt, {
    systemPrompt: getKimiDocumentSystemPrompt(docType, tone, length),
    signal,
    onToken: (token) => {
      content += token;
      onChunk(content);
    },
  });

  const polished = polishProfessionalMarkdown(content, { tone });
  onChunk(polished);
  return polished;
}

export async function fetchLocalDocumentResearch(
  query: string,
  options?: { signal?: AbortSignal; onChunk?: (text: string) => void },
): Promise<string> {
  const memory = await retrieveSovereignMemoryContext(query);
  const brief = await streamLocalAgentCompletion(
    `Create a research brief for: ${query}\n\nUse local memory below when relevant. Mark inferences clearly.\n\n${memory || "No local memory indexed yet."}`,
    { signal: options?.signal, onToken: options?.onChunk },
  );
  return brief;
}
