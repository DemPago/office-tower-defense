// Lo stato di una partita. Tutto quello che cambia mentre si gioca sta qui:
// i sistemi (systems/) lo modificano, il disegno (render/) e l'interfaccia (ui/) lo leggono.
import { ABILITIES } from './data/abilities.js';
import { UPGRADES } from './data/upgrades.js';
import { computeStats, metaBonuses } from './systems/stats.js';

// Dimensioni del "mondo" di gioco in pixel logici (verticale, tipo telefono).
export const WORLD = { w: 360, h: 560 };
export const TOWER = { x: 180, y: 455, radius: 26 };

export function createRun(meta) {
  const mb = metaBonuses(meta);
  const run = {
    phase: 'break',          // 'break' (pausa fra ondate) | 'wave' | 'cards' | 'over'
    breakTimer: 2,           // secondi prima della prossima ondata
    wave: 0,
    time: 0,
    gold: 20 + mb.startGold,
    rerolls: mb.rerolls,
    kills: 0,
    bossesKilled: 0,
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    cards: {},               // id carta -> quante copie prese
    cardChoices: null,       // le 3 carte proposte durante la fase 'cards'
    abilityCd: Object.fromEntries(ABILITIES.map(a => [a.id, 0])),
    tower: { hp: 0, cooldown: 0, hitFlash: 0 },
    stats: null,
    enemies: [],
    shots: [],               // colpi della torre
    enemyShots: [],          // colpi dei nemici a distanza
    spawnQueue: [],
    boss: null,              // il boss vivo (per la barra in alto)
    fx: { texts: [], parts: [], rings: [], corpses: [], shake: 0, banner: null },
    healFull: false,
  };
  run.stats = computeStats(run, meta);
  run.tower.hp = run.stats.maxHp;
  return run;
}
