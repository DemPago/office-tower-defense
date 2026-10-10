// Il palazzo (la torre) disegnato a risoluzione doppia, il protagonista sul tetto e il fumo.
import { TOWER } from '../state.js';
import { PAL, FONT, SPRAY } from './palette.js';
import { hazardStripes, sandbag } from './props.js';
import { drawPersonAt } from './view.js';

// Misure del palazzo (la torre).
export const B = { w: 60, h: 84 };
B.x0 = TOWER.x - B.w / 2;
B.base = TOWER.y + 24;
B.top = B.base - B.h;

// Il palazzo è disegnato a risoluzione doppia (1 pixel = mezzo pixel del mondo),
// come i personaggi. Coordinate interne: facciata 120×168, origine in alto a sinistra.
const TW = B.w * 2, TH = B.h * 2;

// Stato di ogni finestra (3 colonne × 4 piani): L accesa, D spenta, X rotta, B sbarrata con assi.
const WINDOWS = 'LDL' + 'XLL' + 'LBD' + 'DLX';

// Crepe che compaiono quando il palazzo è danneggiato (coordinate interne).
const CRACKS = [
  [[16, 60], [24, 72], [20, 84], [30, 96], [26, 104]],
  [[88, 40], [80, 54], [86, 66], [82, 74]],
  [[60, 120], [52, 132], [58, 144], [50, 156]],
];

let facadeCache = null;

// Facciata "statica" (cemento, macchie, colature): disegnata una sola volta.
function facade() {
  if (facadeCache) return facadeCache;
  const c = document.createElement('canvas');
  c.width = TW;
  c.height = TH;
  const g = c.getContext('2d');
  const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  p(0, 0, TW, TH, PAL.concrete);
  for (let i = 0; i < 1400; i++) p(Math.floor(rnd() * TW), Math.floor(rnd() * TH), 1, 1, rnd() < 0.5 ? PAL.concreteHi : PAL.concreteDk);
  for (let x = 20; x < TW - 20; x += 20) p(x, 0, 1, TH, 'rgba(13,13,15,0.18)');         // giunti dei pannelli
  for (let y = 46; y < TH; y += 30) { p(0, y, TW, 2, PAL.concreteDk); p(0, y + 2, TW, 1, PAL.concreteHi); } // marcapiani
  p(0, 0, 3, TH, PAL.concreteHi);                                                         // spigolo illuminato
  p(TW - 20, 0, 20, TH, PAL.concreteDk);                                                  // lato in ombra
  p(TW - 20, 0, 2, TH, PAL.black);
  for (let i = 0; i < 18; i++) {                                                          // colature di sporco
    const x = Math.floor(rnd() * (TW - 24)), y = Math.floor(rnd() * TH * 0.8), len = 8 + Math.floor(rnd() * 24);
    p(x, y, 1, len, 'rgba(13,13,15,0.3)');
    p(x + 1, y, 1, Math.floor(len * 0.6), 'rgba(13,13,15,0.2)');
  }
  for (let i = 0; i < 4; i++) {                                                           // ruggine
    const x = Math.floor(rnd() * (TW - 30)), y = Math.floor(rnd() * 40);
    p(x, y, 2, 20 + Math.floor(rnd() * 20), 'rgba(138,59,30,0.45)');
  }
  // graffito
  g.font = `16px ${SPRAY}`;
  g.fillStyle = PAL.black;
  g.fillText('OTD', 8, TH - 12);
  g.fillStyle = PAL.pink;
  g.fillText('OTD', 6, TH - 14);
  facadeCache = c;
  return c;
}

function drawWindow(p, x, y, kind, flick, i) {
  p(x - 1, y - 1, 26, 22, PAL.black);
  p(x, y + 20, 24, 2, PAL.concreteHi); // davanzale
  if (kind === 'L') {
    p(x, y, 24, 20, flick ? '#9aa05a' : PAL.fluo);
    for (let r = 2; r < 9; r += 2) p(x, y + r, 24, 1, 'rgba(120,110,40,0.35)'); // tapparelle a metà
    // sagome di impiegati dietro al vetro
    const sx = x + 4 + (i * 7) % 12;
    p(sx, y + 11, 6, 9, 'rgba(13,13,15,0.55)');
    p(sx + 1, y + 8, 4, 4, 'rgba(13,13,15,0.55)');
    p(x + 2, y + 2, 3, 6, 'rgba(255,255,255,0.4)');
  } else if (kind === 'D') {
    p(x, y, 24, 20, PAL.glass);
    for (let k = 0; k < 6; k++) p(x + 3 + k, y + 2 + k, 1, 1, '#4b6075');        // riflesso in diagonale
    for (let k = 0; k < 4; k++) p(x + 12 + k, y + 9 + k, 1, 1, '#34465a');
  } else if (kind === 'X') {
    p(x, y, 24, 20, '#060607');
    p(x, y, 7, 2, PAL.grey); p(x, y, 2, 6, PAL.grey); p(x + 5, y + 2, 2, 2, PAL.grey); // schegge di vetro
    p(x + 18, y + 16, 6, 2, PAL.grey); p(x + 22, y + 11, 2, 6, PAL.grey);
    p(x + 9, y + 8, 3, 1, 'rgba(192,196,204,0.5)');
  } else {
    p(x, y, 24, 20, PAL.glass);
    for (const [py, tilt] of [[3, 0], [9, 1], [15, 0]]) {
      p(x - 3, y + py + tilt, 30, 4, PAL.wood);
      p(x - 3, y + py + tilt, 30, 1, PAL.woodHi);
      p(x - 1, y + py + 1 + tilt, 1, 1, PAL.black); p(x + 24, y + py + 1 + tilt, 1, 1, PAL.black); // chiodi
    }
  }
}

// Tetto pagoda: corpo rosso + gronde che si alzano agli angoli
function drawRoof(p, x, y, w, h) {
  p(x, y + h - 2, w, 3, '#0d0508');                          // cornice nera
  p(x + 2, y + 1, w - 4, h - 3, '#c41c1c');                  // corpo
  p(x + 2, y + 1, w - 4, 2, '#e63030');                      // highlight cima
  p(x + 2, y + h - 4, w - 4, 2, '#8c1010');                  // ombra basso
  // Gronde curve: si alzano verso l'esterno angolo per angolo
  for (let i = 1; i <= 5; i++) {
    p(x - i * 2,         y + h - 1 - i, i * 2, 2, '#c41c1c');
    p(x + w - 1 + i * 0, y + h - 1 - i, i * 2, 2, '#c41c1c');
  }
  p(x - 12, y + h - 8, 4, 3, '#e63030'); p(x + w + 8, y + h - 8, 4, 3, '#e63030'); // punte
  p(x - 14, y + h - 11, 3, 4, '#c41c1c'); p(x + w + 11, y + h - 11, 3, 4, '#c41c1c');
}

function drawCastle(ctx, assets, run, time) {
  const dead = run && run.phase === 'over';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(B.x0 + 6, B.base - 2, B.w + 14, 7);
  ctx.save();
  ctx.translate(B.x0, B.top);
  ctx.scale(0.5, 0.5);
  const p = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  const W = TW, H = TH;

  // ── Ciliegio pixel art (a sinistra del castello) ──
  p(-20, Math.round(H * 0.55), 5, Math.round(H * 0.45), '#5a3a22');   // tronco
  p(-18, Math.round(H * 0.38), 3, Math.round(H * 0.2),  '#5a3a22');   // ramo
  const blossoms = [[-30,0.18],[-18,0.14],[-12,0.24],[-26,0.30],[-8,0.21],[-22,0.38]];
  for (const [bx, by] of blossoms) {
    const gy = Math.round(H * by);
    p(bx - 7, gy - 3, 14, 7, 'rgba(255,140,170,0.72)');
    p(bx - 4, gy - 6, 8,13, 'rgba(255,140,170,0.60)');
    p(bx - 1, gy - 1, 2, 2, '#fff8f8');
  }

  // ── Piano terra ──
  const f1y = Math.round(H * 0.65), f1h = Math.round(H * 0.35);
  p(12, f1y, W - 24, f1h, '#3a2010');
  p(12, f1y, W - 24, 2, '#7a5428');                     // highlight
  for (let c = 0; c < 3; c++) p(18 + c * 22, f1y, 4, f1h, '#251508'); // colonne
  // Finestre shoji (3)
  for (let c = 0; c < 3; c++) {
    const wx = 16 + c * 22, wy = f1y + 8;
    p(wx - 1, wy - 1, 16, 18, '#0d0508');
    const lit = !dead && Math.sin(time * 3.5 + c * 1.8) > 0.72;
    p(wx, wy, 14, 16, lit ? '#a0b060' : '#c89850');
    p(wx + 4, wy, 1, 16, '#7a6030'); p(wx + 9, wy, 1, 16, '#7a6030');
    p(wx, wy + 6, 14, 1, '#7a6030'); p(wx, wy + 11, 14, 1, '#7a6030');
  }
  // Porta centrale
  p(W/2 - 8, f1y + f1h - 22, 16, 22, '#1a0a04');
  p(W/2 - 7, f1y + f1h - 21, 14, 20, '#251208');
  p(W/2 - 4, f1y + f1h - 22, 8, 6, '#3a1a08');         // arco porta
  drawRoof(p, -16, f1y - 16, W + 32, 18);

  // ── Piano medio ──
  const f2y = Math.round(H * 0.37), f2h = Math.round(H * 0.29);
  p(24, f2y, W - 48, f2h, '#2e1c0e');
  p(24, f2y, W - 48, 2, '#5c3c18');
  for (let c = 0; c < 2; c++) p(30 + c * 24, f2y, 3, f2h, '#1e1008');
  // Finestre (2)
  for (let c = 0; c < 2; c++) {
    const wx = 28 + c * 26, wy = f2y + 7;
    p(wx - 1, wy - 1, 14, 13, '#0d0508');
    const lit2 = !dead && Math.sin(time * 4 + c * 2.1 + 0.8) > 0.75;
    p(wx, wy, 12, 11, lit2 ? '#90a050' : '#b89050');
    p(wx + 4, wy, 1, 11, '#7a6030'); p(wx + 8, wy, 1, 11, '#7a6030');
    p(wx, wy + 4, 12, 1, '#7a6030');
  }
  drawRoof(p, -4, f2y - 14, W + 8, 16);

  // ── Piano cima ──
  const f3y = Math.round(H * 0.12), f3h = Math.round(H * 0.26);
  p(38, f3y, W - 76, f3h, '#241408');
  p(38, f3y, W - 76, 2, '#4a3010');
  // Finestra centrale
  const wx3 = W/2 - 7, wy3 = f3y + 6;
  p(wx3 - 1, wy3 - 1, 14, 11, '#0d0508');
  const lit3 = !dead && Math.sin(time * 5 + 1.2) > 0.65;
  p(wx3, wy3, 12, 9, lit3 ? '#a0b860' : '#c8a060');
  p(wx3 + 4, wy3, 1, 9, '#8a6030'); p(wx3 + 8, wy3, 1, 9, '#8a6030');
  p(wx3, wy3 + 4, 12, 1, '#8a6030');
  drawRoof(p, 14, f3y - 12, W - 28, 14);

  // ── Pinnacolo dorato + banderina rossa ──
  p(W/2 - 2, -36, 4, 50, '#a07808');
  p(W/2 - 7, -20, 14, 5, '#f2b705');
  p(W/2 - 5, -28, 10, 3, '#d4a000');
  p(W/2 - 2, -38, 4, 6, '#f2b705');
  p(W/2 - 1, -42, 2, 6, '#a07808');
  for (let i = 0; i < 6; i++) p(W/2 + 1, -42 + i, 7 - i, 1, i < 3 ? '#d7263d' : '#e85550');

  // ── Hit flash ──
  if (run && run.tower.hitFlash > 0) {
    const fi = run.tower.hitFlash / 0.22;
    p(-3, -3, W + 6, H + 6, `rgba(215,38,61,${(0.2 + fi * 0.45).toFixed(2)})`);
  }
  ctx.restore();
  // Protagonist on roof
  if (dead) return;
  const recoil = run && run.tower.recoil > 0 ? 1 : 0;
  const bob = Math.round(Math.sin(time * 2.2) * 0.6);
  const feet = B.top - 3 + recoil + bob;
  drawPersonAt(ctx, assets.person(run ? run.hero : 'peppe', 0, 1), TOWER.x + 4, feet);
  if (recoil) {
    const fx = TOWER.x + 5, fy = feet - 15;
    ctx.fillStyle = PAL.white; ctx.fillRect(fx - 2, fy - 2, 5, 5);
    ctx.fillStyle = PAL.hazard; ctx.fillRect(fx - 5, fy - 1, 11, 3); ctx.fillRect(fx - 1, fy - 5, 3, 11);
  }
}

export function drawTower(ctx, assets, run, time) {
  if (run?.bonusStage) { drawCastle(ctx, assets, run, time); return; }
  const hpRatio = run ? run.tower.hp / run.stats.maxHp : 1;
  const dead = run && run.phase === 'over';

  // Ombra a terra (in coordinate del mondo)
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(B.x0 + 6, B.base - 2, B.w + 14, 7);

  ctx.save();
  ctx.translate(B.x0, B.top);
  ctx.scale(0.5, 0.5);
  const p = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };

  p(-3, -3, TW + 6, TH + 6, PAL.black);
  ctx.drawImage(facade(), 0, 0);

  // Finestre: 3 colonne × 4 piani
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 3; col++) {
      const i = r * 3 + col;
      let kind = WINDOWS[i];
      if (dead && kind === 'L') kind = 'D';
      if (hpRatio < 0.3 && kind === 'L' && i % 2) kind = 'X';
      const flick = kind === 'L' && Math.sin(time * 9 + i * 3.1) > 0.92;
      drawWindow(p, 8 + col * 32, 18 + r * 30, kind, flick, i);
    }
  }

  // Ingresso: saracinesca mezza alzata con architrave a strisce
  const dx = TW / 2 - 20;
  hazardStripes(ctx, dx - 6, TH - 44, 52, 8);
  p(dx - 2, TH - 36, 44, 36, PAL.black);
  p(dx, TH - 34, 40, 20, PAL.steel);
  for (let i = 0; i < 10; i++) p(dx, TH - 33 + i * 2, 40, 1, i % 2 ? '#4a4d54' : '#6b6f77');
  p(dx, TH - 14, 40, 14, '#060607');
  p(dx + 4, TH - 10, 6, 10, 'rgba(242,183,5,0.12)'); // luce dall'interno

  // Tetto: cornicione, filo spinato, condizionatore arrugginito, parabola, antenna
  p(-8, -8, TW + 16, 12, PAL.black);
  p(-6, -6, TW + 12, 8, PAL.concreteDk);
  p(-6, -6, TW + 12, 2, PAL.concreteHi);
  p(4, -28, 30, 22, PAL.black);
  p(6, -26, 26, 18, PAL.rust);
  p(6, -26, 26, 3, PAL.rustHi);
  for (let i = 0; i < 6; i++) p(9 + i * 4, -21, 2, 10, PAL.black);          // griglia della ventola
  p(TW - 28, -30, 22, 18, PAL.black);
  p(TW - 26, -28, 18, 12, PAL.grey);
  p(TW - 26, -28, 18, 3, PAL.silver);
  p(TW - 18, -18, 2, 12, PAL.black);
  p(TW - 12, -60, 3, 52, PAL.black);                                        // antenna
  p(TW - 18, -44, 15, 2, PAL.black);
  p(TW - 16, -52, 11, 2, PAL.black);
  p(TW - 14, -66, 7, 7, Math.sin(time * 4) > 0 ? PAL.red : PAL.blood);
  ctx.strokeStyle = PAL.grey;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= TW + 12; i += 4) ctx.lineTo(-6 + i + 0.5, -12 + ((i / 4) % 2 ? 0 : 3) + 0.5);
  ctx.stroke();

  // Insegna al neon con una lettera che fa i capricci
  p(8, 2, TW - 36, 14, PAL.black);
  p(8, 2, TW - 36, 1, PAL.steel);
  ctx.font = `8px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.shadowColor = PAL.pink;
  ctx.shadowBlur = dead ? 0 : 8;
  const broken = Math.sin(time * 17) > 0.2 || Math.sin(time * 1.3) > 0.7;
  'UFFICIO'.split('').forEach((ch, i) => {
    ctx.fillStyle = dead || (i === 4 && broken) ? '#4a1830' : PAL.pink;
    ctx.fillText(ch, 12 + i * 11, 13);
  });
  ctx.shadowBlur = 0;

  // Crepe quando la vita scende
  if (hpRatio < 0.6) {
    ctx.strokeStyle = PAL.black;
    ctx.lineWidth = 2;
    const n = hpRatio < 0.3 ? CRACKS.length : 1;
    for (let k = 0; k < n; k++) {
      ctx.beginPath();
      CRACKS[k].forEach(([cx, cy], j) => (j ? ctx.lineTo : ctx.moveTo).call(ctx, cx, cy));
      ctx.stroke();
    }
  }

  // Lampo rosso quando viene colpito: intensità proporzionale al flash
  if (run && run.tower.hitFlash > 0) {
    const fi = run.tower.hitFlash / 0.22;
    p(-3, -3, TW + 6, TH + 6, `rgba(215,38,61,${(0.2 + fi * 0.45).toFixed(2)})`);
    if (fi > 0.6) p(-3, -3, TW + 6, 4, `rgba(255,255,255,${(fi * 0.5).toFixed(2)})`);
  }
  ctx.restore();

  // Sacchi di sabbia davanti all'ingresso (in coordinate del mondo)
  sandbag(ctx, TOWER.x - 26, B.base - 6);
  sandbag(ctx, TOWER.x + 15, B.base - 6);

  if (dead) return;

  // Il protagonista sul tetto: elmetto e giubbotto catarifrangente
  const recoil = run && run.tower.recoil > 0 ? 1 : 0;
  const bob = Math.round(Math.sin(time * 2.2) * 0.6);
  const feet = B.top - 3 + recoil + bob;
  drawPersonAt(ctx, assets.person(run ? run.hero : 'peppe', 0, 1), TOWER.x + 4, feet);
  // Lampo allo sparo
  if (recoil) {
    const fx = TOWER.x + 5, fy = feet - 15;
    ctx.fillStyle = PAL.white;
    ctx.fillRect(fx - 2, fy - 2, 5, 5);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(fx - 5, fy - 1, 11, 3);
    ctx.fillRect(fx - 1, fy - 5, 3, 11);
  }
}

export function updateSmoke(smoke, run, dt) {
  const ratio = run ? run.tower.hp / run.stats.maxHp : 1;
  const over = run && run.phase === 'over';
  const rate = over ? 34 : ratio < 0.3 ? 10 : ratio < 0.6 ? 4 : 0.6;
  if (Math.random() < rate * dt) {
    smoke.push({
      x: B.x0 + 8 + Math.random() * (B.w - 16), y: B.top + 4 + Math.random() * (ratio < 0.6 ? 50 : 4),
      vx: (Math.random() - 0.3) * 6, size: 3, life: 1.8, max: 1.8,
      fire: over || (ratio < 0.3 && Math.random() < 0.5),
    });
  }
  for (const s of smoke) { s.life -= dt; s.y -= 16 * dt; s.x += s.vx * dt; s.size += 4 * dt; }
  for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].life <= 0) smoke.splice(i, 1);
}

export function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    const k = s.life / s.max;
    ctx.globalAlpha = k * 0.75;
    ctx.fillStyle = s.fire && k > 0.75 ? PAL.hazard : s.fire && k > 0.55 ? '#e8641b' : k > 0.5 ? '#3a3a40' : '#1e1e22';
    const z = Math.round(s.size);
    ctx.fillRect(Math.round(s.x - z / 2), Math.round(s.y - z / 2), z, z);
  }
  ctx.globalAlpha = 1;
}

export function hiddenByTower(e) {
  return Math.abs(e.x - TOWER.x) < B.w / 2 + 8 && e.y > B.top && e.y < B.base;
}
