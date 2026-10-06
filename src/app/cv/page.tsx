import type { Metadata } from "next";
import { person } from "@/data/content";

export const metadata: Metadata = {
  title: "Rishi Sangare · CV",
  description: "One-page CV: AI / LLM engineer shipping production LLM systems, retrieval and evals.",
};

const jobs = [
  {
    role: "AI / Backend Engineer", org: "LD Technologies", when: "Feb 2025 – present", where: "Remote · full-time",
    points: [
      "Built the whole AI matching workflow (jobs to candidates and candidates to jobs) for a large Japanese recruiting database, after building its first search on a vector database with a re-ranking model: FastAPI, Elasticsearch retrieval with filters, a 3-turn LLM pre-screening flow (EN/JA) with idempotent sessions and HMAC-signed webhooks. 253 commits, 128 PRs.",
      "Rebuilt a filter-aware eval golden set, showing real recall@10 was 0.57, not 0.19, on identical outputs. Cut degenerate clarifying questions from 85% to 0% (verified on 72 live scenarios).",
      "Ran an LLM reranker trial (48k judgements for $2.31) with holdout and bias audit; caught my own inflated +30% and reported +12.9%.",
      "Sole engineer on RefineCV, working with the founder: a B2B CV-formatting SaaS (FastAPI, React 19, Supabase, WeasyPrint): 435 commits and 203 PRs in 5 months. Fixed a cross-tenant authorization flaw across 63 call sites; found the cause of production 500s (sync PDF rendering starving the event loop). Picked the AI assistant's model via a 24-model, 3,162-turn bake-off.",
      "Built v1 of Recruiter Copilot (Chrome MV3 + Supabase Edge Functions) and shipped 11 Web Store releases (400+ installs); closed a cross-account RLS leak and a billing exploit.",
      "Sole engineer on a CRM migration for a UK agency: 18 GB keyless SQL Server → REST-only CRM. 253,541 activities, 36,661 people, 0 missing, 99.97% exact on reconciliation.",
    ],
  },
  {
    role: "Freelance AI & Automation Engineer", org: "Upwork", when: "Jun 2026 – present", where: "Remote",
    points: [
      "Evaluated AI coding agents on SQLAlchemy, SymPy, NetworkX and Astropy, reproducing real upstream bugs to grade model fixes.",
      "Built self-hosted n8n automations (Stripe → Thinkific → Slack; lead enrichment → HubSpot) with duplicate-safe webhooks and full failure-test suites.",
    ],
  },
  {
    role: "Backend Developer (Intern)", org: "Paragon Dynamics", when: "May – Jul 2024", where: "Chennai",
    points: ["Visitor-management system for shipping & logistics (Angular, Flask, PostgreSQL); optimised slow queries."],
  },
  {
    role: "Backend & ML Engineer", org: "Mitwa.ai", when: "Dec 2023 – Apr 2024", where: "Hybrid",
    points: ["Backend, auth and OpenAI integration for an AI wellbeing companion; fine-tuned Mistral-7B with DPO on 6k and 18k-pair datasets (Hugging Face: Rishi-19)."],
  },
];

export default function CV() {
  return (
    <main className="mx-auto max-w-[820px] px-[var(--gutter)] py-14 text-[15px] leading-relaxed text-[var(--text-2)]">
      <a href="/" className="font-mono text-[12px] text-[var(--amber)] no-underline">← back to the forward pass</a>
      <header className="mt-8 border-b border-[var(--line)] pb-8">
        <h1 className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-[var(--text)]">{person.name}</h1>
        <p className="mt-3 text-[18px] text-[var(--text)]">{person.role}</p>
        <p className="mt-1">{person.location} · open to full-time remote</p>
        <p className="mt-3 font-mono text-[12.5px]">
          {person.email} · <a href={person.github}>github.com/rishi-sangare</a> · <a href={person.linkedin}>linkedin.com/in/rishi-sangare</a> · <a href={person.caseStudies}>case studies</a>
        </p>
      </header>
      <section className="mt-8">
        <h2 className="eyebrow">Summary</h2>
        <p className="mt-3 text-[var(--text)]">
          AI engineer who ships LLM products to production and measures them honestly: retrieval, multi-turn LLM flows, eval harnesses, security and the infrastructure that keeps them up. Comfortable owning a product end to end on a small team, and fluent with AI coding agents.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="eyebrow">Experience</h2>
        {jobs.map((j) => (
          <article key={j.org} className="mt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-[19px] font-semibold text-[var(--text)]">{j.role} · {j.org}</h3>
              <span className="font-mono text-[12px] text-[var(--text-3)]">{j.when} · {j.where}</span>
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">{j.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </article>
        ))}
      </section>
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="eyebrow">Skills</h2>
          <p className="mt-3">Python, FastAPI, TypeScript, React, Elasticsearch/OpenSearch, Supabase/Postgres, Docker, AWS (CDK, Lambda), GitHub Actions, Playwright, LLM evals (golden sets, recall@k, LLM-as-judge), OpenRouter, Cerebras, Claude, OpenAI, n8n, Claude Code.</p>
        </div>
        <div>
          <h2 className="eyebrow">Education & open source</h2>
          <p className="mt-3">MBA Tech, Computer Engineering · NMIMS MPSTME, Mumbai (2021–2026). Merged contribution to Keras (#22407). Smart India Hackathon 2024 & 2025.</p>
        </div>
      </section>
    </main>
  );
}
