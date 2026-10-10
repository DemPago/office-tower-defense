// Bombe piazzabili all'inizio di ogni quadro.
// Moltiplicatore: quadro 1-3 = ×3, 4-6 = ×2, 7-9 = ×1.5, 10+ = ×1.
// Costo: ogni bomba piazzata riduce tutte le stat del 5% (min 5% totale = max 19 bombe).
import { TOWER } from '../state.js';
import { dist } from '../util.js';
import { burst, ring, floatText } from './fx.js';
import { dealDamage } from './damage.js';
import { refreshStats } from './economy.js';

const BOMB_RADIUS      = 70;   // raggio detonazione (pixel)
const BOMB_BASE_SHOTS  = 40;   // danno = stats.dmg × BOMB_BASE_SHOTS × mult
const BOMB_MIN_DIST    = 60;   // distanza minima tra bombe
const BOMB_TOWER_CLEAR = 80;   // distanza minima dalla torre
export const BOMB_MAX  = 19;   // al 20° le stat scenderebbero a 0

// Quadro che stiamo per iniziare (1-indexed). run.wave = ondate già completate.
export function nextQuadro(run) {
  return Math.floor(run.wave / 10) + 1;
}

export function bombMult(run) {
  const q = nextQuadro(run);
  if (q <= 3) return 3;
  if (q <= 6) return 2;
  if (q <= 9) return 1.5;
  return 1;
}

export function canPlaceBomb(run) {
  return run.bombPenalty < BOMB_MAX;
}

export function placeBomb(run, x, y) {
  if (!canPlaceBomb(run)) return false;
  if (dist({ x, y }, TOWER) < BOMB_TOWER_CLEAR) return false;
  if (run.bombs.some(b => !b.detonated && dist({ x, y }, b) < BOMB_MIN_DIST)) return false;
  run.bombs.push({ x, y, mult: bombMult(run), age: 0, detonated: false });
  run.bombPenalty++;
  refreshStats(run, run.meta);
  return true;
}

export function removeBomb(run, idx) {
  if (idx < 0 || idx >= run.bombs.length) return false;
  run.bombs.splice(idx, 1);
  if (run.bombPenalty > 0) run.bombPenalty--;
  refreshStats(run, run.meta);
  return true;
}

// Controlla ogni bomba non detonata: se un nemico entra nel raggio, esplode in AOE.
export function checkBombs(run) {
  for (const bomb of run.bombs) {
    if (bomb.detonated) continue;
    const trigger = run.enemies.some(e => !e.dead && dist(e, bomb) < BOMB_RADIUS * 0.6);
    if (!trigger) { bomb.age += 0.016; continue; }
    bomb.detonated = true;
    const dmg = run.stats.dmg * BOMB_BASE_SHOTS * bomb.mult;
    for (const e of run.enemies) {
      if (!e.dead && dist(e, bomb) < BOMB_RADIUS) dealDamage(run, e, dmg, { silent: true });
    }
    burst(run, bomb.x, bomb.y, 20, '#ff6600');
    ring(run, bomb.x, bomb.y, BOMB_RADIUS, '#ff3300');
    floatText(run, bomb.x, bomb.y - 24, `💥 ×${bomb.mult}`, '#ffaa00', 9);
  }
  run.bombs = run.bombs.filter(b => !b.detonated);
}
