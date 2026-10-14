// Carte potenziamento: dopo ogni ondata se ne sceglie 1 fra 3.
// Le carte crescono con il gioco: il loro effetto è moltiplicato per cardPower(ondata)
// nel momento in cui le prendi (una carta presa all'ondata 30 vale molto di più).
//   rarity   'common' | 'rare' | 'epic' (più rara = esce meno spesso)
//   max      quante volte si può prendere al massimo (le copie si sommano)
//   linear   l'effetto cresce in proporzione alle copie (per mostrare il totale)
//   desc(m)  testo della carta con la potenza m
//   mod(c,m) modifica i bonus delle carte (vedi systems/stats.js), una volta per copia
//   onPick   effetto immediato, solo nel momento della scelta
// Ogni carta vale di più se la prendi tardi: +2% per ondata (era +4%, ridotto per bilanciamento).
// Ondata 1 → 1.0×  |  Ondata 10 → 1.18×  |  Ondata 20 → 1.38×
import type { CardDef, BonusSet, Run } from '../types.js';

export const MAX_HAND = 5;
export function cardPower(wave: number): number {
  return 1 + 0.02 * (wave - 1);
}
const pct = (v: number, m: number) => Math.round(v * m * 100);
const num = (v: number, m: number) => Math.round(v * m * 10) / 10;

export const CARDS: CardDef[] = [
  { id: 'caffe',     icon: '☕', name: 'Double Espresso',      rarity: 'common', max: 10, linear: true, desc: (m: number) => `+${pct(0.20, m)}% fire rate`,                   mod: (c: BonusSet, m: number) => { c.rate += 0.20 * m; } },
  { id: 'straord',   icon: '⏰', name: 'Overtime',             rarity: 'common', max: 10, linear: true, desc: (m: number) => `+${pct(0.25, m)}% damage`,                      mod: (c: BonusSet, m: number) => { c.dmg += 0.25 * m; } },
  { id: 'vision',    icon: '🔭', name: 'Corporate Vision',     rarity: 'common', max: 5,  linear: true, desc: (m: number) => `+${pct(0.12, m)}% range`,                       mod: (c: BonusSet, m: number) => { c.range += 0.12 * m; } },
  { id: 'smart',     icon: '🏠', name: 'Remote Work',          rarity: 'common', max: 10, linear: true, desc: (m: number) => `+${Math.round(30 * m)} max HP and full heal`,   mod: (c: BonusSet, m: number) => { c.hpFlat += 30 * m; }, onPick: (run: Run) => { run.healFull = true; } },
  { id: 'ferie',     icon: '🏖️', name: 'Overdue Leave',        rarity: 'common', max: 10, linear: true, desc: (m: number) => `+${num(1.5, m)} HP per second`,                 mod: (c: BonusSet, m: number) => { c.regen += 1.5 * m; } },
  { id: 'bonus',     icon: '💰', name: 'Performance Bonus',    rarity: 'common', max: 5,  linear: true, desc: (m: number) => `+${pct(0.25, m)}% gold from enemies`,           mod: (c: BonusSet, m: number) => { c.gold += 0.25 * m; } },
  { id: 'rimborso',  icon: '🧾', name: 'Expense Report',       rarity: 'common', max: 99, desc: () => 'Receive gold immediately (10 × wave)',          mod: () => {}, onPick: (run: Run) => { run.gold += 10 * run.wave; } },
  { id: 'sindacato', icon: '🛡️', name: 'Union',                rarity: 'rare',   max: 5,  linear: true, desc: (m: number) => `+${pct(0.10, m)}% armor (damage reduction)`,   mod: (c: BonusSet, m: number) => { c.armor += 0.10 * m; } },
  { id: 'cc',        icon: '📧', name: 'CC the Boss',          rarity: 'rare',   max: 5,  linear: true, desc: (m: number) => `+${pct(0.10, m)}% crit chance`,                 mod: (c: BonusSet, m: number) => { c.crit += 0.10 * m; } },
  { id: 'replyall',  icon: '📨', name: 'Reply All',            rarity: 'rare',   max: 5,  linear: true, desc: (m: number) => `+${pct(0.6, m)}% crit damage`,                  mod: (c: BonusSet, m: number) => { c.critMult += 0.6 * m; } },
  { id: 'pm',        icon: '📊', name: "PM's Laser",           rarity: 'rare',   max: 4,  desc: () => 'Shoot 1 additional target',                      mod: (c: BonusSet) => { c.multishot += 1; } },
  { id: 'sm',        icon: '🎯', name: "SM's Crossbow",        rarity: 'rare',   max: 3,  linear: true, desc: (m: number) => `Shots slow enemies by ${Math.min(60, pct(0.20, m))}%`, mod: (c: BonusSet, m: number) => { c.slow += 0.20 * m; } },
  { id: 'stagista',  icon: '🧑‍🎓', name: 'Eager Intern',       rarity: 'rare',   max: 4,  desc: () => 'Shots bounce to 1 extra enemy',                  mod: (c: BonusSet) => { c.bounce += 1; } },
  { id: 'excel',     icon: '📗', name: 'Poisoned Spreadsheet', rarity: 'rare',   max: 5,  linear: true, desc: (m: number) => `Shots burn: +${pct(0.40, m)}% dmg over 3s`,     mod: (c: BonusSet, m: number) => { c.dot += 0.40 * m; } },
  { id: 'pausa',     icon: '🥪', name: 'Lunch Break',          rarity: 'rare',   max: 5,  linear: true, desc: (m: number) => `Each kill heals ${num(1, m)} HP`,               mod: (c: BonusSet, m: number) => { c.healOnKill += m; } },
  { id: 'dev',       icon: '💻', name: "Dev's Thrown PC",      rarity: 'epic',   max: 3,  desc: () => 'Shots explode: 50% AoE damage',                   mod: (c: BonusSet) => { c.aoe += 1; } },
  { id: 'itil',      icon: '📚', name: 'ITIL Manual',          rarity: 'epic',   max: 3,  desc: () => 'Abilities: -20% mana cost',                       mod: (c: BonusSet) => { c.cdr += 0.20; } },
  { id: 'energy',    icon: '🔋', name: 'Extra Coffee Break',   rarity: 'common', max: 5,  linear: true, desc: (m: number) => `+${num(0.3, m)} mana per second`,              mod: (c: BonusSet, m: number) => { c.manaRegen += 0.3 * m; } },
  { id: 'reserve',   icon: '🗄️', name: 'Supply Reserve',       rarity: 'common', max: 5,  linear: true, desc: (m: number) => `+${Math.round(25 * m)} max mana`,              mod: (c: BonusSet, m: number) => { c.manaMax += 25 * m; } },
  { id: 'inbox',     icon: '📥', name: 'Inbox Zero',           rarity: 'rare',   max: 3,  linear: true, desc: (m: number) => `Each kill gives ${num(1, m)} mana`,             mod: (c: BonusSet, m: number) => { c.manaOnKill += m; } },
  { id: 'concrete',  icon: '🧱', name: 'Concrete Wall',        rarity: 'rare',   max: 3,  linear: true, desc: (m: number) => `Wall: +${pct(0.6, m)}% HP`,                    mod: (c: BonusSet, m: number) => { c.wallHp += 0.6 * m; } },
  { id: 'barbed',    icon: '➰', name: 'Barbed Wire',          rarity: 'rare',   max: 3,  linear: true, desc: (m: number) => `Wall attackers take ${pct(0.5, m)}% your dmg`,  mod: (c: BonusSet, m: number) => { c.wallThorns += 0.5 * m; } },
  { id: 'steel',     icon: '🛡️', name: 'Steel Plates',         rarity: 'epic',   max: 2,  linear: true, desc: (m: number) => `Wall: +${pct(0.4, m)}% HP & reflects ${pct(0.35, m)}% sniper shots`, mod: (c: BonusSet, m: number) => { c.wallHp += 0.4 * m; c.wallReflect += 0.35 * m; } },
  { id: 'selfrepair',icon: '🔧', name: 'Self-Repairing Wall',  rarity: 'rare',   max: 3,  linear: true, desc: (m: number) => `Wall repairs itself: ${num(2, m)}% HP/s in combat`, mod: (c: BonusSet, m: number) => { c.wallRegen += 0.02 * m; } },
  { id: 'scrum',     icon: '📋', name: 'Scrum Master',         rarity: 'epic',   max: 3,  linear: true, desc: (m: number) => `+${pct(0.6, m)}% damage & +${pct(0.15, m)}% fire rate`, mod: (c: BonusSet, m: number) => { c.dmg += 0.6 * m; c.rate += 0.15 * m; } },
  // ── Usable cards: kept in hand, played before a wave ──
  { id: 'medkit',   icon: '🩹', name: 'First Aid Kit',         type: 'use', rarity: 'rare',   max: 3, desc: () => 'Heals 25% of max HP at the right moment',      mod: () => {}, use: (run: Run) => { run.tower.hp += run.stats.maxHp * 0.25; } },
  { id: 'redbull',  icon: '🥤', name: 'Red Bull',              type: 'use', rarity: 'common', max: 3, desc: () => 'Restores 60 mana at the right moment',          mod: () => {}, use: (run: Run) => { run.mana += 60; } },
  { id: 'pizza',    icon: '🍕', name: 'Team Pizza',            type: 'use', rarity: 'rare',   max: 2, desc: () => 'Heals 15% HP and restores 30 mana',             mod: () => {}, use: (run: Run) => { run.tower.hp += run.stats.maxHp * 0.15; run.mana += 30; } },
  { id: 'expenses', icon: '🚕', name: 'Expense Report',        type: 'use', rarity: 'epic',   max: 2, desc: () => 'Collect 20 × wave in gold immediately',         mod: () => {}, use: (run: Run) => { run.gold += 20 * run.wave; } },
  { id: 'armsdepot', icon: '💣', name: 'Arms Depot',           rarity: 'rare',  max: 3, desc: () => '+2 free bombs per round',                       mod: () => {}, onPick: (run: Run) => { run.extraBombs = (run.extraBombs ?? 0) + 2; } },
  { id: 'minefield', icon: '💥', name: 'Minefield',            rarity: 'epic',  max: 2, desc: () => 'Next 3 placed bombs become mines (manual detonation)', mod: () => {}, onPick: (run: Run) => { run.minesNext = (run.minesNext ?? 0) + 3; } },
];

// Malus pesanti: dopo ogni ondata zombie (7, 17, 27…) le 3 scelte sono TUTTE negative.
// Scegli il male minore. Nessun compenso in oro, nessun reroll.
export const HEAVY_MALUS_CARDS: CardDef[] = [
  { id: 'licenziamento', icon: '📋', name: 'Layoff',           rarity: 'epic', max: 99, malus: true, heavy: true,
    desc: () => 'Removes your last chosen card',
    mod: () => {},
    onPick: (run: Run) => {
      // licenziamento è già in cardPicks come ultimo elemento; rimuoviamo il penultimo
      if (run.cardPicks.length >= 2) {
        const victim = run.cardPicks[run.cardPicks.length - 2];
        run.cardPicks.splice(run.cardPicks.length - 2, 1);
        if (run.cards[victim.id] > 0) run.cards[victim.id]--;
      }
    } },
  { id: 'crisi',         icon: '📉', name: 'Corporate Crisis',  rarity: 'epic', max: 99, malus: true, heavy: true,
    desc: () => '-30% damage and -30% fire rate',
    mod: (c: BonusSet) => { c.dmg -= 0.30; c.rate -= 0.30; } },
  { id: 'burnout',       icon: '🔥', name: 'Team Burnout',      rarity: 'epic', max: 99, malus: true, heavy: true,
    desc: () => '-2 HP per second (less regen)',
    mod: (c: BonusSet) => { c.regen -= 2; } },
  { id: 'blackout',      icon: '🌑', name: 'System Blackout',   rarity: 'epic', max: 99, malus: true, heavy: true,
    desc: () => '+50% mana cost for abilities',
    mod: (c: BonusSet) => { c.cdr -= 0.50; } },
  { id: 'tagli',         icon: '✂️', name: 'Budget Cuts',       rarity: 'epic', max: 99, malus: true, heavy: true,
    desc: () => '-35% gold from enemies',
    mod: (c: BonusSet) => { c.gold -= 0.35; } },
  { id: 'downgrade',     icon: '⬇️', name: 'Forced Downgrade',  rarity: 'epic', max: 99, malus: true, heavy: true,
    desc: () => '-25% range',
    mod: (c: BonusSet) => { c.range -= 0.25; } },
];

// Carte malus: compaiono quando vinci troppo facilmente (vita > 80%).
// Penalità fissa, mai in pool normale — compenso in oro che scala con l'ondata.
export const MALUS_CARDS: CardDef[] = [
  { id: 'riunione',  icon: '😴', name: 'Endless Meeting',       rarity: 'common', malus: true, max: 1,
    desc: () => '-15% fire rate',
    reward: (wave: number) => `+${30 + wave * 2}💰 as compensation`,
    mod: (c: BonusSet) => { c.rate -= 0.15; },
    onPick: (run: Run) => { run.gold += 30 + run.wave * 2; } },
  { id: 'bug_prod',  icon: '🐛', name: 'Production Bug',        rarity: 'common', malus: true, max: 1,
    desc: () => '-20% damage',
    reward: (wave: number) => `+${40 + wave * 2}💰 as compensation`,
    mod: (c: BonusSet) => { c.dmg -= 0.20; },
    onPick: (run: Run) => { run.gold += 40 + run.wave * 2; } },
  { id: 'reorg',     icon: '📉', name: 'Restructuring',         rarity: 'common', malus: true, max: 1,
    desc: () => '-0.8 HP/s regen',
    reward: (wave: number) => `+${25 + wave * 2}💰 as compensation`,
    mod: (c: BonusSet) => { c.regen -= 0.8; },
    onPick: (run: Run) => { run.gold += 25 + run.wave * 2; } },
];

// Lookup unificato (usato da computeStats per trovare il mod di ogni carta presa).
export function findCard(id: string): CardDef | undefined {
  return CARDS.find(c => c.id === id)
    ?? MALUS_CARDS.find(c => c.id === id)
    ?? HEAVY_MALUS_CARDS.find(c => c.id === id);
}

export const RARITY: Record<string, { weight: number; label: string; color: string }> = {
  common: { weight: 60, label: 'Common', color: '#8a8d93' },
  rare:   { weight: 30, label: 'Rare',   color: '#2de2e6' },
  epic:   { weight: 10, label: 'Epic',   color: '#ff3e8a' },
};
