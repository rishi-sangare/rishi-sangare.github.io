"use client";
import { useState } from "react";
import { person } from "@/data/content";
import { SCENES, state } from "@/lib/store";
import { useEffect, useRef } from "react";

/** The fast path: visible from the first frame, on every scene. */
export function TopBar() {
  const [copied, setCopied] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  // scene progress rail
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${state.scroll / (SCENES.length - 1)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(person.email); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { window.location.href = `mailto:${person.email}`; }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex items-center justify-between gap-3 px-[var(--gutter)] py-4">
        <a href="#prompt" className="font-display text-[17px] font-semibold tracking-tight text-[var(--text)] no-underline">
          rishi<span className="text-[var(--amber)]">.</span>sangare
        </a>
        <nav aria-label="Quick links" className="flex flex-wrap justify-end gap-2">
          <a className="chip primary" href="/cv/">CV</a>
          <button type="button" className="chip" onClick={copy} aria-live="polite">{copied ? "Copied ✓" : "Email"}</button>
          <a className="chip hidden sm:inline-block" href={person.github} target="_blank" rel="noreferrer">GitHub</a>
          <a className="chip hidden sm:inline-block" href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="chip hidden md:inline-block" href="#eos">Skip to output →</a>
        </nav>
      </div>
      <div className="h-px w-full bg-[var(--line)]">
        <div ref={bar} className="h-px origin-left bg-[var(--amber)]" style={{ transform: "scaleX(0)" }} />
      </div>
    </header>
  );
}
