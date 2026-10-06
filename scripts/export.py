"""Export real model data for the Forward Pass portfolio.

- GPT-2 small: tokens, attention (12 layers x 12 heads), residual-stream norms per layer,
  and next-token logits (top 40) for a handful of preset prompts.
- all-MiniLM-L6-v2: embeddings for project/skill documents + a 3D PCA layout, so the browser
  can embed the visitor's question with the same model and find the nearest documents.

Run: uv run --with torch --with transformers --with numpy export.py
"""
import json, math
from pathlib import Path

import numpy as np
import torch
from transformers import AutoModel, AutoTokenizer, GPT2LMHeadModel, GPT2TokenizerFast

OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)

PROMPTS = [
    "Who is Rishi Sangare?",
    "What has Rishi built?",
    "Can Rishi ship LLM products?",
    "Why should we hire Rishi?",
]

# ---------------------------------------------------------------- GPT-2
tok = GPT2TokenizerFast.from_pretrained("gpt2")
gpt = GPT2LMHeadModel.from_pretrained("gpt2", attn_implementation="eager").eval()

def r(x, n=4):
    return [round(float(v), n) for v in x]

gpt_out = []
for p in PROMPTS:
    enc = tok(p, return_tensors="pt")
    with torch.no_grad():
        o = gpt(**enc, output_attentions=True, output_hidden_states=True)
    ids = enc["input_ids"][0].tolist()
    T = len(ids)
    att = [[[r(row, 3) for row in head] for head in layer[0].tolist()] for layer in o.attentions]  # [L][H][T][T]
    norms = [r(h[0].norm(dim=-1).tolist(), 2) for h in o.hidden_states]  # [L+1][T]
    logits = o.logits[0, -1]
    top = torch.topk(logits, 40)
    gpt_out.append({
        "prompt": p,
        "ids": ids,
        "tokens": [tok.decode([i]) for i in ids],
        "attention": att,
        "residualNorms": norms,
        "next": {"ids": top.indices.tolist(), "tokens": [tok.decode([i]) for i in top.indices.tolist()],
                  "logits": r(top.values.tolist(), 3)},
    })
    print(p, T, "tokens; top next:", [tok.decode([i]) for i in top.indices[:5].tolist()])

(OUT / "gpt2.json").write_text(json.dumps({"model": "gpt2 (124M)", "layers": 12, "heads": 12, "prompts": gpt_out}))

# ---------------------------------------------------------------- embeddings
DOCS = [
    ("migration", "CRM data migration: 18 GB legacy SQL Server with no keys moved into a REST-only CRM. 253,541 activities, 36,661 people, 0 records missing, idempotent ETL in Node.js."),
    ("migration", "Found a platform concurrency bug that created invisible ghost rows during parallel loads, and re-architected the loader."),
    ("migration", "Reconciliation: 99.97% content-exact after restoring 49,725 activities and re-linking 1,901 hiring managers."),
    ("retrieval", "Elasticsearch candidate and job search with wage, language, age and company filters for a Japanese recruiting database."),
    ("retrieval", "Rebuilt a filter-aware golden set: recall@10 went from 0.19 to 0.57 on identical model outputs."),
    ("retrieval", "Hybrid search with BM25 and vectors on AWS OpenSearch, built with FastAPI and AWS CDK."),
    ("attention", "Three-turn interactive LLM pre-screening: clarifying questions, deal-breaker classification, retrieval, parallel LLM judges and HMAC-signed webhooks."),
    ("attention", "Cut degenerate clarifying questions from 85% to 0% and stopped English leaking into Japanese sessions."),
    ("attention", "Multi-provider LLM fallback with Cerebras and OpenRouter, hardened against malformed JSON output."),
    ("layers", "Fine-tuned Mistral-7B with DPO on 6k and 18k preference pairs for an AI wellbeing companion at Mitwa.ai."),
    ("layers", "Merged open-source contribution to Keras: implemented numpy.view for the OpenVINO backend."),
    ("layers", "Built a transformer language model from scratch in Python to understand attention and training."),
    ("eval", "LLM reranker trial with 48,000 judgements for $2.31; caught an inflated +30% result and reported an honest +12.9% on holdout."),
    ("eval", "24-model by 61-scenario LLM bake-off over 3,162 live turns to choose a production model: 0.982 versus 0.907."),
    ("eval", "Bias audit with 540 controlled probes, token cost benchmarks per session, golden sets and LLM-as-judge."),
    ("decode", "RefineCV: B2B CV formatting SaaS with FastAPI, React 19, Supabase and WeasyPrint. 435 commits and 203 pull requests in five months."),
    ("decode", "Fixed a cross-tenant authorization flaw across 63 API call sites and hardened the production server."),
    ("decode", "Diagnosed intermittent production 500 errors caused by synchronous PDF rendering starving the async event loop."),
    ("decode", "Recruiter Copilot Chrome extension: scores LinkedIn profiles against a job description. 11 releases, 400+ installs, fixed a cross-account data leak."),
    ("decode", "Revenue automation on self-hosted n8n with Stripe, Thinkific and Slack, duplicate-safe webhooks, 11 of 11 failure tests passing."),
    ("about", "AI engineer based in Mumbai, India, working US hours, open to full-time remote roles in LLM engineering."),
    ("about", "Treats LLMs as unreliable components: validate, fall back, alert. Measures before claiming."),
    ("about", "Uses AI coding agents like Claude Code every day with discipline: plans, review gates, tests."),
    ("about", "MBA Tech in Computer Engineering from NMIMS Mumbai. Smart India Hackathon 2024 and 2025."),
]

etok = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
emod = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2").eval()

def embed(texts):
    b = etok(texts, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        h = emod(**b).last_hidden_state
    m = b["attention_mask"].unsqueeze(-1).float()
    v = (h * m).sum(1) / m.sum(1)
    return torch.nn.functional.normalize(v, dim=-1).numpy()

V = embed([d[1] for d in DOCS])
C = V - V.mean(0)
U, S, Wt = np.linalg.svd(C, full_matrices=False)
xyz = C @ Wt[:3].T
scale = float(np.abs(xyz).max())
xyz = xyz / scale
(OUT / "embeddings.json").write_text(json.dumps({
    "model": "all-MiniLM-L6-v2",
    # PCA basis so the browser can project the visitor's query into the same 3D space
    "mean": r(V.mean(0), 6), "components": [r(c, 6) for c in Wt[:3]], "scale": scale,
    "docs": [{"group": g, "text": t, "pos": r(xyz[i], 4), "vec": r(V[i], 5)} for i, (g, t) in enumerate(DOCS)],
}))
q = embed(["Who is Rishi Sangare?"])[0]
sims = V @ q
print("embedding sanity, top docs for default prompt:", [DOCS[i][1][:50] for i in np.argsort(-sims)[:3]])
print("done", list(OUT.iterdir()))
