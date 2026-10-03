// Scenari: uno per reparto, cambia ogni 10 ondate (dopo il boss).
// Ogni scenario disegna una volta il suo sfondo su un canvas (random a seed fisso)
// e può avere un'animazione leggera (led, neon, fari) disegnata a ogni frame.
import { WORLD, TOWER } from '../state.js';
import { PAL, FONT, shade } from './palette.js';
import * as P from './props.js';

// Lo sfondo continua oltre i bordi del mondo, per riempire anche schermi larghi.
export const MARGIN = 240;
// Gli sfondi sono disegnati a risoluzione doppia (come personaggi e palazzo).
export const SCENE_RES = 2;
export const AREA = { x: -MARGIN, y: -MARGIN, w: WORLD.w + MARGIN * 2, h: WORLD.h + MARGIN * 2 };
// Cortile fortificato intorno al palazzo e i 4 corridoi d'accesso (N, S, E, O).
export const YARD = { x: TOWER.x - 112, y: TOWER.y - 104, w: 224, h: 200 };
const LANE = 28; // mezza larghezza dei corridoi

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function inYard(x, y, pad = 0) {
  return x > YARD.x - pad && x < YARD.x + YARD.w + pad && y > YARD.y - pad && y < YARD.y + YARD.h + pad;
}
function inLane(x, y, pad = 0) {
  return Math.abs(x - TOWER.x) < LANE + pad || Math.abs(y - TOWER.y) < LANE + pad;
}
// Punto libero: fuori dal cortile e dai corridoi.
function free(x, y, pad = 8) {
  return !inYard(x, y, pad + 10) && !inLane(x, y, pad);
}
function scatter(rnd, n, pad, fn) {
  const pts = [];
  for (let i = 0; i < n * 4 && pts.length < n; i++) {
    const x = Math.round(AREA.x + rnd() * AREA.w), y = Math.round(AREA.y + rnd() * AREA.h);
    if (free(x, y, pad)) pts.push({ x, y, r: rnd() });
  }
  pts.sort((a, b) => a.y - b.y).forEach(p => fn(p.x, p.y, p.r));
}
const many = n => Math.round(n * (AREA.w * AREA.h) / (1200 * 1200));

// ─── Scenari ────────────────────────────────────────────────────

export const SCENES = [
  { name: 'Parcheggio aziendale', build: buildParking },
  { name: "Archivio dell'Amministrazione", build: buildArchive },
  { name: 'Data center', build: buildDataCenter, ambient: blinkLeds },
  { name: 'Centro commerciale', build: buildMall, ambient: flickerNeon },
  { name: 'Zona industriale', build: buildIndustrial, ambient: searchlights },
  { name: 'Tetto del grattacielo', build: buildRooftop, ambient: beacons },
];

export function sceneIndexForWave(wave) {
  return Math.floor((Math.max(1, wave) - 1) / 10) % SCENES.length;
}

// Costruisce lo sfondo di uno scenario: { canvas, ambient(ctx, time) }.
export function buildScene(index) {
  const scene = SCENES[index];
  const c = document.createElement('canvas');
  c.width = AREA.w * SCENE_RES;
  c.height = AREA.h * SCENE_RES;
  const g = c.getContext('2d');
  g.scale(SCENE_RES, SCENE_RES);
  g.translate(MARGIN, MARGIN); // si disegna in coordinate del mondo, con dettagli a mezzo pixel
  const rnd = seeded(101 + index * 7);
  const data = { leds: [], neons: [], lights: [] };
  const yardStyle = scene.build(g, rnd, data) || {};
  drawYard(g, rnd, yardStyle);
  return { canvas: c, name: scene.name, ambient: scene.ambient ? (ctx, t) => scene.ambient(ctx, t, data) : null };
}

// ─── Cortile comune a tutti gli scenari ─────────────────────────

function drawYard(g, rnd, { floor = PAL.concrete, seam = PAL.concreteDk } = {}) {
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

// ─── 1. Parcheggio aziendale (Open Space) ───────────────────────

function buildParking(g, rnd) {
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

// ─── 2. Archivio (Amministrazione) ──────────────────────────────

function buildArchive(g, rnd) {
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

// ─── 3. Data center (Reparto IT) ────────────────────────────────

function buildDataCenter(g, rnd, data) {
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

function blinkLeds(ctx, time, data) {
  const tick = Math.floor(time * 6);
  for (let i = 0; i < data.leds.length; i++) {
    const led = data.leds[i];
    if ((i * 7 + tick) % 5 === 0) continue; // ogni tanto si spengono
    ctx.fillStyle = led.c;
    ctx.fillRect(led.x, led.y, 1, 0.5);
  }
}

// ─── 4. Centro commerciale (Commerciale) ────────────────────────

function buildMall(g, rnd, data) {
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

function flickerNeon(ctx, time, data) {
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

// ─── 5. Zona industriale (Sicurezza) ────────────────────────────

function buildIndustrial(g, rnd, data) {
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
      if (r < 0.15) continue; // posto vuoto
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

function searchlights(ctx, time, data) {
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

// ─── 6. Tetto del grattacielo (Piani Alti) ──────────────────────

function buildRooftop(g, rnd, data) {
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

function beacons(ctx, time, data) {
  const on = Math.sin(time * 3) > 0;
  for (const l of data.lights) {
    if (!on) continue;
    ctx.fillStyle = 'rgba(215,38,61,0.35)';
    ctx.fillRect(l.x - 3, l.y - 3, 7, 7);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(l.x - 1, l.y - 1, 3, 3);
  }
}
