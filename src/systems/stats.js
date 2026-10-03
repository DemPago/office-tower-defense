// Calcola le statistiche finali della torre combinando tre fonti di bonus:
// potenziamenti con l'oro (u), carte (c) e progressi permanenti (m).
import { CARDS } from '../data/cards.js';
import { UPGRADES, META_UPGRADES } from '../data/upgrades.js';
import { ALLIES } from '../data/allies.js';

// La torre senza nessun bonus.
export const BASE = {
  dmg: 10,         // danno per colpo
  rate: 1.4,       // colpi al secondo
  range: 170,      // gittata in pixel
  hp: 150,         // vita massima
  regen: 1,        // vita recuperata al secondo
  crit: 0.05,      // probabilità di critico
  critMult: 2,     // moltiplicatore del critico
  shotSpeed: 380,  // velocità dei proiettili
};

function emptyBonus() {
  return {
    dmg: 0, rate: 0, range: 0, hp: 0, hpFlat: 0, regen: 0, armor: 0,
    crit: 0, critMult: 0, multishot: 0, bounce: 0, aoe: 0, slow: 0, dot: 0,
    gold: 0, healOnKill: 0, cdr: 0, startGold: 0, rerolls: 0, fence: 0,
  };
}

export function metaBonuses(meta) {
  const m = emptyBonus();
  for (const def of META_UPGRADES) {
    const L = meta.levels[def.id] || 0;
    if (L) def.mod(m, L);
  }
  return m;
}

export function computeStats(run, meta) {
  const u = emptyBonus();
  for (const def of UPGRADES) {
    const L = run.upgrades[def.id];
    if (L) def.mod(u, L);
  }
  const c = emptyBonus();
  for (const card of CARDS) {
    const n = run.cards[card.id] || 0;
    for (let i = 0; i < n; i++) card.mod(c);
  }
  const m = metaBonuses(meta);

  // Bonus dei maghi (rinforzi con aura): valgono per torre e colleghi.
  let auraRate = 0, auraDmg = 0;
  for (const ally of run.allies) {
    const def = ALLIES.find(a => a.id === ally.id);
    if (def.aura === 'rate') auraRate += def.auraPer * ally.level;
    if (def.aura === 'dmg') auraDmg += def.auraPer * ally.level;
  }

  return {
    dmg: BASE.dmg * (1 + u.dmg) * (1 + c.dmg) * (1 + m.dmg) * (1 + auraDmg),
    rate: Math.min(12, BASE.rate * (1 + u.rate + c.rate + m.rate + auraRate)),
    allyRateMult: 1 + auraRate,
    range: Math.min(260, BASE.range * (1 + u.range + c.range)),
    maxHp: (BASE.hp + u.hpFlat + c.hpFlat) * (1 + c.hp + m.hp),
    regen: BASE.regen + u.regen + c.regen,
    armor: Math.min(0.7, c.armor),
    crit: Math.min(0.8, BASE.crit + c.crit),
    critMult: BASE.critMult + c.critMult,
    shotSpeed: BASE.shotSpeed,
    multishot: 1 + c.multishot,
    bounce: c.bounce,
    aoeRadius: c.aoe ? 30 + 12 * c.aoe : 0,
    aoeDmg: c.aoe ? 0.5 : 0,
    slow: Math.min(0.6, c.slow),
    dot: c.dot,
    goldMult: 1 + c.gold + m.gold,
    healOnKill: c.healOnKill,
    cdMult: Math.max(0.3, 1 - c.cdr),
    fence: u.fence,          // quarti di cerchio coperti dal recinto elettrico (0-4)
  };
}
