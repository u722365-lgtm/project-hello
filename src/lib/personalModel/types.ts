export interface PersonalTrainingExample {
  id: string;
  userMessage: string;
  assistantResponse: string;
}

export interface PersonalShadowTalkModel {
  id?: string;
  name: string;
  basePersonality: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  trainingExamples: PersonalTrainingExample[];
  isActive: boolean;
  /** Learn from each chat turn automatically (on-device, private). */
  autoLearnFromChat: boolean;
  syncedToCloud?: boolean;
}

export const DEFAULT_PERSONAL_MODEL_NAME = "My ShadowTalk";

export const DEFAULT_PERSONAL_MODEL: PersonalShadowTalkModel = {
  name: DEFAULT_PERSONAL_MODEL_NAME,
  basePersonality: "helpful",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt:
    "You are my personally trained ShadowTalk AI. You know ShadowTalk deeply, match my tone, and improve from every conversation. Be direct, capable, and finish work — not just chat.",
  trainingExamples: [],
  isActive: true,
  autoLearnFromChat: true,
};
