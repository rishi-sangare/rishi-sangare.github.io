// One source of truth for every project. The journey, the case-study pages, the Work page and the CV read from here.
// Every number is real: from git history, production reconciliation reports or eval runs.

export type Num = { v: string; l: string };
export type Section = { h: string; body?: string; items?: string[] };
export type Project = {
  slug: string;
  title: string;
  org: string;
  role: string;
  when: string;
  line: string;            // one sentence, used on cards
  numbers: Num[];
  sections: Section[];
  stack: string[];
  links?: { href: string; label: string }[];
};

export const projects: Project[] = [
  {
    slug: "crm-migration",
    title: "CRM migration",
    org: "LD Technologies · for JustRecruit (UK)",
    role: "Sole engineer, from research to production run, repairs and handover",
    when: "Jun – Sep 2026",
    line: "Moved a UK agency's 18 GB legacy CRM, with no declared keys, into a SaaS CRM that could only be written through its REST API. Nothing lost, nothing invented.",
    numbers: [
      { v: "253,541", l: "activities moved with original dates" },
      { v: "0", l: "missing records" },
      { v: "99.97%", l: "content-exact after repair" },
      { v: "574", l: "source tables, no primary or foreign keys" },
    ],
    sections: [
      { h: "The problem", body: "A UK recruitment agency was leaving a legacy CRM. What they had was a SQL Server backup: about 18 GB restored, 574 tables, and no declared primary or foreign keys. The destination was a SaaS recruitment CRM that could only be written through its public REST API. The rule was simple and strict: represent everything exactly as in the source, and invent nothing." },
      { h: "What I built", items: [
        "A three-stage pipeline: extract (PowerShell + sqlcmd to JSON), transform (mapped entities with deterministic UUIDv5 ids), load (REST), then file associations, contact and action fixes, and a read-only reconciliation pass.",
        "Idempotent by design: ids salted per account, adopt-on-duplicate, checkpoints, and a refusal to run against the wrong account.",
        "Batch-split retry: when a batch hit a duplicate, isolate the single bad record and retry the rest. That's the difference between hours and days.",
        "Safety rails: 50-record canary gates, a drops ledger that fails the run, self-halting on anomalous duplicates, and a watchdog for unattended overnight runs.",
      ] },
      { h: "What I found on the way", items: [
        "A platform bug: concurrent POSTs created \"ghost\" rows (id reserved, record invisible). I diagnosed it, switched to sequential loading and re-salted the ids.",
        "Integrity without keys: I proved 71 inferred ID/FK columns across 12 tables with joins, and found 3 broken-reference cases (about 400 orphan rows) before they reached the client.",
        "Undocumented API limits: batch caps, which endpoints honour historical dates, and uniqueness rules that include trashed rows.",
      ] },
      { h: "Results on the live account", items: [
        "Companies 7,611 / 7,611 · People 36,661 / 36,661 · Activities 253,541 with original dates.",
        "Contact → company links 21,375 · File associations 170,834.",
        "Post-migration repair: 1,901 / 1,901 hiring managers re-linked with 0 failures; 49,725 activities restored, 99.97% content-exact, 0 duplicates.",
      ] },
    ],
    stack: ["Node.js (stdlib only)", "PowerShell 7", "SQL Server 2022", "sqlcmd", "Playwright"],
    links: [{ href: "https://github.com/rishi-sangare/case-studies/blob/main/crm-migration.md", label: "Long-form write-up" }],
  },
  {
    slug: "tamago",
    title: "LLM matching for a Japanese recruiting platform",
    org: "LD Technologies · for Tamago",
    role: "Backend / LLM engineer on a team of 3",
    when: "Oct 2025 – now",
    line: "Recruiters type a job description and get a ranked shortlist with reasons, in English and Japanese, fast enough to use live.",
    numbers: [
      { v: "0.19 → 0.57", l: "recall@10, same model, honest golden set" },
      { v: "85% → 0%", l: "broken clarifying questions" },
      { v: "16/16 → 0/16", l: "English leaking into Japanese sessions" },
      { v: "253", l: "commits · 128 PRs" },
    ],
    sections: [
      { h: "The problem", body: "A large Japanese recruiting database wanted recruiters to type a job description, or pick a candidate, and get a ranked shortlist with reasons. It had to work in English and Japanese and be fast enough to use live." },
      { h: "What I built", items: [
        "The service foundation: FastAPI, Docker, Caddy/TLS, GitHub Actions to GHCR to staging and production, with Slack alerts.",
        "Retrieval: Elasticsearch (kuromoji for Japanese) with wage/currency, language, age, experience and excluded-company filters, routed per tenant.",
        "Interactive pre-screening, in two flows: the LLM asks clarifying questions and a deal-breaker question, classifies the answers in parallel, then runs retrieval and parallel LLM evaluation in the background and calls back with an HMAC-signed webhook. Sessions are idempotent, with status guards and TTLs.",
        "Reliability: a primary and fallback LLM provider chain hardened against malformed JSON, which removed a whole class of \"all evaluations failed\" 500/503 errors. A 4-agent robustness audit found 8 issues; all were fixed.",
      ] },
      { h: "The measurement work", items: [
        "Request filters were silently deleting 68% of the \"ideal\" answers in the golden set. I rebuilt it to be filter-aware. Same model outputs: recall@10 went from 0.19 to 0.57 in English, hits@10 from 2.2 to 6.6 in Japanese.",
        "Clarifying questions were often degenerate: 85% → 0%. Visa over-triggering 90% → 0%. Options per question 3.3 → 5.9. Verified on 72 live scenarios.",
        "Elasticsearch boost tuning gained 6.8 points on train and under 1 on holdout. It didn't generalize, so I said so: retrieval depth was the real lever.",
        "An open-source reranker scored recall@20 0.153 against the paid one's 0.536, so I recommended not switching yet.",
      ] },
    ],
    stack: ["Python", "FastAPI", "Pydantic", "Elasticsearch 8/9", "Supabase", "Cerebras", "OpenRouter", "AWS Bedrock", "Docker", "Caddy", "GitHub Actions", "pytest"],
    links: [{ href: "https://github.com/rishi-sangare/case-studies/blob/main/llm-matching-evals.md", label: "Long-form write-up" }],
  },
  {
    slug: "evals",
    title: "Evals that tell the truth",
    org: "Across Tamago and RefineCV",
    role: "Designed and ran the evaluations",
    when: "2025 – 2026",
    line: "My first result said +30%. I didn't trust a number that good, found the artifact, and reported +12.9%.",
    numbers: [
      { v: "+12.9%", l: "honest holdout recall@20" },
      { v: "$2.31", l: "for about 48,000 LLM judgements" },
      { v: "3,162", l: "live turns in a 24-model bake-off" },
      { v: "0.982 vs 0.907", l: "winner vs incumbent" },
    ],
    sections: [
      { h: "The reranker trial", body: "I tested an LLM reranker on the Tamago matcher: about 48,000 judgements for $2.31. My first read said +30%. A number that good made me suspicious; it turned out to be an artifact of how I'd split the data. The honest holdout result was +12.9% recall@20. A bias audit over 540 probes found a maximum difference of 0.09. Cost: about $0.008 per search." },
      { h: "Choosing a model by measurement", body: "For RefineCV's CV-editing assistant I ran a 24-model, 61-scenario bake-off over 3,162 live turns. The winner scored 0.982 against the incumbent's 0.907." },
      { h: "Why this matters", body: "Most LLM features fail quietly. The work I'm proudest of is building the golden sets, judges and holdouts that make a number trustworthy, and reporting the smaller number when it's the true one." },
    ],
    stack: ["Golden sets", "recall@k", "LLM-as-judge", "holdout splits", "bias probes", "Python"],
  },
  {
    slug: "refinecv",
    title: "RefineCV",
    org: "LD Technologies · in-house product",
    role: "Co-lead engineer",
    when: "May – Sep 2026",
    line: "A B2B SaaS that turns any CV (PDF, DOCX, scans) into an agency-branded document, sold to recruitment agencies.",
    numbers: [
      { v: "435", l: "commits in five months" },
      { v: "203", l: "PRs authored" },
      { v: "63", l: "call sites secured" },
      { v: "24", l: "models compared for the AI assistant" },
    ],
    sections: [
      { h: "What it is", body: "RefineCV turns any candidate CV into an agency-branded document using LLM parsing, OCR and configurable templates, with teams, credits and billing." },
      { h: "Security", items: [
        "Found and fixed an authorization bug class where the API trusted a caller-supplied tenant ID at 63 call sites. The tenant is now derived on the server from membership.",
        "Revoked direct browser writes to billing tables, fixed owner-only RLS policies, hardened JWT, CORS and headers, and ran a pen-test style review with a numbered findings report.",
      ] },
      { h: "Reliability and quality", items: [
        "Intermittent production 500s turned out to be event-loop starvation from synchronous PDF rendering. I moved rendering to a serialized executor across all 5 call sites.",
        "An LLM-provider watchdog (/health/llm plus Slack) that discovered the production fallback model had been silently dead.",
        "A parsing-faithfulness scorecard on every deploy, Playwright end-to-end tests (12 staging and 10 production smoke flows), and a manual QA run system.",
      ] },
      { h: "Product", body: "On-canvas WYSIWYG editing with rich text, CV import, cover pages, an onboarding tour, OTP password reset, and credit and billing fixes." },
    ],
    stack: ["FastAPI", "WeasyPrint", "Jinja2", "React 19", "TypeScript", "Vite", "Zustand", "TanStack Query", "Tailwind", "Supabase", "Docker", "Caddy", "Cloudflare", "GitHub Actions", "Playwright", "pytest"],
    links: [{ href: "https://github.com/rishi-sangare/case-studies/blob/main/refinecv.md", label: "Long-form write-up" }],
  },
  {
    slug: "recruiter-copilot",
    title: "Recruiter Copilot",
    org: "LD Technologies · in-house product",
    role: "Built v1, then product owner for releases 1.0.11 – 1.0.21",
    when: "2025 – 2026",
    line: "A Chrome extension that scores every LinkedIn profile 0–100 against a job description, with pros and cons.",
    numbers: [
      { v: "11", l: "Chrome Web Store releases" },
      { v: "400+", l: "installs" },
      { v: "847", l: "Vitest tests" },
      { v: "121", l: "commits" },
    ],
    sections: [
      { h: "How it works", body: "A recruiter uploads a job description and browses LinkedIn. The extension pre-matches on the client, sends the profile to a Supabase Edge Function, and an LLM returns a 0–100 fit score with reasons." },
      { h: "What I'm proud of", items: [
        "Closed a cross-account data leak through Postgres SECURITY DEFINER functions that bypassed row-level security, and a payment round-trip that refunded the free allowance.",
        "Accounts and billing: required sign-up with email OTP, a one-time free-credit grant tied to verified usage, Dodo Payments webhooks.",
        "Telemetry: Slack error alerts with fingerprint dedup and spike thresholds, sign-up and install alerts, release-adoption alerts at 60% and 90%. One schema bug turned out to cause 32 of 75 weekly errors.",
        "LinkedIn quirks: lazy-loaded profile sections, re-scoring when content changes on scroll, a fast path for revisits.",
      ] },
    ],
    stack: ["JavaScript (MV3)", "Supabase (Postgres, RLS, Edge Functions)", "OpenRouter", "Dodo Payments", "Vitest", "Playwright"],
    links: [{ href: "https://github.com/rishi-sangare/case-studies/blob/main/recruiter-copilot.md", label: "Long-form write-up" }],
  },
  {
    slug: "mitwa",
    title: "Fine-tuning Mistral-7B with DPO",
    org: "Mitwa.ai",
    role: "Backend and ML engineer",
    when: "Dec 2023 – Apr 2024",
    line: "With three college friends I built the backend of an AI wellbeing companion, then fine-tuned Mistral-7B when the base model wasn't good enough.",
    numbers: [
      { v: "7B", l: "Mistral, DPO fine-tuned" },
      { v: "6k + 18k", l: "preference pairs" },
      { v: "4", l: "friends, one product" },
    ],
    sections: [
      { h: "What happened", body: "I built the backend, auth and OpenAI integration for an AI wellbeing companion. When the base model wasn't good enough, a friend and I fine-tuned Mistral-7B with DPO: for every prompt, a chosen answer and a rejected one, on datasets of 6k and 18k pairs." },
      { h: "Why it matters", body: "It's where I learned that a model is only as good as the data and the measurement around it, which is the thread through everything I've built since." },
    ],
    stack: ["Python", "Hugging Face TRL", "Mistral-7B", "OpenAI API"],
    links: [{ href: "https://huggingface.co/Rishi-19", label: "Models on Hugging Face" }],
  },
  {
    slug: "freelance",
    title: "Freelance: agent evals and automations",
    org: "Upwork",
    role: "AI and automation engineer",
    when: "Jun 2026 – now",
    line: "Graded AI coding agents against real upstream bugs, and built duplicate-safe automations for small businesses.",
    numbers: [
      { v: "4", l: "open-source codebases used to grade agents" },
      { v: "2", l: "n8n pipelines with failure tests" },
    ],
    sections: [
      { h: "Evaluating coding agents", body: "I evaluated AI coding agents on SQLAlchemy, SymPy, NetworkX and Astropy, reproducing real upstream bugs to grade the models' fixes." },
      { h: "Automations", body: "Self-hosted n8n pipelines (Stripe → Thinkific → Slack, and lead enrichment → HubSpot) with duplicate-safe webhooks and full failure-test suites." },
    ],
    stack: ["Python", "pytest", "n8n", "Stripe", "HubSpot", "Docker"],
  },
];

export const bySlug = (s: string) => projects.find((p) => p.slug === s);

/** The career as a sequence, for the Work page. Cards without a slug have no case study. */
export type Tok = { t: string; yr?: string; slug?: string; card?: { title: string; when: string; line: string; stat: string } };
export const sequence: Tok[] = [
  { t: "NMIMS", yr: "'21", card: { title: "NMIMS, Mumbai", when: "2021 – 2026", line: "MBA Tech: computer engineering with finance. Smart India Hackathon 2024 and 2025.", stat: "MBA Tech · CS + Finance" } },
  { t: "Mitwa · DPO", yr: "'23", slug: "mitwa" },
  { t: "Paragon", yr: "'24", card: { title: "Paragon Dynamics", when: "May – Jul 2024 · intern", line: "A visitor-management system for shipping and logistics; optimised slow queries.", stat: "Angular · Flask · PostgreSQL" } },
  { t: "Keras PR", card: { title: "Keras", when: "open source", line: "A merged contribution: numpy.view for the OpenVINO backend.", stat: "PR #22407 · merged" } },
  { t: "LD Tech", yr: "'25", card: { title: "LD Technologies", when: "Feb 2025 – now · full-time, remote", line: "AI and backend engineer for clients in Japan and the UK, plus two in-house products.", stat: "Saachi · Tamago · JustRecruit" } },
  { t: "Tamago", slug: "tamago" },
  { t: "evals", slug: "evals" },
  { t: "RefineCV", slug: "refinecv" },
  { t: "Copilot", slug: "recruiter-copilot" },
  { t: "CRM · UK", slug: "crm-migration" },
  { t: "Upwork", yr: "'26", slug: "freelance" },
  { t: "▮", yr: "next" },
];
/** How later work drew on earlier work. My judgment, not model attention. */
export const arcs: Record<number, [number, number][]> = {
  5: [[1, .5], [4, .6]], 6: [[1, .45], [5, .75]], 7: [[4, .5], [6, .45]], 8: [[7, .65]], 9: [[4, .5]], 10: [[6, .4]], 11: [[5, .45], [6, .6], [7, .5]],
};

export const person = {
  name: "Rishi Sangare",
  role: "AI / LLM engineer",
  location: "Mumbai · works US hours",
  email: "sangarerishi@gmail.com",
  github: "https://github.com/rishi-sangare",
  linkedin: "https://www.linkedin.com/in/rishi-sangare",
  huggingface: "https://huggingface.co/Rishi-19",
  cv: "/cv/",
};
