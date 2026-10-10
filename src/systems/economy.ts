// Oro e potenziamenti comprati durante la partita.
import { UPGRADES, levelCost } from '../data/upgrades.js';
import { computeStats } from './stats.js';
import type { Run, Meta } from '../types.js';

export function upgradeCost(run: Run, id: string): number | null {
  const def = UPGRADES.find(u => u.id === id);
  const L = run.upgrades[id];
  if (def!.max && L >= def!.max) return null; // già al massimo
  return levelCost(def!, L);
}

export function buyUpgrade(run: Run, meta: Meta, id: string): boolean {
  const cost = upgradeCost(run, id);
  if (cost === null || run.gold < cost || run.phase === 'over') return false;
  run.gold -= cost;
  run.upgrades[id]++;
  refreshStats(run, meta);
  return true;
}

// Ricalcola le statistiche dopo un acquisto o una carta.
// Se la vita massima sale, la differenza viene aggiunta anche alla vita attuale.
export function refreshStats(run: Run, meta: Meta): void {
  const oldMax = run.stats.maxHp;
  run.stats = computeStats(run, meta);
  const t = run.tower;
  if (run.healFull) {
    t.hp = run.stats.maxHp;
    run.healFull = false;
  } else {
    t.hp = Math.min(run.stats.maxHp, t.hp + Math.max(0, run.stats.maxHp - oldMax));
  }
}
