// Cortile fortificato intorno al palazzo, uguale in tutti gli scenari.
import { TOWER } from '../../state.js';
import { PAL, shade } from '../palette.js';
import * as P from '../props.js';
import { YARD, LANE } from './common.js';

export function drawYard(g, rnd, { floor = PAL.concrete, seam = PAL.concreteDk } = {}) {
  const { x, y, w, h } = YARD;
  P.rect(g, x - 6, y - 6, w + 12, h + 12, PAL.black);
  P.hazardStripes(g, x - 5, y - 5, w + 10, h + 10);
  P.rect(g, x, y, w, h, floor);
  for (let yy = y; yy < y + h; yy += 16) {
    for (let xx = x; xx < x + w; xx += 16) {
      P.rect(g, xx, yy, 16, 0.5, seam);
      P.rect(g, xx, yy, 0.5, 16, seam);
      P.rect(g, xx + 0.5, yy + 0.5, 15.5, 0.5, shade(floor, 1.12));
      P.rect(g, xx + 0.5, yy + 0.5, 0.5, 15.5, shade(floor, 1.08));
      if (rnd() < 0.25) P.rect(g, xx + 1, yy + 1, 15, 15, 'rgba(20,20,22,0.15)');
    }
  }
  P.noise(g, { x, y, w, h }, 2600, [shade(floor, 1.18), shade(floor, 0.82), shade(floor, 0.9)], rnd);
  for (let i = 0; i < 6; i++) P.stain(g, x + 10 + rnd() * (w - 20), y + 10 + rnd() * (h - 20), 5 + rnd() * 8, 3 + rnd() * 4, 'rgba(0,0,0,0.22)');
  for (let i = 0; i < 4; i++) P.crack(g, x + 10 + rnd() * (w - 20), y + 10 + rnd() * (h - 20), rnd, 6);

  // Sacchi di sabbia lungo i bordi, con un varco per ogni corridoio
  for (let xx = x + 2; xx < x + w - 10; xx += 12) {
    if (Math.abs(xx + 5 - TOWER.x) < LANE) continue;
    P.sandbag(g, xx, y - 7);
    P.sandbag(g, xx, y + h - 2);
  }
  for (let yy = y + 6; yy < y + h - 6; yy += 9) {
    if (Math.abs(yy + 3 - TOWER.y) < LANE) continue;
    P.sandbag(g, x - 8, yy);
    P.sandbag(g, x + w - 3, yy);
  }
  // Barriere ai lati dei varchi e lampioni agli angoli
  P.barrier(g, TOWER.x - LANE - 22, y - 16);
  P.barrier(g, TOWER.x + LANE + 2, y - 16);
  P.barrier(g, TOWER.x - LANE - 22, y + h + 4);
  P.barrier(g, TOWER.x + LANE + 2, y + h + 4);
  for (const [lx, ly] of [[x + 6, y + 30], [x + w - 6, y + 30], [x + 6, y + h - 4], [x + w - 6, y + h - 4]]) {
    P.stain(g, lx, ly + 4, 22, 9, 'rgba(242,183,5,0.10)');
    P.lamp(g, lx, ly);
  }
}
