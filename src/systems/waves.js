// Ondate: quanti nemici, quali, quanto sono forti e da dove arrivano.
import { ENEMIES } from '../data/enemies.js';
import { bossForWave } from '../data/bosses.js';
import { TOWER } from '../state.js';
import { banner } from './fx.js';

// Quanto crescono i nemici rispetto all'ondata 1.
// Dopo l'ondata 25 si aggiunge una crescita esponenziale, così prima o poi si perde sempre.
export function hpScale(w)   { return (1 + 0.15 * (w - 1) + 0.03 * (w - 1) ** 2) * 1.05 ** Math.max(0, w - 25); }
export function atkScale(w)  { return (1 + 0.10 * (w - 1) + 0.008 * (w - 1) ** 2) * 1.03 ** Math.max(0, w - 25); }
export function goldScale(w) { return 1 + 0.06 * (w - 1); }

function enemyCount(w) {
  return Math.min(60, 5 + Math.floor(w * 1.2));
}

// Sceglie un tipo di nemico: i tipi appena sbloccati escono un po' più spesso.
function pickEnemy(w) {
  const pool = ENEMIES.filter(e => e.from <= w);
  const weights = pool.map((e, i) => 1 + i * 0.5);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    if ((r -= weights[i]) <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// Punto di partenza casuale su un arco sopra e ai lati della torre, fuori schermo.
function spawnPoint() {
  const a = Math.PI * (1.08 + Math.random() * 0.84);
  return { x: TOWER.x + Math.cos(a) * 240, y: TOWER.y + Math.sin(a) * 500 };
}

function makeEnemy(def, w, extra = {}) {
  const p = spawnPoint();
  const hp = def.hp * hpScale(w);
  return {
    id: Math.random(),
    def,
    name: def.name,
    look: def.look,
    scale: 1,
    x: p.x, y: p.y,
    hp, maxHp: hp,
    speed: def.speed * (0.9 + Math.random() * 0.2),
    atk: def.atk * atkScale(w),
    range: def.range,
    armor: def.armor || 0,
    gold: def.gold * goldScale(w),
    size: def.size,
    attackCd: 1,
    slowT: 0, slowF: 0, stunT: 0, dotT: 0, dotDps: 0,
    hitFlash: 0, anim: Math.random(),
    boss: false,
    ...extra,
  };
}

function makeBoss(b, w) {
  const base = ENEMIES[0];
  const group = b.group || 1;
  const list = [];
  for (let i = 0; i < group; i++) {
    const hp = base.hp * hpScale(w) * b.hpFactor / group;
    list.push(makeEnemy(base, w, {
      name: b.name, look: b.look, boss: true,
      scale: group > 4 ? 1 : 2,
      hp, maxHp: hp,
      speed: b.speed,
      atk: base.atk * atkScale(w) * b.atkFactor,
      gold: 30 * goldScale(w) / group,
      size: group > 4 ? 28 : 56,
    }));
  }
  return list;
}

export function startWave(run) {
  run.wave++;
  const w = run.wave;
  const queue = [];
  const boss = bossForWave(w);
  const n = boss ? Math.ceil(enemyCount(w) / 2) : enemyCount(w);
  // Intervallo fra un nemico e l'altro: si accorcia con le ondate.
  const gap = Math.max(0.25, 1.1 - w * 0.02);
  for (let i = 0; i < n; i++) queue.push({ delay: i === 0 ? 0.3 : gap * (0.6 + Math.random() * 0.8), enemy: () => makeEnemy(pickEnemy(w), w) });
  if (boss) {
    queue.splice(Math.floor(n / 3), 0, { delay: 1.5, enemies: () => makeBoss(boss, w), boss });
  }
  run.spawnQueue = queue;
  run.spawnTimer = 0;
  run.phase = 'wave';
  if (boss) banner(run, boss.name, boss.sub, '#d7263d');
  else banner(run, `ONDATA ${w}`, `${n} nemici in arrivo`);
}

export function updateSpawns(run, dt) {
  if (!run.spawnQueue.length) return;
  run.spawnTimer += dt;
  while (run.spawnQueue.length && run.spawnTimer >= run.spawnQueue[0].delay) {
    const next = run.spawnQueue.shift();
    run.spawnTimer -= next.delay;
    if (next.enemies) {
      const bosses = next.enemies();
      run.enemies.push(...bosses);
      run.boss = { name: next.boss.name, list: bosses };
    } else {
      run.enemies.push(next.enemy());
    }
  }
}
