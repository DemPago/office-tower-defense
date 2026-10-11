// Ondate: quanti nemici, quali, quanto sono forti e da dove arrivano.
import { ENEMIES, ROLE_WEIGHTS, TIERS, ROLE_TIER, FOCAL_POINT_DEF, decadeFor, isZombieWave, ZOMBIE } from '../data/enemies.js';
import { ANIMALS } from '../data/animals.js';
import { bossForWave, WEAPONS } from '../data/bosses.js';
import { TOWER, SPAWN_RADIUS } from '../state.js';
import { banner, sfx } from './fx.js';
import type { Run } from '../types.js';

// ─── Parametri di bilanciamento ondate ───────────────────────────────────────
// Tutti i numeri che regolano la difficoltà sono qui: modificane uno solo per
// testare l'impatto senza dover cercare nelle formule.
export const WAVE_CONFIG = {
  // Crescita HP: lineare + quadratica fino all'ondata 25, poi esponenziale
  hp: { linear: 0.15, quadratic: 0.03, lateWave: 25, lateExp: 1.05 },
  // Crescita ATK: più morbida dell'HP (i colpi non devono ammazzare subito)
  atk: { linear: 0.10, quadratic: 0.008, lateWave: 25, lateExp: 1.03 },
  // Crescita oro: lineare, niente esponenziale (il gioco non diventa infinitamente ricco)
  gold: { linear: 0.06 },
  // Velocità per posizione nel ciclo (pos 1–9, boss=pos 0 usa 1.0)
  speed: { min: 0.25, max: 2.0 },   // waveSpeedMult = min + ((pos-1)/8)*(max-min)
  // Numero nemici per posizione nel ciclo (1–3 / 4–6 / 7–9)
  count: { early: 50, mid: 75, late: 100, boss: 50 },
  // Bonus HP per reparto: +12% ogni reparto completato (max 5 reparti)
  deptHpBonus: 0.12,
  // HP boss = danno_per_colpo × bossHpMultiplier (diviso per group size)
  bossHpMultiplier: 100,
  // Oro boss base (×goldScale a runtime)
  bossGoldBase: 30,
  // Dimensione base nemico in px (moltiplicata per scale nei boss)
  enemySize: 28,
};

// Quanto crescono i nemici rispetto all'ondata 1.
// Dopo l'ondata 25 si aggiunge una crescita esponenziale, così prima o poi si perde sempre.
export function hpScale(w: number): number {
  const c = WAVE_CONFIG.hp;
  return (1 + c.linear * (w - 1) + c.quadratic * (w - 1) ** 2) * c.lateExp ** Math.max(0, w - c.lateWave);
}
export function atkScale(w: number): number {
  const c = WAVE_CONFIG.atk;
  return (1 + c.linear * (w - 1) + c.quadratic * (w - 1) ** 2) * c.lateExp ** Math.max(0, w - c.lateWave);
}
export function goldScale(w: number): number { return 1 + WAVE_CONFIG.gold.linear * (w - 1); }

// Posizione nel ciclo di 10 ondate: 1-9 = ondata normale, 0 = boss
function cyclePos(w: number) { return w % 10; }

// Moltiplicatore velocità: pos 1 = lentissimi, pos 9 = velocissimi (vedi WAVE_CONFIG.speed)
export function waveSpeedMult(w: number) {
  const pos = cyclePos(w);
  if (pos === 0) return 1;
  const { min, max } = WAVE_CONFIG.speed;
  return min + ((pos - 1) / 8) * (max - min);
}

function speedLabel(w: number) {
  const pos = cyclePos(w);
  if (pos === 0) return '';
  const labels = ['VERY SLOW','SLOW','SLOW','MEDIUM','MEDIUM','FAST','FAST','FAST','VERY FAST'];
  return ` — ${labels[pos - 1]}`;
}

// Nemici per posizione nel ciclo (vedi WAVE_CONFIG.count)
function enemyCount(w: number) {
  const pos = cyclePos(w);
  const c = WAVE_CONFIG.count;
  if (pos === 0) return c.boss;
  if (pos <= 3)  return c.early;
  if (pos <= 6)  return c.mid;
  return c.late;
}

// Sceglie un nemico del reparto di questa ondata, pesando i ruoli (tanti tank).
function pickEnemy(w: number) {
  const lineup = decadeFor(w).enemies as Record<string, string>;
  let r = Math.random();
  for (const [role, weight] of Object.entries(ROLE_WEIGHTS)) {
    if ((r -= weight) <= 0) return (ENEMIES as Record<string, any>)[lineup[role]];
  }
  return (ENEMIES as Record<string, any>)[lineup.tank];
}

// Punto di partenza casuale su un cerchio intorno alla torre: arrivano da ogni direzione.
function spawnPoint() {
  const a = Math.random() * Math.PI * 2;
  return { x: TOWER.x + Math.cos(a) * SPAWN_RADIUS, y: TOWER.y + Math.sin(a) * SPAWN_RADIUS };
}

// I cecchini si affacciano sempre da finestre fisse (palazzi di fronte) — non vagano a caso.
const SNIPER_NESTS = [
  { x: TOWER.x + 240, y: TOWER.y - 210 }, // palazzo NE
  { x: TOWER.x - 240, y: TOWER.y - 200 }, // palazzo NO
  { x: TOWER.x + 230, y: TOWER.y + 210 }, // palazzo SE
  { x: TOWER.x - 220, y: TOWER.y + 220 }, // palazzo SO
];
let _sniperNestIdx = 0;
function sniperSpawnPoint() {
  const nest = SNIPER_NESTS[_sniperNestIdx % SNIPER_NESTS.length];
  _sniperNestIdx++;
  return { ...nest };
}

// Calcola le statistiche scalate di un nemico dato il suo def e l'ondata corrente.
// Separato da makeEnemy per rendere la logica di bilanciamento testabile in isolamento.
export function scaleEnemyStats(def: any, w: number, wsm = 1) {
  const decade   = decadeFor(w);
  const elite    = decade.elite;
  const zombie   = isZombieWave(w);
  const tierKey  = def.tier || (ROLE_TIER as Record<string, string>)[def.role] || 'junior';
  const tier     = (TIERS as Record<string, any>)[tierKey];
  const deptBonus = 1 + WAVE_CONFIG.deptHpBonus * Math.min(decade.index, 5);
  const hp       = def.hp * hpScale(w) * deptBonus * (zombie ? ZOMBIE.hp : 1) * tier.hpMult;
  const speed    = def.speed * (0.9 + Math.random() * 0.2) * (elite ? 1.15 : 1) * (zombie ? ZOMBIE.speed : 1) * tier.speedMult * wsm;
  const atk      = def.atk * atkScale(w) * tier.atkMult;
  const gold     = def.gold * goldScale(w) * tier.goldMult;
  return { hp, speed, atk, gold, tierKey, elite, zombie };
}

export function makeEnemy(def: any, w: number, extra: Record<string, any> = {}) {
  const p   = extra.at || (def.role === 'sniper' ? sniperSpawnPoint() : spawnPoint());
  const wsm = extra.wsm ?? 1;
  const { hp, speed, atk, gold, tierKey, elite, zombie } = scaleEnemyStats(def, w, wsm);
  // I cecchini restano fermi nel nido: il range copre la distanza dal nido alla torre.
  const range = def.role === 'sniper' && !extra.at
    ? Math.hypot(p.x - TOWER.x, p.y - TOWER.y) + 20
    : def.range;
  return {
    id: Math.random(),
    def,
    name: def.name,
    look: def.look,
    tier: tierKey,
    scale: 1,
    x: p.x, y: p.y,
    hp, maxHp: hp,
    speed,
    elite,
    zombie,
    role: def.role,
    taunt: !!def.taunt,
    charge: def.charge || null,
    charging: false,
    shotCd: def.shotCd || 1,
    healCd: 3,
    atk,
    range,
    armor: def.armor || 0,
    gold,
    size: WAVE_CONFIG.enemySize,
    attackCd: 1,
    slowT: 0, slowF: 0, stunT: 0, dotT: 0, dotDps: 0,
    hitFlash: 0, anim: Math.random(),
    boss: false,
    ...extra,
  };
}

function makeFocalPoint(w: number) {
  const def = { ...FOCAL_POINT_DEF, look: Math.random() < 0.5 ? 'focal_m' : 'focal_f' };
  return makeEnemy(def, w);
}

// Base dei boss: un "dipendente medio" a cui si applicano i moltiplicatori del boss.
const BOSS_BASE = { name: 'Boss', look: 'impiegato', role: 'boss', hp: 10, speed: 20, atk: 2, range: 0, gold: 1 };

// Animali di scorta: veloci, poca vita, mordono da vicino.
const ESCORT_BASE = { name: 'Scorta', role: 'escort', hp: 7, speed: 50, atk: 2, range: 0, gold: 2 };

// Restituisce { bosses, escorts }: il boss (o il gruppo) e i suoi animali, che arrivano dallo stesso lato.
// playerDmg: danno per colpo del giocatore — HP boss = playerDmg * 100
function makeBoss(b: any, w: number, playerDmg: number) {
  const base = BOSS_BASE;
  const group = b.group || 1;
  const list = [];
  const at = spawnPoint();
  for (let i = 0; i < group; i++) {
    // HP = bossHpMultiplier × danno del giocatore; diviso per group se multi-boss
    const hp = (playerDmg * WAVE_CONFIG.bossHpMultiplier) / group;
    const W = b.weapon ? (WEAPONS as Record<string, any>)[b.weapon] : null;
    list.push(makeEnemy(base, w, {
      at: { x: at.x + (Math.random() - 0.5) * 50, y: at.y + (Math.random() - 0.5) * 50 },
      animalId: b.animal, bossName: b.name,
      name: b.name, look: b.look, boss: true,
      scale: b.scale,
      aura: b.aura,
      trail: b.trail || null,
      hp, maxHp: hp,
      speed: b.speed * (W && W.speedMult ? W.speedMult : 1),
      atk: base.atk * Math.min(atkScale(w), 3) * b.atkFactor * (W ? W.atkMult : 1),
      range: W ? W.range : 0,
      shotCd: W ? W.shotCd : 1.3,
      gold: WAVE_CONFIG.bossGoldBase * goldScale(w) / group,
      size: WAVE_CONFIG.enemySize * b.scale,
      weaponType: b.weapon || null, // per effetti speciali in updateEnemies
      weaponPierce: W && W.pierce,
      weaponAoe:    W && W.aoe,
      weaponBeam:   W && W.beam,
      weaponSlow:   W && W.slow,
      attackCd: 0, // sfonda il muro subito senza aspettare
    }));
  }
  const A = (ANIMALS as Record<string, any>)[b.animal];
  const escorts = [];
  for (let i = 0; i < (b.escort || 0); i++) {
    escorts.push(makeEnemy(ESCORT_BASE, w, {
      at: { x: at.x + (Math.random() - 0.5) * 70, y: at.y + (Math.random() - 0.5) * 70 },
      name: A.name, animal: b.animal, look: null, speed: A.speed * (0.9 + Math.random() * 0.2), size: 18,
    }));
  }
  return { bosses: list, escorts };
}

export function startWave(run: Run): void {
  run.wave++;
  const w = run.wave;
  const queue: any[] = [];
  const boss = bossForWave(w);
  const focalWave = w > 5 && w % 10 === 8;
  const n = enemyCount(w);
  const wsm = waveSpeedMult(w);
  // Intervallo fisso: 100 nemici in ~35 secondi; boss wave usa gap più largo
  const gap = boss ? 0.6 : 0.35;
  for (let i = 0; i < n; i++) queue.push({ delay: i === 0 ? 0.3 : gap * (0.7 + Math.random() * 0.6), enemy: () => makeEnemy(pickEnemy(w), w, { wsm }) });
  if (boss) {
    const playerDmg = run.stats?.dmg ?? 10;
    queue.splice(Math.floor(n / 3), 0, { delay: 1.5, enemies: () => makeBoss(boss, w, playerDmg), boss });
  }
  if (focalWave) {
    queue.splice(Math.floor(queue.length / 2), 0, { delay: 2.5, enemy: () => makeFocalPoint(w) });
  }
  run.spawnQueue = queue;
  run.spawnTimer = 0;
  run.phase = 'wave';
  const decade = decadeFor(w);
  sfx(run, boss ? 'boss' : 'wave');
  if (boss) banner(run, boss.name, boss.sub, '#d7263d');
  else if (focalWave) banner(run, 'FOCAL POINT INCOMING', 'The department reference is furious!', '#f2b705');
  else if (isZombieWave(w)) {
    banner(run, 'ZOMBIE NIGHT', 'Your colleagues are not themselves anymore… slower but harder to kill', '#7bd332');
    sfx(run, 'zombie');
  } else if ((w - 1) % 10 === 0) {
    const names = Object.values(decade.enemies).map(id => (ENEMIES as Record<string, any>)[id].name).join(', ');
    banner(run, decade.name + (decade.elite ? ' ÉLITE' : ''), `Incoming: ${names}`, '#ff3e8a');
  } else banner(run, `WAVE ${w}${speedLabel(w)}`, `${n} enemies incoming`);
}

export function updateSpawns(run: Run, dt: number): void {
  if (!run.spawnQueue.length) return;
  run.spawnTimer = (run.spawnTimer ?? 0) + dt;
  while (run.spawnQueue.length && run.spawnTimer! >= run.spawnQueue[0].delay) {
    const next = run.spawnQueue.shift();
    run.spawnTimer = run.spawnTimer! - next.delay;
    if (next.enemies) {
      const { bosses, escorts } = next.enemies();
      run.enemies.push(...bosses, ...escorts);
      run.boss = { name: next.boss.name, list: bosses } as any;
    } else {
      run.enemies.push(next.enemy());
    }
  }
}
