// Misure e aiuti condivisi da tutti gli scenari.
import { WORLD, TOWER, YARD } from '../../state.js';

// Lo sfondo continua oltre i bordi del mondo, per riempire anche schermi larghi.
export const MARGIN = 240;
// Gli sfondi sono disegnati a risoluzione doppia (come personaggi e palazzo).
export const SCENE_RES = 2;
export const AREA = { x: -MARGIN, y: -MARGIN, w: WORLD.w + MARGIN * 2, h: WORLD.h + MARGIN * 2 };
// Cortile fortificato intorno al palazzo e i 4 corridoi d'accesso (N, S, E, O).
export { YARD };
export const LANE = 28; // mezza larghezza dei corridoi

export function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function inYard(x, y, pad = 0) {
  return x > YARD.x - pad && x < YARD.x + YARD.w + pad && y > YARD.y - pad && y < YARD.y + YARD.h + pad;
}
export function inLane(x, y, pad = 0) {
  return Math.abs(x - TOWER.x) < LANE + pad || Math.abs(y - TOWER.y) < LANE + pad;
}
// Punto libero: fuori dal cortile e dai corridoi.
export function free(x, y, pad = 8) {
  return !inYard(x, y, pad + 10) && !inLane(x, y, pad);
}
export function scatter(rnd, n, pad, fn) {
  const pts = [];
  for (let i = 0; i < n * 4 && pts.length < n; i++) {
    const x = Math.round(AREA.x + rnd() * AREA.w), y = Math.round(AREA.y + rnd() * AREA.h);
    if (free(x, y, pad)) pts.push({ x, y, r: rnd() });
  }
  pts.sort((a, b) => a.y - b.y).forEach(p => fn(p.x, p.y, p.r));
}
export const many = n => Math.round(n * (AREA.w * AREA.h) / (1200 * 1200));
