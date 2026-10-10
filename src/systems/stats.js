// Calcola le statistiche finali della torre combinando tre fonti di bonus:
// potenziamenti con l'oro (u), carte (c) e progressi permanenti (m).
import { findCard } from '../data/cards.js';
import { UPGRADES, META_UPGRADES } from '../data/upgrades.js';
import { ALLIES } from '../data/allies.js';
import { MANA } from '../data/abilities.js';
import { weaponDef } from '../data/weapons.js';
import { heroDef } from '../data/heroes.js';

// La torre senza nessun bonus.
export const BASE = {
  dmg: 10,         // danno per colpo
  rate: 1.4,       // colpi al secondo
  range: 145,      // gittata in pixel (cresce lentamente con le ondate)
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
    manaRegen: 0, manaMax: 0, manaOnKill: 0,
    wallHp: 0, wallThorns: 0, wallReflect: 0, wallRegen: 0,
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
  // ogni carta presa conta con la potenza dell'ondata in cui è stata scelta
  for (const pick of run.cardPicks) findCard(pick.id)?.mod(c, pick.m);
  const m = metaBonuses(meta);

  // Bonus dei maghi (rinforzi con aura): valgono per torre e colleghi.
  let auraRate = 0, auraDmg = 0;
  for (const ally of run.allies) {
    const def = ALLIES.find(a => a.id === ally.id);
    if (def.aura === 'rate') auraRate += def.auraPer * ally.level;
    if (def.aura === 'dmg') auraDmg += def.auraPer * ally.level;
  }

  const W = weaponDef(run.weapon);
  const H = { dmg: 0, rate: 0, hp: 0, regen: 0, range: 0, manaRegen: 0, crit: 0, armor: 0, gold: 0, manaMax: 0, ...heroDef(run.hero).stats };

  // Penalità bombe: ogni bomba piazzata = −5% a tutto (min 5%)
  const bp = Math.max(0.05, 1 - (run.bombPenalty || 0) * 0.05);

  return {
    dmg: bp * (1 + H.dmg) * W.dmg * BASE.dmg * (1 + u.dmg) * (1 + c.dmg) * (1 + m.dmg) * (1 + auraDmg),
    rate: bp * Math.min(12 * W.rate, (1 + H.rate) * W.rate * BASE.rate * (1 + u.rate + c.rate + m.rate + auraRate)),
    allyRateMult: 1 + auraRate,
    range: bp * Math.min(260, (1 + H.range) * W.range * BASE.range * (1 + u.range + c.range) * (1 + (run.wave || 0) * 0.003)),
    maxHp: bp * (BASE.hp + u.hpFlat + c.hpFlat) * (1 + c.hp + m.hp) * (1 + H.hp),
    regen: bp * (BASE.regen + u.regen + c.regen) * (1 + H.regen),
    armor: Math.min(0.7, c.armor + H.armor),
    crit: Math.min(0.8, BASE.crit + c.crit + H.crit),
    critMult: BASE.critMult + c.critMult,
    shotSpeed: BASE.shotSpeed,
    multishot: 1 + c.multishot,
    bounce: c.bounce,
    aoeRadius: c.aoe ? 30 + 12 * c.aoe : 0,
    aoeDmg: c.aoe ? 0.5 : 0,
    slow: Math.min(0.6, c.slow),
    dot: c.dot,
    goldMult: 1 + c.gold + m.gold + H.gold,
    healOnKill: c.healOnKill,
    manaMult: Math.max(0.4, 1 - c.cdr), // costo dei poteri (carta Manuale ITIL)
    manaRegen: (MANA.regen + c.manaRegen) * (1 + H.manaRegen), // mana al secondo
    manaMax: c.manaMax + H.manaMax,      // mana massimo in più
    manaOnKill: c.manaOnKill,            // mana per ogni nemico eliminato
    wallHp: c.wallHp,                    // muro: vita in più (frazione)
    wallThorns: c.wallThorns,            // muro: danno a chi lo colpisce (frazione del danno della torre)
    wallReflect: Math.min(0.8, c.wallReflect), // muro: probabilità di respingere i colpi dei cecchini
    wallRegen: c.wallRegen,              // muro: riparazione al secondo (frazione)
    fence: u.fence,          // quarti di cerchio coperti dal recinto elettrico (0-4)
  };
}
