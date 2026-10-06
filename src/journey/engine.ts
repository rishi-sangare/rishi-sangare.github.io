// The home page engine: one clock (scroll → one damped progress value → everything), one GPU dot cloud
// that morphs through six stages, a logit-lens answer line, cursor push, and generated sound.
import * as THREE from "three";
import { chapters as CH, PRESET, PRESETS, PRESET_TOKENS, PRESET_ATT, NORMS, PROJECT_ANCHORS } from "@/data/journey";
import { person } from "@/data/projects";
import { createSound } from "./sound";

type Tok = [string, number];
type Opts = { onOpen: (slug: string) => void };
const NCH = CH.length;
const STEP = 1.3; // viewport heights of scroll per chapter
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const gauss = (i: number, k: number) => { const u = Math.max(1e-6, hash(i * 1.37 + k)), v = hash(i * 2.11 + k + 7); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const GL = "▮▯<>/\\=+*#%&01{}[]·:;_~";
const POSES = ["/poses/pose-front.txt", "/poses/pose-up.txt"]; // add the side profile here when its photo is available

export function startJourney(root: HTMLElement, opts: Opts) {
  const $ = <T extends HTMLElement = HTMLElement>(k: string) => root.querySelector(`[data-j="${k}"]`) as T;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE = matchMedia("(max-width: 700px)").matches || matchMedia("(hover: none)").matches;
  const N = MOBILE ? 20000 : 56000;
  const disposers: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, ev: K | string, fn: (e: any) => void, o?: AddEventListenerOptions) => { t.addEventListener(ev, fn, o); disposers.push(() => t.removeEventListener(ev, fn)); };
  const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-newsreader").trim() || "Georgia";

  let tokens: Tok[] = PRESET_TOKENS.slice();
  let tokApi: { encode: (s: string) => number[]; decode: (ids: number[]) => string } | null = null;
  import("gpt-tokenizer/encoding/r50k_base").then((m) => { tokApi = m as any; }).catch(() => {});

  // phones get their own layout: the cloud is fitted, stage by stage, into the space above the bottom panel
  let PHONE = innerWidth < 760, VH = 6.55, VW = 6.55;
  const boxes = Array.from({ length: 6 }, () => ({ cx: 0, cy: 0, w: 1, h: 1 }));
  function measure(k: number) {
    const a = A[k]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i += 5) { const x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const spins = k === 2 || k === 3; // these stages turn slowly, so allow for depth becoming width
    const lab = k === 1 ? .7 : 0; // room for the id labels under the token rows
    boxes[k] = { cx: (x0 + x1) / 2, cy: (y0 + y1 - lab) / 2, w: spins ? Math.max(x1 - x0, z1 - z0) * 1.08 : x1 - x0, h: y1 - y0 + lab };
  }

  // ── renderer ──
  const canvas = $<HTMLCanvasElement>("gl") as unknown as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  const DPR = Math.min(devicePixelRatio, MOBILE ? 1.5 : 2);
  renderer.setPixelRatio(DPR); renderer.setClearColor(0x0c0b0a, 1);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, .1, 100); cam.position.set(0, 0, 9);
  const world = new THREE.Group(); scene.add(world);

  // ── point targets: a0 question, a1 tokens, a2 meaning space, a3 attention, a4 layers, a5..a8 portrait poses ──
  const geo = new THREE.BufferGeometry();
  const A = Array.from({ length: 9 }, () => new Float32Array(N * 3));
  const aB = new Float32Array(N * 4).fill(1), aD = new Float32Array(N), aR = new Float32Array(N), aTok = new Float32Array(N);
  for (let i = 0; i < N; i++) { aD[i] = hash(i + .5) * .35; aR[i] = hash(i * 3.3); }
  geo.setAttribute("position", new THREE.BufferAttribute(A[0], 3));
  A.forEach((a, k) => geo.setAttribute("a" + k, new THREE.BufferAttribute(a, 3)));
  geo.setAttribute("aB", new THREE.BufferAttribute(aB, 4)); geo.setAttribute("aD", new THREE.BufferAttribute(aD, 1));
  geo.setAttribute("aR", new THREE.BufferAttribute(aR, 1)); geo.setAttribute("aTok", new THREE.BufferAttribute(aTok, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  const blobPos: [number, number, number][] = [], attW: number[] = [];
  let tokCenters: [number, number, number][] = [];
  function buildQuestion(text: string) {
    const c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true })!, FS = 150;
    const font = `italic 300 ${FS}px ${serif}`;
    g.font = font; const tw = g.measureText(text).width;
    c.width = Math.ceil(tw + 40); c.height = Math.ceil(FS * 1.5);
    g.font = font; g.fillStyle = "#fff"; g.textBaseline = "middle"; g.fillText(text, 20, c.height / 2);
    const d = g.getImageData(0, 0, c.width, c.height).data, pix: number[] = [];
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 120) pix.push(x, y);
    const s = 9.03 / tw;
    const bounds: number[] = []; let accw = 0; tokens.forEach(([t]) => { accw += g.measureText(t).width; bounds.push(20 + accw); });
    const n = tokens.length, last = n - 1;
    const perRow = PHONE && n > 4 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / perRow);
    const spacing = PHONE ? Math.min(1.25, 6 / perRow) : Math.min(1.25, 9 / n);
    blobPos.length = 0; tokCenters = [];
    tokens.forEach(([, id], j) => {
      const a = hash(id * .013) * 6.283, el = (hash(id * .021) - .5) * 1.4, r = .9 + hash(id * .037) * .9;
      blobPos.push([Math.cos(a) * r, el, Math.sin(a) * r * .8]);
      const row = Math.floor(j / perRow), col = j % perRow, inRow = row === rows - 1 ? n - perRow * (rows - 1) : perRow;
      tokCenters.push([(col - (inRow - 1) / 2) * spacing, rows > 1 ? (row === 0 ? .62 : -.78) : 0, 0]);
    });
    attW.length = 0;
    const preset = text === PRESET;
    for (let j = 0; j < last; j++) attW.push(preset ? PRESET_ATT[j] : (j + 1) / (last * (last + 1) / 2));
    const P = pix.length / 2;
    for (let i = 0; i < N; i++) {
      const k = Math.floor(hash(i * .731 + text.length) * P), px = pix[k * 2], py = pix[k * 2 + 1];
      let ti = 0; while (ti < n - 1 && px > bounds[ti]) ti++;
      aTok[i] = ti === last ? 1 : 0;
      A[0].set([(px - 20 - tw / 2) * s, -(py - c.height / 2) * s, (hash(i * 9.1) - .5) * .05], i * 3);
      const tc = tokCenters[ti], side = Math.min(.62, spacing * .58);
      A[1].set([tc[0] + (hash(i * 1.9) - .5) * side, tc[1] + (hash(i * 2.7) - .5) * side, (hash(i * 3.9) - .5) * side], i * 3);
      const b = blobPos[ti];
      A[2].set([b[0] + gauss(i, 1) * .22, b[1] + gauss(i, 2) * .22, b[2] + gauss(i, 3) * .22], i * 3);
      const lb = blobPos[last], w = ti === last ? 0 : attW[ti] * 1.4, L = THREE.MathUtils.lerp;
      A[3].set([L(b[0], lb[0], w) * .85 + gauss(i, 4) * .2, L(b[1], lb[1], w) * .85 + gauss(i, 5) * .2, L(b[2], lb[2], w) * .85 + gauss(i, 6) * .2], i * 3);
    }
    [0, 1, 2, 3].forEach((k) => { (geo.attributes["a" + k] as THREE.BufferAttribute).needsUpdate = true; });
    geo.attributes.aTok.needsUpdate = true; geo.attributes.position.needsUpdate = true;
    buildThreads(); buildTokLabels();
    [0, 1, 2, 3].forEach((k) => measure(k));
  }
  // layers (real residual norms) and a placeholder figure until the portrait loads
  for (let i = 0; i < N; i++) {
    const L = Math.floor(hash(i * 4.4) * 12), a = hash(i * 5.5) * 6.283;
    const r = .7 + 1.5 * Math.log(NORMS[L]) / Math.log(650) + gauss(i, 9) * .025;
    A[4].set([Math.cos(a) * r, 2.1 - L * .38 + gauss(i, 10) * .02, Math.sin(a) * r * .55], i * 3);
    const u = hash(i * 7.7) * 6.283, v = Math.acos(2 * hash(i * 8.8) - 1);
    const head = hash(i * 6.6) < .55;
    const x = head ? .36 * Math.sin(v) * Math.cos(u) : .86 * Math.sin(v) * Math.cos(u), y = head ? .47 * Math.cos(v) + .62 : Math.max(-.5, -.3 + .34 * Math.cos(v));
    for (let k = 5; k < 9; k++) A[k].set([x * 2.3, y * 2.3 - .35, .3 * Math.sin(v) * Math.sin(u) * 2.3], i * 3);
  }
  measure(4); measure(5);
  let nPoses = 1;
  async function loadPoses() {
    const got: Uint8Array[] = [];
    for (const f of POSES) {
      try { const r = await fetch(f); if (r.ok) { const bin = atob((await r.text()).replace(/\s/g, "")), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); got.push(u); } } catch {}
    }
    if (!got.length || dead) return;
    nPoses = got.length;
    for (let k = 0; k < 4; k++) {
      const buf = got[k % got.length], P = buf.byteLength / 7, q = new Uint16Array(buf.buffer, 0, P * 3), b = buf.subarray(P * 6), tgt = A[5 + k];
      for (let i = 0; i < N; i++) {
        const j = (i * 7919) % P;
        tgt[i * 3] = (q[j * 3] / 65535 * 2 - 1) * 1.75;
        tgt[i * 3 + 1] = (q[j * 3 + 1] / 65535 * 2 - 1) * 1.75 - .1;
        tgt[i * 3 + 2] = (q[j * 3 + 2] / 65535 - .5) * 1.1;
        aB[i * 4 + k] = .25 + .75 * b[j] / 255;
      }
      (geo.attributes["a" + (5 + k)] as THREE.BufferAttribute).needsUpdate = true;
    }
    geo.attributes.aB.needsUpdate = true;
    measure(5);
    $("note").textContent = nPoses > 1 ? "click the portrait to change the moment" : "made of dots from a photo · depth estimated by a model";
  }

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uS: { value: 0 }, uTime: { value: 0 }, uPix: { value: DPR }, uSize: { value: MOBILE ? 15 : 13 }, uAspect: { value: 1 },
      uTrail: { value: Array.from({ length: 10 }, () => new THREE.Vector3(9, 9, 1)) },
      uBone: { value: new THREE.Color("#EDE7DC") }, uAcc: { value: new THREE.Color("#FF6A3D") },
      uRM: { value: RM ? 1 : 0 }, uFrom: { value: 0 }, uTo: { value: 0 }, uPT: { value: 1 }, uDim: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 a0; attribute vec3 a1; attribute vec3 a2; attribute vec3 a3; attribute vec3 a4; attribute vec3 a5; attribute vec3 a6; attribute vec3 a7; attribute vec3 a8; attribute vec4 aB;
      attribute float aD; attribute float aR; attribute float aTok;
      uniform float uS, uTime, uPix, uSize, uAspect, uRM, uFrom, uTo, uPT, uDim; uniform vec3 uTrail[10];
      varying float vA; varying float vAcc;
      vec3 pose(float k){ return k < .5 ? a5 : k < 1.5 ? a6 : k < 2.5 ? a7 : a8; }
      float bri(float k){ return k < .5 ? aB.x : k < 1.5 ? aB.y : k < 2.5 ? aB.z : aB.w; }
      float e(float x){ x = clamp((x - aD) / .65, 0., 1.); return uRM > .5 ? step(.5, x) : x * x * (3. - 2. * x); }
      void main(){
        float pt = clamp((uPT - aD) / .65, 0., 1.); pt = pt * pt * (3. - 2. * pt);
        vec3 person = mix(pose(uFrom), pose(uTo), pt);
        vec3 p = a0;
        p = mix(p, a1, e(uS)); p = mix(p, a2, e(uS - 1.)); p = mix(p, a3, e(uS - 2.)); p = mix(p, a4, e(uS - 3.)); p = mix(p, person, e(uS - 4.));
        float idle = smoothstep(1.2, 2., uS) * (1. - uRM);
        p += idle * .02 * vec3(sin(uTime * 1.1 + aR * 50.), cos(uTime * .9 + aR * 40.), sin(uTime * .7 + aR * 30.));
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        vec2 ndc = gl_Position.xy / gl_Position.w, push = vec2(0.);
        for (int k = 0; k < 10; k++) {
          vec2 d = (ndc - uTrail[k].xy) * vec2(uAspect, 1.);
          float w = exp(-dot(d, d) / .006) * (1. - uTrail[k].z);
          push += normalize(d + 1e-5) * w;
        }
        gl_Position.xy += push * .035 * mix(1., .35, e(uS - 4.)) * gl_Position.w * (1. - uRM);   // gentler on the portrait
        float depth = clamp((-mv.z - 6.) / 6., 0., 1.);
        vA = mix(.95, .35, depth) * (.55 + .45 * aR) * mix(.72, 1., e(uS - 4.));   // more dots overall, so earlier stages are a touch fainter
        float lit = mix(bri(uFrom), bri(uTo), pt);
        vA *= mix(1., pow(lit, 1.6) * 1.45, e(uS - 4.)) * (1. - .78 * uDim);
        vAcc = aTok;
        gl_PointSize = uSize * uPix * (.65 + aR * .7) / -mv.z * mix(1., .7, e(uS - 4.));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBone, uAcc; varying float vA; varying float vAcc;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        gl_FragColor = vec4(mix(uBone, uAcc, vAcc), vA * smoothstep(.5, .15, d)); }`,
  });
  world.add(new THREE.Points(geo, mat));

  // attention threads
  const threads = new THREE.Group(); world.add(threads);
  function buildThreads() {
    threads.children.forEach((l: any) => { l.geometry.dispose(); l.material.dispose(); });
    threads.clear();
    const last = blobPos.length - 1, lb = new THREE.Vector3(...blobPos[last]).multiplyScalar(.85);
    attW.forEach((w, j) => {
      const b = new THREE.Vector3(...blobPos[j]).multiplyScalar(.85).lerp(lb, w * .7);
      const mid = b.clone().lerp(lb, .5); mid.y += .9 + w * 1.5;
      const pts = new THREE.QuadraticBezierCurve3(lb, mid, b).getPoints(48);
      const strands = 1 + Math.round(w * 10);
      for (let k = 0; k < strands; k++) {
        const off = new THREE.Vector3((hash(j * 9 + k) - .5) * .06, (hash(j * 7 + k) - .5) * .06, (hash(j * 5 + k) - .5) * .06);
        const m = new THREE.LineBasicMaterial({ color: "#FF6A3D", transparent: true, opacity: 0, depthWrite: false });
        m.userData.w = (w / strands) * 2;
        threads.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((q, n) => q.clone().addScaledVector(off, Math.sin((Math.PI * n) / 48)))), m));
      }
    });
  }

  // DOM labels riding 3D anchors
  const labelsEl = $("labels");
  type Lbl = { el: HTMLElement; p: THREE.Vector3; tok?: boolean };
  let tokLabels: Lbl[] = [];
  function buildTokLabels() {
    tokLabels.forEach((l) => l.el.remove());
    tokLabels = tokens.map(([t, id], j) => {
      const el = document.createElement("div"); el.className = "j-lbl tok";
      el.innerHTML = `<span>${esc(t.replace(/^ /, "·"))}</span><br>${id}`;
      labelsEl.appendChild(el); return { el, p: new THREE.Vector3(tokCenters[j][0], tokCenters[j][1] - .62, 0), tok: true };
    });
  }
  const projLabels: Lbl[] = PROJECT_ANCHORS.map(([name, slug, p]) => {
    const el = document.createElement("button"); el.type = "button"; el.className = "j-lbl proj"; el.textContent = name;
    el.onclick = () => opts.onOpen(slug);
    labelsEl.appendChild(el); return { el, p: new THREE.Vector3(...p) };
  });
  const v3 = new THREE.Vector3();
  const place = (l: Lbl, alpha: number) => {
    v3.copy(l.p).applyMatrix4(world.matrixWorld).project(cam);
    l.el.style.transform = `translate(${(v3.x * .5 + .5) * innerWidth}px, ${(-v3.y * .5 + .5) * innerHeight}px) translate(${l.tok ? "-50%" : "-4px"}, -50%)`;
    l.el.style.opacity = String(alpha); l.el.style.pointerEvents = alpha > .5 ? "auto" : "none";
  };

  // ── sound ──
  const snd = createSound();
  if (location.search.includes("audiodebug")) (window as any).__fpSound = snd;
  const pitchOf = () => tokens.map((t) => t[1]);

  // ── answer line + chapter UI ──
  let job: { text: string; focus: string; t0: number } | null = null, shownCh = -1;
  function setChapter(k: number) {
    if (k === shownCh) return; shownCh = k; const c = CH[k];
    job = { text: c.ans, focus: c.focus, t0: performance.now() };
    const cands = $("cands");
    cands.innerHTML = c.c.map(([w, p]) => `<span>${esc(w)}<em style="width:0"></em>${Math.round(p * 100)}%</span>`).join("");
    requestAnimationFrame(() => cands.querySelectorAll("em").forEach((e, i) => { (e as HTMLElement).style.width = c.c[i][1] * 140 + "px"; }));
    const ev = $("ev");
    ev.innerHTML = c.ev.map((e) => e.slug ? `<button type="button" class="j-chip" data-slug="${e.slug}">${esc(e.t)}<i aria-hidden="true">↗</i></button>` : `<span class="j-chip">${esc(e.t)}</span>`).join("");
    [...ev.children].forEach((ch, i) => setTimeout(() => ch.classList.add("on"), 350 + i * 220));
    $("status").textContent = c.st;
    $("hero").style.display = k <= (PHONE ? 0 : 1) ? "" : "none";   // phones: the ask box only on the first screen
    $("cta").classList.toggle("on", k === NCH - 1);
    $("facts").style.opacity = k === NCH - 1 ? "1" : "0"; $("note").style.opacity = k === NCH - 1 ? "1" : "0";
    $("factsline").classList.toggle("on", k === NCH - 1);
    const feat = $("feature");
    if (c.feature) { feat.dataset.slug = c.feature; feat.style.opacity = "1"; feat.style.pointerEvents = "auto"; feat.hidden = false; } else { feat.style.opacity = "0"; feat.style.pointerEvents = "none"; feat.hidden = PHONE; }
    $("rail").querySelectorAll(".tick").forEach((t, i) => t.classList.toggle("on", i === k));
    snd.chapter(k, attW, pitchOf());
    if (k === NCH - 1) poseAt = performance.now();   // each moment holds before the next one flows in
  }
  function tickDecode(now: number) {
    if (!job) return;
    const p = Math.min(1, (now - job.t0) / 520), text = job.text, n = text.length, lock = Math.floor(p * (n + 1));
    let out = ""; for (let i = 0; i < n; i++) out += i < lock || text[i] === " " ? text[i] : i < lock + 6 ? GL[Math.floor(Math.random() * GL.length)] : " ";
    const fi = text.lastIndexOf(job.focus), fe = fi + job.focus.length;
    $("line").innerHTML = esc(out.slice(0, fi)) + "<i>" + esc(out.slice(fi, fe)) + "</i>" + esc(out.slice(fe));
    if (p >= 1) { job = null; snd.lock(shownCh === NCH - 1); }
  }
  on(root, "click", (e: MouseEvent) => { const b = (e.target as HTMLElement).closest("[data-slug]") as HTMLElement | null; if (b?.dataset.slug) opts.onOpen(b.dataset.slug); });

  // rail
  const rail = $("rail");
  CH.forEach((c, i) => {
    const b = document.createElement("button"); b.className = "tick"; b.type = "button"; b.innerHTML = `<s></s><span>${c.name}</span>`;
    b.onclick = () => scrollTo({ top: i * innerHeight * STEP, behavior: RM ? "auto" : "smooth" }); rail.appendChild(b);
  });

  // question input (real GPT-2 BPE in the browser)
  const q = $<HTMLInputElement>("q") as HTMLInputElement, presets = $("presets");
  presets.innerHTML = PRESETS.map((p) => `<button type="button" aria-pressed="${p === PRESET}">${esc(p)}</button>`).join("");
  presets.querySelectorAll("button").forEach((b) => { b.onclick = () => { q.value = b.textContent || PRESET; retok(); }; });
  let rtT = 0;
  function retok() {
    const text = q.value.trim() || PRESET;
    presets.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === text)));
    if (!tokApi) { if (text !== PRESET) { rtT = window.setTimeout(retok, 300); return; } tokens = PRESET_TOKENS.slice(); }
    else { const ids = tokApi.encode(text).slice(0, 14); tokens = ids.map((id) => [tokApi!.decode([id]), id] as Tok); }
    buildQuestion(text); snd.tokens(pitchOf());
  }
  on(q, "input", () => { clearTimeout(rtT); rtT = window.setTimeout(retok, 180); });

  // email copy
  const copyMail = async (btn: HTMLElement) => {
    try { await navigator.clipboard.writeText(person.email); const o = btn.textContent; btn.textContent = "copied ✓"; snd.tone(); setTimeout(() => (btn.textContent = o), 1400); }
    catch { btn.textContent = person.email; }
  };
  on(root, "click", (e: MouseEvent) => { const b = (e.target as HTMLElement).closest("[data-mail]") as HTMLElement | null; if (b) copyMail(b); });

  // sound toggle
  const sbtn = $("sound");
  on(sbtn, "click", async () => {
    const st = await snd.toggle(); sbtn.setAttribute("aria-pressed", String(st));
    sbtn.querySelector("span")!.textContent = st ? "sound on" : "sound off"; if (st) snd.tokens(pitchOf());
  });
  on(document, "visibilitychange", () => snd.hidden(document.hidden));

  // pointer, cursor, magnetic buttons
  const ptr = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2, nx: 0, ny: 0, moved: 0 };
  const trail = Array.from({ length: 10 }, () => ({ x: 9, y: 9, age: 1 })); let trailI = 0, lastTrail = 0;
  on(window, "pointermove", (e: PointerEvent) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.nx = (e.clientX / innerWidth) * 2 - 1; ptr.ny = -(e.clientY / innerHeight) * 2 + 1; ptr.moved = 1; });
  const ring = $("ring"), cur = $("cur");
  on(document, "pointerover", (e: PointerEvent) => ring.classList.toggle("big", !!(e.target as HTMLElement).closest?.("a,button,input")));
  const mags = [...root.querySelectorAll<HTMLElement>(".j-cta a,.j-cta button")];

  // portrait poses
  let poseAt = 0, poseCur = 0;
  const nextPose = () => { if (nPoses < 2) return; mat.uniforms.uFrom.value = poseCur; poseCur = (poseCur + 1) % nPoses; mat.uniforms.uTo.value = poseCur; mat.uniforms.uPT.value = 0; poseAt = performance.now(); snd.tone(); };
  on(canvas as any, "click", () => { if (shownCh === NCH - 1) nextPose(); });

  // resize
  function resize() {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    VH = 2 * Math.tan(THREE.MathUtils.degToRad(20)) * 9; VW = VH * cam.aspect;
    const wasPhone = PHONE; PHONE = w < 760; root.classList.toggle("phone", PHONE);
    if (!PHONE) { world.position.set(0, VH * .155, 0); world.scale.setScalar(Math.min(1, VW / 10.5) * .8); }
    mat.uniforms.uAspect.value = cam.aspect;
    if (wasPhone !== PHONE && blobPos.length) retok();
  }
  resize(); on(window, "resize", resize);

  // ── one clock ──
  let prog = 0, last = performance.now(), lastProg = 0, raf = 0, dead = false, dimT = 0;
  const factsEls = [...$("facts").children] as HTMLElement[], soundBars = [...sbtn.querySelectorAll("b")] as HTMLElement[];
  const layerEl = $("layer"), progEl = $("prog"), answerEl = root.querySelector(".j-answer") as HTMLElement;
  let panelTop = innerHeight * .6;
  function frame(now: number) {
    if (dead) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const target = Math.min(NCH - 1, scrollY / (innerHeight * STEP));
    prog += (target - prog) * (RM ? 1 : 1 - Math.exp(-dt * 5.5));
    const vel = (prog - lastProg) / Math.max(dt, 1e-3); lastProg = prog; snd.vel(vel);
    const i = Math.floor(prog), f = prog - i, s = Math.min(NCH - 1, i + THREE.MathUtils.smoothstep(f, .18, .82));
    const u = mat.uniforms;
    u.uS.value = s; u.uTime.value = now / 1000;
    u.uPT.value = Math.min(1, u.uPT.value + dt / 1.6);
    u.uDim.value += (dimT - u.uDim.value) * (1 - Math.exp(-dt * 6));
    if (shownCh === NCH - 1 && nPoses > 1 && now - poseAt > 6500) nextPose();
    setChapter(Math.min(NCH - 1, Math.round(prog - .12)));
    layerEl.textContent = PHONE ? `${CH[shownCh].name} · layer ${String(CH[shownCh].L).padStart(2, "0")}` : `layer ${String(CH[shownCh].L).padStart(2, "0")} / 12`;
    progEl.style.transform = `scaleX(${Math.max(.02, prog / (NCH - 1))})`;
    if (PHONE) {
      panelTop += (answerEl.getBoundingClientRect().top - panelTop) * (1 - Math.exp(-dt * 6));
      const topPx = 92, botPx = Math.max(topPx + 140, panelTop - 16), upp = VH / innerHeight;
      const availH = (botPx - topPx) * upp, availW = VW * .9, cyW = (.5 - (topPx + botPx) / 2 / innerHeight) * VH;
      const k0 = Math.min(5, Math.floor(s)), k1 = Math.min(5, k0 + 1), fk = s - k0;
      const fit = (k: number) => Math.min(availW / boxes[k].w, availH / boxes[k].h, 1.4);
      const sc = THREE.MathUtils.lerp(fit(k0), fit(k1), fk);
      const cx = THREE.MathUtils.lerp(boxes[k0].cx, boxes[k1].cx, fk), cy = THREE.MathUtils.lerp(boxes[k0].cy, boxes[k1].cy, fk);
      world.scale.setScalar(sc); world.position.set(-cx * sc, cyW - cy * sc, 0);
    }
    const turn = THREE.MathUtils.smoothstep(s, 1.6, 2.4) * (1 - THREE.MathUtils.smoothstep(s, 3.6, 4.4));
    world.rotation.y += (Math.sin(now / 5200) * .55 * turn + ptr.nx * .12 - world.rotation.y) * (1 - Math.exp(-dt * 3));
    world.rotation.x += (-ptr.ny * .06 - world.rotation.x) * (1 - Math.exp(-dt * 3));
    if (ptr.moved && now - lastTrail > 30) { trail[trailI] = { x: ptr.nx, y: ptr.ny, age: 0 }; trailI = (trailI + 1) % trail.length; lastTrail = now; ptr.moved = 0; }
    trail.forEach((t, k) => { t.age = Math.min(1, t.age + dt / .7); u.uTrail.value[k].set(t.x, t.y, t.age); });
    ptr.sx += (ptr.x - ptr.sx) * (1 - Math.exp(-dt * 18)); ptr.sy += (ptr.y - ptr.sy) * (1 - Math.exp(-dt * 18));
    cur.style.transform = `translate(${ptr.x}px,${ptr.y}px)`; ring.style.transform = `translate(${ptr.sx}px,${ptr.sy}px)`;
    mags.forEach((m) => { const r = m.getBoundingClientRect(), dx = ptr.x - (r.left + r.width / 2), dy = ptr.y - (r.top + r.height / 2), d = Math.hypot(dx, dy), k = d < 90 ? (1 - d / 90) * .18 : 0; m.style.translate = `${dx * k}px ${dy * k}px`; });
    const thrVis = Math.max(0, 1 - Math.abs(s - 3) * 1.6) * (1 - u.uDim.value);
    threads.children.forEach((l: any) => { l.material.opacity = Math.min(1, thrVis * (.35 + l.material.userData.w * 2.4)); });
    world.updateMatrixWorld();
    const tokVis = Math.max(0, 1 - Math.abs(s - 1) * 2.2), projVis = PHONE ? 0 : Math.max(0, 1 - Math.abs(s - 2.5) * 1.1) * (1 - u.uDim.value);
    tokLabels.forEach((l) => place(l, tokVis)); projLabels.forEach((l) => place(l, projVis));
    if (s > 4.6 && !PHONE) {
      const anchors = [[-.7, 1.25], [.72, .75], [-1.45, -.7], [1.45, -1.0]];
      factsEls.forEach((el, k) => {
        v3.set(anchors[k][0], anchors[k][1], 0).applyMatrix4(world.matrixWorld).project(cam);
        const x = (v3.x * .5 + .5) * innerWidth, y = (-v3.y * .5 + .5) * innerHeight;
        el.style.top = y + "px";
        if (el.classList.contains("l")) { el.style.left = "auto"; el.style.right = innerWidth - x + 102 + "px"; } else el.style.left = x + 102 + "px";
      });
    }
    const sOn = sbtn.getAttribute("aria-pressed") === "true";
    soundBars.forEach((b, k) => { b.style.height = sOn ? 3 + Math.abs(Math.sin(now / 180 + k * 1.3)) * 9 + "px" : "3px"; });
    tickDecode(now);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }

  (async () => {
    await document.fonts.load(`italic 300 150px ${serif}`).catch(() => {});
    if (dead) return;
    buildQuestion(PRESET); setChapter(0); loadPoses();
    raf = requestAnimationFrame(frame);
    root.classList.add("ready");
  })();

  return {
    /** dim the cloud while a case study is open */
    focus(open: boolean) { dimT = open ? 1 : 0; },
    destroy() {
      dead = true; cancelAnimationFrame(raf); clearTimeout(rtT);
      disposers.forEach((d) => d()); snd.close();
      threads.children.forEach((l: any) => { l.geometry.dispose(); l.material.dispose(); });
      geo.dispose(); mat.dispose(); renderer.dispose();
      labelsEl.innerHTML = ""; rail.innerHTML = "";
    },
  };
}
