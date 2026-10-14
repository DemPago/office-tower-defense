// Bombe piazzabili all'inizio di ogni quadro.
// Moltiplicatore: quadro 1-3 = ×3, 4-6 = ×2, 7-9 = ×1.5, 10+ = ×1.
// Costo: quadro × 10 oro a bomba (nessuna penalità alle stat).
import { TOWER } from '../state.js';
import { dist } from '../util.js';
import { burst, ring, floatText } from './fx.js';
import { dealDamage } from './damage.js';
import { refreshStats } from './economy.js';
import type { Run } from '../types.js';

const BOMB_RADIUS      = 70;
const BOMB_BASE_SHOTS  = 40;
const BOMB_MIN_DIST    = 60;
const BOMB_TOWER_CLEAR = 80;

// Quadro che stiamo per iniziare (1-indexed). run.wave = ondate già completate.
export function nextQuadro(run: Run): number {
  return Math.floor(run.wave / 10) + 1;
}

export function bombMult(run: Run): number {
  const q = nextQuadro(run);
  if (q <= 3) return 3;
  if (q <= 6) return 2;
  if (q <= 9) return 1.5;
  return 1;
}

// Quante bombe si possono piazzare in questo quadro (= moltiplicatore arrotondato per difetto, min 1)
export function bombsForQuadro(run: Run): number {
  return Math.max(1, Math.floor(bombMult(run)));
}

// Costo in oro di ogni bomba per il quadro corrente.
export function bombCost(run: Run): number {
  return nextQuadro(run) * 10;
}

export function canPlaceBomb(run: Run): boolean {
  return (run.bombsLeft ?? 0) > 0 && run.gold >= bombCost(run);
}

export function placeBomb(run: Run, x: number, y: number): boolean {
  if (!canPlaceBomb(run)) return false;
  if (dist({ x, y }, TOWER) < BOMB_TOWER_CLEAR) return false;
  if (run.bombs.some(b => !b.detonated && dist({ x, y }, b) < BOMB_MIN_DIST)) return false;
  const mine = (run.minesNext ?? 0) > 0;
  if (mine) run.minesNext = (run.minesNext ?? 0) - 1;
  run.bombs.push({ x, y, mult: bombMult(run), age: 0, detonated: false, mine });
  run.gold -= bombCost(run);
  run.bombsLeft = Math.max(0, (run.bombsLeft ?? 0) - 1);
  return true;
}

export function removeBomb(run: Run, idx: number): boolean {
  if (idx < 0 || idx >= run.bombs.length) return false;
  run.gold += bombCost(run);  // rimborso
  run.bombs.splice(idx, 1);
  run.bombsLeft = Math.min(bombsForQuadro(run), (run.bombsLeft ?? 0) + 1);
  return true;
}

// Da chiamare all'inizio di ogni fase bomb-placement per inizializzare il contatore.
export function resetBombsLeft(run: Run): void {
  run.bombsLeft = bombsForQuadro(run) + (run.extraBombs ?? 0);
}

// Controlla ogni bomba non detonata: se un nemico entra nel raggio, esplode in AOE.
// Le mine (mine: true) saltano l'auto-trigger e aspettano la detonazione manuale.
export function checkBombs(run: Run): void {
  for (const bomb of run.bombs) {
    if (bomb.detonated) continue;
    if (bomb.mine) { bomb.age += 0.016; continue; }
    const trigger = run.enemies.some(e => !e.dead && dist(e, bomb) < BOMB_RADIUS * 0.6);
    if (!trigger) { bomb.age += 0.016; continue; }
    bomb.detonated = true;
    const dmg = run.stats.dmg * BOMB_BASE_SHOTS * bomb.mult;
    for (const e of run.enemies) {
      if (!e.dead && dist(e, bomb) < BOMB_RADIUS) dealDamage(run, e, dmg, { silent: true });
    }
    burst(run, bomb.x, bomb.y, '#ff6600', 20);
    ring(run, bomb.x, bomb.y, BOMB_RADIUS, '#ff3300');
    floatText(run, bomb.x, bomb.y - 24, `💥 ×${bomb.mult}`, '#ffaa00', 9);
  }
  run.bombs = run.bombs.filter(b => !b.detonated);
}

export function hasMines(run: Run): boolean {
  return run.bombs.some(b => !b.detonated && b.mine);
}

export function detonateAllMines(run: Run): void {
  for (const bomb of run.bombs) {
    if (bomb.detonated || !bomb.mine) continue;
    bomb.detonated = true;
    const dmg = run.stats.dmg * BOMB_BASE_SHOTS * bomb.mult;
    for (const e of run.enemies) {
      if (!e.dead && dist(e, bomb) < BOMB_RADIUS) dealDamage(run, e, dmg, { silent: true });
    }
    burst(run, bomb.x, bomb.y, '#ff6600', 20);
    ring(run, bomb.x, bomb.y, BOMB_RADIUS, '#ff3300');
    floatText(run, bomb.x, bomb.y - 24, `💥 MINE`, '#ffaa00', 9);
  }
  run.bombs = run.bombs.filter(b => !b.detonated);
}
