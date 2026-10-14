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
  { id: 'peppe',   name: 'Peppe',      weapon: 'laser',    stats: { rate: 0.30, manaRegen: 0.50, hp: -0.20 },              desc: 'Inspired by Hank Scorpio. Wears Patagonia. Runs 5K before the standup. Genuinely happy to help — and that\'s what makes him dangerous.' },
  { id: 'dem',     name: 'Dem',        weapon: 'daggers',  stats: { gold: 0.50, hp: 0.20, dmg: -0.15 },                       desc: 'Nobody knows his past. Nobody asks. He completes the mission, collects the prize, and disappears. They say he\'s done this before. In other towers. Under other names.' },
  { id: 'nando',   name: 'Nando',      weapon: 'crossbow', stats: { crit: 0.20, range: 0.20, rate: -0.15 },                   desc: 'Regional archery champion, two-time. No social media, by choice. Has never lost a bet. Has never explained why. Arrives late, leaves early, somehow always wins.' },
  { id: 'tony',    name: 'Tony',       weapon: 'pistol',   stats: { dmg: 0.20, crit: 0.20, regen: -0.80, hp: -0.15 },         desc: 'Senior manager. Eats kebab at his desk every single day. Asks "com\'è?" about everything, including quarterly reports. Data expert. Still looking for his cousin, last seen at a Calabrian wedding. No one talks about it.' },
  { id: 'vanessa', name: 'Vanessa',    weapon: 'hearts',   stats: { regen: 1.20, hp: 0.25, dmg: -0.15 },                      desc: 'Blond, decisive, impossible to stop. Survived three office restructurings and two CEO changes. The fourth one tried. She\'s still here. They\'re not.' },
  { id: 'clara',   name: 'Clara',      weapon: 'energy',   stats: { manaRegen: 0.70, manaMax: 50, hp: -0.15 },                 desc: 'Doesn\'t drive. Doesn\'t cook. Doesn\'t talk. Shoots. Her loyal companion handles everything else — with a sword. Don\'t get in her way.' },
  { id: 'pesce',   name: 'Uomo Pesce', weapon: 'sonic',    stats: { hp: 0.50, armor: 0.20, rate: -0.25 },                      desc: 'Nobody knows how he got the job. The HR system accepted his application. Facilities gave him a badge. He showed up Monday. That was three years ago. He absorbs damage. He keeps going.' },
  { id: 'frank',   name: 'Frank',      weapon: 'crossbow', stats: { range: 0.35, crit: 0.20, hp: -0.35, regen: -0.30 },        desc: 'Tall. Quiet. Surgically precise. Comes from somewhere. Returns there every evening. Nobody follows. Nobody asks. His crossbow never misses. Especially the second shot.' },
  { id: 'cirios',  name: 'Cirios',     weapon: 'daggers',  stats: { gold: 0.55, armor: 0.15, rate: -0.25, range: -0.15 },      desc: 'One invoice in hand is worth more than a sword. Gold flows toward him naturally, as if gravity itself respects the margin. From Napoli. Deeply, irreversibly from Napoli.' },
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
  dmg: 'damage', rate: 'fire rate', hp: 'HP', regen: 'regen', range: 'range',
  manaRegen: 'mana regen', crit: 'crit', armor: 'armor', gold: 'gold', manaMax: 'max mana',
};

// Testo delle statistiche per il menu, es. "+15% velocità di fuoco, -15% vita".
export function heroStatsText(hero: HeroDef): string {
  return Object.entries(hero.stats ?? {}).map(([k, v]) => {
    const n = k === 'manaMax' ? `${v! > 0 ? '+' : ''}${v}` : `${v! > 0 ? '+' : ''}${Math.round(v! * 100)}%`;
    return `${n} ${STAT_LABELS[k]}`;
  }).join(', ');
}
