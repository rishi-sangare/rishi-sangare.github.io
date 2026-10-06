"use client";
import { useState } from "react";
import { person, skills } from "@/data/content";
import { useStore } from "@/lib/useStore";

export function Eos() {
  const stats = useStore((s) => ({ ...s.stats }));
  const tokens = useStore((s) => s.tokens.length);
  const [copied, setCopied] = useState(false);
  const backend = stats.backend === "webgpu" ? "your GPU (WebGPU)" : stats.backend === "wasm" ? "your CPU (WASM)" : "precomputed data";

  const copy = async () => {
    try { await navigator.clipboard.writeText(person.email); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { window.location.href = `mailto:${person.email}`; }
  };

  return (
    <section id="eos" className="relative flex min-h-[100svh] items-center px-[var(--gutter)] py-28">
      <div className="max-w-[900px]">
        <p className="eyebrow">07 · &lt;eos&gt;</p>
        <h2 className="font-display mt-4 text-[clamp(44px,8vw,112px)] font-bold leading-[0.9] tracking-[-0.045em]">
          Generation<br />complete<span className="text-[var(--amber)]">.</span>
        </h2>
        <p className="mt-6 font-mono text-[13px] text-[var(--text-2)]">
          1 candidate · {person.location}
          <br />
          this visit: {tokens} tokens · tokenized in {stats.tokenizeMs < 0.1 ? "<0.1" : stats.tokenizeMs.toFixed(1)} ms · embedded in {stats.embedMs.toFixed(0)} ms on {backend}
        </p>
        <p className="mt-8 max-w-[56ch] text-[18px] leading-relaxed text-[var(--text-2)]">
          I&apos;m looking for a full-time remote role building LLM products: retrieval, evals, agents, and the reliability work in between. I&apos;m in Mumbai and already work US hours.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <button type="button" onClick={copy} className="chip primary !px-5 !py-3 !text-[14px]">{copied ? "Copied ✓" : person.email}</button>
          <a className="chip !px-5 !py-3 !text-[14px]" href="/cv/">CV (one page)</a>
          <a className="chip !px-5 !py-3 !text-[14px]" href={person.github} target="_blank" rel="noreferrer">GitHub</a>
          <a className="chip !px-5 !py-3 !text-[14px]" href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="chip !px-5 !py-3 !text-[14px]" href={person.caseStudies} target="_blank" rel="noreferrer">Case studies</a>
        </div>
        <div className="mt-12 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[12px] text-[var(--text-3)]">
          {skills.map((s) => <span key={s}>{s}</span>)}
        </div>
        <p className="mt-10 font-mono text-[12px] text-[var(--text-3)]">
          <a className="text-[var(--amber)]" href="/colophon/">How this site was built →</a>
          <span className="mx-3">·</span> 3D layout inspired by Brendan Bycroft&apos;s LLM visualization (MIT)
        </p>
      </div>
    </section>
  );
}
