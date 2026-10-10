// Ondate: quanti nemici, quali, quanto sono forti e da dove arrivano.
import { ENEMIES, ROLE_WEIGHTS, TIERS, ROLE_TIER, FOCAL_POINT_DEF, decadeFor, isZombieWave, ZOMBIE } from '../data/enemies.js';
import { ANIMALS } from '../data/animals.js';
import { bossForWave, WEAPONS } from '../data/bosses.js';
import { TOWER, SPAWN_RADIUS } from '../state.js';
import { banner, sfx } from './fx.js';

// Quanto crescono i nemici rispetto all'ondata 1.
// Dopo l'ondata 25 si aggiunge una crescita esponenziale, così prima o poi si perde sempre.
export function hpScale(w)   { return (1 + 0.15 * (w - 1) + 0.03 * (w - 1) ** 2) * 1.05 ** Math.max(0, w - 25); }
export function atkScale(w)  { return (1 + 0.10 * (w - 1) + 0.008 * (w - 1) ** 2) * 1.03 ** Math.max(0, w - 25); }
export function goldScale(w) { return 1 + 0.06 * (w - 1); }

// Posizione nel ciclo di 10 ondate: 1-9 = ondata normale, 0 = boss
function cyclePos(w) { return w % 10; }

// Moltiplicatore velocità: pos 1 = lentissimi (0.25x), pos 9 = velocissimi (2.0x)
export function waveSpeedMult(w) {
  const pos = cyclePos(w);
  if (pos === 0) return 1; // boss wave: velocità normale
  return 0.25 + ((pos - 1) / 8) * 1.75;
}

function speedLabel(w) {
  const pos = cyclePos(w);
  if (pos === 0) return '';
  const labels = ['LENTISSIMA','LENTA','LENTA','MEDIA','MEDIA','VELOCE','VELOCE','VELOCE','VELOCISSIMA'];
  return ` — ${labels[pos - 1]}`;
}

// Nemici per posizione nel ciclo: 1-3 = 50, 4-6 = 75, 7-9 = 100; boss = 50 normali
function enemyCount(w) {
  const pos = cyclePos(w);
  if (pos === 0) return 50;
  if (pos <= 3) return 50;
  if (pos <= 6) return 75;
  return 100;
}

// Sceglie un nemico del reparto di questa ondata, pesando i ruoli (tanti tank).
function pickEnemy(w) {
  const lineup = decadeFor(w).enemies;
  let r = Math.random();
  for (const [role, weight] of Object.entries(ROLE_WEIGHTS)) {
    if ((r -= weight) <= 0) return ENEMIES[lineup[role]];
  }
  return ENEMIES[lineup.tank];
}

// Punto di partenza casuale su un cerchio intorno alla torre: arrivano da ogni direzione.
function spawnPoint() {
  const a = Math.random() * Math.PI * 2;
  return { x: TOWER.x + Math.cos(a) * SPAWN_RADIUS, y: TOWER.y + Math.sin(a) * SPAWN_RADIUS };
}

export function makeEnemy(def, w, extra = {}) {
  const p = extra.at || spawnPoint();
  const decade = decadeFor(w);
  const elite = decade.elite;
  const zombie = isZombieWave(w);
  // moltiplicatori tier: Graduate è più debole, Middle è più robusto, ecc.
  const tier = def.tier ? TIERS[def.tier] : TIERS[ROLE_TIER[def.role] || 'junior'];
  const deptBonus = 1 + 0.12 * Math.min(decade.index, 5);
  const hp = def.hp * hpScale(w) * deptBonus * (zombie ? ZOMBIE.hp : 1) * tier.hpMult;
  const wsm = extra.wsm ?? 1; // moltiplicatore velocità da posizione nel ciclo
  return {
    id: Math.random(),
    def,
    name: def.name,
    look: def.look,
    tier: def.tier || ROLE_TIER[def.role] || 'junior',
    scale: 1,
    x: p.x, y: p.y,
    hp, maxHp: hp,
    speed: def.speed * (0.9 + Math.random() * 0.2) * (elite ? 1.15 : 1) * (zombie ? ZOMBIE.speed : 1) * tier.speedMult * wsm,
    elite,
    zombie,
    role: def.role,
    taunt: !!def.taunt,
    charge: def.charge || null,
    charging: false,
    shotCd: def.shotCd || 1,
    healCd: 3,
    atk: def.atk * atkScale(w) * tier.atkMult,
    range: def.range,
    armor: def.armor || 0,
    gold: def.gold * goldScale(w) * tier.goldMult,
    size: 28,
    attackCd: 1,
    slowT: 0, slowF: 0, stunT: 0, dotT: 0, dotDps: 0,
    hitFlash: 0, anim: Math.random(),
    boss: false,
    ...extra,
  };
}

function makeFocalPoint(w) {
  const def = { ...FOCAL_POINT_DEF, look: Math.random() < 0.5 ? 'focal_m' : 'focal_f' };
  return makeEnemy(def, w);
}

// Base dei boss: un "dipendente medio" a cui si applicano i moltiplicatori del boss.
const BOSS_BASE = { name: 'Boss', look: 'impiegato', role: 'boss', hp: 10, speed: 20, atk: 2, range: 0, gold: 1 };

// Animali di scorta: veloci, poca vita, mordono da vicino.
const ESCORT_BASE = { name: 'Scorta', role: 'escort', hp: 7, speed: 50, atk: 2, range: 0, gold: 2 };

// Restituisce { bosses, escorts }: il boss (o il gruppo) e i suoi animali, che arrivano dallo stesso lato.
// playerDmg: danno per colpo del giocatore — HP boss = playerDmg * 100
function makeBoss(b, w, playerDmg) {
  const base = BOSS_BASE;
  const group = b.group || 1;
  const list = [];
  const at = spawnPoint();
  for (let i = 0; i < group; i++) {
    // HP = 100x il danno del giocatore; diviso per il gruppo se multi-boss
    const hp = (playerDmg * 100) / group;
    const W = b.weapon ? WEAPONS[b.weapon] : null;
    list.push(makeEnemy(base, w, {
      at: { x: at.x + (Math.random() - 0.5) * 50, y: at.y + (Math.random() - 0.5) * 50 },
      animalId: b.animal, bossName: b.name,
      name: b.name, look: b.look, boss: true,
      scale: b.scale,
      aura: b.aura,
      trail: b.trail || null,
      hp, maxHp: hp,
      speed: b.speed * (W && W.speedMult ? W.speedMult : 1),
      atk: base.atk * atkScale(w) * b.atkFactor * (W ? W.atkMult : 1),
      range: W ? W.range : 0,
      shotCd: W ? W.shotCd : 1.3,
      gold: 30 * goldScale(w) / group,
      size: 28 * b.scale,
      weaponType: b.weapon || null, // per effetti speciali in updateEnemies
      weaponPierce: W && W.pierce,
      weaponAoe:    W && W.aoe,
      weaponBeam:   W && W.beam,
      weaponSlow:   W && W.slow,
      attackCd: 0, // sfonda il muro subito senza aspettare
    }));
  }
  const A = ANIMALS[b.animal];
  const escorts = [];
  for (let i = 0; i < (b.escort || 0); i++) {
    escorts.push(makeEnemy(ESCORT_BASE, w, {
      at: { x: at.x + (Math.random() - 0.5) * 70, y: at.y + (Math.random() - 0.5) * 70 },
      name: A.name, animal: b.animal, look: null, speed: A.speed * (0.9 + Math.random() * 0.2), size: 18,
    }));
  }
  return { bosses: list, escorts };
}

export function startWave(run) {
  run.wave++;
  const w = run.wave;
  const queue = [];
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
  else if (focalWave) banner(run, 'FOCAL POINT IN ARRIVO', 'Il riferimento del reparto è furioso!', '#f2b705');
  else if (isZombieWave(w)) {
    banner(run, 'NOTTE DEGLI ZOMBIE', 'I colleghi non sono più loro… più lenti ma più duri a morire', '#7bd332');
    sfx(run, 'zombie');
  } else if ((w - 1) % 10 === 0) {
    const names = Object.values(decade.enemies).map(id => ENEMIES[id].name).join(', ');
    banner(run, decade.name + (decade.elite ? ' ÉLITE' : ''), `Arrivano: ${names}`, '#ff3e8a');
  } else banner(run, `ONDATA ${w}${speedLabel(w)}`, `${n} nemici in arrivo`);
}

export function updateSpawns(run, dt) {
  if (!run.spawnQueue.length) return;
  run.spawnTimer += dt;
  while (run.spawnQueue.length && run.spawnTimer >= run.spawnQueue[0].delay) {
    const next = run.spawnQueue.shift();
    run.spawnTimer -= next.delay;
    if (next.enemies) {
      const { bosses, escorts } = next.enemies();
      run.enemies.push(...bosses, ...escorts);
      run.boss = { name: next.boss.name, list: bosses };
    } else {
      run.enemies.push(next.enemy());
    }
  }
}
