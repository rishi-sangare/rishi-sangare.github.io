"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { SCENES, emit, state } from "@/lib/store";
import { runPrompt } from "@/lib/model";
import { TopBar } from "./dom/TopBar";
import { Hero } from "./dom/Hero";
import { SceneSection } from "./dom/SceneSection";
import { Eos } from "./dom/Eos";
import { scenes } from "@/data/content";

const World = dynamic(() => import("./three/World"), { ssr: false });

export default function Experience() {
  const [quality, setQuality] = useState<0 | 1 | 2 | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // pick a quality tier: no canvas for reduced motion / weak GPUs, reduced on phones
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { state.quality = 0; setQuality(0); return; }
    let cancelled = false;
    import("detect-gpu").then(({ getGPUTier }) => getGPUTier()).then((g) => {
      if (cancelled) return;
      const q: 0 | 1 | 2 = g.tier === 0 ? 0 : g.isMobile || g.tier === 1 ? 1 : 2;
      state.quality = q; setQuality(q);
    }).catch(() => { if (!cancelled) { state.quality = 1; setQuality(1); } });
    return () => { cancelled = true; };
  }, []);

  // smooth native scroll + map scroll position to scene progress
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduce ? null : new Lenis({ lerp: 0.09, smoothWheel: true });
    let sections: { top: number; h: number; id: string }[] = [];
    const measure = () => {
      sections = SCENES.map((id) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.offsetTop : 0, h: el ? el.offsetHeight : 1 };
      });
    };
    const update = () => {
      const y = window.scrollY, vh = window.innerHeight, mid = y + vh / 2;
      let f = 0;
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        state.local[s.id as (typeof SCENES)[number]] = Math.min(1, Math.max(0, (y - s.top) / Math.max(1, s.h - vh)));
        const c = s.top + s.h / 2, next = sections[i + 1];
        if (mid >= c && next) {
          const nc = next.top + next.h / 2;
          f = i + Math.min(1, (mid - c) / (nc - c));
        } else if (mid < c && i === 0) f = 0;
      }
      state.scroll = f;
    };
    measure(); update();
    const ro = new ResizeObserver(() => { measure(); update(); });
    ro.observe(document.body);
    let raf = 0;
    const loop = (t: number) => { lenis?.raf(t); update(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onPointer = (e: PointerEvent) => {
      state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    // anchor links go through Lenis so they glide instead of jump
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a || !lenis) return;
      const id = a.getAttribute("href")!.slice(1), el = document.getElementById(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { duration: 1.6 }); history.replaceState(null, "", `#${id}`); }
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); lenis?.destroy();
      window.removeEventListener("pointermove", onPointer); document.removeEventListener("click", onClick);
    };
  }, []);

  // load the in-browser models after first paint
  useEffect(() => {
    const go = () => runPrompt(state.prompt).then(emit);
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(go); else setTimeout(go, 600);
  }, []);

  return (
    <div ref={root} className="relative">
      {quality !== null && quality > 0 && <World quality={quality as 1 | 2} />}
      {/* static backdrop for the no-WebGL / reduced-motion path */}
      {quality === 0 && (
        <div aria-hidden className="fixed inset-0 -z-0" style={{ background: "radial-gradient(60% 50% at 70% 30%, #9b8cff22, transparent), radial-gradient(50% 40% at 20% 80%, #ffb54718, transparent), #07080f" }} />
      )}
      <TopBar />
      <main className="relative z-10">
        <Hero />
        {scenes.map((s, i) => (
          <SceneSection key={s.id} scene={s} index={i + 1} />
        ))}
        <Eos />
      </main>
    </div>
  );
}
