/**
 * Runs chat completion on-device when cloud is unavailable or routing chooses local.
 */

import { decideRoute, type RouterMessage } from "@/lib/offline/hybridRouter";
import { getGemmaEngine } from "@/lib/offline/gemmaEngine";
import { getQuickOfflineEngine } from "@/lib/offline/quickOfflineModels";
import { getActiveQuickModelId, isForceOfflineSessionActive } from "@/lib/offline/forceOfflineSession";
import { canUseCloudAI } from "@/lib/privacy/deviceOnlyPledge";
import { isAnyLocalModelReady, runLocalChat } from "@/lib/offline/localChat";
import { shouldPreferOllamaInference } from "@/lib/desktop/sovereignMode";
import { chat as ollamaChat } from "@/lib/ollama/unifiedClient";

export type OfflineCompletionSource = "local-ollama" | "local-gemma" | "local-webllm" | "local-smollm" | "fallback";

export type OfflineCompletionResult = {
  content: string;
  source: OfflineCompletionSource;
};

const PERSONALITY_HINT: Record<string, string> = {
  friendly: "Warm, approachable tone.",
  professional: "Clear, formal, business-appropriate tone.",
  creative: "Imaginative, vivid language.",
  sarcastic: "Witty with light sarcasm.",
  meticulous: "Precise, thorough, detail-oriented.",
};

function withSystemPrompt(messages: RouterMessage[], personality: string): RouterMessage[] {
  const hint = PERSONALITY_HINT[personality] ?? "Helpful assistant tone.";
  const system: RouterMessage = {
    role: "system",
    content: `You are ShadowTalk AI running fully on the user's device (offline). ${hint} Be concise, accurate, and use markdown when helpful.`,
  };
  const hasSystem = messages.some((m) => m.role === "system");
  return hasSystem ? messages : [system, ...messages];
}

/** Basic canned responses when no local LLM is loaded. */
export function getBasicOfflineFallback(prompt: string): string {
  const normalized = prompt.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings|bro|yo|sup)/i.test(normalized)) {
    return (
      "Hi! Your on-device model is still downloading. " +
      "Go to **Profile → AI → Quick offline models** to download SmolLM Nano (~130 MB), then tap **Configure**."
    );
  }
  if (/help|what can you do/i.test(normalized)) {
    return (
      "Offline mode:\n\n" +
      "• **With a downloaded model** — full local AI chat (private, no internet)\n" +
      "• **Without a model** — cached chats, simple math, time/date\n\n" +
      "Go to **Profile → AI** to download a quick model or Gemma while online."
    );
  }
  if (/\b(what time|current time)\b/i.test(normalized)) {
    return `The current time is: **${new Date().toLocaleTimeString()}**`;
  }
  if (/\b(what date|today|what day)\b/i.test(normalized)) {
    return `Today is: **${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}**`;
  }

  const mathMatch = normalized.match(/(\d+)\s*([+\-*/×÷])\s*(\d+)/);
  if (mathMatch) {
    const [, a, op, b] = mathMatch;
    const n1 = parseFloat(a);
    const n2 = parseFloat(b);
    let result: number;
    switch (op) {
      case "+":
        result = n1 + n2;
        break;
      case "-":
        result = n1 - n2;
        break;
      case "*":
      case "×":
        result = n1 * n2;
        break;
      case "/":
      case "÷":
        result = n2 !== 0 ? n1 / n2 : NaN;
        break;
      default:
        result = NaN;
    }
    if (!isNaN(result)) return `**${n1} ${op} ${n2} = ${result}**`;
  }

  return (
    "Your on-device model is not loaded yet. " +
    "Open **Profile → AI**, download a quick offline model, then tap **Configure** for fully private chat."
  );
}

export type RunOfflineCompletionOptions = {
  messages: RouterMessage[];
  personality: string;
  isOnline: boolean;
  onToken?: (token: string) => void;
};

async function ensureQuickModelLoaded(): Promise<boolean> {
  const quickId = getActiveQuickModelId();
  if (!quickId) return false;
  const engine = getQuickOfflineEngine();
  if (engine.isModelReady(quickId)) return true;
  if (!(await engine.isCached(quickId))) return false;
  return engine.download(quickId);
}

/**
 * Attempt on-device completion. Returns null if caller should use cloud API.
 */
export async function runOfflineCompletion(
  options: RunOfflineCompletionOptions,
): Promise<OfflineCompletionResult | null> {
  const { messages, personality, isOnline, onToken } = options;

  const decision = decideRoute(messages, isOnline);
  const formatted = withSystemPrompt(messages, personality);

  const tryOllama = async (): Promise<OfflineCompletionResult | null> => {
    if (!shouldPreferOllamaInference()) return null;
    try {
      const res = await ollamaChat(formatted, { onToken });
      if (res.ok && res.content) return { content: res.content, source: "local-ollama" };
    } catch (e) {
      console.warn("[OfflineCompletion] Ollama failed:", e);
    }
    return null;
  };

  const tryUnifiedLocal = async (): Promise<OfflineCompletionResult | null> => {
    const ollama = await tryOllama();
    if (ollama) return ollama;

    if (!isAnyLocalModelReady() && isForceOfflineSessionActive()) {
      await ensureQuickModelLoaded();
    }
    if (!isAnyLocalModelReady()) return null;
    try {
      const { content, tier } = await runLocalChat(formatted, onToken);
      const source: OfflineCompletionSource =
        tier === "gemma" ? "local-gemma" : "local-smollm";
      return { content, source };
    } catch (e) {
      console.warn("[OfflineCompletion] runLocalChat failed:", e);
      return null;
    }
  };

  const tryGemmaDirect = async (): Promise<OfflineCompletionResult | null> => {
    const engine = getGemmaEngine();
    if (!engine.isReady) return null;
    try {
      const content = await engine.chat(formatted, { onToken });
      return { content, source: "local-gemma" };
    } catch (e) {
      console.warn("[OfflineCompletion] Gemma failed:", e);
      return null;
    }
  };

  if (decision.target === "local") {
    const local = await tryUnifiedLocal();
    if (local) return local;
    const gemma = await tryGemmaDirect();
    if (gemma) return gemma;
    const lastUser = messages.filter((m) => m.role === "user").pop()?.content ?? "";
    if (canUseCloudAI() && isOnline && !isForceOfflineSessionActive()) return null;
    return { content: getBasicOfflineFallback(lastUser), source: "fallback" };
  }

  if (!isOnline) {
    const local = await tryUnifiedLocal();
    if (local) return local;
    const gemma = await tryGemmaDirect();
    if (gemma) return gemma;
    const lastUser = messages.filter((m) => m.role === "user").pop()?.content ?? "";
    return { content: getBasicOfflineFallback(lastUser), source: "fallback" };
  }

  return null;
}
