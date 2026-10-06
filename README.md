# Forward Pass

My portfolio, built as an LLM forward pass. Your question goes through a real GPT-2 tokenizer and a real
embedding model in your browser, then down through real GPT-2 attention, residual norms and logits
(exported from PyTorch), and every stage opens one of my projects.

**Live:** https://rishi-sangare.github.io

- `src/components/three/*`: React Three Fiber scenes (253,541-particle migration, embedding cloud, attention arcs, layer stack, logit bars)
- `src/lib/model.ts`: Transformers.js tokenizer + all-MiniLM-L6-v2 (WebGPU, WASM fallback)
- `scripts/export.py`: exports GPT-2 attention / residual norms / logits and MiniLM embeddings + PCA basis
- Stack: Next.js 16 (static export), three.js r186, R3F 9, drei, postprocessing, GSAP 3.15, Lenis

```bash
npm i && npm run dev        # http://localhost:3000
uv run --with torch --with transformers --with numpy scripts/export.py   # regenerate model data
```

3D LLM layout inspired by Brendan Bycroft's LLM Visualization (MIT).
