// Rinforzi: colleghi intorno al palazzo, i loro spicchi e il recinto elettrico.
import { TOWER } from '../state.js';
import { allyDef, allyPos } from '../systems/allies.js';
import { ALLY_SLOTS, allyArc } from '../data/allies.js';
import { FENCE } from '../systems/combat.js';
import { PAL } from './palette.js';
import { sandbag } from './props.js';
import { drawPersonAt, rad } from './view.js';

const ALLY_COLOR = { pm: PAL.red, sm: PAL.toxic, dev: PAL.cyan };

// Spicchi difesi dai colleghi: un arco colorato a terra.
export function drawSectors(ctx, run, time) {
  for (const ally of run.allies) {
    const color = ALLY_COLOR[ally.id];
    if (!color) continue; // i maghi non hanno spicchio
    const width = allyArc(ally.level), center = ALLY_SLOTS[ally.slot];
    const r = 104 + ally.slot * 3;
    ctx.save();
    ctx.globalAlpha = run.phase === 'wave' ? 0.35 : 0.6 + Math.sin(time * 4) * 0.2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    if (width >= 360) ctx.arc(TOWER.x, TOWER.y, r, 0, Math.PI * 2);
    else ctx.arc(TOWER.x, TOWER.y, r, rad(center + width / 2), rad(center - width / 2));
    ctx.stroke();
    ctx.restore();
  }
}

// Recinto elettrico: pali e fili sui quarti di cerchio costruiti.
// back=true disegna la metà dietro al palazzo, back=false quella davanti.
export function drawFence(ctx, run, time, back) {
  if (!run || !run.stats.fence) return;
  const q = run.stats.fence, r = FENCE.outer - 4;
  for (let deg = 0; deg < q * 90; deg += 12) {
    const a = rad(deg + 6);
    const x = TOWER.x + Math.cos(a) * r, y = TOWER.y + Math.sin(a) * r * 0.8;
    if ((y < TOWER.y) !== back) continue;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 12, 3, 13);
    ctx.fillStyle = PAL.steel;
    ctx.fillRect(Math.round(x), Math.round(y) - 11, 1, 11);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 13, 3, 2);
  }
  ctx.save();
  ctx.strokeStyle = 'rgba(45,226,230,0.75)';
  ctx.lineWidth = 1;
  for (const h of [-10, -5]) {
    ctx.beginPath();
    for (let deg = 0; deg <= q * 90; deg += 3) {
      const a = rad(deg);
      const y = TOWER.y + Math.sin(a) * r * 0.8;
      if ((y < TOWER.y) !== back) { ctx.moveTo(TOWER.x + Math.cos(a) * r, y + h); continue; }
      const jitter = Math.random() < 0.08 ? (Math.random() - 0.5) * 3 : 0;
      ctx.lineTo(TOWER.x + Math.cos(a) * r, y + h + jitter);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawAlly(ctx, assets, ally, time) {
  const def = allyDef(ally.id);
  const { x, y } = allyPos(ally);
  const drop = Math.round((1 - ally.spawn) * -40); // arriva "paracadutato" dall'alto

  // postazione di sacchi di sabbia
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x - 12, y, 26, 4);
  if (def.aura) {
    const pulse = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = def.aura === 'rate' ? `rgba(45,226,230,${0.15 + pulse * 0.2})` : `rgba(255,62,138,${0.15 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + pulse * 3, 7 + pulse, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const recoil = ally.recoil > 0 ? 1 : 0;
  if (ally.promoFlash > 0) {
    // promozione: colonna di luce dorata
    ctx.fillStyle = `rgba(242,183,5,${0.35 * ally.promoFlash / 1.5})`;
    ctx.fillRect(x - 8, y - 70, 16, 72);
  }
  ctx.globalAlpha = ally.spawn;
  drawPersonAt(ctx, assets.person(def.look, 0, 1), x, y - 1 + drop + recoil);
  if (ally.hurt > 0) {
    // sta perdendo vita: lampeggia di rosso
    ctx.globalAlpha = 0.45;
    drawPersonAt(ctx, assets.person(def.look, 0, 1, '#ff2a3d'), x, y - 1 + drop + recoil);
  }
  ctx.globalAlpha = 1;
  if (ally.hp < ally.maxHp && ally.spawn >= 1) {
    const bw = 18, bx = x - bw / 2, by = y - 34, k = Math.max(0, ally.hp / ally.maxHp);
    ctx.fillStyle = PAL.black;
    ctx.fillRect(bx - 0.5, by - 0.5, bw + 1, 3);
    ctx.fillStyle = PAL.blood;
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = k > 0.5 ? PAL.toxic : k > 0.25 ? PAL.hazard : PAL.red;
    ctx.fillRect(bx, by, bw * k, 2);
  }
  if (recoil) {
    // lampo allo sparo, sopra la testa
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x - 2, y - 24, 5, 5);
    ctx.fillStyle = PAL.cyan;
    ctx.fillRect(x - 4, y - 23, 9, 3);
    ctx.fillRect(x - 1, y - 26, 3, 9);
  }
  sandbag(ctx, x - 12, y - 5);
  sandbag(ctx, x + 1, y - 5);

  // segno di riconoscimento: freccia gialla e tacche del livello
  if (ally.spawn >= 1) {
    const by = y - (def.aura ? 44 : 38) + Math.round(Math.sin(time * 3 + ally.slot));
    ctx.fillStyle = PAL.black;
    ctx.fillRect(x - 4, by - 1, 9, 5);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(x - 3, by, 7, 1);
    ctx.fillRect(x - 2, by + 1, 5, 1);
    ctx.fillRect(x - 1, by + 2, 3, 1);
    for (let i = 0; i < ally.level; i++) {
      ctx.fillStyle = PAL.black;
      ctx.fillRect(x - 10 + i * 4, y + 4, 4, 4);
      ctx.fillStyle = i === 4 ? PAL.pink : PAL.hazard;
      ctx.fillRect(x - 9 + i * 4, y + 5, 2, 2);
    }
  }
}
