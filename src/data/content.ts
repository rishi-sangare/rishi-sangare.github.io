// Every number here is real and comes from git history, production reconciliation reports or eval runs.

export const person = {
  name: "Rishi Sangare",
  role: "AI / LLM Engineer",
  line: "20 months shipping LLM products to recruiters in Japan and the UK, and measuring whether they actually work.",
  location: "Mumbai, India · works US hours",
  email: "sangarerishi@gmail.com",
  github: "https://github.com/rishi-sangare",
  linkedin: "https://www.linkedin.com/in/rishi-sangare",
  huggingface: "https://huggingface.co/Rishi-19",
  caseStudies: "https://github.com/rishi-sangare/case-studies",
};

export type Stat = { v: string; l: string };
export type Scene = {
  id: string;
  n: string;
  stage: string;
  title: string;
  model: string; // what this stage does inside an LLM
  project: string;
  kicker: string;
  story: string[];
  stats: Stat[];
  link?: { href: string; label: string };
};

export const scenes: Scene[] = [
  {
    id: "tokenize", n: "01", stage: "Tokenize",
    title: "Messy text in, clean tokens out.",
    model: "Before a model reads anything, raw text is split into tokens and mapped to ids. Garbage in, garbage out starts here.",
    project: "CRM migration · UK recruitment agency",
    kicker: "Sole engineer",
    story: [
      "A legacy SQL Server CRM: 18 GB, 574 tables, not a single declared key. The destination only accepted writes through a REST API.",
      "I built an idempotent ETL in Node.js with deterministic UUIDv5 ids, checkpoints, canary gates and a loader that halts itself on anomalies. It ran unattended overnight.",
      "Mid-migration, parallel writes started creating invisible \"ghost\" rows on the target platform. I traced it, proved it, and re-architected the load around it.",
    ],
    stats: [
      { v: "253,541", l: "activities migrated" },
      { v: "36,661", l: "people" },
      { v: "0", l: "records missing" },
      { v: "99.97%", l: "exact on reconciliation" },
    ],
  },
  {
    id: "embed", n: "02", stage: "Embed",
    title: "Meaning becomes geometry.",
    model: "Each token becomes a vector. Similar meanings land close together, and search becomes a question of distance.",
    project: "AI matching · large Japanese recruiting database",
    kicker: "Retrieval + evals",
    story: [
      "Recruiters paste a job description and get a ranked shortlist: Elasticsearch retrieval with salary, language, age and company filters, in English and Japanese.",
      "Our offline score said recall@10 was 0.19, which would mean the system was nearly useless. Before touching the model, I checked the ruler.",
      "The golden set ignored the request filters, so we were grading answers the system was never allowed to give. Rebuilt filter-aware, same outputs: 0.57.",
    ],
    stats: [
      { v: "0.19 → 0.57", l: "recall@10, same model" },
      { v: "2.2 → 6.6", l: "Japanese hits@10" },
      { v: "253", l: "commits · 128 PRs" },
    ],
  },
  {
    id: "attend", n: "03", stage: "Attend",
    title: "Every token decides what to listen to.",
    model: "Attention lets each token weigh every earlier token. Below is real GPT-2 attention for this exact sentence: pick any of its 12 layers and 12 heads.",
    project: "3-turn LLM pre-screening flows",
    kicker: "Multi-turn orchestration",
    story: [
      "The matcher became a conversation: the LLM asks clarifying questions and a deal-breaker, classifies the answers in parallel, retrieves, then fans out to LLM judges and calls back with an HMAC-signed webhook.",
      "State has to survive across turns, in two languages, with idempotent sessions. Context is everything, which is what attention is for.",
    ],
    stats: [
      { v: "85% → 0%", l: "broken clarifying questions" },
      { v: "16/16 → 0/16", l: "English leaking into Japanese" },
      { v: "72", l: "live scenarios verified" },
    ],
  },
  {
    id: "layers", n: "04", stage: "Layers",
    title: "Down through the stack.",
    model: "The residual stream flows through layer after layer. Brightness here is the real activation norm of each GPT-2 layer for your prompt.",
    project: "Fine-tuning Mistral-7B · Mitwa.ai · Keras",
    kicker: "Where it started",
    story: [
      "With three college friends I built the backend of an AI wellbeing companion. When the base model wasn't good enough, a friend and I fine-tuned Mistral-7B with DPO: for every prompt, a chosen answer and a rejected one.",
      "That's the two streams you see splitting. It's what got me into LLMs. Later I landed a merged contribution in Keras (numpy.view for the OpenVINO backend).",
    ],
    stats: [
      { v: "7B", l: "Mistral, DPO fine-tuned" },
      { v: "6k + 18k", l: "preference pairs" },
      { v: "#22407", l: "merged into Keras" },
    ],
    link: { href: "https://huggingface.co/Rishi-19", label: "Models on Hugging Face" },
  },
  {
    id: "sample", n: "05", stage: "Sample + evaluate",
    title: "How do you know it's right?",
    model: "The model outputs a probability for every possible next token. Drag the temperature: these are GPT-2's real logits for your prompt.",
    project: "Eval harnesses, golden sets, honest numbers",
    kicker: "Measure before claiming",
    story: [
      "I ran an LLM reranker trial: about 48,000 judgements for $2.31. My first result said +30%. I didn't trust a number that good, found it was an artifact of how I'd split the data, and reported the honest one.",
      "For RefineCV's AI assistant I ran a 24-model, 61-scenario bake-off over 3,162 live turns before picking one.",
    ],
    stats: [
      { v: "+12.9%", l: "honest holdout recall@20" },
      { v: "$2.31", l: "for 48k LLM judgements" },
      { v: "0.982 vs 0.907", l: "winner vs incumbent" },
    ],
  },
  {
    id: "decode", n: "06", stage: "Decode",
    title: "Tokens become product.",
    model: "Sampled tokens stream out one by one. This is where models turn into things people actually use.",
    project: "RefineCV · Recruiter Copilot",
    kicker: "Shipped, owned, on-call",
    story: [
      "RefineCV turns any CV into an agency-branded document (FastAPI, React 19, Supabase, WeasyPrint). I co-led engineering: 435 commits and 203 PRs in five months, a cross-tenant authorization fix across 63 call sites, and the root cause of random 500s (PDF rendering starving the event loop).",
      "Recruiter Copilot is a Chrome extension that scores LinkedIn profiles against a job. I built v1 and shipped 11 releases, closing a cross-account data leak and a billing exploit along the way.",
    ],
    stats: [
      { v: "435", l: "commits in 5 months" },
      { v: "63", l: "call sites secured" },
      { v: "11", l: "Web Store releases" },
      { v: "400+", l: "installs" },
    ],
    link: { href: "https://github.com/rishi-sangare/case-studies", label: "Read the case studies" },
  },
];

export const skills = ["Python", "FastAPI", "Elasticsearch", "LLM evals", "TypeScript", "React", "Supabase", "Docker", "AWS", "GSAP", "Three.js", "Claude Code"];
