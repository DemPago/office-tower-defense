// Scenario: 4. Centro commerciale (Commerciale).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g, rnd, data) {
  for (let y = AREA.y; y < AREA.y + AREA.h; y += 16) {
    for (let x = AREA.x; x < AREA.x + AREA.w; x += 16) {
      const dark = ((x + y) / 16) % 2;
      P.rect(g, x, y, 16, 16, dark ? '#8f7f73' : '#a8968a');
      P.rect(g, x, y, 16, 0.5, 'rgba(60,50,45,0.5)');
      P.rect(g, x, y, 0.5, 16, 'rgba(60,50,45,0.5)');
      for (let k = 0; k < 5; k++) P.rect(g, x + 3 + k, y + 2 + k, 0.5, 0.5, 'rgba(255,255,255,0.22)'); // riflesso lucido
      if (rnd() < 0.3) P.rect(g, x + 9, y + 10, 3, 0.5, 'rgba(255,255,255,0.15)');
    }
  }
  P.noise(g, AREA, many(26000), ['#6e6158', '#b9a99a', '#8a7a6e'], rnd);
  // Corridoi: moquette blu sporca
  P.rect(g, TOWER.x - LANE + 4, AREA.y, LANE * 2 - 8, AREA.h, '#2b3a5a');
  P.rect(g, AREA.x, TOWER.y - LANE + 4, AREA.w, LANE * 2 - 8, '#2b3a5a');
  P.noise(g, { x: TOWER.x - LANE + 4, y: AREA.y, w: LANE * 2 - 8, h: AREA.h }, 3000, ['#24314d', '#34466a'], rnd);
  P.noise(g, { x: AREA.x, y: TOWER.y - LANE + 4, w: AREA.w, h: LANE * 2 - 8 }, 3000, ['#24314d', '#34466a'], rnd);
  // Vetrine dei negozi con insegne al neon, in fila
  const signs = ['SALDI', '-70%', 'OUTLET', 'BAR', 'SCONTI', 'SUSHI', 'TECH', 'MODA'];
  const neonColors = [PAL.pink, PAL.cyan, PAL.hazard, PAL.toxic];
  for (let ry = AREA.y + 30; ry < AREA.y + AREA.h; ry += 110) {
    for (let x = AREA.x + 10; x < AREA.x + AREA.w - 50; x += 58) {
      if (!free(x + 26, ry, 6) || !free(x + 26, ry - 34, 6) || !free(x, ry - 20, 2) || !free(x + 52, ry - 20, 2)) continue;
      const col = neonColors[Math.floor(rnd() * neonColors.length)];
      P.shadow(g, x + 2, ry + 1, 52, 4);
      P.rect(g, x - 1, ry - 35, 54, 36, PAL.black);
      P.rect(g, x, ry - 34, 52, 35, '#3a3c42');
      P.rect(g, x + 3, ry - 22, 46, 22, '#1c2430');
      P.rect(g, x + 5, ry - 20, 10, 18, 'rgba(255,255,255,0.12)');
      P.rect(g, x + 3, ry - 33, 46, 9, PAL.black);
      const label = signs[Math.floor(rnd() * signs.length)];
      data.neons.push({ x: x + 26, y: ry - 26, label, col, phase: rnd() * 10 });
      if (rnd() < 0.5) P.box(g, x + 10 + rnd() * 30, ry + 12, 9, 7);
    }
  }
  scatter(rnd, many(36), 12, (x, y, r) => {
    if (r < 0.3) P.palm(g, x, y);
    else if (r < 0.5) P.bench(g, x, y);
    else if (r < 0.62) P.kiosk(g, x, y, neonColors[Math.floor(rnd() * 4)], signs[Math.floor(rnd() * signs.length)]);
    else if (r < 0.8) { P.rect(g, x, y - 7, 6, 7, PAL.black); P.rect(g, x + 1, y - 6, 4, 5, neonColors[Math.floor(rnd() * 4)]); } // sacchetti della spesa
    else P.trash(g, x, y, rnd);
  });
  P.spray(g, 'COMPRA! COMPRA!', TOWER.x + 170, TOWER.y + 150, PAL.pink, 0.06, 14);
  return { floor: '#7e746a', seam: '#5e554d' };
}

export function ambient(ctx, time, data) {
  ctx.save();
  ctx.font = `6px ${FONT}`;
  ctx.textAlign = 'center';
  for (const n of data.neons) {
    const on = Math.sin(time * 7 + n.phase) > -0.85 || Math.sin(time * 1.3 + n.phase) > 0;
    ctx.shadowColor = n.col;
    ctx.shadowBlur = on ? 6 : 0;
    ctx.fillStyle = on ? n.col : shade(n.col, 0.35);
    ctx.fillText(n.label, n.x, n.y + 3);
  }
  ctx.restore();
}
