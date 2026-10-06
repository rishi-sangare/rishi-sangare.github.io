"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { emit, state } from "@/lib/store";
import { useStore } from "@/lib/useStore";
import { probs } from "@/lib/sampling";
import { docs } from "@/lib/model";
import gpt2 from "@/data/gpt2.json";

const RECORDS = 253_541;

/** rAF-driven text: reads the shared state every frame without React re-renders. */
function useTicker(fn: () => void) {
  useEffect(() => {
    let raf = 0;
    const loop = () => { fn(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fn]);
}

function MigrationCounter() {
  const n = useRef<HTMLSpanElement>(null), bar = useRef<HTMLDivElement>(null), ghost = useRef<HTMLSpanElement>(null);
  const fn = useMemo(() => () => {
    const p = Math.min(1, Math.max(0, (state.local.tokenize - 0.12) / 0.7));
    if (n.current) n.current.textContent = Math.round(p * RECORDS).toLocaleString("en-US");
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    if (ghost.current) {
      const g = p > 0.42 && p < 0.68;
      ghost.current.textContent = g ? "ghost rows detected · loading sequentially" : p >= 0.68 ? "ghost rows fixed · 0 missing" : "missing: 0";
      ghost.current.style.color = g ? "var(--rose)" : "var(--mint)";
    }
  }, []);
  useTicker(fn);
  return (
    <div className="reveal mt-5 rounded-xl border border-[var(--line)] bg-[#0d1020] p-4 font-mono text-[12.5px]">
      <div className="flex justify-between text-[var(--text-2)]"><span>migrated</span><span className="tabular"><span ref={n} className="text-[var(--amber)]">0</span> / 253,541</span></div>
      <div className="mt-2 h-1 overflow-hidden rounded bg-[var(--line)]"><div ref={bar} className="h-full origin-left bg-[var(--amber)]" style={{ transform: "scaleX(0)" }} /></div>
      <span ref={ghost} className="mt-2 block text-[var(--mint)]">missing: 0</span>
      <span className="mt-1 block text-[11px] text-[var(--text-3)]">{state.quality === 1 ? "1 point = 4 records on this device" : "1 point = 1 record"}</span>
    </div>
  );
}

function NearestDocs() {
  const sims = useStore((s) => s.sims);
  const prompt = useStore((s) => s.prompt);
  const backend = useStore((s) => s.stats.backend);
  const ms = useStore((s) => s.stats.embedMs);
  const top = sims ? sims.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).slice(0, 3) : [];
  return (
    <div className="reveal mt-5 rounded-xl border border-[var(--line)] bg-[#0d1020] p-4">
      <p className="font-mono text-[11.5px] text-[var(--text-3)]">
        nearest to <span className="text-[var(--cyan)]">&ldquo;{prompt}&rdquo;</span> · all-MiniLM-L6-v2 {backend ? `on ${backend === "webgpu" ? "WebGPU" : backend === "wasm" ? "WASM" : backend}` : "loading…"}{ms ? ` · ${ms.toFixed(0)} ms` : ""}
      </p>
      <ul className="mt-2 space-y-2">
        {top.length ? top.map(({ s, i }) => (
          <li key={i} className="flex gap-3 text-[13.5px] text-[var(--text-2)]">
            <span className="tabular shrink-0 font-mono text-[var(--cyan)]">{s.toFixed(3)}</span>
            <span>{docs[i].text}</span>
          </li>
        )) : <li className="font-mono text-[12px] text-[var(--text-3)]">embedding your question in the browser…</li>}
      </ul>
    </div>
  );
}

function AttentionControls() {
  const layer = useStore((s) => s.attention.layer);
  const head = useStore((s) => s.attention.head);
  const prompt = useStore((s) => s.prompt);
  const exact = gpt2.prompts.some((p) => p.prompt.toLowerCase() === prompt.trim().toLowerCase());
  const set = (k: "layer" | "head", v: number) => { state.attention = { ...state.attention, [k]: v }; emit(); };
  return (
    <div className="reveal mt-5 grid gap-3 rounded-xl border border-[var(--line)] bg-[#0d1020] p-4 font-mono text-[12.5px] text-[var(--text-2)]">
      {(["layer", "head"] as const).map((k) => (
        <label key={k} className="flex items-center gap-3">
          <span className="w-12">{k}</span>
          <input type="range" min={0} max={11} value={k === "layer" ? layer : head} onChange={(e) => set(k, +e.target.value)} className="flex-1" aria-label={`attention ${k}`} />
          <span className="tabular w-6 text-right text-[var(--amber)]">{(k === "layer" ? layer : head) + 1}</span>
        </label>
      ))}
      <span className="text-[11px] text-[var(--text-3)]">
        {exact ? "GPT-2 (124M) attention for your prompt, exported from PyTorch." : "Showing GPT-2 attention for “Who is Rishi Sangare?” (custom prompts use the default sentence)."}
      </span>
    </div>
  );
}

function Sampler() {
  const prompt = useStore((s) => s.prompt);
  const [t, setT] = useState(1);
  const data = gpt2.prompts.find((p) => p.prompt.toLowerCase() === prompt.trim().toLowerCase()) ?? gpt2.prompts[0];
  const p = probs(data.next.logits, t).slice(0, 6);
  const grid = useRef<HTMLDivElement>(null), corr = useRef<HTMLSpanElement>(null);
  const fn = useMemo(() => () => {
    const k = state.local.sample;
    // degenerate clarifying questions: 85% before the fix, 0% after (each cell = 1%)
    const fixed = Math.round(Math.min(1, Math.max(0, (k - 0.25) / 0.45)) * 85);
    if (grid.current) Array.from(grid.current.children).forEach((c, i) => {
      const broken = i < 85 - fixed;
      (c as HTMLElement).style.background = broken ? "var(--rose)" : "var(--mint)";
      (c as HTMLElement).style.opacity = broken ? "0.75" : "0.9";
    });
    if (corr.current) corr.current.dataset.on = k > 0.6 ? "1" : "0";
  }, []);
  useTicker(fn);
  return (
    <div className="reveal mt-5 grid gap-4">
      <div className="rounded-xl border border-[var(--line)] bg-[#0d1020] p-4 font-mono text-[12.5px]">
        <label className="flex items-center gap-3 text-[var(--text-2)]">
          <span>temperature</span>
          <input type="range" min={0.1} max={2} step={0.05} value={t} onChange={(e) => { setT(+e.target.value); state.temperature = +e.target.value; }} className="flex-1" aria-label="temperature" />
          <span className="tabular w-10 text-right text-[var(--amber)]">{t.toFixed(2)}</span>
        </label>
        <ul className="mt-3 space-y-1.5">
          {p.map((v, i) => (
            <li key={i} className="grid grid-cols-[84px_1fr_52px] items-center gap-2">
              <span className="truncate text-[var(--text)]">{JSON.stringify(data.next.tokens[i]).slice(1, -1)}</span>
              <span className="h-1.5 rounded bg-[var(--line)]"><span className="block h-full rounded" style={{ width: `${v * 100}%`, background: i === 0 ? "var(--amber)" : "var(--violet)" }} /></span>
              <span className="tabular text-right text-[var(--text-2)]">{(v * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-[var(--text-3)]">GPT-2&apos;s real next-token logits for &ldquo;{data.prompt}&rdquo;, softmaxed live.</p>
      </div>
      <div className="rounded-xl border border-[var(--line)] bg-[#0d1020] p-4">
        <div className="flex items-baseline justify-between font-mono text-[11.5px] text-[var(--text-3)]">
          <span>broken clarifying questions · 1 cell = 1%</span>
          <span><span className="text-[var(--rose)]">■</span> broken question <span className="ml-2 text-[var(--mint)]">■</span> fixed</span>
        </div>
        <div ref={grid} className="mt-3 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1" aria-label="Broken clarifying questions: 85% before the fix, 0% after, verified on 72 live scenarios">
          {Array.from({ length: 100 }, (_, i) => <span key={i} className="aspect-square rounded-[2px] transition-colors duration-300" />)}
        </div>
        <p className="mt-2 font-mono text-[11px] text-[var(--text-3)]">85% before the fix → 0% after, verified on 72 live scenarios.</p>
        <p className="mt-3 font-mono text-[13px]">
          reranker gain: <span ref={corr} data-on="0" className="group">
            <span className="text-[var(--rose)] [[data-on='1']_&]:line-through [[data-on='1']_&]:opacity-50">+30%</span>
            <span className="ml-2 text-[var(--mint)] opacity-0 transition-opacity duration-500 [[data-on='1']_&]:opacity-100">+12.9% (honest holdout)</span>
          </span>
        </p>
      </div>
    </div>
  );
}

function TypedOutput() {
  const out = useRef<HTMLSpanElement>(null);
  const text = "Rishi ships LLM products to production, and measures them honestly.";
  const fn = useMemo(() => () => {
    const n = Math.round(Math.min(1, state.local.decode * 1.6) * text.length);
    if (out.current && out.current.textContent!.length !== n) out.current.textContent = text.slice(0, n);
  }, []);
  useTicker(fn);
  return (
    <p className="reveal mt-5 rounded-xl border border-[var(--line)] bg-[#0d1020] p-4 font-mono text-[14px] text-[var(--text)]">
      <span className="text-[var(--amber)]">› </span><span ref={out} /><span className="ml-0.5 inline-block w-2 animate-pulse bg-[var(--amber)]">&nbsp;</span>
    </p>
  );
}

export function Widget({ id }: { id: string }) {
  if (id === "tokenize") return <MigrationCounter />;
  if (id === "embed") return <NearestDocs />;
  if (id === "attend") return <AttentionControls />;
  if (id === "sample") return <Sampler />;
  if (id === "decode") return <TypedOutput />;
  return null;
}
