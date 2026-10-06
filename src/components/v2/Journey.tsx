"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { chapters, FACTS } from "@/data/journey";
import { bySlug, person, projects } from "@/data/projects";
import { CaseStudy } from "./CaseStudy";

type Engine = { focus: (open: boolean) => void; destroy: () => void };

export default function Journey() {
  const root = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [menu, setMenu] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  const openCase = useCallback((slug: string) => {
    if (!bySlug(slug)) return;
    lastFocus.current = document.activeElement as HTMLElement;
    setOpen(slug);
    history.replaceState(null, "", `#${slug}`);
  }, []);
  const close = useCallback(() => {
    setShown(false);
    setTimeout(() => setOpen(null), 380);
    history.replaceState(null, "", location.pathname);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    let alive = true;
    import("@/journey/engine").then(({ startJourney }) => {
      if (!alive || !root.current) return;
      engine.current = startJourney(root.current, { onOpen: openCase });
      const h = location.hash.slice(1); if (h && bySlug(h)) openCase(h);
    });
    return () => { alive = false; engine.current?.destroy(); engine.current = null; };
  }, [openCase]);

  useEffect(() => {
    engine.current?.focus(!!open);
    if (!open) { document.documentElement.style.overflow = ""; return; }
    document.documentElement.style.overflow = "hidden";
    const r = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(r); removeEventListener("keydown", onKey); };
  }, [open, close]);

  const p = open ? bySlug(open) : null;

  return (
    <div ref={root} className="j-root">
      <canvas data-j="gl" className="j-gl" aria-hidden="true" />
      <div className="j-track" aria-hidden="true" />
      <div className="j-ui">
        <header className="j-top">
          <div className="j-who"><b>{person.name}</b><span>{person.role} · {person.location}</span></div>
          <div>
            <nav className="j-links" aria-label="Site">
              <a href="/work/">work</a>
              <a href="/cv/">CV</a>
              <button type="button" data-mail>email</button>
              <a href={person.github} target="_blank" rel="noreferrer">github</a>
              <a href={person.linkedin} target="_blank" rel="noreferrer">linkedin</a>
            </nav>
            <div className="j-layer" data-j="layer">layer 00 / 12</div>
          </div>
          <button type="button" className="j-menu-btn" aria-expanded={menu} onClick={() => setMenu(true)}>menu</button>
          <div className="j-prog" aria-hidden="true"><i data-j="prog" /></div>
        </header>
        <nav className="j-rail" data-j="rail" aria-label="Chapters" />
        <div data-j="labels" />
        <div className="j-facts" data-j="facts" aria-hidden="true">
          {FACTS.map((f, i) => <div key={f} className={`j-fact ${i % 2 ? "r" : "l"}`}>{f}</div>)}
        </div>
        <div className="j-answer">
          <p className="j-line" data-j="line" aria-live="polite" />
          <div className="j-cands" data-j="cands" aria-hidden="true" />
          <div data-j="hero">
            <div className="j-ask"><label htmlFor="q">ask it</label><input id="q" data-j="q" maxLength={44} defaultValue="Who is Rishi Sangare?" autoComplete="off" spellCheck={false} /></div>
            <div className="j-presets" data-j="presets" />
          </div>
          <div className="j-ev" data-j="ev" />
          <button type="button" className="j-feature" data-j="feature" style={{ opacity: 0 }}>read the case study ↗</button>
          <div className="j-cta" data-j="cta">
            <button type="button" className="primary" data-mail>{person.email}</button>
            <a href="/work/">all work</a>
            <a href="/cv/">CV</a>
            <a href={person.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
          <div className="j-note" data-j="note">made of dots from a photo · depth estimated by a model</div>
          <div className="j-factsline" data-j="factsline">{FACTS.join("  ·  ")}</div>
        </div>
        <div className="j-status" data-j="status" />
        <button type="button" className="j-sound" data-j="sound" aria-pressed="false"><i><b /><b /><b /><b /></i><span>sound off</span></button>
      </div>
      <div className="j-cur" data-j="cur" /><div className="j-ring" data-j="ring" />

      {/* The whole story as text, for screen readers and search engines */}
      <section className="sr" aria-label="Summary">
        <h1>{person.name}, {person.role}</h1>
        {chapters.map((c) => <p key={c.name}>{c.ans} {c.ev.map((e) => e.t).join(". ")}</p>)}
        <ul>{projects.map((pr) => <li key={pr.slug}><a href={`/work/${pr.slug}/`}>{pr.title}</a>: {pr.line}</li>)}</ul>
      </section>

      {menu && (
        <div className="j-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="j-menu-close" onClick={() => setMenu(false)} autoFocus>close</button>
          <nav>
            <a href="/work/">Work</a>
            <a href="/cv/">CV</a>
            <button type="button" data-mail>{person.email}</button>
            <a href={person.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="/colophon/">How this site works</a>
          </nav>
          <p>{person.name} · {person.role} · {person.location}</p>
        </div>
      )}

      {p && (
        <>
          <div className={`cs-veil ${shown ? "in" : ""}`} onClick={close} />
          <div className={`cs-sheet ${shown ? "in" : ""}`} role="dialog" aria-modal="true" aria-label={p.title}>
            <button type="button" className="cs-close" onClick={close} autoFocus>close · esc</button>
            <CaseStudy p={p} headingLevel="h2" pageLink />
          </div>
        </>
      )}
    </div>
  );
}
