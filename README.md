# Forward Pass

My portfolio, built as one LLM forward pass that ends in a person. Ask it a question: one GPU dot cloud carries
it through GPT-2's real tokenizer, a meaning space beside my projects, real GPT-2 attention and the twelve layers,
and finally into my portrait, while the answer line sharpens layer by layer into who I am.

**Live:** https://rishi-sangare.github.io

- `src/journey/engine.ts`: the home page engine (one scroll clock, six-stage morph shader, cursor push, labels)
- `src/journey/sound.ts`: generated Web Audio sound, off by default
- `src/data/projects.ts`: every project and number, used by the journey, case studies, Work page and CV
- `src/data/journey.ts`: the chapters, plus the real GPT-2 attention and residual norms for the preset question
- `public/poses/*.txt`: the portrait as dot positions (base64), made by `scripts/portrait.py` from photos
- `scripts/export.py`: exports GPT-2 attention, residual norms and logits
- Stack: Next.js 16 (static export), three.js, gpt-tokenizer, GitHub Pages

```bash
npm i && npm run dev        # http://localhost:3000
npm run build               # static site in out/
```
