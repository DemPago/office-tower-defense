// Camera e aiuti per disegnare: zoom a pixel nitidi e disegno degli sprite.
import { TOWER } from '../state.js';

// Raggio (in pixel del mondo) visibile intorno al palazzo sul lato corto dello schermo:
// è solo indicativo, perché lo zoom viene arrotondato per avere pixel nitidi (vedi resize).
export const VIEW_R = 205;

// Pixel dello schermo per pixel del mondo, aggiornato in resize(): serve ad "agganciare"
// gli sprite alla griglia dei pixel, così restano netti.
let PX = 2;
export function setPixelSize(px) {
  PX = px;
}

export const snap = v => Math.round(v * PX) / PX;

export const CAMERA = { x: TOWER.x, y: TOWER.y - 16 };

// Disegna uno sprite (da assets.person o assets.animal) con i piedi nel punto (x, feetY).
// flip = specchiato (gli animali, visti di profilo, guardano verso il palazzo).
export function drawPersonAt(ctx, sp, x, feetY, flip = false) {
  const left = snap(x - sp.w / 2), top = snap(feetY - sp.h + sp.k * 2);
  if (!flip) {
    ctx.drawImage(sp.img, left, top, sp.w, sp.h);
    return;
  }
  ctx.save();
  ctx.translate(left + sp.w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(sp.img, 0, top, sp.w, sp.h);
  ctx.restore();
}

// Sprite di un nemico: persona oppure animale (scorta dei boss e boss trasformati).
// Stadio di "sfacelo" di uno zombie (0-3) in base alla vita persa.
export function zombieStage(e) {
  return Math.max(0, Math.min(3, Math.floor((1 - e.hp / e.maxHp) * 4)));
}

export function enemySprite(assets, e, frame, tint = false) {
  if (e.animal) return assets.animal(e.animal, frame, e.scale || 1, tint);
  return assets.person(e.zombie ? `z${zombieStage(e)}:${e.look}` : e.look, frame, e.scale || 1, tint);
}

export const facesLeft = e => !!e.animal && e.x > TOWER.x;

// Angolo "da geometria" (0 = destra, 90 = su) → angolo del canvas (y verso il basso).
export const rad = deg => -deg * Math.PI / 180;

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
