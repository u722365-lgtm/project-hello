export interface TauriOllamaModel {
  name: string;
  tag: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface TauriOllamaClient {
  listModels(): Promise<TauriOllamaModel[]>;
  /** Send completion streaming prompt, yielding partial text to the Rust backend. */
  streamCompletion(params: {
    model: string;
    prompt: string;
    context?: number[];
    options?: Record<string, unknown>;
  }): Promise<AsyncIterable<string>>;
  pullModel(name: string): Promise<{ success: boolean; error?: string }>;
}
