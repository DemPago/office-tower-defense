// Scenario: 5. Zona industriale (Sicurezza).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g, rnd, data) {
  P.rect(g, AREA.x, AREA.y, AREA.w, AREA.h, '#4d3f30');
  P.noise(g, AREA, many(60000), ['#5e4e3c', '#3d3226', '#6b5a45', '#2e261d'], rnd);
  P.noise(g, AREA, many(9000), ['#8a8d93', '#5b5f66', '#a8a296'], rnd, 1); // ghiaia
  P.noise(g, AREA, many(3000), ['#6e6a64', '#4a4743'], rnd, 1.5);
  // Piazzole di cemento
  scatter(rnd, many(10), 30, (x, y) => {
    const w = 50 + rnd() * 60, h = 30 + rnd() * 40;
    P.rect(g, x - 1, y - 1, w + 2, h + 2, PAL.black);
    P.rect(g, x, y, w, h, PAL.concrete);
    P.noise(g, { x, y, w, h }, Math.round(w * h / 12), [PAL.concreteHi, PAL.concreteDk], rnd);
  });
  // Strade sterrate con i solchi delle ruote
  for (const [x, y, w, h] of [[TOWER.x - LANE, AREA.y, LANE * 2, AREA.h], [AREA.x, TOWER.y - LANE, AREA.w, LANE * 2]]) {
    P.rect(g, x, y, w, h, '#3d3226');
    if (w < h) {
      for (const tx of [x + 10, x + w - 14]) { P.rect(g, tx, y, 4, h, '#2e261d'); for (let t = y; t < y + h; t += 2) P.rect(g, tx + 0.5, t, 3, 0.5, '#251e17'); }
    } else {
      for (const ty of [y + 10, y + h - 14]) { P.rect(g, x, ty, w, 4, '#2e261d'); for (let t = x; t < x + w; t += 2) P.rect(g, t, ty + 0.5, 0.5, 3, '#251e17'); }
    }
  }
  // Piazzali di container, in file, a volte impilati
  const cols = ['#7a1f2b', '#2f4f6f', '#3e6b2a', '#a67c00', '#8a3b1e', '#3a3c42'];
  for (let ry = AREA.y + 20; ry < AREA.y + AREA.h - 30; ry += 72) {
    for (let x = AREA.x + 6; x < AREA.x + AREA.w - 60; x += 62) {
      if (!free(x, ry, 6) || !free(x + 56, ry + 26, 6) || !free(x + 56, ry, 6) || !free(x, ry + 26, 6)) continue;
      const r = rnd();
      if (r < 0.15) { // posto vuoto con un paio di Ape e una Panda da lavoro
        P.italianCar(g, x + 6, ry + 2, 'ape', '#4a8a9a');
        P.italianCar(g, x + 24, ry + 2, 'ape', '#e8e2d0');
        P.italianCar(g, x + 40, ry + 2, 'panda', '#e8e2d0', rnd() < 0.5, rnd);
        continue;
      }
      if (r < 0.25) { for (let k = 0; k < 4; k++) P.barrel(g, x + 10 + k * 12, ry + 24, cols[Math.floor(rnd() * cols.length)]); continue; }
      P.container(g, x, ry, cols[Math.floor(rnd() * cols.length)]);
      if (rnd() < 0.4) P.container(g, x + 3, ry - 16, cols[Math.floor(rnd() * cols.length)], 50, 22);
    }
  }
  // Recinzioni lungo le strade, con qualche varco
  for (let t = AREA.x; t < AREA.x + AREA.w; t += 70) {
    if (inYard(t + 30, TOWER.y, 30) || rnd() < 0.3) continue;
    P.fence(g, t, TOWER.y - LANE - 4, t + 52, TOWER.y - LANE - 4);
  }
  for (let t = AREA.y; t < AREA.y + AREA.h; t += 70) {
    if (inYard(TOWER.x, t + 30, 30) || rnd() < 0.3) continue;
    P.fence(g, TOWER.x + LANE + 4, t, TOWER.x + LANE + 4, t + 52);
  }
  scatter(rnd, many(110), 8, (x, y, r) => {
    if (r < 0.35) P.barrel(g, x, y, [PAL.rust, '#2f4f6f', '#3e6b2a'][Math.floor(rnd() * 3)]);
    else if (r < 0.5) { for (let k = 0; k < 3; k++) P.rect(g, x - 8, y - 10 + k * 4, 18, 2, PAL.woodHi); P.rect(g, x - 8, y - 10, 18, 12, 'rgba(0,0,0,0.15)'); } // pallet
    else if (r < 0.62) { P.rect(g, x, y - 16, 2, 16, PAL.steel); g.fillStyle = PAL.hazard; g.beginPath(); g.moveTo(x + 1, y - 26); g.lineTo(x + 9, y - 14); g.lineTo(x - 7, y - 14); g.fill(); P.rect(g, x, y - 22, 2, 5, PAL.black); } // cartello di pericolo
    else if (r < 0.75) P.tire(g, x, y);
    else P.trash(g, x, y, rnd);
  });
  // Torri faro (le luci girano nell'animazione)
  for (const [x, y] of [[TOWER.x - 210, TOWER.y - 180], [TOWER.x + 220, TOWER.y + 170], [TOWER.x + 230, TOWER.y - 200]]) {
    P.rect(g, x - 1, y - 40, 3, 40, PAL.steel);
    P.rect(g, x - 6, y - 44, 13, 6, PAL.black);
    P.rect(g, x - 5, y - 43, 11, 4, PAL.fluo);
    data.lights.push({ x, y: y - 41 });
  }
  P.spray(g, 'VIETATO ENTRARE', TOWER.x - 180, TOWER.y + 150, PAL.hazard, -0.05, 14);
  return { floor: '#6e6a64', seam: '#4a4743' };
}

export function ambient(ctx, time, data) {
  data.lights.forEach((l, i) => {
    const a = time * 0.6 + i * 2.1;
    const len = 260;
    ctx.fillStyle = 'rgba(233,240,138,0.07)';
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(l.x + Math.cos(a - 0.18) * len, l.y + Math.sin(a - 0.18) * len);
    ctx.lineTo(l.x + Math.cos(a + 0.18) * len, l.y + Math.sin(a + 0.18) * len);
    ctx.fill();
  });
}
