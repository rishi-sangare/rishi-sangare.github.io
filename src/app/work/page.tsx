import type { Metadata } from "next";
import WorkSequence from "@/components/v2/WorkSequence";
import { person, projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Work · Rishi Sangare",
  description: "Every project, read as a sequence: CRM migration, LLM matching for Japanese recruiting, evals, RefineCV, Recruiter Copilot, Mitwa DPO fine-tunes and freelance agent evals.",
};

export default function Work() {
  return (
    <main className="pg">
      <div className="pg-top">
        <a href="/">← {person.name}</a>
        <nav><a href="/cv/">CV</a><a href={person.github} target="_blank" rel="noreferrer">github</a><a href={person.linkedin} target="_blank" rel="noreferrer">linkedin</a></nav>
      </div>
      <h1 className="ws-h1">My work, read one token at a time.</h1>
      <p className="ws-sub">Each step can look back at everything before it.</p>
      <WorkSequence />
      <section className="ws-list" aria-label="All case studies">
        <div className="eyebrow">all case studies</div>
        {projects.map((p) => (
          <a key={p.slug} className="ws-item" href={`/work/${p.slug}/`}>
            <span className="t">{p.title}</span>
            <span className="o">{p.org} · {p.when}</span>
            <span className="l">{p.line}</span>
            <span className="n">{p.numbers[0].v} <small>{p.numbers[0].l}</small></span>
          </a>
        ))}
      </section>
    </main>
  );
}
