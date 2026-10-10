// Lo stato di una partita. Tutto quello che cambia mentre si gioca sta qui:
// i sistemi (systems/) lo modificano, il disegno (render/) e l'interfaccia (ui/) lo leggono.
import { ABILITIES, MANA } from './data/abilities.js';
import { UPGRADES } from './data/upgrades.js';
import { computeStats, metaBonuses } from './systems/stats.js';
import { unlockedHeroes, heroDef } from './data/heroes.js';
import { buildWall, repairWall } from './systems/wall.js';

// Mondo di gioco in pixel logici: un quadrato con la torre al centro,
// attaccabile da tutte le direzioni (360°).
export const WORLD = { w: 640, h: 640 };
export const TOWER = { x: 320, y: 320, radius: 26 };
// Distanza dalla torre a cui compaiono i nemici (uguale per tutti gli schermi,
// così la difficoltà non dipende dalla grandezza del monitor).
export const SPAWN_RADIUS = 330;
// Cortile ridotto: zona critica subito intorno al palazzo.
export const YARD = { x: TOWER.x - 50, y: TOWER.y - 46, w: 100, h: 92 };

export function createRun(meta) {
  const mb = metaBonuses(meta);
  const run = {
    meta,                    // progressi permanenti (servono per ricalcolare le statistiche)
    hero: unlockedHeroes(meta).includes(meta.hero) ? meta.hero : 'peppe', // personaggio sul tetto
    weapon: null,            // arma della torre: quella del personaggio (vedi sotto)
    phase: 'bomb-placement',  // 'break' | 'wave' | 'ally' | 'cards' | 'over' | 'bomb-placement'
    breakTimer: 1.5,         // secondi prima della prossima ondata
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
    wall: buildWall(),       // tratti del muro di cinta (systems/wall.js)
    abilityCd: Object.fromEntries(ABILITIES.map(a => [a.id, 0])),
    mana: MANA.start,
    tower: { hp: 0, cooldown: 0, hitFlash: 0 },
    stats: null,
    enemies: [],
    bombs: [],               // mine piazzate dal giocatore
    bombPenalty: 0,          // quante bombe piazzate (ognuna = −5% a tutte le stat)
    shots: [],               // colpi della torre
    enemyShots: [],          // colpi dei nemici a distanza
    spawnQueue: [],
    boss: null,              // il boss vivo (per la barra in alto)
    slowTowerT: 0,           // fiocina: riduce temporaneamente la velocità di fuoco della torre
    fx: { texts: [], parts: [], rings: [], corpses: [], sounds: [], beams: [], waves: [], shake: 0, banner: null },
    healFull: false,
  };
  run.weapon = heroDef(run.hero).weapon;
  run.stats = computeStats(run, meta);
  run.tower.hp = run.stats.maxHp;
  repairWall(run);
  return run;
}
