import type { Project } from "@/data/projects";

/** The body of a case study. Used both in the in-place overlay and on its own page. */
export function CaseStudy({ p, headingLevel = "h1", pageLink = false }: { p: Project; headingLevel?: "h1" | "h2"; pageLink?: boolean }) {
  const H = headingLevel;
  return (
    <article>
      <div className="cs-org">{p.org}</div>
      <H className="cs-title">{p.title}</H>
      <p className="cs-line">{p.line}</p>
      <div className="cs-meta"><span>{p.role}</span><span>{p.when}</span></div>
      <div className="cs-nums">
        {p.numbers.map((n, i) => (
          <div key={n.l}><b className={i === 0 ? "acc" : undefined}>{n.v}</b><span>{n.l}</span></div>
        ))}
      </div>
      {p.sections.map((s) => (
        <section className="cs-sec" key={s.h}>
          <h3>{s.h}</h3>
          {s.body && <p>{s.body}</p>}
          {s.items && <ul>{s.items.map((it) => <li key={it}>{it}</li>)}</ul>}
        </section>
      ))}
      <section className="cs-sec">
        <h3>Stack</h3>
        <div className="cs-stack">{p.stack.map((t) => <span key={t}>{t}</span>)}</div>
      </section>
      <div className="cs-links">
        {pageLink && <a href={`/work/${p.slug}/`}>Open as a page ↗</a>}
        {p.links?.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
        <a href="/work/">All work</a>
      </div>
    </article>
  );
}
