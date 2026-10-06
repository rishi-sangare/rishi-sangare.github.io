// Generated sound: off until the visitor turns it on. Every level change is ramped, never stepped.
// Tokens tick at a pitch from their id, a drone rises a step per chapter, scroll speed drives "air",
// attention plays a chord weighted by the real attention, and the final answer resolves.
//
// Two profiles. "full" is tuned for speakers with real bass (MacBooks, headphones): a pure sine drone at 55 Hz.
// "small" is for phones and most laptops, which reproduce almost nothing below ~200 Hz: the drone moves up an
// octave and carries strong overtones, so the ear infers the low note it can't hear (the "missing fundamental"),
// the scroll air becomes a soft low-passed breath instead of a bright sweep, and everything sits in 200–1500 Hz.
// Override with ?audio=small or ?audio=full.

type Profile = "full" | "small";
const PENT = [0, 2, 4, 7, 9];
const pitch = (id: number) => 220 * Math.pow(2, (PENT[id % 5] + 12 * (Math.floor(id / 5) % 2)) / 12);
const STEPS = [0, 0, 3, 5, 7, 12];
const STEPS_SMALL = [0, 0, 2, 3, 5, 7];

function pickProfile(): Profile {
  const q = new URLSearchParams(location.search).get("audio");
  if (q === "small" || q === "full") return q;
  const touch = matchMedia("(hover: none)").matches || matchMedia("(pointer: coarse)").matches;
  const mac = /Mac/i.test(navigator.platform || navigator.userAgent) && !touch;
  return mac ? "full" : "small";
}

const P = {
  // drone base, harmonic amplitudes (1st..6th), voice gains, tone filter, air limits, attention octave
  full: { base: 55, harm: [1, 0, 0, 0, 0, 0], voices: [.16, .07, .025], lp: 700, hp: 30, airMax: .09, airLo: 600, airHi: 3000, attOct: .5, master: .55 },
  small: { base: 110, harm: [.6, 1, .7, .4, .2, .1], voices: [.09, .045, .02], lp: 1100, hp: 140, airMax: .022, airLo: 300, airHi: 1000, attOct: 1, master: .27 },
} as const;

export function createSound() {
  let ac: AudioContext | null = null, master!: GainNode, bus!: GainNode, airGain!: GainNode, airLp!: BiquadFilterNode, analyser!: AnalyserNode;
  const drone: OscillatorNode[] = [], droneGains: GainNode[] = [];
  let on = false, velS = 0;
  const prof: Profile = typeof window === "undefined" ? "full" : pickProfile();
  const cfg = P[prof];
  const ramp = (p: AudioParam, v: number, t = .3) => ac && p.setTargetAtTime(v, ac.currentTime, t);

  function start() {
    ac = new AudioContext();
    // master chain: gain → gentle compressor (even levels, no crackle on small drivers) → high-pass → out
    master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
    const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = cfg.hp; hp.Q.value = .5;
    analyser = ac.createAnalyser(); analyser.fftSize = 8192;
    if (prof === "small") { master.connect(hp); hp.connect(ac.destination); hp.connect(analyser); void comp; }
    else { master.connect(ac.destination); master.connect(analyser); }

    const rev = ac.createConvolver(), len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir; const wet = ac.createGain(); wet.gain.value = prof === "small" ? .32 : .35; rev.connect(wet); wet.connect(master);
    bus = ac.createGain(); bus.connect(master); bus.connect(rev);

    // the drone: one custom waveform per voice so the overtones glide together when the pitch changes
    const real = new Float32Array(cfg.harm.length + 1), imag = new Float32Array(cfg.harm.length + 1);
    cfg.harm.forEach((a, i) => { imag[i + 1] = a; });
    const wave = ac.createPeriodicWave(real, imag);
    const tone = ac.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = cfg.lp; tone.Q.value = .4; tone.connect(bus);
    [cfg.base, cfg.base * 1.5, cfg.base * 2.006].forEach((f, i) => {
      const o = ac!.createOscillator(), g = ac!.createGain();
      if (prof === "small") { o.setPeriodicWave(wave); g.connect(tone); }
      else { o.type = i === 2 ? "triangle" : "sine"; g.connect(bus); }
      o.frequency.value = f; g.gain.value = cfg.voices[i]; o.connect(g); o.start(); drone.push(o); droneGains.push(g);
    });
    if (prof === "small") { // a slow breathing swell on the drone so it never feels static
      const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = .07; lfoG.gain.value = cfg.lp * .18;
      lfo.connect(lfoG); lfoG.connect(tone.frequency); lfo.start();
    }

    // the air: low-passed noise, opened gently by (smoothed) scroll speed
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0);
    let b0 = 0;
    for (let i = 0; i < nd.length; i++) {
      const w = Math.random() * 2 - 1;
      if (prof === "small") { b0 = .97 * b0 + .03 * w; nd[i] = b0 * 6; } else nd[i] = w; // small: brown-ish noise, soft not hissy
    }
    const air = ac.createBufferSource(); air.buffer = nb; air.loop = true;
    airLp = ac.createBiquadFilter(); airLp.type = prof === "small" ? "lowpass" : "bandpass"; airLp.frequency.value = prof === "small" ? cfg.airLo : 900; airLp.Q.value = prof === "small" ? .3 : .7;
    airGain = ac.createGain(); airGain.gain.value = 0; air.connect(airLp); airLp.connect(airGain); airGain.connect(master); air.start();
  }
  function blip(f: number, t0 = 0, dur = .5, vol = .12, type: OscillatorType = "triangle") {
    if (!on || !ac) return;
    if (prof === "small") vol *= .45;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + t0;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  }

  return {
    profile: prof,
    async toggle() {
      if (!ac) start();
      on = !on; if (ac!.state === "suspended") await ac!.resume();
      ramp(master.gain, on ? cfg.master : 0, .4); return on;
    },
    vel(v: number) {
      if (!on) return;
      if (prof === "full") { ramp(airGain.gain, Math.min(.09, Math.abs(v) * .05), .08); ramp(airLp.frequency, 600 + Math.min(2400, Math.abs(v) * 1600), .1); return; }
      velS += (Math.min(2, Math.abs(v)) - velS) * .08; // smooth out scroll jitter so the air swells, never sweeps
      ramp(airGain.gain, Math.min(cfg.airMax, velS * cfg.airMax * .9), .25);
      ramp(airLp.frequency, cfg.airLo + Math.min(1, velS * .6) * (cfg.airHi - cfg.airLo), .3);
    },
    chapter(k: number, att: number[], ids: number[]) {
      if (!on) return;
      const f = cfg.base * Math.pow(2, ((prof === "small" ? STEPS_SMALL : STEPS)[k] ?? 0) / 12);
      ramp(drone[0].frequency, f, .6); ramp(drone[1].frequency, f * 1.5, .6); ramp(drone[2].frequency, f * 2.006, .6);
      if (prof === "small") droneGains.forEach((g, i) => ramp(g.gain, cfg.voices[i] * Math.pow(cfg.base / f, 1.2), .6));
      if (k === 3) att.forEach((w, j) => blip(pitch(ids[j]) * cfg.attOct, j * .05, 1.6, .03 + w * .12, prof === "small" ? "triangle" : "sine"));
    },
    lock(final: boolean) { if (final) [261.6, 329.6, 392, 523.3].forEach((f, i) => blip(f, i * .07, 2.4, .07, "sine")); else blip(660, 0, .25, .04, "sine"); },
    tokens(ids: number[]) { ids.forEach((id, i) => blip(pitch(id), i * .07, .45, .08)); },
    tone() { blip(880, 0, .9, .08, "sine"); blip(1320, .08, .9, .05, "sine"); },
    hidden(h: boolean) { if (on) ramp(master.gain, h ? .05 : cfg.master, h ? .3 : 1.2); },
    /** for testing: the post-filter spectrum */
    analyser: () => analyser,
    close() { ac?.close().catch(() => {}); ac = null; on = false; },
  };
}
