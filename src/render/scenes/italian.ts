// Dettagli italiani aggiunti sopra agli scenari: nasoni romani (con l'acqua che scorre)
// e il kebabbaro (con lo spiedo che gira). Le quantità per scenario sono in scenery.js.
import { PAL, FONT } from '../palette.js';
import * as P from '../props.js';
import { AREA, free } from './common.js';

// Cerca un punto dove un oggetto largo w e alto h sta tutto fuori da cortile e corridoi.
function findSpot(rnd, w, h, taken) {
  for (let i = 0; i < 400; i++) {
    const x = Math.round(AREA.x + 20 + rnd() * (AREA.w - w - 40)), y = Math.round(AREA.y + h + 20 + rnd() * (AREA.h - h - 40));
    const ok = [[x, y], [x + w, y], [x, y - h], [x + w, y - h], [x + w / 2, y - h / 2]].every(([px, py]) => free(px, py, 6))
      && taken.every(t => Math.abs(t.x - x) > 70 || Math.abs(t.y - y) > 60);
    if (ok) { taken.push({ x, y }); return { x, y }; }
  }
  return null;
}

export function placeItalian(g, rnd, data, { nasoni = 0, kebab = 0 }) {
  const taken = [];
  data.water = [];
  data.kebabs = [];
  for (let i = 0; i < kebab; i++) {
    const p = findSpot(rnd, 46, 34, taken);
    if (p) data.kebabs.push(P.kebab(g, p.x, p.y));
  }
  for (let i = 0; i < nasoni; i++) {
    const p = findSpot(rnd, 12, 20, taken);
    if (p) data.water.push(P.nasone(g, p.x, p.y));
  }
}

// Animazione: getto d'acqua dei nasoni, spiedo del kebab che gira, insegna che lampeggia.
export function animateItalian(ctx, time, data) {
  for (const w of data.water || []) {
    // arco del getto che scende fino a terra, con gocce che scorrono
    for (let k = 0; k < 9; k++) {
      const t = k / 8;
      const x = w.x + t * 3, y = w.y + t * t * (w.ground - w.y);
      ctx.fillStyle = (k + Math.floor(time * 12)) % 3 ? 'rgba(160,210,240,0.85)' : '#e0f4ff';
      ctx.fillRect(x, y, 0.5 + (1 - t) * 0.5, 1.5);
    }
    ctx.fillStyle = 'rgba(160,210,240,0.5)';
    ctx.fillRect(w.x + 1.5 + Math.sin(time * 9) * 0.5, w.ground, 2, 0.5); // schizzi
  }
  for (const k of data.kebabs || []) {
    // spiedo verticale che gira: strisce di carne che scorrono
    for (let r = 0; r < 11; r++) {
      const wdt = 4 - Math.abs(r - 4) * 0.25;
      ctx.fillStyle = (r + Math.floor(time * 6)) % 3 ? '#a8602e' : '#c8803e';
      ctx.fillRect(k.x - wdt / 2, k.y + r, wdt, 1);
    }
    ctx.fillStyle = '#5b5f66';
    ctx.fillRect(k.x - 0.25, k.y - 1.5, 0.5, 13);
    ctx.fillStyle = 'rgba(255,123,28,0.35)'; // brace dietro lo spiedo
    ctx.fillRect(k.x + 2, k.y, 1.5, 11);
    // insegna al neon KEBAB
    const on = Math.sin(time * 5) > -0.7;
    ctx.save();
    ctx.font = `6px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.shadowColor = PAL.hazard;
    ctx.shadowBlur = on ? 5 : 0;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(k.sign.x - 15, k.sign.y - 6, 30, 8);
    ctx.fillStyle = on ? PAL.hazard : '#6a5010';
    ctx.fillText('KEBAB', k.sign.x, k.sign.y + 0.5);
    ctx.restore();
  }
}
