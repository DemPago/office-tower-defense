// Scenario: 1. Parcheggio aziendale (Open Space).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g: CanvasRenderingContext2D, rnd: () => number, data?: any, opts?: { skipCars?: boolean }) {
  // Base asfalto con variazioni di tono per rompere l'uniformità
  P.rect(g, AREA.x, AREA.y, AREA.w, AREA.h, PAL.asphalt);
  P.noise(g, AREA, many(60000), [PAL.asphalt2, PAL.asphaltHi, PAL.black, '#3e4048'], rnd);
  P.noise(g, AREA, many(4000), ['#5a5d68', '#252830'], rnd, 1);
  // Macchie di asfalto vecchio (zone più scure, irregolari)
  for (let i = 0; i < many(22); i++) {
    const x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h, w = 30 + rnd() * 60, h = 20 + rnd() * 40;
    P.rect(g, x - 0.5, y - 0.5, w + 1, h + 1, '#18191e');
    P.rect(g, x, y, w, h, '#26272c');
    P.noise(g, { x, y, w, h }, Math.round(w * h / 3), ['#2e3038', '#1e1f24'], rnd);
  }
  // Zona carico/scarico: hatch giallo in un angolo
  const lzx = AREA.x + 30, lzy = AREA.y + 30, lzw = 80, lzh = 60;
  P.rect(g, lzx, lzy, lzw, lzh, '#2e2e1a');
  for (let d = 0; d < lzw + lzh; d += 10) {
    const x1 = lzx + Math.max(0, d - lzh), y1 = lzy + Math.max(0, lzh - d);
    const x2 = lzx + Math.min(lzw, d),      y2 = lzy + Math.max(0, d - lzw + lzh);
    if (x2 > x1) { g.strokeStyle = 'rgba(242,183,5,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  }
  P.rect(g, lzx, lzy, lzw, 1.5, 'rgba(242,183,5,0.6)');
  P.rect(g, lzx, lzy + lzh, lzw, 1.5, 'rgba(242,183,5,0.6)');
  // Strade di accesso
  P.rect(g, TOWER.x - LANE, AREA.y, LANE * 2, AREA.h, PAL.road);
  P.rect(g, AREA.x, TOWER.y - LANE, AREA.w, LANE * 2, PAL.road);
  // Linee tratteggiate gialle — più visibili
  for (let t = AREA.y + 4; t < AREA.y + AREA.h; t += 18) {
    if (rnd() < 0.15) continue;
    P.rect(g, TOWER.x - 1, t, 2, 10, 'rgba(242,183,5,0.75)');
  }
  for (let t = AREA.x + 4; t < AREA.x + AREA.w; t += 18) {
    if (rnd() < 0.15) continue;
    P.rect(g, t, TOWER.y - 1, 10, 2, 'rgba(242,183,5,0.75)');
  }
  // File di posti auto con linee bianche più visibili
  const colors = ['#b02030', '#2f4f6f', '#c0c4cc', '#3e6b2a', '#141416', '#d9c040', '#e8e2d0', '#8a3b1e', '#4a8a9a', '#e8641b'];
  const kinds = ['500', '500', 'panda', 'panda', 'alfa', 'ape'];
  for (let ry = AREA.y + 20; ry < AREA.y + AREA.h - 30; ry += 76) {
    for (let sx = AREA.x + 10; sx < AREA.x + AREA.w - 20; sx += 22) {
      if (!free(sx + 10, ry + 16, 4) || !free(sx + 10, ry, 4) || !free(sx + 10, ry + 32, 4)) continue;
      P.rect(g, sx, ry, 1, 34, 'rgba(220,215,195,0.6)');
      P.rect(g, sx, ry + 34, 22, 1, 'rgba(220,215,195,0.4)');
      if (!opts?.skipCars && rnd() < 0.7) P.italianCar(g, sx + 3, ry + 3, kinds[Math.floor(rnd() * kinds.length)], colors[Math.floor(rnd() * colors.length)], rnd() < 0.15, rnd);
      else if (rnd() < 0.25) P.moto(g, sx + 8, ry + 4, colors[Math.floor(rnd() * colors.length)]);
      else if (rnd() < 0.3) P.trash(g, sx + 10, ry + 20, rnd);
    }
  }
  // Camion parcheggiati lungo il bordo
  if (!opts?.skipCars) {
    const truckColors = ['#e8e2d0', '#d9c040', '#b02030', '#2f4f6f', '#3a3c42'];
    for (let i = 0; i < many(3); i++) {
      const tx = AREA.x + 20 + Math.floor(rnd() * 3) * 90, ty = AREA.y + 10 + Math.floor(rnd() * 4) * 80;
      if (free(tx + 20, ty + 30, 30)) P.truck(g, tx, ty, truckColors[Math.floor(rnd() * truckColors.length)], rnd() < 0.1, rnd);
    }
  }
  // Crepe, erbacce, macchie
  for (let i = 0; i < many(70); i++) {
    const x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h;
    if (inYard(x, y, 8)) continue;
    const end = P.crack(g, x, y, rnd, 4 + Math.floor(rnd() * 10));
    if (rnd() < 0.4) P.weeds(g, Math.round(end.x), Math.round(end.y));
  }
  scatter(rnd, many(30), 6,  (x: number, y: number) => P.stain(g, x, y, 5 + rnd() * 10, 3 + rnd() * 5));
  scatter(rnd, many(10), 14, (x: number, y: number) => P.puddle(g, x, y, 10 + rnd() * 10, 4 + rnd() * 4));
  scatter(rnd, many(8),  10, (x: number, y: number) => P.manhole(g, x, y));
  scatter(rnd, many(6),  16, (x: number, y: number) => P.parkingMeter(g, x, y));
  scatter(rnd, many(40), 10, (x: number, y: number, r: number) => {
    if      (r < 0.20) P.cone(g, x, y);
    else if (r < 0.35) P.barrel(g, x, y, rnd() < 0.5 ? PAL.rust : '#2f4f6f');
    else if (r < 0.50) P.planterTree(g, x, y, rnd() < 0.5);
    else if (r < 0.60) P.tire(g, x, y);
    else if (r < 0.72) P.fireHydrant(g, x, y);
    else               P.trash(g, x, y, rnd);
  });
  scatter(rnd, many(5),  30, (x: number, y: number) => P.dumpster(g, x, y));
  scatter(rnd, many(6),  20, (x: number, y: number) => P.vendingMachine(g, x, y, rnd() < 0.5 ? '#1a3a6a' : '#2a1a4a'));
  P.spray(g, 'SCIOPERO!',       TOWER.x - 170, TOWER.y - 150, PAL.pink, -0.08, 18);
  P.spray(g, 'NO STRAORDINARI', TOWER.x + 180, TOWER.y + 160, PAL.cyan,  0.05, 13);
}
