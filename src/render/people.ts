// Personaggi in pixel art HD disegnati via codice (niente immagini).
// Ogni "look" descrive com'è vestito un personaggio; drawPerson lo disegna su una
// griglia di 40×68 pixel (12 righe in alto servono per cappelli e capelli alti).
// Nel mondo di gioco ogni pixel di questa griglia vale mezzo pixel del mondo
// (WORLD_PER_PX): così i personaggi hanno il doppio dei dettagli dello sfondo.

// LOOKS e Look sono definiti in looks.ts e ri-esportati qui per compatibilità.
export { LOOKS } from './looks.js';
export type { Look } from './looks.js';
import type { Look } from './looks.js';

export const GRID = { w: 40, h: 68, top: 12 };
// Il corpo è disegnato su 32 colonne centrali: 4 colonne libere per lato servono
// a mantelli larghi e oggetti in mano.
const OX = 4;
export const WORLD_PER_PX = 0.5;
export const FRAMES = 4; // fotogrammi della camminata
// Posizione degli occhi nella griglia (per gli occhi rossi dei nemici élite).
export const EYES = { y: GRID.top + 10, xs: [12 + OX, 18 + OX] };

type PxFn = (x: number, y: number, w: number, h: number, c: string) => void;
type ClearFn = (x: number, y: number, w: number, h: number) => void;

// Versione zombie di un look: pelle verde malata, vestiti strappati, sangue, occhi vuoti.
// stage 0-3: quanto è malridotto (cresce man mano che lo colpisci).
export function zombify(L: Look, stage = 0) {
  return { ...L, skin: '#8aa070', angry: true, zombie: true, stage };
}

// ─── Disegno ────────────────────────────────────────────────────

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

const INK = '#141416', MOUTH = '#5a1e1e', WHITE = '#e8e2d0';

// frame 0-3: ciclo della camminata (gambe e braccia alternate)
export function drawPerson(g: CanvasRenderingContext2D, L: Look, frame: number) {
  const oy = GRID.top;
  const clear: ClearFn = (x: number, y: number, w: number, h: number) => g.clearRect(x + OX, y + oy, w, h);
  const px: PxFn = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x + OX, y + oy, w, h); };

  // corporatura: huge = boss con spalle larghe
  const tw = L.build === 'huge' ? 24 : L.build === 'fat' ? 20 : L.build === 'thin' ? 12 : 16;
  const tx = 16 - tw / 2;
  const legW = L.build === 'huge' ? 7 : L.build === 'fat' ? 6 : L.build === 'thin' ? 4 : 5;
  const pants = L.pants || '#2a2a2e';
  const shoes = L.shoes || INK;
  const liftL = frame === 0 ? 3 : 0, liftR = frame === 2 ? 3 : 0;
  const swing = [4, 1, -4, -1][frame];
  const skinDk = shade(L.skin, 0.82);

  // Mantello (dietro a tutto): si allarga verso il basso, con bordo dorato
  if (L.cape) {
    for (let r = 0; r < 34; r++) {
      const half = tw / 2 + 3 + Math.floor(r / 4);
      px(16 - half, 17 + r, half * 2, 1, r % 6 === 5 ? shade(L.cape, 0.8) : L.cape);
      px(16 - half, 17 + r, 1, 1, L.capeTrim || shade(L.cape, 1.4));
      px(16 + half - 1, 17 + r, 1, 1, L.capeTrim || shade(L.cape, 1.4));
    }
    const bottom = 17 + 34, half = tw / 2 + 3 + 8;
    px(16 - half, bottom, half * 2, 1, L.capeTrim || shade(L.cape, 1.4));
    if (L.capeStars) for (let i = 0; i < 14; i++) px(16 - half + 1 + (i * 7) % (half * 2 - 2), 20 + (i * 11) % 30, 1, 1, i % 3 ? '#e8e2d0' : '#2de2e6');
    px(tx - 3, 13, 3, 7, L.cape); px(tx + tw, 13, 3, 7, shade(L.cape, 0.8));
    px(tx - 3, 13, 1, 7, L.capeTrim || shade(L.cape, 1.4)); px(tx + tw + 2, 13, 1, 7, L.capeTrim || shade(L.cape, 1.4));
  }
  // Camice lungo (dietro alle gambe)
  if (L.coat) px(tx - 2, 19, tw + 4, 27, shade(L.coat, 0.85));

  // ── Gambe, gonna e scarpe
  const legs = [[tx + 1, liftL, -1], [tx + tw - 1 - legW, liftR, 1]];
  if (L.skirt) {
    for (const [lx, lift] of legs) {
      px(lx + 1, 44, legW - 2, 9 - lift, L.skin);
      px(lx + legW - 2, 44, 1, 9 - lift, skinDk);
    }
    px(tx - 1, 38, tw + 2, 8, L.skirt);
    px(tx - 2, 43, tw + 4, 3, L.skirt);
    px(tx + tw - 2, 38, 3, 8, shade(L.skirt, 0.75));
    px(tx + 3, 40, 1, 5, shade(L.skirt, 0.8));
    px(tx + tw - 6, 40, 1, 5, shade(L.skirt, 0.8));
  } else {
    for (const [lx, lift] of legs) {
      px(lx, 39, legW, 14 - lift, pants);
      px(lx, 39, 1, 14 - lift, shade(pants, 1.25));
      px(lx + legW - 1, 39, 1, 14 - lift, shade(pants, 0.75));
      px(lx + (legW >> 1), 42, 1, 8 - lift, shade(pants, 0.88));
    }
  }
  for (const [lx, lift, side] of legs) {
    const sx = side < 0 ? lx - 1 : lx;
    px(sx, 53 - lift, legW + 1, 3, shoes);
    px(sx + (side < 0 ? 0 : 1), 53 - lift, legW, 1, shade(shoes, 1.5));
    px(sx, 55 - lift, legW + 1, 1, shade(shoes, 0.6));
  }

  // ── Busto
  const top = L.top;
  px(tx, 19, tw, 20, top);
  px(tx, 19, 1, 20, shade(top, 1.3));
  px(tx + 1, 19, 1, 20, shade(top, 1.12));
  px(tx + tw - 2, 19, 2, 20, shade(top, 0.72));
  px(tx + 2, 19, tw - 4, 1, shade(top, 1.15));
  px(tx + 3, 30, 3, 1, shade(top, 0.85));
  px(tx + tw - 6, 33, 3, 1, shade(top, 0.85));
  // colletto a V e camicia
  if (L.shirt !== top || L.tie) {
    for (let i = 0; i < 7; i++) {
      const half = Math.max(1, 4 - (i >> 1));
      px(16 - half, 19 + i, half * 2, 1, L.shirt);
    }
    for (let i = 0; i < 8; i++) {
      px(16 - Math.max(1, 4 - (i >> 1)) - 1, 19 + i, 1, 1, shade(top, 0.6));
      px(16 + Math.max(1, 4 - (i >> 1)), 19 + i, 1, 1, shade(top, 0.6));
    }
  } else {
    px(13, 19, 6, 1, shade(top, 0.7));
  }
  if (L.tie) {
    px(15, 20, 2, 2, shade(L.tie, 1.15));
    px(15, 22, 2, 10, L.tie);
    px(16, 22, 1, 10, shade(L.tie, 0.8));
    for (let y = 24; y < 31; y += 3) px(15, y, 2, 1, shade(L.tie, 1.3));
    px(15, 32, 2, 1, shade(L.tie, 0.8));
  }
  if (L.shirt !== top || L.tie) {
    px(16, 34, 1, 1, shade(top, 0.5));
    px(16, 37, 1, 1, shade(top, 0.5));
    px(tx + tw - 6, 24, 3, 1, shade(top, 0.6));
  }
  if (L.vest) {
    for (const vx of [tx, tx + tw - 5]) {
      px(vx, 19, 5, 19, L.vest);
      px(vx, 28, 5, 2, '#c0c4cc');
      px(vx, 34, 5, 2, '#c0c4cc');
    }
    px(tx + tw - 2, 19, 2, 19, shade(L.vest, 0.75));
  }
  if (L.coat) {
    px(tx - 2, 19, 4, 27, L.coat);
    px(tx + tw - 2, 19, 4, 27, shade(L.coat, 0.8));
    px(tx - 2, 19, 1, 27, shade(L.coat, 1.1));
    px(tx + 2, 22, 1, 20, shade(L.coat, 0.75));
  }
  if (L.lanyard) {
    for (let i = 0; i < 8; i++) px(12 + (i >> 1), 19 + i, 1, 1, '#d7263d');
    px(14, 27, 4, 5, WHITE);
    px(15, 28, 2, 2, '#3a6ea5');
  }
  if (L.badge) {
    px(tx + 3, 23, 3, 4, '#f2b705');
    px(tx + 4, 24, 1, 2, '#a67c00');
  }
  if (L.chain) {
    for (let i = 0; i < 9; i++) px(tx + 2 + i * ((tw - 6) / 8), 22 + Math.round(Math.sin(i / 8 * Math.PI) * 4), 1, 1, L.chain);
    px(16, 26, 2, 2, L.chain);
  }
  if (L.build === 'huge') px(tx - 2, 19, tw + 4, 2, shade(top, 1.1));
  px(tx, 38, tw, 1, shade(pants, 0.55));
  if (!L.skirt) px(15, 38, 2, 1, '#c0c4cc');

  // ── Braccia e mani
  const short = L.sleeves === 'short';
  for (const [ax, sw, side] of [[tx - 4, swing, -1], [tx + tw, -swing, 1]]) {
    const sleeve = L.coat || (L.vest ? L.top : top);
    px(ax, 20 + sw, 4, short ? 6 : 14, sleeve);
    px(side < 0 ? ax : ax + 3, 20 + sw, 1, short ? 6 : 14, shade(sleeve, side < 0 ? 1.2 : 0.7));
    if (short) {
      px(ax, 26 + sw, 4, 8, L.skin);
      px(side < 0 ? ax : ax + 3, 26 + sw, 1, 8, skinDk);
    } else if (L.shirt !== top) {
      px(ax, 33 + sw, 4, 1, L.shirt);
    }
    px(ax, 34 + sw, 4, 3, L.skin);
    px(ax + (side < 0 ? 0 : 3), 34 + sw, 1, 3, skinDk);
    px(ax + 1, 37 + sw, 2, 1, skinDk);
  }

  // ── Collo e testa
  px(14, 17, 4, 2, skinDk);
  px(11, 4, 10, 1, L.skin);
  px(10, 5, 12, 11, L.skin);
  px(11, 16, 10, 1, L.skin);
  px(20, 5, 2, 11, shade(L.skin, 0.88));
  px(11, 15, 9, 1, shade(L.skin, 0.9));
  px(9, 9, 1, 3, L.skin);
  px(22, 9, 1, 3, skinDk);

  px(12, 10, 2, 2, WHITE);
  px(18, 10, 2, 2, WHITE);
  px(13, 10, 1, 2, INK);
  px(18, 10, 1, 2, INK);
  const brow = shade(L.hair === WHITE || L.hairStyle === 'bald' ? '#5a3a22' : L.hair, 0.8);
  if (L.angry) {
    px(11, 8, 2, 1, brow); px(13, 9, 1, 1, brow);
    px(19, 8, 2, 1, brow); px(18, 9, 1, 1, brow);
    px(13, 14, 6, 1, MOUTH);
    px(12, 15, 1, 1, MOUTH); px(19, 15, 1, 1, MOUTH);
  } else {
    px(11, 8, 3, 1, brow); px(18, 8, 3, 1, brow);
    px(13, 14, 1, 1, MOUTH); px(14, 15, 4, 1, MOUTH); px(18, 14, 1, 1, MOUTH);
  }
  px(15, 12, 2, 1, skinDk);
  px(16, 13, 1, 1, shade(L.skin, 0.75));

  if (L.glasses === 'glasses') {
    px(11, 9, 4, 4, INK); px(17, 9, 4, 4, INK);
    px(12, 10, 2, 2, '#9fc3d6'); px(18, 10, 2, 2, '#9fc3d6');
    px(13, 10, 1, 1, INK); px(18, 10, 1, 1, INK);
    px(15, 10, 2, 1, INK);
    px(10, 10, 1, 1, INK); px(21, 10, 1, 1, INK);
  } else if (L.glasses === 'shades') {
    px(11, 9, 10, 3, '#0d0d0f');
    px(12, 9, 2, 1, '#5b5f66'); px(18, 9, 2, 1, '#5b5f66');
    px(10, 10, 1, 1, INK); px(21, 10, 1, 1, INK);
  } else if (L.glasses === 'big') {
    px(10, 8, 6, 6, INK); px(16, 8, 6, 6, INK);
    px(11, 9, 4, 4, '#9fc3d6'); px(17, 9, 4, 4, '#9fc3d6');
    px(13, 10, 1, 2, INK); px(18, 10, 1, 2, INK);
    px(11, 9, 1, 1, WHITE); px(17, 9, 1, 1, WHITE);
  } else if (L.glasses === 'fish') {
    px(10, 8, 5, 5, WHITE); px(17, 8, 5, 5, WHITE);
    px(12, 9, 2, 3, INK); px(18, 9, 2, 3, INK);
    px(10, 8, 1, 1, L.skin); px(14, 12, 1, 1, L.skin); px(21, 8, 1, 1, L.skin); px(17, 12, 1, 1, L.skin);
  } else if (L.glasses === 'goggles') {
    px(9, 9, 14, 4, '#5a4632');
    px(11, 9, 4, 4, INK); px(17, 9, 4, 4, INK);
    px(12, 10, 2, 2, '#2de2e6'); px(18, 10, 2, 2, '#2de2e6');
  }

  const h = L.hair;
  if (L.facial === 'beard' || L.facial === 'longbeard') {
    px(10, 12, 2, 4, h); px(20, 12, 2, 4, h);
    px(11, 14, 10, 4, h);
    px(13, 13, 6, 1, h);
    px(14, 15, 4, 1, MOUTH);
    px(12, 17, 8, 1, shade(h, 0.8));
  }
  if (L.facial === 'longbeard') { px(12, 18, 8, 5, h); px(13, 23, 6, 3, h); px(14, 26, 4, 2, h); px(15, 19, 1, 6, shade(h, 0.85)); }
  if (L.facial === 'stubble') for (let x = 11; x < 21; x += 2) for (let y = 13; y < 17; y += 2) px(x + ((y >> 1) % 2), y, 1, 1, shade(L.skin, 0.62));
  if (L.gills) { px(10, 12, 1, 3, shade(L.skin, 0.6)); px(12, 13, 1, 2, shade(L.skin, 0.6)); px(20, 12, 1, 3, shade(L.skin, 0.6)); }
  if (L.facial === 'mustache') { px(12, 13, 8, 1, h); px(11, 14, 2, 1, h); px(19, 14, 2, 1, h); }
  if (L.monocle) { px(17, 9, 4, 1, '#f2b705'); px(17, 12, 4, 1, '#f2b705'); px(17, 9, 1, 4, '#f2b705'); px(20, 9, 1, 4, '#f2b705'); px(20, 13, 1, 6, '#a67c00'); }
  if (L.scar) { px(19, 6, 1, 1, '#a04040'); px(20, 7, 1, 2, '#a04040'); px(19, 9, 1, 1, '#a04040'); }

  const hs = L.hairStyle, hi = shade(h, 1.35), hd = shade(h, 0.75);
  if (hs === 'short' || hs === 'messy' || hs === 'bun' || hs === 'long') {
    px(11, 2, 10, 1, h);
    px(10, 3, 12, 2, h);
    px(9, 4, 2, 5, h); px(21, 4, 2, 5, hd);
    px(11, 5, 4, 1, h);
    px(12, 2, 4, 1, hi);
  }
  if (hs === 'messy') { px(10, 1, 2, 1, h); px(14, 0, 2, 2, h); px(18, 1, 2, 1, h); px(21, 2, 2, 1, h); px(8, 5, 1, 2, h); px(15, 5, 3, 1, h); }
  if (hs === 'bun') { px(13, -2, 6, 4, h); px(14, -2, 2, 1, hi); px(9, 4, 2, 9, h); px(21, 4, 2, 9, hd); }
  if (hs === 'long') { px(8, 4, 3, 16, h); px(21, 4, 3, 16, hd); px(8, 19, 3, 2, hd); px(9, 6, 1, 10, hi); }
  if (hs === 'slick') {
    px(10, 2, 12, 3, h); px(9, 4, 2, 4, h); px(21, 4, 2, 5, hd);
    px(12, 3, 7, 1, hi); px(19, 2, 2, 1, hd);
  }
  if (hs === 'curly') {
    for (const [x, y] of [[9, 1], [12, 0], [15, 0], [18, 0], [21, 1], [8, 4], [22, 4], [8, 7], [22, 7], [11, 3], [14, 2], [17, 2], [20, 3]]) {
      px(x, y, 3, 3, h); px(x, y, 1, 1, hi); px(x + 2, y + 2, 1, 1, hd);
    }
  }
  if (hs === 'bob') {
    px(10, 1, 12, 5, h); px(11, 0, 10, 1, h); px(12, 1, 6, 1, hi);
    px(8, 3, 3, 13, h); px(21, 3, 3, 13, hd); px(8, 15, 3, 1, hd); px(21, 15, 3, 1, hd);
  }
  if (hs === 'fin') {
    for (let r = 0; r < 7; r++) px(13 + Math.floor(r / 2), -3 + r, 7 - r, 1, r % 2 ? h : hi);
    px(12, 3, 9, 1, hd);
  }
  if (hs === 'bald') { px(9, 8, 2, 4, h); px(21, 8, 2, 4, hd); px(13, 5, 3, 1, shade(L.skin, 1.18)); }
  if (hs === 'wild') {
    px(7, -1, 18, 6, h); px(5, 1, 2, 3, h); px(25, 1, 2, 3, h); px(9, -3, 2, 2, h); px(15, -4, 3, 3, h); px(21, -3, 2, 2, h);
    px(6, 4, 4, 9, h); px(22, 4, 4, 9, hd); px(10, 0, 6, 1, hi);
  }
  if (L.headphones) { px(10, 1, 12, 1, INK); px(8, 8, 2, 5, '#2de2e6'); px(22, 8, 2, 5, '#2de2e6'); px(8, 8, 1, 5, INK); }

  const hc = L.hatColor!;
  if (L.hat === 'hardhat') {
    px(12, -1, 8, 1, hc); px(10, 0, 12, 4, hc); px(8, 3, 16, 2, shade(hc, 0.85));
    px(12, 0, 3, 1, shade(hc, 1.3)); px(15, -1, 2, 5, shade(hc, 0.85)); px(8, 4, 16, 1, shade(hc, 0.6));
  }
  if (L.hat === 'cap') { px(10, 1, 12, 4, hc); px(19, 4, 8, 2, shade(hc, 0.8)); px(12, 1, 3, 1, shade(hc, 1.3)); px(14, 2, 2, 2, '#f2b705'); }
  if (L.hat === 'tophat') {
    px(11, -10, 10, 13, hc); px(12, -10, 1, 13, shade('#3a3c42', 1)); px(11, 0, 10, 2, '#7a0f1c'); px(8, 3, 16, 2, hc);
  }
  if (L.hat === 'wizard') {
    for (let r = 0; r < 14; r++) {
      const w = 2 + r;
      px(16 - (w >> 1), -12 + r, w, 1, r % 4 === 3 ? shade(hc, 0.85) : hc);
    }
    px(7, 2, 18, 3, hc); px(7, 4, 18, 1, shade(hc, 0.6));
    px(15, -6, 1, 1, '#f2b705'); px(18, -2, 1, 1, '#f2b705'); px(12, -1, 1, 1, '#f2b705'); px(16, -10, 1, 1, '#e9f08a');
  }

  drawItem(px, L, tx + tw, 34 - swing, tw, tx);
  if (L.weapon) drawWeapon(px, L, tx - 4, 34 + swing, tw);
  if (L.zombie) drawZombieDetails(px, L, tx, tw);
  if (L.zombie && L.stage) drawZombieDamage(px, clear, L, tx, tw, [2, 0, -2, 0][frame]);
}

// Arma in mano (lato SINISTRO). hx, hy = posizione della mano sinistra, tw = larghezza busto.
function drawWeapon(px: PxFn, L: Look, hx: number, hy: number, tw: number) {
  switch (L.weapon) {
    case 'mazza':
      px(hx + 1, hy - 1, 2, 16, '#8b6a3e');
      px(hx - 1, hy - 11, 6, 5,  '#6b4a2b');
      px(hx - 1, hy - 11, 6, 1,  '#a58054');
      px(hx - 1, hy - 6,  6, 1,  '#4a3020');
      break;
    case 'arco':
      px(hx - 2, hy - 12, 2, 20, '#8b6a3e');
      px(hx - 3, hy - 12, 1, 1,  '#8b6a3e');
      px(hx - 3, hy + 7,  1, 1,  '#8b6a3e');
      px(hx - 3, hy - 11, 1, 19, '#c0c4cc');
      px(hx + 1, hy - 8,  1, 12, '#a58054');
      px(hx + 1, hy - 9,  2, 1,  '#c0c4cc');
      break;
    case 'spada':
      px(hx + 1, hy,      2, 4,  '#8b6a3e');
      px(hx,     hy - 1,  4, 1,  '#8b6a3e');
      px(hx + 1, hy - 14, 2, 14, '#c0c4cc');
      px(hx + 1, hy - 14, 1, 14, '#e8e2d0');
      px(hx + 1, hy - 15, 1, 1,  '#e8e2d0');
      break;
    case 'palla_ferrata':
      px(hx + 1, hy,      2, 12, '#6b4a2b');
      px(hx - 1, hy - 10, 6, 6,  '#5b5f66');
      px(hx,     hy - 12, 2, 2,  '#5b5f66');
      px(hx + 2, hy - 12, 2, 2,  '#5b5f66');
      px(hx - 2, hy - 8,  2, 2,  '#5b5f66');
      px(hx + 4, hy - 8,  2, 2,  '#5b5f66');
      px(hx,     hy - 6,  2, 2,  '#5b5f66');
      px(hx,     hy - 11, 2, 1,  '#8a8d93');
      break;
    case 'laser':
      px(hx - 1, hy - 2, 7, 4, '#3a3c42');
      px(hx + 6, hy - 3, 3, 2, '#2de2e6');
      px(hx + 9, hy - 3, 2, 2, '#90f4f6');
      px(hx,     hy - 2, 5, 1, '#5b5f66');
      px(hx - 1, hy + 2, 2, 2, '#141416');
      break;
    case 'pistola':
      px(hx - 1, hy - 2, 6, 3, '#3a3c42');
      px(hx + 5, hy - 2, 4, 2, '#5b5f66');
      px(hx,     hy + 1, 2, 3, '#141416');
      px(hx,     hy - 2, 5, 1, '#6e6a64');
      break;
    case 'fucile':
      px(hx - 3, hy - 2, 13, 3, '#5a3a22');
      px(hx + 8, hy - 2, 7,  2, '#3a3c42');
      px(hx + 2, hy - 2, 8,  1, '#7a5a3a');
      px(hx + 8, hy - 2, 7,  1, '#5b5f66');
      px(hx - 2, hy + 1, 3,  3, '#3a3226');
      break;
    case 'fiocina':
      px(hx + 1, hy - 1, 2, 16, '#8b6a3e');
      px(hx,     hy - 14, 4, 4, '#c0c4cc');
      px(hx,     hy - 12, 2, 1, '#e8e2d0');
      px(hx + 3, hy - 12, 1, 4, '#8a8d93');
      px(hx + 3, hy - 10, 2, 1, '#8a8d93');
      break;
    case 'balestra':
      px(hx - 4, hy - 2, 10, 2, '#6b4a2b');
      px(hx + 6, hy - 6, 2, 8,  '#8b6a3e');
      px(hx + 7, hy - 5, 1, 6,  '#a58054');
      px(hx - 3, hy - 1, 9, 1,  '#c0c4cc');
      px(hx + 3, hy - 1, 2, 1,  '#d7263d');
      break;
  }
}

function drawZombieDetails(px: PxFn, L: Look, tx: number, tw: number) {
  const BLOOD = '#7a0f1c', DRIP = '#a01828', ROT = '#5a7048';
  px(12, 10, 2, 2, '#e8f0d0'); px(18, 10, 2, 2, '#e8f0d0');
  px(12, 12, 2, 1, ROT); px(18, 12, 2, 1, ROT);
  px(13, 14, 6, 2, '#2a0a0a'); px(14, 14, 1, 1, '#e8e2d0'); px(17, 14, 1, 1, '#e8e2d0');
  px(19, 6, 2, 3, ROT); px(11, 13, 1, 2, ROT);
  px(15, 16, 1, 3, DRIP);
  for (const [x, y, w, h] of [[tx + 2, 27, 3, 2], [tx + tw - 5, 22, 2, 3], [tx + 4, 34, 2, 2]]) {
    px(x, y, w, h, '#1a1a14');
    px(x, y + h, w, 1, ROT);
  }
  px(tx + 1, 39, 2, 2, '#1a1a14');
  for (const [x, y] of [[tx + 3, 24], [tx + tw - 4, 30], [tx + 6, 36], [tx + tw - 3, 40]]) { px(x, y, 2, 1, BLOOD); px(x + 1, y + 1, 1, 2, DRIP); }
}

function drawZombieDamage(px: PxFn, clear: ClearFn, L: Look, tx: number, tw: number, swing: number) {
  const BLOOD = '#7a0f1c', BONE = '#d9d4c7', MEAT = '#a0303a';
  clear(tx - 4, 18 + swing, 4, 22);
  px(tx - 3, 20 + swing, 3, 3, L.top);
  px(tx - 3, 23 + swing, 3, 1, MEAT);
  px(tx - 2, 23 + swing, 1, 1, BONE);
  px(tx - 3, 24 + swing, 1, 3, BLOOD);
  if ((L.stage ?? 0) >= 2) {
    clear(16, 1, 7, 5);
    clear(19, 5, 3, 2);
    px(16, 4, 6, 2, '#c87a8a');
    px(17, 3, 2, 1, '#e0a0aa');
    px(15, 5, 1, 1, BONE); px(21, 6, 1, 1, BONE);
    px(19, 8, 1, 4, BLOOD);
  }
  if ((L.stage ?? 0) >= 3) {
    clear(tx + tw, 18 - swing, 4, 22);
    px(tx + tw, 20 - swing, 3, 3, L.top);
    px(tx + tw, 23 - swing, 3, 1, MEAT);
    px(tx + tw + 1, 24 - swing, 1, 3, BLOOD);
    px(tx + 3, 26, tw - 6, 9, '#2a0a0a');
    for (let y = 27; y < 35; y += 2) px(tx + 4, y, tw - 8, 1, BONE);
    px(15, 26, 2, 9, BONE);
  }
}

function drawItem(px: PxFn, L: Look, hx: number, hy: number, tw: number, tx: number) {
  switch (L.item) {
    case 'briefcase': {
      const c = L.itemColor || '#6b4a2b';
      px(hx - 2, hy + 2, 9, 7, INK); px(hx - 1, hy + 3, 7, 5, c); px(hx - 1, hy + 3, 7, 1, shade(c, 1.3));
      px(hx, hy, 5, 1, INK); px(hx, hy, 1, 3, INK); px(hx + 4, hy, 1, 3, INK); px(hx + 2, hy + 5, 2, 1, '#a67c00');
      break;
    }
    case 'mug':
      px(hx, hy - 4, 4, 5, WHITE); px(hx + 4, hy - 3, 1, 2, WHITE); px(hx, hy - 4, 4, 1, '#5a3a22');
      px(hx + 3, hy - 4, 1, 5, '#c0c4cc'); px(hx + 1, hy - 7, 1, 2, 'rgba(232,226,208,0.6)'); px(hx + 2, hy - 9, 1, 2, 'rgba(232,226,208,0.4)');
      break;
    case 'clipboard':
      px(hx - 1, hy - 10, 6, 12, '#6b4a2b'); px(hx, hy - 8, 4, 9, WHITE);
      for (let y = hy - 6; y < hy; y += 2) px(hx + 1, y, 2, 1, '#8a8d93');
      px(hx + 1, hy - 11, 2, 2, '#c0c4cc');
      break;
    case 'phone':
      px(tx + tw, 22, 4, 4, L.skin); px(22, 13, 3, 3, L.skin); px(23, 8, 2, 6, INK); px(23, 9, 1, 1, '#2de2e6');
      break;
    case 'wrench':
      px(hx + 1, hy - 9, 2, 11, '#c0c4cc'); px(hx - 1, hy - 12, 6, 3, '#c0c4cc'); px(hx + 1, hy - 12, 2, 1, INK); px(hx + 2, hy - 9, 1, 11, '#8a8d93');
      break;
    case 'calculator':
      px(hx - 1, hy - 7, 6, 9, '#3a3c42'); px(hx, hy - 6, 4, 2, '#7bd332');
      for (let y = hy - 3; y < hy + 1; y += 2) for (let x = hx; x < hx + 4; x += 2) px(x, y, 1, 1, '#c0c4cc');
      break;
    case 'megaphone':
      px(tx + tw, 21, 4, 4, L.skin); px(22, 14, 3, 3, L.skin); px(23, 11, 3, 4, WHITE); px(26, 9, 4, 8, '#d7263d'); px(29, 8, 2, 10, shade('#d7263d', 0.7));
      break;
    case 'laptop':
      px(hx - 6, hy - 1, 11, 2, '#c0c4cc'); px(hx - 6, hy - 8, 11, 7, '#5b5f66'); px(hx - 5, hy - 7, 9, 5, '#2a6f80');
      px(hx - 4, hy - 6, 5, 1, '#2de2e6'); px(hx - 4, hy - 4, 3, 1, '#2de2e6');
      break;
    case 'pc':
      px(hx - 4, hy - 10, 10, 8, '#8a8d93'); px(hx - 3, hy - 9, 8, 5, '#2de2e6'); px(hx - 2, hy - 8, 3, 1, WHITE); px(hx, hy - 2, 3, 2, '#5b5f66');
      break;
    case 'crossbow':
      px(hx - 7, 28, 13, 2, '#6b4a2b'); px(hx + 4, 23, 2, 11, '#8b6a3e'); px(hx + 6, 24, 1, 9, WHITE); px(hx - 5, 27, 10, 1, '#c0c4cc'); px(hx + 5, 27, 2, 1, '#d7263d');
      break;
    case 'cigar':
      px(19, 14, 5, 1, '#6b4a2b'); px(24, 14, 1, 1, '#e8641b'); px(24, 11, 1, 2, 'rgba(192,196,204,0.6)'); px(25, 9, 1, 2, 'rgba(192,196,204,0.4)');
      break;
    case 'sticky':
      px(tx + 2, 24, 3, 3, '#f2b705'); px(tx + tw - 5, 28, 3, 3, '#ff3e8a'); px(tx + 4, 32, 3, 3, '#2de2e6'); px(hx, hy - 3, 3, 3, '#7bd332');
      break;
    case 'cable':
      px(hx - 1, hy - 2, 6, 6, INK); px(hx + 1, hy, 2, 2, '#3a3c42'); px(hx + 5, hy + 3, 1, 7, INK); px(hx + 5, hy + 9, 2, 2, '#f2b705');
      break;
    case 'keyboard':
      px(hx - 8, hy - 2, 13, 5, '#c0c4cc'); px(hx - 7, hy - 1, 11, 1, '#5b5f66'); px(hx - 7, hy + 1, 11, 1, '#5b5f66'); px(hx - 4, hy + 2, 5, 1, '#8a8d93');
      break;
    case 'flyers':
      px(hx - 1, hy - 6, 5, 7, '#ff3e8a'); px(hx + 1, hy - 8, 5, 7, '#f2b705'); px(hx + 2, hy - 6, 3, 1, INK); px(hx + 2, hy - 4, 2, 1, INK);
      break;
    case 'invoice':
      px(hx - 4, hy - 9, 10, 12, '#e8e2d0');
      px(hx - 4, hy - 9, 10, 2, '#c0c4cc');
      px(hx - 3, hy - 5, 8, 1, '#8a8d93'); px(hx - 3, hy - 3, 6, 1, '#8a8d93'); px(hx - 3, hy - 1, 8, 1, '#8a8d93');
      px(hx - 3, hy + 1, 3, 1, '#f2b705'); px(hx - 3, hy + 2, 4, 1, '#f2b705'); px(hx - 3, hy + 3, 3, 1, '#f2b705');
      break;
    case 'baton':
      px(hx + 1, hy - 10, 2, 15, INK); px(hx, hy - 1, 4, 3, '#3a3c42'); px(hx + 1, hy - 10, 1, 8, '#3a3c42');
      break;
    case 'flashlight':
      px(hx - 1, hy - 1, 7, 3, '#5b5f66'); px(hx + 6, hy - 2, 2, 5, '#fff3b0'); px(hx + 8, hy - 3, 3, 7, 'rgba(255,243,176,0.35)');
      break;
    case 'box':
      px(hx - 5, hy - 9, 11, 10, '#8b6a3e'); px(hx - 5, hy - 9, 11, 2, '#a5824f'); px(hx - 1, hy - 9, 2, 10, '#c9b48a'); px(hx + 5, hy - 9, 1, 10, '#6b4a2b');
      break;
    case 'cane':
      px(hx + 1, hy - 4, 2, 22, '#141416'); px(hx, hy - 6, 4, 3, '#f2b705'); px(hx + 1, hy - 6, 1, 1, '#fff3b0');
      break;
    case 'device':
      px(hx - 2, hy - 6, 8, 7, '#5b5f66'); px(hx - 1, hy - 5, 2, 2, '#d7263d'); px(hx + 2, hy - 5, 3, 1, '#2de2e6');
      px(hx + 4, hy - 12, 1, 6, '#c0c4cc'); px(hx + 3, hy - 13, 3, 1, '#2de2e6'); px(hx + 1, hy - 3, 4, 1, '#7bd332');
      break;
    case 'stamp':
      px(hx + 1, hy - 7, 2, 5, '#6b4a2b'); px(hx, hy - 9, 4, 2, '#8b6a3e'); px(hx - 1, hy - 2, 6, 3, '#7a1f2b');
      break;
  }
}
