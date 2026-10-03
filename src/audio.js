// Suoni sintetizzati con la Web Audio API: nessun file audio da scaricare.
// I browser permettono l'audio solo dopo un'interazione (clic o tasto):
// per questo initAudio() viene chiamata al primo input dell'utente.
const MUTE_KEY = 'otd-v2-muted';

let ac = null;        // AudioContext
let master = null;    // volume generale
let noiseBuf = null;  // rumore bianco riusato per spari, esplosioni, tamburi
let muted = false;
const lastPlayed = {};

try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  // niente
}

export function initAudio() {
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ac = new Ctx();
  master = ac.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // niente
  }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.6, ac.currentTime, 0.02);
  return muted;
}

// ─── Mattoncini ─────────────────────────────────────────────────

// Una nota: forma d'onda, frequenza iniziale → finale, durata, volume.
function tone({ type = 'square', f1, f2 = f1, dur = 0.1, vol = 0.1, at = 0, filter = null }) {
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = o;
  if (filter) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    o.connect(f);
    out = f;
  }
  out.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Rumore filtrato: esplosioni, colpi, rullante.
function noise({ dur = 0.1, vol = 0.1, at = 0, type = 'bandpass', freq = 1000, q = 1 }) {
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

// ─── Effetti ────────────────────────────────────────────────────

const SOUNDS = {
  shoot:   { gap: 0.06, play: () => tone({ f1: 900, f2: 380, dur: 0.06, vol: 0.035 }) },
  ally:    { gap: 0.08, play: () => tone({ type: 'triangle', f1: 700, f2: 300, dur: 0.07, vol: 0.05 }) },
  kill:    { gap: 0.05, play: () => { noise({ dur: 0.09, vol: 0.12, freq: 1400, q: 0.8 }); tone({ f1: 220, f2: 110, dur: 0.08, vol: 0.05 }); } },
  hurt:    { gap: 0.15, play: () => { tone({ type: 'sine', f1: 140, f2: 55, dur: 0.18, vol: 0.25 }); noise({ dur: 0.08, vol: 0.08, type: 'lowpass', freq: 400 }); } },
  split:   { gap: 0.1,  play: () => { tone({ f1: 500, dur: 0.05, vol: 0.05 }); tone({ f1: 750, dur: 0.05, vol: 0.05, at: 0.06 }); } },
  wave:    { gap: 1,    play: () => { tone({ type: 'sawtooth', f1: 220, dur: 0.25, vol: 0.08, filter: 900 }); tone({ type: 'sawtooth', f1: 330, dur: 0.4, vol: 0.08, at: 0.22, filter: 900 }); } },
  pick:    { gap: 0.2,  play: () => [523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f1: f, dur: 0.12, vol: 0.08, at: i * 0.07 })) },
  buy:     { gap: 0.05, play: () => { tone({ type: 'triangle', f1: 988, dur: 0.06, vol: 0.06 }); tone({ type: 'triangle', f1: 1319, dur: 0.1, vol: 0.06, at: 0.05 }); } },
  bossdown:{ gap: 0.5,  play: () => { noise({ dur: 0.9, vol: 0.35, type: 'lowpass', freq: 600 }); tone({ type: 'sine', f1: 110, f2: 30, dur: 0.9, vol: 0.35 }); } },
  over:    { gap: 2,    play: () => { tone({ type: 'sawtooth', f1: 400, f2: 60, dur: 1.2, vol: 0.12, filter: 1200 }); noise({ dur: 1, vol: 0.25, type: 'lowpass', freq: 500 }); } },
  bomb:    { gap: 0.5,  play: () => { noise({ dur: 0.7, vol: 0.4, type: 'lowpass', freq: 900 }); tone({ type: 'sine', f1: 90, f2: 35, dur: 0.6, vol: 0.3 }); } },
  coffee:  { gap: 0.5,  play: () => { for (let i = 0; i < 6; i++) tone({ type: 'sine', f1: 300 + Math.random() * 400, f2: 900, dur: 0.06, vol: 0.05, at: i * 0.05 }); } },
  meeting: { gap: 0.5,  play: () => { tone({ type: 'sine', f1: 1046, dur: 0.8, vol: 0.12 }); tone({ type: 'sine', f1: 1568, dur: 0.6, vol: 0.06 }); } },
  audit:   { gap: 0.5,  play: () => { tone({ type: 'square', f1: 1760, dur: 0.07, vol: 0.05 }); tone({ type: 'square', f1: 2637, dur: 0.25, vol: 0.05, at: 0.08 }); noise({ dur: 0.15, vol: 0.08, freq: 5000, at: 0.02 }); } },
  boss:    { gap: 5,    play: () => bossMarch() },
  charge:  { gap: 0.3,  play: () => tone({ type: 'sawtooth', f1: 200, f2: 700, dur: 0.25, vol: 0.06, filter: 1500 }) },
  boom:    { gap: 0.1,  play: () => { noise({ dur: 0.45, vol: 0.3, type: 'lowpass', freq: 800 }); tone({ type: 'sine', f1: 120, f2: 40, dur: 0.4, vol: 0.25 }); } },
};

export function play(name) {
  if (!ac || muted) return;
  const s = SOUNDS[name];
  if (!s) return;
  const now = ac.currentTime;
  if (now - (lastPlayed[name] || 0) < s.gap) return; // evita la cacofonia
  lastPlayed[name] = now;
  s.play();
}

// ─── Marcia del boss ────────────────────────────────────────────
// Composizione ORIGINALE in re minore: ottoni cupi, timpani e rullante militare.
// Atmosfera da "arriva l'impero", ma non è la Marcia Imperiale (che è protetta da copyright).
function bossMarch() {
  const q = 60 / 100; // un quarto a 100 battiti al minuto
  const note = n => 440 * Math.pow(2, (n - 69) / 12);
  const D3 = 50, E3 = 52, F3 = 53, G3 = 55, A3 = 57, Bb3 = 58, Cs3 = 49;
  // [nota, durata in quarti]
  const melody = [
    [D3, 1], [D3, 1], [F3, 0.5], [E3, 0.5], [D3, 1],
    [A3, 1.5], [G3, 0.5], [F3, 1], [E3, 1],
    [Bb3, 1], [A3, 0.5], [G3, 0.5], [F3, 1], [Cs3, 1],
    [D3, 3],
  ];
  let t = 0;
  for (const [n, len] of melody) {
    const dur = len * q * 0.92;
    tone({ type: 'sawtooth', f1: note(n), dur, vol: 0.09, at: t, filter: 1100 });
    tone({ type: 'square', f1: note(n - 12), dur, vol: 0.05, at: t, filter: 500 });
    t += len * q;
  }
  const beats = Math.round(t / q);
  for (let b = 0; b < beats; b++) {
    const at = b * q;
    // timpani sui tempi forti
    if (b % 2 === 0) tone({ type: 'sine', f1: note(38), f2: note(36), dur: 0.35, vol: 0.3, at });
    // rullante, con un piccolo rullo a fine battuta
    noise({ dur: 0.08, vol: 0.12, freq: 2500, q: 0.7, at: at + q / 2 });
    if (b % 4 === 3) for (let k = 0; k < 4; k++) noise({ dur: 0.05, vol: 0.08, freq: 2500, q: 0.7, at: at + k * q / 4 });
  }
}
