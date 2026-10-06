// In-browser models, lazy-loaded after first paint.
// GPT-2 tokenizer (real BPE ids) + all-MiniLM-L6-v2 embeddings (same model the document
// vectors were built with in Python), running on WebGPU when available, WASM otherwise.
import { emit, state } from "./store";
import emb from "@/data/embeddings.json";

type Tok = { encode: (s: string) => number[]; decode: (ids: number[]) => string };
let tokP: Promise<Tok> | null = null;
let embP: Promise<(s: string) => Promise<Float32Array>> | null = null;

async function lib() {
  const t = await import("@huggingface/transformers");
  t.env.allowLocalModels = false;
  return t;
}

export function loadTokenizer() {
  tokP ??= (async () => {
    const { AutoTokenizer } = await lib();
    const tk = await AutoTokenizer.from_pretrained("Xenova/gpt2");
    return {
      encode: (s: string) => tk.encode(s, { add_special_tokens: false }) as number[],
      decode: (ids: number[]) => tk.decode(ids),
    };
  })();
  return tokP;
}

export function loadEmbedder() {
  embP ??= (async () => {
    const { pipeline } = await lib();
    const hasGPU = typeof navigator !== "undefined" && "gpu" in navigator;
    let device: "webgpu" | "wasm" = hasGPU ? "webgpu" : "wasm";
    let fx;
    try {
      fx = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { device, dtype: "q8" });
    } catch {
      device = "wasm";
      fx = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { device, dtype: "q8" });
    }
    state.stats.backend = device;
    return async (s: string) => {
      const out = await fx(s, { pooling: "mean", normalize: true });
      return out.data as Float32Array;
    };
  })();
  return embP;
}

const docs = emb.docs as { group: string; text: string; pos: number[]; vec: number[] }[];

/** Tokenize + embed the visitor's prompt and write results into the shared state. */
export async function runPrompt(prompt: string) {
  state.prompt = prompt;
  try {
    const tk = await loadTokenizer();
    const t0 = performance.now();
    const ids = tk.encode(prompt);
    state.tokens = ids.map((id) => ({ id, text: tk.decode([id]) }));
    state.stats.tokenizeMs = performance.now() - t0;
    emit();

    const embed = await loadEmbedder();
    const t1 = performance.now();
    const q = await embed(prompt);
    state.stats.embedMs = performance.now() - t1;
    state.sims = docs.map((d) => d.vec.reduce((a, v, i) => a + v * q[i], 0));
    // project the query into the same PCA space the documents live in
    const mean = emb.mean as number[], comps = emb.components as number[][], scale = emb.scale as number;
    const c = Array.from(q, (v, i) => v - mean[i]);
    state.queryPos = comps.map((w) => w.reduce((a, v, i) => a + v * c[i], 0) / scale) as [number, number, number];
    emit();
  } catch (e) {
    console.warn("[forward-pass] in-browser model unavailable, using precomputed data", e);
    state.stats.backend = "precomputed";
    emit();
  }
}

export { docs };
