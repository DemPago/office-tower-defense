// Personaggi giocabili: stanno sul tetto del palazzo, ognuno con la sua arma (data/weapons.js)
// e le sue statistiche: punti forti e deboli, in più o in meno rispetto alla base.
//   dmg, rate, hp, regen, range, manaRegen  frazioni (0.15 = +15%)
//   crit, armor                             punti in più (0.1 = +10%)
//   gold                                    oro in più dai nemici; manaMax = mana massimo in più
// All'inizio ci sono Peppe e Dem; gli altri si sbloccano uno alla volta, nell'ordine,
// ogni volta che completi tutti i livelli (UNLOCK_WAVE: i 6 reparti, fino all'ondata 60).
import type { Meta } from '../types.js';

export interface HeroStats {
  dmg?: number;
  rate?: number;
  hp?: number;
  regen?: number;
  range?: number;
  manaRegen?: number;
  crit?: number;
  armor?: number;
  gold?: number;
  manaMax?: number;
}

export interface HeroDef {
  id: string;
  name: string;
  weapon: string;
  stats: HeroStats;
  desc: string;
}

export const HEROES: HeroDef[] = [
  { id: 'peppe',   name: 'Peppe',      weapon: 'laser',    stats: { rate: 0.15, manaRegen: 0.25, hp: -0.15 },               desc: 'Esperto AI sciupato dal running' },
  { id: 'dem',     name: 'Dem',        weapon: 'daggers',  stats: { gold: 0.25, hp: 0.1, dmg: -0.1 },                        desc: 'Al servizio dei poveri e italiano vero' },
  { id: 'nando',   name: 'Nando',      weapon: 'crossbow', stats: { crit: 0.1, range: 0.1, rate: -0.1 },                     desc: 'Campione di RDA' },
  { id: 'tony',    name: 'Tony',       weapon: 'pistol',   stats: { dmg: 0.05, crit: 0.1, regen: -0.5, hp: -0.1 },           desc: 'È come una macchina' },
  { id: 'vanessa', name: 'Vanessa',    weapon: 'hearts',   stats: { regen: 0.6, hp: 0.15, dmg: -0.1 },                       desc: 'Bionda, decisa, inarrestabile' },
  { id: 'clara',   name: 'Clara',      weapon: 'energy',   stats: { manaRegen: 0.4, manaMax: 25, hp: -0.1 },                  desc: 'Epiche su Jira' },
  { id: 'pesce',   name: 'Uomo Pesce', weapon: 'sonic',    stats: { hp: 0.3, armor: 0.1, rate: -0.15 },                       desc: 'Nessuno sa come sia stato assunto' },
  { id: 'frank',   name: 'Frank',      weapon: 'crossbow', stats: { range: 0.2, crit: 0.1, hp: -0.2, regen: -0.15 },          desc: 'Alto, sottile, pericolosamente preciso' },
  { id: 'cirios',  name: 'Cirios',     weapon: 'daggers',  stats: { gold: 0.3, armor: 0.1, rate: -0.15, range: -0.1 },        desc: 'Una fattura in mano vale più di una spada' },
];

// Sempre disponibili — i 7 personaggi originali
const BASE_HEROES = ['peppe', 'dem', 'nando', 'tony', 'vanessa', 'clara', 'pesce'];
export const UNLOCK_WAVE = 60;

export function heroDef(id: string): HeroDef {
  return HEROES.find(h => h.id === id) ?? HEROES[0];
}

export function unlockedHeroes(meta: Meta): string[] {
  const extra = (meta.heroes ?? []).filter(id => !BASE_HEROES.includes(id));
  return [...BASE_HEROES, ...extra];
}

// Sblocca il prossimo personaggio non ancora disponibile (solo quelli oltre i 7 base).
export function unlockNextHero(meta: Meta): HeroDef | null {
  const have = unlockedHeroes(meta);
  const next = HEROES.find(h => !have.includes(h.id));
  if (!next) return null;
  meta.heroes = [...(meta.heroes ?? []), next.id];
  return next;
}

const STAT_LABELS: Record<string, string> = {
  dmg: 'danno', rate: 'velocità di fuoco', hp: 'vita', regen: 'rigenerazione', range: 'gittata',
  manaRegen: 'ricarica del mana', crit: 'critici', armor: 'armatura', gold: 'oro', manaMax: 'mana massimo',
};

// Testo delle statistiche per il menu, es. "+15% velocità di fuoco, -15% vita".
export function heroStatsText(hero: HeroDef): string {
  return Object.entries(hero.stats ?? {}).map(([k, v]) => {
    const n = k === 'manaMax' ? `${v! > 0 ? '+' : ''}${v}` : `${v! > 0 ? '+' : ''}${Math.round(v! * 100)}%`;
    return `${n} ${STAT_LABELS[k]}`;
  }).join(', ');
}
