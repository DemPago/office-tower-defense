// Poteri attivi: si usano con un clic (o coi tasti 1-4) e costano MANA,
// che si ricarica da solo nel tempo. L'effetto vero è in systems/abilities.js.
//   mana   costo in mana; cd = piccola pausa dopo l'uso (anti-doppio clic)
//   short  nome breve sotto l'icona; help = spiegazione nel suggerimento
// Mana: il massimo parte da `base` e cresce di `perWave` a ogni ondata; si ricarica
// di `regen` al secondo (aumentabile con le carte).
import type { Run } from '../types.js';

export interface AbilityDef {
  id: string;
  key: string;
  icon: string;
  short: string;
  name: string;
  desc: string;
  mana: number;
  cd: number;
  help: string;
}

export const MANA = { base: 100, perWave: 5, regen: 0.8, start: 100 };

export function maxMana(run: Run): number {
  return MANA.base + MANA.perWave * Math.max(0, run.wave - 1) + run.stats.manaMax;
}

export const ABILITIES: AbilityDef[] = [
  { id: 'bomb',    key: '1', icon: '💣', short: 'Bomb',    name: 'Paper Bomb',        desc: 'Massive damage to all enemies', mana: 45, cd: 10,
    help: 'Hits ALL enemies on screen with 12× tower damage. Best when a group arrives at once.' },
  { id: 'coffee',  key: '2', icon: '☕', short: 'Coffee',  name: 'Hot Coffee',        desc: 'Slows everyone by 60% for 5s', mana: 25, cd: 15,
    help: 'All enemies slow by 60% for 5 seconds. Great against charging kamikaze enemies.' },
  { id: 'meeting', key: '3', icon: '📅', short: 'Meeting', name: 'Urgent Meeting',    desc: 'Stuns everyone for 3s', mana: 35, cd: 12,
    help: 'All enemies freeze for 3 seconds (bosses only 1.2s). Saves the yard when intruders break through.' },
  { id: 'audit',   key: '4', icon: '🔍', short: 'Audit',   name: 'Tax Audit',         desc: 'Halves enemy HP', mana: 60, cd: 10,
    help: 'Removes half the HP from all enemies (bosses only 15%), ignoring armor. Perfect against tanks.' },
  { id: 'sniper',  key: '5', icon: '🎯', short: 'Sniper',  name: 'Precision Shot',    desc: 'Sniper shot at an enemy outside range', mana: 1, cd: 0.3,
    help: 'Fires a powerful shot (5× damage) at the nearest enemy beyond normal range. Costs only 1 mana — useful when bosses are still far away.' },
];
