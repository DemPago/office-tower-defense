// Scenario: 6. Tetto del grattacielo (Piani Alti).
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, inYard, scatter, many } from './common.js';

export function build(g, rnd, data) {
  // Sotto il tetto: la città di notte
  P.rect(g, AREA.x, AREA.y, AREA.w, AREA.h, '#0b0d14');
  P.noise(g, AREA, many(3000), ['#f2b705', '#e9f08a', '#2de2e6', '#ff3e8a', '#3a3c42'], rnd);
  // Il tetto (più grande del mondo di gioco) con il parapetto
  const roof = { x: -150, y: -150, w: WORLD.w + 300, h: WORLD.h + 300 };
  P.rect(g, roof.x - 6, roof.y - 6, roof.w + 12, roof.h + 12, PAL.concreteDk);
  P.rect(g, roof.x - 6, roof.y - 6, roof.w + 12, 3, PAL.concreteHi);
  P.rect(g, roof.x, roof.y, roof.w, roof.h, '#2b2d33');
  for (let y = roof.y; y < roof.y + roof.h; y += 32) { P.rect(g, roof.x, y, roof.w, 0.5, '#1d1f24'); P.rect(g, roof.x, y + 0.5, roof.w, 0.5, '#383a41'); }
  for (let x = roof.x; x < roof.x + roof.w; x += 48) P.rect(g, x, roof.y, 0.5, roof.h, '#24262b');
  P.noise(g, roof, Math.round(roof.w * roof.h / 4), ['#34363d', '#222429', '#3d4048', '#2e3036'], rnd);
  for (let i = 0; i < many(60); i++) P.crack(g, roof.x + rnd() * roof.w, roof.y + rnd() * roof.h, rnd, 3, '#1d1f24'); // grinze
  // Passerelle
  P.rect(g, TOWER.x - LANE + 6, roof.y, LANE * 2 - 12, roof.h, '#55585f');
  P.rect(g, roof.x, TOWER.y - LANE + 6, roof.w, LANE * 2 - 12, '#55585f');
  for (let t = roof.y; t < roof.y + roof.h; t += 8) P.rect(g, TOWER.x - LANE + 6, t, LANE * 2 - 12, 1, '#44474e');
  for (let t = roof.x; t < roof.x + roof.w; t += 8) P.rect(g, t, TOWER.y - LANE + 6, 1, LANE * 2 - 12, '#44474e');
  // Eliporto
  const hx = TOWER.x + 190, hy = TOWER.y - 180;
  P.stain(g, hx, hy, 52, 52, PAL.black);
  P.stain(g, hx, hy, 50, 50, '#3a3c42');
  g.strokeStyle = PAL.hazard;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(hx, hy, 42, 0, Math.PI * 2);
  g.stroke();
  P.rect(g, hx - 14, hy - 18, 6, 36, PAL.white);
  P.rect(g, hx + 8, hy - 18, 6, 36, PAL.white);
  P.rect(g, hx - 8, hy - 3, 16, 6, PAL.white);
  // Blocchi di pannelli solari in file
  for (let ry = roof.y + 30; ry < roof.y + roof.h - 30; ry += 58) {
    for (let x = roof.x + 14; x < roof.x + roof.w - 40; x += 40) {
      if (!free(x, ry, 6) || !free(x + 36, ry + 12, 6) || Math.hypot(x - hx, ry - hy) < 70) continue;
      if (rnd() < 0.45) continue;
      for (let k = 0; k < 3; k++) {
        P.rect(g, x + k * 12, ry, 11, 14, PAL.black);
        P.rect(g, x + k * 12 + 1, ry + 1, 9, 12, '#24406a');
        P.rect(g, x + k * 12 + 1, ry + 1, 9, 1, '#3a6ea5');
        P.rect(g, x + k * 12 + 5, ry + 1, 1, 12, '#1a2f50');
      }
      P.shadow(g, x + 2, ry + 14, 34, 3);
    }
  }
  // Casotti delle scale e serbatoi d'acqua
  scatter(rnd, many(10), 30, (x, y, r) => {
    if (x < roof.x + 20 || y < roof.y + 40 || x > roof.x + roof.w - 50 || y > roof.y + roof.h - 20) return;
    if (r < 0.5) {
      P.shadow(g, x + 4, y + 1, 40, 5);
      P.rect(g, x - 1, y - 31, 42, 32, PAL.black);
      P.rect(g, x, y - 30, 40, 30, PAL.concrete);
      P.rect(g, x, y - 30, 40, 4, PAL.concreteHi);
      P.rect(g, x + 14, y - 18, 12, 18, PAL.steel);
      P.rect(g, x + 23, y - 10, 2, 2, PAL.hazard);
      P.spray(g, 'EXIT', x + 20, y - 21, PAL.toxic, 0, 8);
    } else {
      P.shadow(g, x - 10, y + 1, 30, 5);
      P.rect(g, x - 9, y - 30, 2, 30, PAL.steel);
      P.rect(g, x + 7, y - 30, 2, 30, PAL.steel);
      P.stain(g, x, y - 36, 14, 12, PAL.black);
      P.stain(g, x, y - 37, 13, 11, PAL.rust);
      P.rect(g, x - 12, y - 40, 24, 2, PAL.rustHi);
    }
  });
  // Condotti dell'aria lungo il tetto
  for (let i = 0; i < many(8); i++) {
    const x = roof.x + 20 + rnd() * (roof.w - 140), y = roof.y + 20 + rnd() * (roof.h - 40);
    if (!free(x, y, 6) || !free(x + 100, y, 6)) continue;
    P.rect(g, x - 1, y - 9, 102, 10, PAL.black);
    P.rect(g, x, y - 8, 100, 8, PAL.steel);
    P.rect(g, x, y - 8, 100, 2, PAL.silver);
    for (let k = 10; k < 100; k += 20) P.rect(g, x + k, y - 8, 1, 8, PAL.black);
  }
  // Lucernari, condizionatori, antenne
  scatter(rnd, many(90), 12, (x, y, r) => {
    if (x < roof.x + 10 || y < roof.y + 10 || x > roof.x + roof.w - 40 || y > roof.y + roof.h - 30) return;
    if (Math.hypot(x - hx, y - hy) < 60) return;
    if (r < 0.3) P.skylight(g, x, y);
    else if (r < 0.55) P.acUnit(g, x, y);
    else if (r < 0.75) { for (let k = 0; k < 3; k++) { P.rect(g, x + k * 12, y - 10, 11, 10, PAL.black); P.rect(g, x + k * 12 + 1, y - 9, 9, 8, '#24406a'); P.rect(g, x + k * 12 + 1, y - 9, 9, 1, '#3a6ea5'); } } // pannelli solari
    else { P.rect(g, x, y - 34, 2, 34, PAL.steel); P.rect(g, x - 4, y - 26, 10, 1, PAL.steel); data.lights.push({ x: x + 1, y: y - 35 }); } // antenna
  });
  P.spray(g, 'IL CAPO NON CÈ', TOWER.x - 180, TOWER.y + 160, PAL.pink, -0.04, 14);
  return { floor: '#55585f', seam: '#3a3c42' };
}

export function ambient(ctx, time, data) {
  const on = Math.sin(time * 3) > 0;
  for (const l of data.lights) {
    if (!on) continue;
    ctx.fillStyle = 'rgba(215,38,61,0.35)';
    ctx.fillRect(l.x - 3, l.y - 3, 7, 7);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(l.x - 1, l.y - 1, 3, 3);
  }
}
