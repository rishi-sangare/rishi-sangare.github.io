"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { arcs, bySlug, person, sequence } from "@/data/projects";

/** The career as a context window: a reading head moves along the tokens; each one looks back at what it drew on. */
export default function WorkSequence() {
  const [cur, setCur] = useState(0);
  const [auto, setAuto] = useState(true);
  const [xs, setXs] = useState<number[]>([]);
  const strip = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const last = sequence.length - 1;

  // play through once on arrival, then hand control to the visitor
  useEffect(() => {
    if (!auto) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setCur(last); setAuto(false); return; }
    const t = setTimeout(() => { setCur((c) => { if (c >= last) { setAuto(false); return c; } return c + 1; }); }, cur === 0 ? 900 : 1100);
    return () => clearTimeout(t);
  }, [cur, auto, last]);

  useLayoutEffect(() => {
    const measure = () => {
      const s = strip.current?.getBoundingClientRect(); if (!s) return;
      setXs(btns.current.map((b) => { const r = b!.getBoundingClientRect(); return r.left - s.left + r.width / 2 + (strip.current?.scrollLeft ?? 0); }));
    };
    measure(); addEventListener("resize", measure); return () => removeEventListener("resize", measure);
  }, []);

  const pick = (i: number) => { setAuto(false); setCur(i); };
  useEffect(() => { btns.current[cur]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }, [cur]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); pick(Math.min(last, cur + 1)); btns.current[Math.min(last, cur + 1)]?.focus(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); pick(Math.max(0, cur - 1)); btns.current[Math.max(0, cur - 1)]?.focus(); }
  };

  const tok = sequence[cur];
  const p = tok.slug ? bySlug(tok.slug) : null;
  const card = p ? { title: p.title, when: p.when, line: p.line, stat: `${p.numbers[0].v} · ${p.numbers[0].l}` } : tok.card;
  const width = xs.length ? xs[xs.length - 1] + 60 : 0;

  return (
    <div className="ws">
      <div className="ws-strip" ref={strip} onKeyDown={onKey}>
        <svg className="ws-arcs" width={width} height="150" aria-hidden="true">
          {(arcs[cur] || []).map(([j, w], n) => {
            if (!xs.length) return null;
            const x0 = xs[cur], x1 = xs[j], h = Math.min(128, 30 + Math.abs(x0 - x1) * .3);
            const d = `M ${x0} 146 C ${x0} ${146 - h * 1.33}, ${x1} ${146 - h * 1.33}, ${x1} 146`;
            return (
              <g key={`${cur}-${j}`} style={{ animationDelay: `${n * 80}ms` }} className="ws-arc">
                <path d={d} pathLength={1} strokeWidth={.8 + w * 3.2} style={{ opacity: .35 + .65 * w }} />
                <text x={(x0 + x1) / 2} y={146 - h - 6} textAnchor="middle">{w.toFixed(2)}</text>
              </g>
            );
          })}
        </svg>
        <div className="ws-row" role="listbox" aria-label="My career, one token at a time">
          {sequence.map((t, i) => (
            <button key={t.t} ref={(el) => { btns.current[i] = el; }} type="button" role="option" aria-selected={i === cur}
              className={`ws-tok ${i === cur ? "cur" : i < cur ? "read" : ""}`} onClick={() => pick(i)} onMouseEnter={() => !auto && setCur(i)}>
              <span className={i === last && i === cur ? "blink" : ""}>{t.t}</span>
              <small>{t.yr ?? " "}</small>
              <em aria-hidden="true">{[0, 1, 2, 3].map((r) => <i key={r} style={{ width: i <= cur ? `${45 + ((i * 37 + r * 23) % 55)}%` : 0 }} />)}</em>
            </button>
          ))}
        </div>
      </div>
      <p className="ws-hint">{auto ? "reading…" : "hover, click or use ← → to move the reading head"} · arcs show how later work drew on earlier work (my judgment, not model attention)</p>

      <div className="ws-card-wrap" aria-live="polite">
        {cur < last && card && (
          <div className="ws-card" key={cur}>
            <div className="ws-card-top"><h2>{card.title}</h2><span>{card.when}</span></div>
            <p>{card.line}</p>
            <div className="ws-card-bot"><b>{card.stat}</b>{p && <a href={`/work/${p.slug}/`}>read the case study ↗</a>}</div>
          </div>
        )}
        {cur === last && (
          <div className="ws-next" key="next">
            <div className="eyebrow">next token</div>
            {([["your team", .58], ["a full-time role", .22], ["a 20-minute call", .11]] as const).map(([w, pr], i) => (
              <div className="ws-cand" key={w}><span className={i ? "" : "top"}>{w}</span><i style={{ width: `${pr * 240}px` }} /><small>{pr.toFixed(2)}</small></div>
            ))}
            <div className="ws-contact"><a href={`mailto:${person.email}`}>{person.email}</a><a href="/cv/">CV</a><a href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></div>
          </div>
        )}
      </div>
    </div>
  );
}
