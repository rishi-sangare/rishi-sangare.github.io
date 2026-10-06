// The home page: one forward pass. Each chapter is a model stage, a logit-lens guess at who Rishi is,
// and the work that guess rests on. Chips with a slug open that project's case study.

export type Chip = { t: string; slug?: string };
export type Chapter = {
  name: string;
  L: number;                 // layer shown in the corner
  ans: string;               // the model's current answer (written in logit-lens style)
  focus: string;             // the word under focus
  c: [string, number][];     // candidates for the focus word
  ev: Chip[];
  st: string;                // status line
  feature?: string;          // the case study this chapter is about
};

export const PRESET = "Who is Rishi Sangare?";
export const PRESETS = [PRESET, "Can Rishi ship LLM products?", "What has Rishi built?"];
export const PRESET_TOKENS: [string, number][] = [["Who", 8241], [" is", 318], [" R", 371], ["ishi", 21644], [" Sang", 30043], ["are", 533], ["?", 30]];
// GPT-2 small, layer 12, what "?" attends to (mean of 12 heads, first-token sink removed, renormalised)
export const PRESET_ATT = [0.15, 0.14, 0.12, 0.12, 0.04, 0.43];
// GPT-2 small residual-stream norms after each of the 12 blocks, for the preset question
export const NORMS = [64.5, 141.2, 419.6, 449.7, 477.4, 497.1, 513.7, 530.7, 548.4, 575.1, 647.1, 194.4];

export const chapters: Chapter[] = [
  {
    name: "prompt", L: 0, ans: "Rishi is ▮", focus: "▮",
    c: [["a", .12], ["the", .09], ["from", .07], ["an", .06]], ev: [],
    st: "type a question, or scroll to run it through the model",
  },
  {
    name: "tokenize", L: 3, ans: "Rishi is an engineer who moves data", focus: "data", feature: "crm-migration",
    c: [["data", .29], ["code", .21], ["money", .07], ["fast", .06]],
    ev: [{ t: "CRM migration · 253,541 records, 0 missing", slug: "crm-migration" }, { t: "574 tables, no keys", slug: "crm-migration" }, { t: "99.97% exact after repair", slug: "crm-migration" }],
    st: "tokenize · messy input becomes clean units: your words here, an 18 GB CRM at work",
  },
  {
    name: "embed", L: 6, ans: "Rishi is an engineer who builds search with LLMs", focus: "search", feature: "tamago",
    c: [["search", .33], ["agents", .18], ["apps", .15], ["models", .09]],
    ev: [{ t: "recall@10 0.19 → 0.57", slug: "tamago" }, { t: "Japanese hits@10 2.2 → 6.6", slug: "tamago" }, { t: "Elasticsearch + kuromoji", slug: "tamago" }],
    st: "embed · meaning becomes position; your question lands beside my work",
  },
  {
    name: "attend", L: 9, ans: "Rishi builds LLM systems that remember context", focus: "context", feature: "tamago",
    c: [["context", .37], ["users", .16], ["state", .14], ["rules", .05]],
    ev: [{ t: "85% → 0% broken clarifying questions", slug: "tamago" }, { t: "English in Japanese 16/16 → 0/16", slug: "tamago" }, { t: "idempotent sessions · HMAC webhooks", slug: "tamago" }],
    st: "attend · the last token pulls on what it reads (real GPT-2 weights for the preset question)",
  },
  {
    name: "layers", L: 11, ans: "Rishi learned LLMs from the weights up", focus: "weights", feature: "mitwa",
    c: [["weights", .34], ["ground", .22], ["basics", .12], ["papers", .07]],
    ev: [{ t: "Mitwa.ai · DPO on Mistral-7B", slug: "mitwa" }, { t: "Keras PR #22407 merged" }, { t: "NMIMS · MBA Tech, CS + Finance" }],
    st: "layers · twelve blocks; ring size is the real residual norm at each layer",
  },
  {
    name: "output", L: 12, ans: "Rishi ships LLM systems and measures them honestly.", focus: "honestly", feature: "evals",
    c: [["honestly", .46], ["carefully", .19], ["quickly", .08], ["at scale", .05]],
    ev: [{ t: "+30% claimed → +12.9% reported", slug: "evals" }, { t: "RefineCV · 435 commits", slug: "refinecv" }, { t: "Recruiter Copilot · 400+ installs", slug: "recruiter-copilot" }],
    st: "output · next token ▸ hire 62%  ·  interview 21%  ·  email 9%",
  },
];

export const PROJECT_ANCHORS: [string, string, [number, number, number]][] = [
  ["Tamago matching", "tamago", [-2.6, .9, -.4]], ["RefineCV", "refinecv", [2.5, 1.2, .2]], ["Recruiter Copilot", "recruiter-copilot", [2.7, -.8, -.3]],
  ["CRM migration", "crm-migration", [-2.5, -1.0, .5]], ["Mitwa DPO", "mitwa", [-.6, 2.0, -1.2]], ["Evals", "evals", [.9, 2.1, -1.0]],
];

export const FACTS = ["AI / LLM engineer", "Mumbai · works US hours", "LLM products for Japan and the UK", "open to full-time remote"];
