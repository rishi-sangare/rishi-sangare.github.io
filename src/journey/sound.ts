// Generated sound: off until the visitor turns it on. Every level change is ramped, never stepped.
// Tokens tick at a pitch from their id, a drone rises a step per chapter, scroll speed drives "air",
// attention plays a chord weighted by the real attention, and the final answer resolves.

const PENT = [0, 2, 4, 7, 9];
const pitch = (id: number) => 220 * Math.pow(2, (PENT[id % 5] + 12 * (Math.floor(id / 5) % 2)) / 12);
const STEPS = [0, 0, 3, 5, 7, 12];

export function createSound() {
  let ac: AudioContext | null = null, master!: GainNode, bus!: GainNode, airGain!: GainNode, bp!: BiquadFilterNode;
  const drone: OscillatorNode[] = [];
  let on = false;
  const ramp = (p: AudioParam, v: number, t = .3) => ac && p.setTargetAtTime(v, ac.currentTime, t);

  function start() {
    ac = new AudioContext();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const rev = ac.createConvolver(), len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir; const wet = ac.createGain(); wet.gain.value = .35; rev.connect(wet); wet.connect(master);
    bus = ac.createGain(); bus.connect(master); bus.connect(rev);
    [55, 55 * 1.5, 110.3].forEach((f, i) => {
      const o = ac!.createOscillator(), g = ac!.createGain(); o.type = i === 2 ? "triangle" : "sine"; o.frequency.value = f;
      g.gain.value = [.16, .07, .025][i]; o.connect(g); g.connect(bus); o.start(); drone.push(o);
    });
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const air = ac.createBufferSource(); air.buffer = nb; air.loop = true;
    bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = .7;
    airGain = ac.createGain(); airGain.gain.value = 0; air.connect(bp); bp.connect(airGain); airGain.connect(master); air.start();
  }
  function blip(f: number, t0 = 0, dur = .5, vol = .12, type: OscillatorType = "triangle") {
    if (!on || !ac) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + t0;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  }

  return {
    async toggle() {
      if (!ac) start();
      on = !on; if (ac!.state === "suspended") await ac!.resume();
      ramp(master.gain, on ? .55 : 0, .4); return on;
    },
    vel(v: number) { if (on) { ramp(airGain.gain, Math.min(.09, Math.abs(v) * .05), .08); ramp(bp.frequency, 600 + Math.min(2400, Math.abs(v) * 1600), .1); } },
    chapter(k: number, att: number[], ids: number[]) {
      if (!on) return;
      const f = 55 * Math.pow(2, (STEPS[k] ?? 0) / 12);
      ramp(drone[0].frequency, f, .6); ramp(drone[1].frequency, f * 1.5, .6); ramp(drone[2].frequency, f * 2.006, .6);
      if (k === 3) att.forEach((w, j) => blip(pitch(ids[j]) * .5, j * .05, 1.6, .03 + w * .12, "sine"));
    },
    lock(final: boolean) { if (final) [261.6, 329.6, 392, 523.3].forEach((f, i) => blip(f, i * .07, 2.4, .07, "sine")); else blip(660, 0, .25, .04, "sine"); },
    tokens(ids: number[]) { ids.forEach((id, i) => blip(pitch(id), i * .07, .45, .08)); },
    tone() { blip(880, 0, .9, .08, "sine"); blip(1320, .08, .9, .05, "sine"); },
    hidden(h: boolean) { if (on) ramp(master.gain, h ? .05 : .55, h ? .3 : 1.2); },
    close() { ac?.close().catch(() => {}); ac = null; on = false; },
  };
}
