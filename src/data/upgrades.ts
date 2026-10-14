// Potenziamenti comprati con l'ORO durante la partita.
// Il costo del livello L è: base × grow^L (arrotondato).
//   mod(u, L) applica L livelli ai bonus dei potenziamenti (vedi systems/stats.js)
//   help(s, L) spiegazione per il suggerimento (s = statistiche attuali, L = livello)
import type { BonusSet, Stats } from '../types.js';

export interface UpgradeDef {
  id: string;
  icon: string;
  name: string;
  base: number;
  grow: number;
  max?: number;
  mod: (u: BonusSet, L: number) => void;
  help: (s: Stats) => string;
}

export interface MetaUpgradeDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  base: number;
  grow: number;
  max: number;
  mod: (m: BonusSet, L: number) => void;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'dmg',   icon: '⚔️', name: 'Damage',    base: 8,  grow: 1.32, mod: (u, L) => { u.dmg += 0.30 * L; },
    help: s => `Damage per shot (allies scale proportionally). +30% per level. Now: ${Math.round(s.dmg)} per shot.` },
  { id: 'rate',  icon: '⚡', name: 'Fire Rate', base: 10, grow: 1.40, mod: (u, L) => { u.rate += 0.10 * L; },
    help: s => `Shots per second. +10% per level. Now: ${s.rate.toFixed(1)} shots/s.` },
  { id: 'range', icon: '📡', name: 'Range',     base: 12, grow: 1.60, max: 8, mod: (u, L) => { u.range += 0.06 * L; },
    help: s => `How far the tower shoots (the dashed circle). +6% per level, max 8 levels. Now: ${Math.round(s.range)}.` },
  { id: 'hp',    icon: '❤️', name: 'HP',        base: 8,  grow: 1.30, mod: (u, L) => { u.hpFlat += 25 * L; },
    help: s => `Max HP of the building. +25 per level. Now: ${Math.round(s.maxHp)}.` },
  { id: 'regen', icon: '💚', name: 'Regen',     base: 10, grow: 1.38, mod: (u, L) => { u.regen += 0.8 * L; },
    help: s => `HP recovered per second. +0.8 per level. Now: ${s.regen.toFixed(1)}/s.` },
  { id: 'mana',  icon: '💧', name: 'Mana',      base: 10, grow: 1.38, mod: (u, L) => { u.manaMax += 20 * L; },
    help: s => `Max mana capacity. +20 per level. Now: ${Math.round(s.manaMax)}.` },
];

// Potenziamenti PERMANENTI comprati con i BUONI PASTO (valgono per sempre).
export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: 'dmg',    icon: '⚔️', name: 'Experience',       desc: '+10% damage',            base: 5,  grow: 1.5, max: 20, mod: (m, L) => { m.dmg += 0.10 * L; } },
  { id: 'hp',     icon: '❤️', name: 'Insurance',        desc: '+10% HP',                base: 5,  grow: 1.5, max: 20, mod: (m, L) => { m.hp += 0.10 * L; } },
  { id: 'rate',   icon: '⚡', name: 'Coffee Machine',   desc: '+5% fire rate',          base: 8,  grow: 1.6, max: 10, mod: (m, L) => { m.rate += 0.05 * L; } },
  { id: 'gold',   icon: '💰', name: 'Better Contract',  desc: '+10% gold',              base: 6,  grow: 1.5, max: 15, mod: (m, L) => { m.gold += 0.10 * L; } },
  { id: 'start',  icon: '🏦', name: 'Early Severance',  desc: '+20 starting gold',      base: 4,  grow: 1.4, max: 15, mod: (m, L) => { m.startGold += 20 * L; } },
  { id: 'reroll', icon: '🎲', name: 'Recommendation',   desc: '+1 card reroll per run', base: 15, grow: 2.0, max: 5,  mod: (m, L) => { m.rerolls += L; } },
];

export function levelCost(def: { base: number; grow: number }, level: number): number {
  return Math.round(def.base * Math.pow(def.grow, level));
}
