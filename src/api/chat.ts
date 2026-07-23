// Scaffolding stub — the web build uses @/lib/see/chatCompletion for chat.
export interface ChatApi {
  streamCompletion(params: {
    model: string;
    prompt: string;
    context?: number[];
    options?: Record<string, unknown>;
  }): Promise<AsyncIterable<string>>;
  chatCompletion(params: {
    model: string;
    prompt: string;
    context?: number[];
    options?: Record<string, unknown>;
  }): Promise<{ text: string }>;
}

export async function chat(): Promise<ChatApi> {
  return {
    streamCompletion: async () => {
      throw new Error("Local chat backend not available in this build.");
    },
    chatCompletion: async () => {
      throw new Error("Local chat backend not available in this build.");
    },
  };
}
