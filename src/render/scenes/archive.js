// Scenario: 2. Archivio (Amministrazione).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g, rnd) {
  const slab = ['#7d776c', '#77716a', '#837d71', '#716b62'];
  for (let y = AREA.y; y < AREA.y + AREA.h; y += 24) {
    for (let x = AREA.x + ((y / 24) % 2 ? 12 : 0) - 12; x < AREA.x + AREA.w; x += 24) {
      P.rect(g, x, y, 24, 24, slab[Math.floor(rnd() * slab.length)]);
      P.rect(g, x, y, 24, 0.5, '#5a554d');
      P.rect(g, x, y, 0.5, 24, '#5a554d');
      P.rect(g, x + 0.5, y + 0.5, 23.5, 0.5, '#99938a');
      P.rect(g, x + 0.5, y + 0.5, 0.5, 23.5, '#928c82');
      if (rnd() < 0.08) P.crack(g, x + 4 + rnd() * 16, y + 4 + rnd() * 16, rnd, 4, '#4a4640');
      if (rnd() < 0.05) P.weeds(g, x + 1, y + 1);
    }
  }
  P.noise(g, AREA, many(40000), ['#8f897d', '#615c54', '#6e685f'], rnd);
  // Corridoi: tappeto rosso consumato
  for (const [x, y, w, h] of [[TOWER.x - LANE + 6, AREA.y, LANE * 2 - 12, AREA.h], [AREA.x, TOWER.y - LANE + 6, AREA.w, LANE * 2 - 12]]) {
    P.rect(g, x, y, w, h, '#6b1d24');
    P.rect(g, x + 3, y + 3, Math.max(1, w - 6), Math.max(1, h - 6), '#7a2430');
    P.noise(g, { x, y, w, h }, Math.round(w * h / 30), ['#5a1820', '#8a3a40'], rnd);
  }
  // Archivi: file di schedari con pile di pratiche
  for (let ry = AREA.y + 40; ry < AREA.y + AREA.h; ry += 70) {
    for (let x = AREA.x + 10; x < AREA.x + AREA.w; x += 14) {
      if (!free(x + 6, ry - 10, 6) || !free(x + 6, ry - 30, 6)) continue;
      if (rnd() < 0.85) P.cabinet(g, x, ry, rnd() < 0.7 ? PAL.steel : '#4a5a4a');
      if (rnd() < 0.3) P.paperStack(g, x + 6, ry - 24, 2 + Math.floor(rnd() * 5));
    }
  }
  scatter(rnd, many(50), 10, (x, y, r) => {
    if (r < 0.3) P.paperStack(g, x, y, 3 + Math.floor(rnd() * 8));
    else if (r < 0.5) P.box(g, x, y, 12, 10);
    else if (r < 0.62) P.chair(g, x, y);
    else if (r < 0.7) P.desk(g, x, y);
    else if (r < 0.78) P.bench(g, x, y);
    else for (let k = 0; k < 4; k++) P.rect(g, x + rnd() * 16, y + rnd() * 8, 4, 3, PAL.white); // fogli sparsi
  });
  P.spray(g, 'PROTOCOLLO 404', TOWER.x - 190, TOWER.y + 150, PAL.hazard, -0.06, 14);
  return { floor: '#8f897d', seam: '#6a655c' };
}
