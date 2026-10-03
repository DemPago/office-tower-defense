// Lo stato di una partita. Tutto quello che cambia mentre si gioca sta qui:
// i sistemi (systems/) lo modificano, il disegno (render/) e l'interfaccia (ui/) lo leggono.
import { ABILITIES } from './data/abilities.js';
import { UPGRADES } from './data/upgrades.js';
import { computeStats, metaBonuses } from './systems/stats.js';

// Mondo di gioco in pixel logici: un quadrato con la torre al centro,
// attaccabile da tutte le direzioni (360°).
export const WORLD = { w: 640, h: 640 };
export const TOWER = { x: 320, y: 320, radius: 26 };
// Distanza dalla torre a cui compaiono i nemici (uguale per tutti gli schermi,
// così la difficoltà non dipende dalla grandezza del monitor).
export const SPAWN_RADIUS = 330;
// Cortile fortificato intorno al palazzo: se un nemico ci entra, i colleghi perdono vita.
export const YARD = { x: TOWER.x - 112, y: TOWER.y - 104, w: 224, h: 200 };

export function createRun(meta) {
  const mb = metaBonuses(meta);
  const run = {
    meta,                    // progressi permanenti (servono per ricalcolare le statistiche)
    phase: 'break',          // 'break' (pausa fra ondate) | 'wave' | 'ally' | 'cards' | 'over'
    breakTimer: 2,           // secondi prima della prossima ondata
    wave: 0,
    time: 0,
    gold: 20 + mb.startGold,
    rerolls: mb.rerolls,
    kills: 0,
    bossesKilled: 0,
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    cards: {},               // id carta -> quante copie prese
    cardPicks: [],           // carte prese: { id, m = potenza al momento della scelta }
    cardChoices: null,       // le 3 carte proposte durante la fase 'cards'
    allies: [],              // rinforzi: { id, level, slot, ... }
    allyChoices: null,       // i 3 colleghi proposti durante la fase 'ally'
    intruders: 0,            // nemici vivi dentro al cortile in questo momento
    abilityCd: Object.fromEntries(ABILITIES.map(a => [a.id, 0])),
    tower: { hp: 0, cooldown: 0, hitFlash: 0 },
    stats: null,
    enemies: [],
    shots: [],               // colpi della torre
    enemyShots: [],          // colpi dei nemici a distanza
    spawnQueue: [],
    boss: null,              // il boss vivo (per la barra in alto)
    fx: { texts: [], parts: [], rings: [], corpses: [], sounds: [], shake: 0, banner: null },
    healFull: false,
  };
  run.stats = computeStats(run, meta);
  run.tower.hp = run.stats.maxHp;
  return run;
}
