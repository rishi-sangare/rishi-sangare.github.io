import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/v2/CaseStudy";
import { bySlug, person, projects } from "@/data/projects";

export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = bySlug((await params).slug);
  return p ? { title: `${p.title} · Rishi Sangare`, description: p.line } : {};
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const p = bySlug((await params).slug);
  if (!p) notFound();
  const i = projects.indexOf(p), next = projects[(i + 1) % projects.length];
  return (
    <main className="pg">
      <div className="pg-top">
        <a href="/">← {person.name}</a>
        <nav><a href="/work/">all work</a><a href="/cv/">CV</a><a href={`mailto:${person.email}`}>email</a></nav>
      </div>
      <div className="pg-case">
        <CaseStudy p={p} />
        <a className="pg-next" href={`/work/${next.slug}/`}><span>next</span>{next.title} →</a>
      </div>
    </main>
  );
}
