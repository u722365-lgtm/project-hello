type EmbedFn = (text: string, opts?: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array | number[] }>;

let pipelinePromise: Promise<EmbedFn | null> | null = null;

async function getEmbedPipeline(): Promise<EmbedFn | null> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      const device = typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
      try {
        return (await pipeline("feature-extraction", "mixedbread-ai/mxbai-embed-xsmall-v1", {
          device,
        })) as unknown as EmbedFn;
      } catch {
        return (await pipeline("feature-extraction", "mixedbread-ai/mxbai-embed-xsmall-v1", {
          device: "wasm",
        })) as unknown as EmbedFn;
      }
    })();
  }
  return pipelinePromise;
}

export async function embedText(text: string): Promise<number[]> {
  const pipe = await getEmbedPipeline();
  if (!pipe) throw new Error("Embedding pipeline unavailable");
  const out = await pipe(text.slice(0, 2000), { pooling: "mean", normalize: true });
  const data = out.data;
  return Array.from(data instanceof Float32Array ? data : (data as number[]));
}
