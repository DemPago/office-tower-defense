// Scenario: 3. Data center (Reparto IT).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g, rnd, data) {
  for (let y = AREA.y; y < AREA.y + AREA.h; y += 16) {
    for (let x = AREA.x; x < AREA.x + AREA.w; x += 16) {
      P.rect(g, x, y, 16, 16, '#353a43');
      P.rect(g, x, y, 16, 0.5, '#20242a');
      P.rect(g, x, y, 0.5, 16, '#20242a');
      P.rect(g, x + 0.5, y + 0.5, 15.5, 0.5, '#454b55');
      if (rnd() < 0.22) for (let a = 2.5; a < 14; a += 1.5) for (let b = 2.5; b < 14; b += 1.5) P.rect(g, x + a, y + b, 0.5, 0.5, '#1c1f25');
    }
  }
  P.noise(g, AREA, many(20000), ['#40464f', '#2a2e35'], rnd);
  // Corridoi con le strisce di sicurezza
  for (const v of [true, false]) {
    if (v) {
      P.rect(g, TOWER.x - LANE, AREA.y, 3, AREA.h, PAL.hazard);
      P.rect(g, TOWER.x + LANE - 3, AREA.y, 3, AREA.h, PAL.hazard);
    } else {
      P.rect(g, AREA.x, TOWER.y - LANE, AREA.w, 3, PAL.hazard);
      P.rect(g, AREA.x, TOWER.y + LANE - 3, AREA.w, 3, PAL.hazard);
    }
  }
  // Cavi colorati per terra
  for (let i = 0; i < many(26); i++) {
    g.strokeStyle = ['#2f4f8f', '#d7263d', '#7bd332', '#f2b705', '#141416'][i % 5];
    g.lineWidth = 2;
    g.beginPath();
    let x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      const nx = x + (rnd() - 0.5) * 120, ny = y + (rnd() - 0.5) * 120;
      g.quadraticCurveTo((x + nx) / 2 + (rnd() - 0.5) * 40, (y + ny) / 2, nx, ny);
      x = nx; y = ny;
    }
    g.stroke();
  }
  // File di armadi server
  for (let ry = AREA.y + 50; ry < AREA.y + AREA.h; ry += 64) {
    for (let x = AREA.x + 8; x < AREA.x + AREA.w; x += 18) {
      if (!free(x + 8, ry - 4, 6) || !free(x + 8, ry - 34, 6)) continue;
      P.serverRack(g, x, ry, data.leds);
    }
  }
  scatter(rnd, many(14), 14, (x, y) => P.puddle(g, x, y, 8 + rnd() * 10, 3 + rnd() * 4, '#1f4a52', PAL.cyan));
  scatter(rnd, many(16), 16, (x, y, r) => (r < 0.5 ? P.acUnit(g, x, y) : P.box(g, x, y)));
  P.spray(g, 'HAI PROVATO A RIAVVIARE?', TOWER.x, TOWER.y - 150, PAL.toxic, -0.03, 12);
  return { floor: '#4a505a', seam: '#30343b' };
}

export function ambient(ctx, time, data) {
  const tick = Math.floor(time * 6);
  for (let i = 0; i < data.leds.length; i++) {
    const led = data.leds[i];
    if ((i * 7 + tick) % 5 === 0) continue; // ogni tanto si spengono
    ctx.fillStyle = led.c;
    ctx.fillRect(led.x, led.y, 1, 0.5);
  }
}
