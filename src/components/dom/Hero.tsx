"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { person } from "@/data/content";
import { runPrompt } from "@/lib/model";
import { emit, state } from "@/lib/store";
import { useStore } from "@/lib/useStore";
import gpt2 from "@/data/gpt2.json";

gsap.registerPlugin(SplitText, useGSAP);
const PRESETS = gpt2.prompts.map((p) => p.prompt);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [value, setValue] = useState(state.prompt);
  const tokens = useStore((s) => s.tokens);
  const stats = useStore((s) => ({ ...s.stats }));
  const debounce = useRef<number | undefined>(undefined);

  useGSAP(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const split = SplitText.create(".hero-name", { type: "chars", mask: "chars" });
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(split.chars, { yPercent: 110, duration: 1.2, stagger: 0.035 }, 0.15)
      .from(".hero-fade", { autoAlpha: 0, y: 18, duration: 1, stagger: 0.08 }, 0.6);
  }, { scope: root });

  const submit = (v: string) => {
    const p = v.trim() || PRESETS[0];
    setValue(p);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => { runPrompt(p).then(emit); }, 220);
  };

  useEffect(() => () => window.clearTimeout(debounce.current), []);

  const backend = stats.backend === "webgpu" ? "WebGPU" : stats.backend === "wasm" ? "WASM (CPU)" : stats.backend === "precomputed" ? "precomputed" : "loading…";

  return (
    <section id="prompt" ref={root} className="relative flex min-h-[100svh] flex-col justify-end px-[var(--gutter)] pb-[12vh] pt-32">
      <div className="max-w-[880px]">
        <p className="eyebrow hero-fade mb-6">00 · prompt · a forward pass through my work</p>
        <h1 className="hero-name font-display text-[clamp(52px,11vw,148px)] font-bold leading-[1.06] tracking-[-0.045em] -mb-[0.12em]">
          Rishi Sangare
        </h1>
        <p className="hero-fade mt-6 max-w-[56ch] text-[clamp(17px,1.6vw,21px)] leading-relaxed text-[var(--text-2)]">
          <span className="text-[var(--text)]">{person.role}.</span> {person.line}
        </p>

        <form className="hero-fade glass mt-9 flex max-w-[640px] items-center gap-3 rounded-2xl p-2 pl-5" onSubmit={(e) => { e.preventDefault(); submit(value); }}>
          <span className="font-mono text-[var(--amber)]" aria-hidden>›</span>
          <label htmlFor="prompt-input" className="sr-only">Ask the model about Rishi</label>
          <input id="prompt-input" value={value} onChange={(e) => { setValue(e.target.value); submit(e.target.value); }}
            className="min-w-0 flex-1 bg-transparent font-mono text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
            placeholder="Ask anything about Rishi" maxLength={120} spellCheck={false} />
          <a href="#tokenize" className="chip primary">Run ↓</a>
        </form>
        <div className="hero-fade mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => submit(p)} aria-pressed={value === p}>{p}</button>
          ))}
        </div>

        <div className="hero-fade mt-7" aria-live="polite">
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((t, i) => (
              <span key={`${t.id}-${i}`} className="token-chip text-[13px]">{t.text.replace(/\n/g, "↵") || "·"}<small>{t.id}</small></span>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11.5px] text-[var(--text-3)]">
            {tokens.length ? `${tokens.length} tokens · GPT-2 BPE tokenizer running in your browser · ${stats.tokenizeMs < 0.1 ? "<0.1" : stats.tokenizeMs.toFixed(1)} ms · embeddings: ${backend}` : "loading the tokenizer in your browser…"}
          </p>
        </div>
      </div>
      <a href="#tokenize" className="hero-fade absolute bottom-6 right-[var(--gutter)] hidden font-mono text-xs text-[var(--text-3)] no-underline md:block">scroll to run the forward pass ↓</a>
    </section>
  );
}
