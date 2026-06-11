import { decideRoute } from "./router.js";
import { streamOllamaChat, type ChatMessage } from "./ollama.js";
import { streamCloudChat } from "./cloudChat.js";
import { DEVICE_ONLY_MESSAGE } from "./pledge.js";

export type CompletionOptions = {
  messages: ChatMessage[];
  stream?: boolean;
  allowCloud?: boolean;
  personality?: string;
  mode?: string;
  onToken?: (token: string) => void;
};

export async function runCompletion(opts: CompletionOptions): Promise<string> {
  const { messages, stream = true, onToken } = opts;
  const route = await decideRoute(messages);

  const write = (token: string) => {
    if (stream && onToken) onToken(token);
  };

  if (route.target === "local" && route.backend === "ollama") {
    const result = await streamOllamaChat(messages, write);
    if (!result.ok) throw new Error(result.error ?? "Ollama failed");
    if (!stream) process.stdout.write(result.content);
    return result.content;
  }

  if (route.target === "local" && route.backend === "none") {
    throw new Error(`${DEVICE_ONLY_MESSAGE}\n${route.reason}`);
  }

  if (opts.allowCloud === false) {
    throw new Error(DEVICE_ONLY_MESSAGE);
  }

  const cloud = await streamCloudChat(messages, write, {
    personality: opts.personality,
    mode: opts.mode,
  });
  if (!cloud.ok) throw new Error(cloud.error ?? "Cloud chat failed");
  if (!stream) process.stdout.write(cloud.content);
  return cloud.content;
}
