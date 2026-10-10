// Lo stato di una partita. Tutto quello che cambia mentre si gioca sta qui:
// i sistemi (systems/) lo modificano, il disegno (render/) e l'interfaccia (ui/) lo leggono.
import type { Meta, Run, FxState } from './types.js';
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

export function createRun(meta: Meta): Run {
  const mb = metaBonuses(meta);
  const fx: FxState = {
    texts: [], parts: [], rings: [], corpses: [], sounds: [],
    beams: [], waves: [], shake: 0, banner: null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run: any = {
    meta,
    hero: unlockedHeroes(meta).includes(meta.hero ?? '') ? meta.hero : 'peppe',
    weapon: null,
    phase: 'bomb-placement' as const,
    breakTimer: 1.5,
    wave: 0,
    time: 0,
    gold: 20 + mb.startGold,
    rerolls: mb.rerolls,
    kills: 0,
    bossesKilled: 0,
    upgrades: Object.fromEntries(UPGRADES.map((u: { id: string }) => [u.id, 0])),
    cards: {},
    cardPicks: [],
    cardChoices: null,
    allies: [],
    allyChoices: null,
    wall: buildWall(),
    abilityCd: Object.fromEntries(ABILITIES.map((a: { id: string }) => [a.id, 0])),
    mana: MANA.start,
    tower: { hp: 0, cooldown: 0, hitFlash: 0 },
    stats: null,
    enemies: [],
    bombs: [],
    bombPenalty: 0,
    shots: [],
    enemyShots: [],
    spawnQueue: [],
    boss: null,
    slowTowerT: 0,
    fx,
    healFull: false,
  };
  run.weapon = heroDef(run.hero).weapon;
  run.stats = computeStats(run, meta);
  run.tower.hp = run.stats.maxHp;
  repairWall(run);
  return run as Run;
}
