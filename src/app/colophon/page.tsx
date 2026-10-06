import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Forward Pass was built",
  description: "The engineering behind rishi-sangare's portfolio: real GPT-2 attention, in-browser embeddings, React Three Fiber and GSAP.",
};

const rows: [string, string][] = [
  ["Tokenizer", "GPT-2 BPE via Transformers.js, running in your browser. The ids you see on the first screen are real."],
  ["Embeddings", "all-MiniLM-L6-v2 (q8), WebGPU with a WASM fallback. Your question is embedded live and projected into the same 3D PCA basis as my project write-ups, which were embedded in Python with the same model."],
  ["Attention, residual norms, logits", "Exported from GPT-2 small (124M) with PyTorch + Hugging Face for four preset prompts: 12 layers × 12 heads of real attention, residual-stream norms per layer, and the top-40 next-token logits. Temperature is applied live in the browser."],
  ["253,541 particles", "One point per migrated activity record, animated in a custom vertex shader (one per four records on phones)."],
  ["3D", "three.js r186, React Three Fiber 9, drei (instancing, troika text, MeshTransmissionMaterial for the glass lens), postprocessing (bloom, grain, vignette)."],
  ["Motion", "GSAP 3.15 (SplitText, ScrollTrigger) with Lenis smooth scroll on native scrolling. Scroll writes to a shared mutable store; the render loop reads it, so React never re-renders per frame."],
  ["Performance", "GPU tiering with detect-gpu, drei PerformanceMonitor + AdaptiveDpr, capped DPR, scenes hidden when off-screen, models loaded after first paint. Reduced-motion and weak GPUs get the same story without WebGL."],
  ["Framework & hosting", "Next.js 16 static export. No server: everything you see runs on your device."],
  ["How it was made", "Designed and built with Claude Code as a pair: research across skills/MCPs/award sites, a written plan, then scene-by-scene build with screenshot-and-critique loops. Every number on the site comes from real git history, reconciliation reports or eval runs."],
  ["Credits", "3D LLM layout inspired by Brendan Bycroft's LLM Visualization (MIT). Interaction ideas from Georgia Tech's Transformer Explainer."],
];

export default function Colophon() {
  return (
    <main className="mx-auto max-w-[820px] px-[var(--gutter)] py-14">
      <a href="/" className="font-mono text-[12px] text-[var(--amber)] no-underline">← back to the forward pass</a>
      <h1 className="font-display mt-8 text-[44px] font-bold leading-none tracking-[-0.03em]">How this was built</h1>
      <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-[var(--text-2)]">
        Nothing on the main page is a video or a canned animation. Here&apos;s what is actually running.
      </p>
      <dl className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr]">
            <dt className="font-mono text-[12.5px] uppercase tracking-[0.12em] text-[var(--amber)]">{k}</dt>
            <dd className="text-[15.5px] leading-relaxed text-[var(--text-2)]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 font-mono text-[12.5px] text-[var(--text-3)]">
        Data export script: <code>scripts/export.py</code> in the repo.
      </p>
    </main>
  );
}
