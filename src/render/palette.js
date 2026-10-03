// Palette grunge (la stessa usata in style.css) e font.
export const PAL = {
  black: '#0d0d0f', ink: '#141416',
  asphalt: '#2a2a2e', asphalt2: '#323237', asphaltHi: '#44444b', road: '#222226',
  concrete: '#6e6a64', concreteHi: '#8f8a80', concreteDk: '#4a4743',
  rust: '#8a3b1e', rustHi: '#b8592a', brick: '#6d2e1f', brickHi: '#86402a',
  sand: '#9c8457', sandHi: '#bfa574', wood: '#6b4a2b', woodHi: '#8b6a3e',
  hazard: '#f2b705', hazardDk: '#a67c00', white: '#e8e2d0', grey: '#8a8d93', silver: '#c0c4cc',
  red: '#d7263d', blood: '#7a0f1c', pink: '#ff3e8a', cyan: '#2de2e6', blue: '#3a6ea5',
  toxic: '#7bd332', weed: '#3e6b2a', fluo: '#e9f08a', glass: '#1c2430', steel: '#5b5f66',
  orange: '#e8641b', purple: '#5d275d', navy: '#1f2a44',
};
export const FONT = '"Press Start 2P", monospace';
export const SPRAY = '"Permanent Marker", "Press Start 2P", cursive';

// Schiarisce (k > 1) o scurisce (k < 1) un colore esadecimale.
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
