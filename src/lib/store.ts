// Mutable, frame-safe state shared by the DOM (GSAP/ScrollTrigger) and the R3F scene.
// Scroll writes here; useFrame reads here. React state is only used for low-frequency UI.

export const SCENES = ["prompt", "tokenize", "embed", "attend", "layers", "sample", "decode", "eos"] as const;
export type SceneId = (typeof SCENES)[number];

type Listener = () => void;

export const state = {
  /** 0..SCENES.length-1, fractional: which scene the viewport is in */
  scroll: 0,
  /** per-scene local progress 0..1 */
  local: Object.fromEntries(SCENES.map((s) => [s, 0])) as Record<SceneId, number>,
  pointer: { x: 0, y: 0 },
  prompt: "Who is Rishi Sangare?",
  tokens: [] as { id: number; text: string }[],
  /** cosine similarity of the visitor's prompt to each document (null until computed) */
  sims: null as number[] | null,
  /** the visitor's prompt projected into the documents' 3D PCA space */
  queryPos: null as [number, number, number] | null,
  attention: { layer: 4, head: 11 },
  temperature: 1,
  quality: 2 as 0 | 1 | 2, // 0 = no canvas, 1 = reduced, 2 = full
  stats: { tokenizeMs: 0, embedMs: 0, backend: "" as "" | "webgpu" | "wasm" | "precomputed" },
};

const listeners = new Set<Listener>();
export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function emit() {
  listeners.forEach((fn) => fn());
}
