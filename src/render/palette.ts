// Palette grunge (la stessa usata in style.css) e font.
export const PAL = {
  black: '#0d0d0f', ink: '#141416',
  asphalt: '#3a3c42', asphalt2: '#464950', asphaltHi: '#5e626c', road: '#2a2c34',
  concrete: '#7a7670', concreteHi: '#9e9990', concreteDk: '#524f4c',
  rust: '#a04522', rustHi: '#cc6430', brick: '#803523', brickHi: '#9e4c32',
  sand: '#b09462', sandHi: '#d4b886', wood: '#7c5533', woodHi: '#a07848',
  hazard: '#f2b705', hazardDk: '#a67c00', white: '#e8e2d0', grey: '#8a8d93', silver: '#c0c4cc',
  red: '#d7263d', blood: '#7a0f1c', pink: '#ff3e8a', cyan: '#2de2e6', blue: '#3a6ea5',
  toxic: '#7bd332', weed: '#3e6b2a', fluo: '#e9f08a', glass: '#1c2430', steel: '#666b74',
  orange: '#e8641b', purple: '#5d275d', navy: '#1f2a44',
};
export const FONT = '"Press Start 2P", monospace';
export const SPRAY = '"Permanent Marker", "Press Start 2P", cursive';

// Schiarisce (k > 1) o scurisce (k < 1) un colore esadecimale.
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
