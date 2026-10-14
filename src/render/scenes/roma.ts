// Scenario 7: Piazza di Roma — sampietrini, nasoni, rovine e pini.
import { WORLD, TOWER } from '../../state.js';
import { PAL, FONT, SPRAY, shade } from '../palette.js';
import * as P from '../props.js';
import { AREA, LANE, free, scatter, many } from './common.js';

// Colori romani
const TERRACOTTA = '#a85428';
const TERRACOTTA_HI = '#c76a38';
const OCHRE = '#c49a32';
const OCHRE_DK = '#8a6a1e';
const TRAVERTINO = '#c8bfa0';
const TRAVERTINO_DK = '#a09880';
const SAMPIETRINO = '#4a4840';
const SAMPIETRINO_HI = '#625e58';
const SAMPIETRINO_JT = '#2e2c28'; // giunti tra i sampietrini

function sampietrini(g: CanvasRenderingContext2D, ax: number, ay: number, aw: number, ah: number, rnd: () => number): void {
  // Base
  g.fillStyle = SAMPIETRINO;
  g.fillRect(ax, ay, aw, ah);
  // Griglia di sampietrini 10x8 con offset a file alterne
  const CW = 10, CH = 8;
  for (let row = 0; row * CH < ah + CH; row++) {
    const ox = (row % 2) * (CW / 2);
    for (let col = -1; col * CW < aw + CW; col++) {
      const x = ax + col * CW + ox, y = ay + row * CH;
      if (x > ax + aw + 2 || y > ay + ah + 2) continue;
      // ogni sampietrino: pietra grigio-scura con variazione casuale
      const v = rnd() * 0.15;
      const base = `hsl(40,${Math.round(3 + v * 4)}%,${Math.round(25 + v * 12)}%)`;
      g.fillStyle = base;
      g.fillRect(x + 0.5, y + 0.5, CW - 1.5, CH - 1.5);
      // luce in alto a sinistra
      g.fillStyle = 'rgba(255,245,220,0.08)';
      g.fillRect(x + 0.5, y + 0.5, CW - 2, 1);
      g.fillRect(x + 0.5, y + 0.5, 1, CH - 2);
    }
  }
  // Giunti
  for (let row = 0; row * CH < ah + CH; row++) {
    g.fillStyle = SAMPIETRINO_JT;
    g.fillRect(ax, ay + row * CH, aw, 0.5);
    const ox = (row % 2) * (CW / 2);
    for (let col = -1; col * CW < aw + CW; col++) {
      g.fillRect(ax + col * CW + ox, ay + row * CH, 0.5, CH);
    }
  }
}

function drawColumn(g: CanvasRenderingContext2D, x: number, y: number, h: number, broken: boolean): void {
  const cw = 12;
  P.shadow(g, x - cw / 2 - 1, y + 1, cw + 4, 4);
  // base
  P.rect(g, x - cw / 2 - 2, y - 6, cw + 4, 6, TRAVERTINO_DK);
  P.rect(g, x - cw / 2 - 1, y - 7, cw + 2, 2, TRAVERTINO);
  // fusto
  P.rect(g, x - cw / 2 - 0.5, y - h - 5, cw + 1, h, PAL.black);
  P.rect(g, x - cw / 2, y - h - 5, cw, h, TRAVERTINO);
  P.rect(g, x - cw / 2, y - h - 5, 2, h, shade(TRAVERTINO, 1.12));
  P.rect(g, x + cw / 2 - 2, y - h - 5, 2, h, shade(TRAVERTINO, 0.82));
  // scanalature verticali
  for (let i = 2; i < cw - 2; i += 2.5) P.rect(g, x - cw / 2 + i, y - h - 5, 0.5, h, shade(TRAVERTINO, 0.88));
  // capitello o spezzatura
  if (broken) {
    const bh = Math.round(h * 0.6);
    P.rect(g, x - cw / 2, y - bh - 5, cw, h - bh, '#2e2c28'); // parte mancante scura
    // bordo irregolare della spezzatura
    for (let i = 0; i < cw; i += 2) P.rect(g, x - cw / 2 + i, y - bh - 5 - (i % 3), 1.5, 2, TRAVERTINO_DK);
  } else {
    P.rect(g, x - cw / 2 - 2.5, y - h - 6, cw + 5, 4, TRAVERTINO_DK);
    P.rect(g, x - cw / 2 - 1.5, y - h - 9, cw + 3, 4, TRAVERTINO);
    P.rect(g, x - cw / 2 - 1.5, y - h - 9, cw + 3, 1, shade(TRAVERTINO, 1.15));
  }
}

function drawArch(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  P.shadow(g, x, y + 1, w + 4, 5);
  // piloni
  const pw = 10, ph = h;
  P.rect(g, x - 0.5, y - ph, pw + 1, ph, PAL.black);
  P.rect(g, x, y - ph, pw, ph, TRAVERTINO);
  P.rect(g, x, y - ph, 2, ph, shade(TRAVERTINO, 1.1));
  P.rect(g, x + w + pw - 0.5, y - ph, pw + 1, ph, PAL.black);
  P.rect(g, x + w + pw, y - ph, pw, ph, TRAVERTINO);
  P.rect(g, x + w + pw, y - ph, 2, ph, shade(TRAVERTINO, 1.1));
  // arco a tutto sesto
  const cx = x + pw + w / 2, cy = y - ph;
  const r = w / 2 + pw / 2;
  g.fillStyle = PAL.black;
  g.beginPath(); g.arc(cx, cy, r + 1, Math.PI, 0); g.fill();
  g.fillStyle = TRAVERTINO;
  g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill();
  g.fillStyle = shade(TRAVERTINO, 0.82);
  g.beginPath(); g.arc(cx, cy, r - pw / 2, Math.PI, 0); g.fill();
  g.fillStyle = PAL.black;
  g.beginPath(); g.arc(cx, cy, r - pw / 2 - 0.5, Math.PI, 0); g.fill();
  // chiave di volta
  P.rect(g, cx - 3, cy - r - 2, 6, 6, TRAVERTINO);
  P.rect(g, cx - 2, cy - r - 3, 4, 1, shade(TRAVERTINO, 1.15));
}

function drawPinTree(g: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  // Pino romano: tronco dritto alto, chioma ad ombrello in cima
  P.shadow(g, x - 3, y + 1, 8, 3);
  // tronco
  P.rect(g, x - 1, y - h, 3, h, PAL.black);
  P.rect(g, x - 0.5, y - h, 2, h, '#5a3a18');
  P.rect(g, x - 0.5, y - h, 1, h, '#7a5228');
  // chioma a ombrello
  const cw = h * 0.55, ch = h * 0.22;
  P.stain(g, x + 1, y - h - 1, cw / 2 + 1, ch / 2 + 1, PAL.black);
  P.stain(g, x + 1, y - h - 1, cw / 2, ch / 2, '#1e4a10');
  P.stain(g, x + 1, y - h - 2, cw / 2 - 2, ch / 2 - 1, '#2a6018');
  // riflesso luce
  P.stain(g, x - cw * 0.15, y - h - ch * 0.3, cw * 0.2, ch * 0.18, '#3a7a20');
}

export function build(g: CanvasRenderingContext2D, rnd: () => number, data: any) {
  // ── Pavimento ──────────────────────────────────────────────────────────────
  sampietrini(g, AREA.x, AREA.y, AREA.w, AREA.h, rnd);

  // Corsie di accesso alla torre: basoli più grandi e lisci
  const laneColor = '#3e3c38';
  P.rect(g, TOWER.x - LANE, AREA.y, LANE * 2, AREA.h, laneColor);
  P.rect(g, AREA.x, TOWER.y - LANE, AREA.w, LANE * 2, laneColor);
  // righe di delimitazione (bianche consunte)
  for (let t = AREA.y; t < AREA.y + AREA.h; t += 12) {
    P.rect(g, TOWER.x - LANE - 1, t, 0.5, 8, 'rgba(220,210,180,0.4)');
    P.rect(g, TOWER.x + LANE + 0.5, t, 0.5, 8, 'rgba(220,210,180,0.4)');
  }
  for (let t = AREA.x; t < AREA.x + AREA.w; t += 12) {
    P.rect(g, t, TOWER.y - LANE - 1, 8, 0.5, 'rgba(220,210,180,0.4)');
    P.rect(g, t, TOWER.y + LANE + 0.5, 8, 0.5, 'rgba(220,210,180,0.4)');
  }

  // ── Pavimento extra: chiazze di calpestio e usura ─────────────────────────
  P.noise(g, AREA, many(600), ['rgba(180,160,120,0.06)', 'rgba(80,70,50,0.08)', 'rgba(255,240,200,0.04)'], rnd, 4);

  // ── Rovine sullo sfondo ────────────────────────────────────────────────────
  // Arco di trionfo nel quadrante NE
  const archX = TOWER.x + 200, archY = TOWER.y - 140;
  if (free(archX, archY, 30)) drawArch(g, archX - 45, archY, 46, 55);

  // Colonne sparse
  const colPositions = [
    { x: TOWER.x - 220, y: TOWER.y - 180, h: 70, broken: false },
    { x: TOWER.x - 195, y: TOWER.y - 170, h: 60, broken: true  },
    { x: TOWER.x + 220, y: TOWER.y + 190, h: 65, broken: false },
    { x: TOWER.x - 230, y: TOWER.y + 185, h: 50, broken: true  },
    { x: TOWER.x + 185, y: TOWER.y - 200, h: 55, broken: true  },
  ];
  for (const c of colPositions) {
    if (free(c.x, c.y, 16)) drawColumn(g, c.x, c.y, c.h, c.broken);
  }

  // ── Pini romani ───────────────────────────────────────────────────────────
  const pinePos = [
    { x: TOWER.x - 250, y: TOWER.y - 150, h: 65 },
    { x: TOWER.x + 240, y: TOWER.y - 160, h: 70 },
    { x: TOWER.x - 240, y: TOWER.y + 160, h: 60 },
    { x: TOWER.x + 250, y: TOWER.y + 170, h: 68 },
    { x: TOWER.x - 280, y: TOWER.y + 10,  h: 75 },
    { x: TOWER.x + 270, y: TOWER.y - 20,  h: 72 },
  ];
  for (const p of pinePos) {
    if (free(p.x, p.y, 14)) drawPinTree(g, p.x, p.y, p.h);
  }
  // Pini extra sparsi
  scatter(rnd, many(4), 30, (x: number, y: number, r: number) => {
    drawPinTree(g, x, y, 50 + r * 30);
  });

  // ── Ape Piaggio ────────────────────────────────────────────────────────────
  const apeColors = ['#c8661e', '#2a5a8a', '#7ab832', '#e8641b', '#c49a32'];
  scatter(rnd, many(6), 22, (x: number, y: number, r: number) => {
    P.italianCar(g, x, y, 'ape', apeColors[Math.floor(r * apeColors.length)], false, rnd);
  });

  // ── Fiat 500 e Panda in giro ───────────────────────────────────────────────
  const carColors = ['#a85428', '#c49a32', '#2a5a8a', '#6d2e1f', '#c8bfa0'];
  scatter(rnd, many(5), 24, (x: number, y: number, r: number) => {
    const kinds = ['500', 'panda', '500'];
    const kind = kinds[Math.floor(r * kinds.length)];
    P.italianCar(g, x, y, kind, carColors[Math.floor(r * carColors.length)], r > 0.8, rnd);
  });

  // ── Erba e malerba tra i sampietrini ─────────────────────────────────────
  scatter(rnd, many(80), 6, (x: number, y: number) => P.weeds(g, x, y));
  scatter(rnd, many(20), 8, (x: number, y: number, r: number) => P.stain(g, x, y, 5 + r * 8, 2 + r * 3, 'rgba(60,80,30,0.25)'));

  // ── Macchie e graffi sul lastricato ───────────────────────────────────────
  scatter(rnd, many(20), 14, (x: number, y: number, r: number) => P.stain(g, x, y, 8 + r * 12, 4 + r * 6, 'rgba(0,0,0,0.18)'));
  for (let i = 0; i < many(30); i++) {
    const x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h;
    if (free(x, y, 4)) P.crack(g, x, y, rnd, 6, '#252320');
  }

  // ── Tombini e caditoie ─────────────────────────────────────────────────────
  scatter(rnd, many(8), 12, (x: number, y: number) => P.manhole(g, x, y));

  // ── Graffiti romani ────────────────────────────────────────────────────────
  P.spray(g, 'FORZA ROMA!',  TOWER.x - 170, TOWER.y + 155, PAL.red,   -0.05, 13);
  P.spray(g, 'SPQR',         TOWER.x + 155, TOWER.y - 155, OCHRE,      0.03, 16);
  P.spray(g, 'DE ROSSI!',    TOWER.x - 150, TOWER.y - 170, PAL.red,    0.04, 11);
  P.spray(g, 'LUPI!',        TOWER.x + 160, TOWER.y + 160, TERRACOTTA, -0.03, 12);
  P.spray(g, 'ROMA O MORTE', TOWER.x - 190, TOWER.y + 10,  PAL.pink,   0.06, 10);

  // ── Lanterne a gas sparse ─────────────────────────────────────────────────
  scatter(rnd, many(12), 18, (x: number, y: number, r: number) => {
    if (r > 0.5) {
      P.lamp(g, x, y);
      data.lights.push({ x, y: y - 28 });
    }
  });

  // ── Bidoni della spazzatura e sanpietrini sciolti ─────────────────────────
  scatter(rnd, many(8), 14, (x: number, y: number, r: number) => P.trash(g, x, y, rnd));
  scatter(rnd, many(4), 20, (x: number, y: number) => P.barrel(g, x, y, TERRACOTTA_HI));

  return { floor: SAMPIETRINO, seam: SAMPIETRINO_JT };
}

export function ambient(ctx: CanvasRenderingContext2D, time: number, data: any) {
  // Lanterne a gas: bagliore caldo che trema leggermente
  for (const l of data.lights) {
    const flicker = 0.7 + Math.sin(time * 7.3 + l.x) * 0.15 + Math.sin(time * 13 + l.y) * 0.08;
    ctx.fillStyle = `rgba(255,190,60,${(0.18 * flicker).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(l.x + 1, l.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,220,100,${(0.55 * flicker).toFixed(3)})`;
    ctx.fillRect(l.x - 1, l.y - 2, 3, 3);
  }
}
