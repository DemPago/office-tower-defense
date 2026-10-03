// Scenario: 1. Parcheggio aziendale (Open Space).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g, rnd) {
  P.rect(g, AREA.x, AREA.y, AREA.w, AREA.h, PAL.asphalt);
  P.noise(g, AREA, many(60000), [PAL.asphalt2, PAL.asphaltHi, PAL.black, '#38383d'], rnd);
  P.noise(g, AREA, many(4000), ['#55555c', '#1c1c20'], rnd, 1); // sassolini nell'asfalto
  for (let i = 0; i < many(22); i++) {
    const x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h, w = 30 + rnd() * 60, h = 20 + rnd() * 40;
    P.rect(g, x - 0.5, y - 0.5, w + 1, h + 1, '#1a1a1d');
    P.rect(g, x, y, w, h, '#303035');
    P.noise(g, { x, y, w, h }, Math.round(w * h / 3), ['#3a3a40', '#2a2a2e'], rnd);
  }
  // Strade di accesso con la riga gialla
  P.rect(g, TOWER.x - LANE, AREA.y, LANE * 2, AREA.h, PAL.road);
  P.rect(g, AREA.x, TOWER.y - LANE, AREA.w, LANE * 2, PAL.road);
  for (let t = AREA.y; t < AREA.y + AREA.h; t += 18) {
    if (rnd() < 0.2) continue;
    P.rect(g, TOWER.x - 1, t, 2, 10, 'rgba(242,183,5,0.55)');
  }
  for (let t = AREA.x; t < AREA.x + AREA.w; t += 18) {
    if (rnd() < 0.2) continue;
    P.rect(g, t, TOWER.y - 1, 10, 2, 'rgba(242,183,5,0.55)');
  }
  // File di posti auto, con auto parcheggiate (alcune distrutte)
  const colors = ['#7a1f2b', '#2f4f6f', '#c0c4cc', '#3e6b2a', '#141416', '#a67c00', '#5d275d', '#8a3b1e'];
  for (let ry = AREA.y + 20; ry < AREA.y + AREA.h - 30; ry += 76) {
    for (let sx = AREA.x + 10; sx < AREA.x + AREA.w - 20; sx += 22) {
      if (!free(sx + 10, ry + 16, 4) || !free(sx + 10, ry, 4) || !free(sx + 10, ry + 32, 4)) continue;
      P.rect(g, sx, ry, 1, 34, 'rgba(232,226,208,0.45)');
      P.rect(g, sx, ry + 34, 22, 1, 'rgba(232,226,208,0.3)');
      if (rnd() < 0.62) P.car(g, sx + 3, ry + 3, colors[Math.floor(rnd() * colors.length)], rnd() < 0.2, rnd);
      else if (rnd() < 0.3) P.trash(g, sx + 10, ry + 20, rnd);
    }
  }
  for (let i = 0; i < many(70); i++) {
    const x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h;
    if (inYard(x, y, 8)) continue;
    const end = P.crack(g, x, y, rnd, 4 + Math.floor(rnd() * 10));
    if (rnd() < 0.4) P.weeds(g, Math.round(end.x), Math.round(end.y));
  }
  scatter(rnd, many(30), 6, (x, y) => P.stain(g, x, y, 5 + rnd() * 10, 3 + rnd() * 5));
  scatter(rnd, many(10), 14, (x, y) => P.puddle(g, x, y, 10 + rnd() * 10, 4 + rnd() * 4));
  scatter(rnd, many(8), 10, (x, y) => P.manhole(g, x, y));
  scatter(rnd, many(40), 10, (x, y, r) => {
    if (r < 0.25) P.cone(g, x, y);
    else if (r < 0.4) P.barrel(g, x, y, rnd() < 0.5 ? PAL.rust : '#2f4f6f');
    else if (r < 0.55) P.planterTree(g, x, y, rnd() < 0.5);
    else if (r < 0.65) P.tire(g, x, y);
    else P.trash(g, x, y, rnd);
  });
  scatter(rnd, many(5), 30, (x, y) => P.dumpster(g, x, y));
  P.spray(g, 'SCIOPERO!', TOWER.x - 170, TOWER.y - 150, PAL.pink, -0.08, 18);
  P.spray(g, 'NO STRAORDINARI', TOWER.x + 180, TOWER.y + 160, PAL.cyan, 0.05, 13);
}
