// Calcola le statistiche finali della torre combinando tre fonti di bonus:
// potenziamenti con l'oro (u), carte (c) e progressi permanenti (m).
import { findCard } from '../data/cards.js';
import { UPGRADES, META_UPGRADES } from '../data/upgrades.js';
import { ALLIES } from '../data/allies.js';
import { MANA } from '../data/abilities.js';
import { weaponDef } from '../data/weapons.js';
import { heroDef } from '../data/heroes.js';
import { DIFF } from '../data/difficulty.js';
import type { Run, Meta, Stats, BonusSet } from '../types.js';

// ─── Statistiche base della torre (senza nessun bonus) ───────────────────────
export const BASE = {
  dmg:       10,    // danno per colpo
  rate:       1.4,  // colpi/sec
  range:    145,    // px nel mondo di gioco
  hp:       150,    // punti vita totali
  regen:      1,    // hp/sec di rigenerazione passiva
  crit:       0.05, // probabilità critico base [0–1]
  critMult:   2,    // moltiplicatore danno critico
  shotSpeed: 380,   // velocità proiettile in px/sec
};

// ─── Limiti e costanti di bilanciamento stats ─────────────────────────────────
// Tutti i cap e i piccoli moltiplicatori che altrimenti sarebbero numeri magici
// sparsi nelle formule di computeStats.
const STAT_CAPS = {
  rateMax:      12,   // colpi/sec massimi (×W.rate per le armi veloci)
  rangeMax:    260,   // px massimi di gittata
  armorMax:     0.7,  // riduzione danno massima [0–1]
  critMax:      0.8,  // probabilità critico massima
  slowMax:      0.6,  // slow massimo applicabile
  wallReflMax:  0.8,  // riflesso muri massimo
  manaMultMin:  0.4,  // costo mana minimo (1 − cdr non scende sotto questo)
  rangeWaveK:   0.003,// bonus range per ondata: +0.3% per ondata giocata
  aoeBaseR:    30,    // raggio AOE base (px) quando c.aoe > 0
  aoePerStack: 12,    // px di raggio aggiuntivi per ogni stack AOE
  aoeDmgRatio:  0.5,  // frazione del danno principale per l'AOE
};

function emptyBonus(): BonusSet {
  return {
    dmg: 0, rate: 0, range: 0, hp: 0, hpFlat: 0, regen: 0, armor: 0,
    crit: 0, critMult: 0, multishot: 0, bounce: 0, aoe: 0, slow: 0, dot: 0,
    gold: 0, healOnKill: 0, cdr: 0, startGold: 0, rerolls: 0,
    manaRegen: 0, manaMax: 0, manaOnKill: 0,
    wallHp: 0, wallThorns: 0, wallReflect: 0, wallRegen: 0,
  };
}

export function metaBonuses(meta: Meta): BonusSet {
  const m = emptyBonus();
  for (const def of META_UPGRADES) {
    const L = meta.levels[def.id] || 0;
    if (L) def.mod(m, L);
  }
  return m;
}

export function computeStats(run: Run, meta: Meta): Stats {
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
    const def = ALLIES.find((a: { id: string }) => a.id === ally.id);
    if (def && def.aura === 'rate') auraRate += (def.auraPer ?? 0) * ally.level;
    if (def && def.aura === 'dmg') auraDmg += (def.auraPer ?? 0) * ally.level;
  }

  const W = weaponDef(run.weapon ?? '');
  const H = { dmg: 0, rate: 0, hp: 0, regen: 0, range: 0, manaRegen: 0, crit: 0, armor: 0, gold: 0, manaMax: 0, ...heroDef(run.hero).stats };

  const S = STAT_CAPS;
  return {
    dmg:          (1 + H.dmg) * W.dmg * BASE.dmg * (1 + u.dmg) * (1 + c.dmg) * (1 + m.dmg) * (1 + auraDmg),
    rate:         Math.min(S.rateMax * W.rate, (1 + H.rate) * W.rate * BASE.rate * (1 + u.rate + c.rate + m.rate + auraRate)),
    allyRateMult: 1 + auraRate,
    range:        Math.min(S.rangeMax, (1 + H.range) * W.range * BASE.range * (1 + u.range + c.range) * (1 + (run.wave || 0) * S.rangeWaveK)),
    maxHp:        (BASE.hp * DIFF.towerHp + u.hpFlat + c.hpFlat) * (1 + c.hp + m.hp) * (1 + H.hp),
    regen:        (BASE.regen + u.regen + c.regen) * (1 + H.regen),
    armor:        Math.min(S.armorMax, c.armor + H.armor),
    crit:         Math.min(S.critMax, BASE.crit + c.crit + H.crit),
    critMult:     BASE.critMult + c.critMult,
    shotSpeed:    BASE.shotSpeed,
    multishot:    1 + c.multishot,
    bounce:       c.bounce,
    aoeRadius:    c.aoe ? S.aoeBaseR + S.aoePerStack * c.aoe : 0,
    aoeDmg:       c.aoe ? S.aoeDmgRatio : 0,
    slow:         Math.min(S.slowMax, c.slow),
    dot:          c.dot,
    goldMult:     1 + c.gold + m.gold + H.gold,
    healOnKill:   c.healOnKill,
    manaMult:     Math.max(S.manaMultMin, 1 - c.cdr),
    manaRegen:    (MANA.regen + c.manaRegen) * (1 + H.manaRegen),
    manaMax:      u.manaMax + c.manaMax + H.manaMax,
    manaOnKill:   c.manaOnKill,
    wallHp:       c.wallHp,
    wallThorns:   c.wallThorns,
    wallReflect:  Math.min(S.wallReflMax, c.wallReflect),
    wallRegen:    c.wallRegen,
  };
}
