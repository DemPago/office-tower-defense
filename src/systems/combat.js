// Combattimento: movimento dei nemici, spari della torre, danni, morti.
import { TOWER } from '../state.js';
import { dist, fmt } from '../util.js';
import { floatText, burst, ring, shake } from './fx.js';

// Punto da cui partono i colpi: il personaggio sul tetto della torre.
const MUZZLE = { x: TOWER.x + 1, y: TOWER.y - 89 };

// ─── Nemici ─────────────────────────────────────────────────────

export function updateEnemies(run, dt) {
  for (const e of run.enemies) {
    if (e.dead) continue;
    e.age = (e.age || 0) + dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt);

    if (e.dotT > 0) {
      e.dotT -= dt;
      dealDamage(run, e, e.dotDps * dt, { silent: true });
      if (e.dead) continue;
    }
    if (e.slowT > 0) e.slowT -= dt;
    if (e.stunT > 0) { e.stunT -= dt; continue; }

    const d = dist(e, TOWER);
    const stopAt = e.range > 0 ? e.range : TOWER.radius + e.size * 0.4;
    if (d > stopAt) {
      const speed = e.speed * (e.slowT > 0 ? 1 - e.slowF : 1);
      e.x += (TOWER.x - e.x) / d * speed * dt;
      e.y += (TOWER.y - e.y) / d * speed * dt;
      e.anim += dt * (speed / 30);
      e.moving = true;
    } else {
      e.moving = false;
      e.attackCd -= dt;
      if (e.attackCd <= 0) {
        e.attackCd = e.boss ? 1.3 : 1;
        if (e.range > 0) {
          run.enemyShots.push({ x: e.x, y: e.y - e.size * 0.3, dmg: e.atk, speed: 160 });
        } else {
          damageTower(run, e.atk);
          e.lunge = 0.15;
        }
      }
    }
    if (e.lunge > 0) e.lunge -= dt;
  }
  run.enemies = run.enemies.filter(e => !e.dead);
}

export function updateEnemyShots(run, dt) {
  for (const s of run.enemyShots) {
    const d = dist(s, TOWER);
    if (d < TOWER.radius) {
      damageTower(run, s.dmg);
      s.done = true;
      continue;
    }
    s.x += (TOWER.x - s.x) / d * s.speed * dt;
    s.y += (TOWER.y - s.y) / d * s.speed * dt;
  }
  run.enemyShots = run.enemyShots.filter(s => !s.done);
}

function damageTower(run, amount) {
  if (run.phase === 'over') return;
  const t = run.tower;
  t.hp -= amount * (1 - run.stats.armor);
  t.hitFlash = 0.15;
  shake(run, 2);
  if (t.hp <= 0) {
    t.hp = 0;
    run.phase = 'over';
    shake(run, 10);
    burst(run, TOWER.x, TOWER.y - 30, '#f97316', 40, 140);
  }
}

// ─── Torre ──────────────────────────────────────────────────────

export function updateTower(run, dt) {
  const t = run.tower, s = run.stats;
  t.hitFlash = Math.max(0, t.hitFlash - dt);
  t.recoil = Math.max(0, (t.recoil || 0) - dt);
  t.hp = Math.min(s.maxHp, t.hp + s.regen * dt);
  t.cooldown -= dt;
  if (t.cooldown > 0) return;

  const targets = run.enemies
    .filter(e => dist(e, TOWER) <= s.range)
    .sort((a, b) => dist(a, TOWER) - dist(b, TOWER))
    .slice(0, s.multishot);
  if (!targets.length) return;

  t.cooldown = 1 / s.rate;
  t.recoil = 0.08;
  const effects = { slow: s.slow, dot: s.dot, aoeRadius: s.aoeRadius, aoeDmg: s.aoeDmg };
  for (const target of targets) {
    fire(run, MUZZLE.x, MUZZLE.y, target, {
      dmg: s.dmg, bounces: s.bounce, hitIds: new Set(), speed: s.shotSpeed, effects, kind: 'tower',
    });
  }
}

// Spara un colpo che insegue il bersaglio. opts: dmg, bounces, hitIds, speed, effects, kind
export function fire(run, x, y, target, opts) {
  const crit = Math.random() < run.stats.crit;
  run.shots.push({
    ...opts, x, y, target,
    baseDmg: opts.dmg,
    dmg: crit ? opts.dmg * run.stats.critMult : opts.dmg,
    crit,
  });
}

export function updateShots(run, dt) {
  for (const s of run.shots) {
    if (s.target.dead) {
      // Il bersaglio è già morto: il colpo cerca il nemico più vicino.
      s.target = nearest(run, s, e => !s.hitIds.has(e.id), 200);
      if (!s.target) { s.done = true; continue; }
    }
    const tx = s.target.x, ty = s.target.y - s.target.size * 0.35;
    const d = Math.hypot(tx - s.x, ty - s.y);
    const step = s.speed * dt;
    if (d <= step + 4) {
      s.done = true;
      onShotHit(run, s, s.target);
    } else {
      s.x += (tx - s.x) / d * step;
      s.y += (ty - s.y) / d * step;
    }
  }
  run.shots = run.shots.filter(s => !s.done);
}

function onShotHit(run, shot, e) {
  const fx = shot.effects;
  shot.hitIds.add(e.id);
  burst(run, shot.x, shot.y, '#ffd23f', 3, 50); // scintille d'impatto
  dealDamage(run, e, shot.dmg, { crit: shot.crit });
  if (fx.slow > 0) { e.slowT = 1.5; e.slowF = fx.slow * (e.boss ? 0.5 : 1); }
  if (fx.dot > 0) { e.dotT = 3; e.dotDps = shot.baseDmg * fx.dot / 3; }

  if (fx.aoeRadius > 0) {
    ring(run, e.x, e.y - e.size * 0.3, fx.aoeRadius, '#ff7b1c');
    burst(run, e.x, e.y - e.size * 0.3, '#ff7b1c', 8, 90);
    for (const o of run.enemies) {
      if (o !== e && !o.dead && dist(o, e) <= fx.aoeRadius) dealDamage(run, o, shot.dmg * fx.aoeDmg, { silent: true });
    }
  }
  if (shot.bounces > 0) {
    const next = nearest(run, e, o => o !== e && !shot.hitIds.has(o.id), 140);
    if (next) {
      fire(run, e.x, e.y - e.size * 0.35, next, {
        ...shot, dmg: shot.baseDmg * 0.75, bounces: shot.bounces - 1, done: false,
      });
    }
  }
}

function nearest(run, from, filter, maxDist) {
  let best = null, bestD = maxDist;
  for (const e of run.enemies) {
    if (e.dead || !filter(e)) continue;
    const d = dist(e, from);
    if (d < bestD) { best = e; bestD = d; }
  }
  return best;
}

// ─── Danni e morti ──────────────────────────────────────────────

export function dealDamage(run, e, amount, { crit = false, silent = false } = {}) {
  if (e.dead) return;
  const dmg = amount * (1 - e.armor);
  e.hp -= dmg;
  if (!silent) {
    e.hitFlash = 0.08;
    floatText(run, e.x + (Math.random() * 10 - 5), e.y - e.size * 0.8, fmt(Math.max(1, dmg)) + (crit ? '!' : ''), crit ? '#d7263d' : '#e8e2d0', crit ? 10 : 7);
  }
  if (e.hp <= 0) killEnemy(run, e);
}

function killEnemy(run, e) {
  e.dead = true;
  run.kills++;
  run.fx.corpses.push({ look: e.look, scale: e.scale, x: e.x, y: e.y, size: e.size, dir: e.x < TOWER.x ? -1 : 1, life: 0.6, max: 0.6 });
  const gold = Math.max(1, Math.round(e.gold * run.stats.goldMult));
  run.gold += gold;
  floatText(run, e.x, e.y - e.size, '+' + fmt(gold) + '💰', '#f2b705', 7);
  // fogli di carta e schizzi rossi
  burst(run, e.x, e.y - e.size * 0.3, '#e8e2d0', e.boss ? 24 : 6, e.boss ? 140 : 80);
  burst(run, e.x, e.y - e.size * 0.3, '#d7263d', e.boss ? 16 : 4, e.boss ? 120 : 60);
  if (run.stats.healOnKill) run.tower.hp = Math.min(run.stats.maxHp, run.tower.hp + run.stats.healOnKill);
  if (e.boss) {
    shake(run, 8);
    if (run.boss && run.boss.list.every(b => b.dead)) {
      run.bossesKilled++;
      run.boss = null;
    }
  }
}
