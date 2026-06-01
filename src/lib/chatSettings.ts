import type { AIProvider } from "@/components/chat/ProviderSelector";
// Re-export for settings UI
export type { AIProvider };
import type { ChatMode } from "@/components/chat/ModeSelector";

export const CHAT_PREFERENCES_KEY = "chat_preferences";

export type DefaultPersonality =
  | "friendly"
  | "sarcastic"
  | "professional"
  | "creative"
  | "meticulous"
  | "curious"
  | "diplomatic"
  | "witty"
  | "pragmatic"
  | "inquisitive"
  | "spicy";

export interface ChatPreferences {
  defaultProvider: AIProvider;
  defaultPersonality: DefaultPersonality;
  defaultMode: ChatMode;
}

export const DEFAULT_CHAT_PREFERENCES: ChatPreferences = {
  defaultProvider: "lovable",
  defaultPersonality: "friendly",
  defaultMode: "general",
};

export const PERSONALITY_OPTIONS: { value: DefaultPersonality; label: string; desc: string }[] = [
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "professional", label: "Professional", desc: "Clear and business-like" },
  { value: "creative", label: "Creative", desc: "Imaginative and expressive" },
  { value: "meticulous", label: "Meticulous", desc: "Detailed and precise" },
  { value: "witty", label: "Witty", desc: "Clever with light humor" },
  { value: "pragmatic", label: "Pragmatic", desc: "Direct and practical" },
  { value: "curious", label: "Curious", desc: "Exploratory questions" },
  { value: "sarcastic", label: "Sarcastic", desc: "Dry edge when fitting" },
  { value: "spicy", label: "Spicy", desc: "Bold and unfiltered" },
];
