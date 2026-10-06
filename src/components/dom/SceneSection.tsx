"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Scene } from "@/data/content";
import { Widget } from "./widgets";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function SceneSection({ scene, index }: { scene: Scene; index: number }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (matchMedia("(max-width: 760px)").matches) root.current!.querySelectorAll("details.story-more").forEach((d) => d.removeAttribute("open"));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(root.current!.querySelectorAll(".reveal"), {
      autoAlpha: 0, y: 28, filter: "blur(6px)", duration: 1, ease: "expo.out", stagger: 0.07,
      scrollTrigger: { trigger: root.current, start: "top 55%", toggleActions: "play none none reverse" },
    });
  }, { scope: root });

  return (
    <section id={scene.id} ref={root} className="scene" aria-labelledby={`${scene.id}-title`}>
      <div className="scene-sticky">
        <div className="panel glass" data-lenis-prevent>
          <p className="eyebrow reveal">{scene.n} · {scene.stage}</p>
          <h2 id={`${scene.id}-title`} className="reveal font-display mt-3 text-[clamp(30px,3.6vw,46px)] font-bold leading-[1.02] tracking-[-0.03em]">
            {scene.title}
          </h2>
          <p className="reveal mt-4 border-l-2 border-[var(--violet)] pl-3 font-mono text-[12.5px] leading-relaxed text-[var(--text-2)]">
            <span className="text-[var(--violet)]">inside the model · </span>{scene.model}
          </p>
          <Widget id={scene.id} />
          <div className="reveal mt-6 flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[19px] font-semibold">{scene.project}</h3>
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--cyan)]">{scene.kicker}</span>
          </div>
          <div className="reveal mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--text-2)]">
            <p>{scene.story[0]}</p>
            {scene.story.length > 1 && (
              <details className="story-more group" open>
                <summary className="cursor-pointer list-none font-mono text-[12px] text-[var(--amber)] group-open:hidden">Read the story +</summary>
                <div className="space-y-3">{scene.story.slice(1).map((p, i) => <p key={i}>{p}</p>)}</div>
              </details>
            )}
          </div>
          <div className="reveal stat-grid mt-5">
            {scene.stats.map((s) => (
              <div key={s.l}>
                <div className="font-display tabular text-[22px] font-semibold text-[var(--text)]">{s.v}</div>
                <div className="mt-0.5 text-[12.5px] text-[var(--text-3)]">{s.l}</div>
              </div>
            ))}
          </div>
          {scene.link && (
            <a className="reveal mt-5 inline-block font-mono text-[13px] text-[var(--amber)]" href={scene.link.href} target="_blank" rel="noreferrer">
              {scene.link.label} ↗
            </a>
          )}
        </div>
      </div>
      <span className="sr-only">Scene {index} of 7</span>
    </section>
  );
}
