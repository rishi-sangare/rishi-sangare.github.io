/** Softmax over GPT-2's real top-40 logits at a given temperature. */
export function probs(logits: number[], temperature: number) {
  const t = Math.max(0.05, temperature);
  const m = Math.max(...logits);
  const e = logits.map((l) => Math.exp((l - m) / t));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
