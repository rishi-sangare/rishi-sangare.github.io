import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Forward Pass was built",
  description: "How Rishi Sangare's portfolio works: a GPU dot cloud, GPT-2's real tokenizer and attention, a dot portrait from photos, and generated sound.",
};

const rows: [string, string][] = [
  ["The dot cloud", "One three.js Points object with a custom shader. Every dot carries six target positions (your question, its tokens, meaning space, attention, the twelve layers, the portrait) and eases between them with its own small delay, so shapes melt instead of snapping."],
  ["Tokenizer", "GPT-2's real byte-pair encoding (r50k), running in your browser. The ids you see are the ones GPT-2 would use, including for any question you type."],
  ["Attention and layers", "Exported from GPT-2 small (124M) with PyTorch for the preset question: the attention threads use layer 12's real weights for \"?\", and the twelve rings are sized by the real residual-stream norm at each layer."],
  ["The answer line", "Written in the style of a logit lens (reading a model's guess at each layer). The guesses are mine; the evidence under them is real."],
  ["The portrait", "From two photos: the person cut out with a segmentation model, depth estimated with Depth Anything V2, then stippled by brightness and edges so the glasses and curls survive. The photos themselves are not on the site, only the dot positions."],
  ["Motion", "One clock: scroll feeds a single damped progress value, and everything (dots, camera, text, sound) is computed from it, so nothing lags behind anything else. The cursor pushes dots aside along a short trail."],
  ["Sound", "Generated live with the Web Audio API, off until you turn it on: each token's pitch comes from its id, a drone rises a step per layer, scroll speed drives the air, and the answer resolves on a chord."],
  ["Framework and hosting", "Next.js static export on GitHub Pages. No server: everything runs on your device. Reduced-motion settings get the same story without the motion."],
  ["How it was made", "Designed and built with Claude Code as a pair: research, concept sketches, a playable prototype, then the build, with screenshot checks at every step. Every number on the site comes from real git history, reconciliation reports or eval runs."],
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
        The data export script is <code>scripts/export.py</code> in the repo.
      </p>
    </main>
  );
}
