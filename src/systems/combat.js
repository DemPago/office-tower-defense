// Combattimento: movimento dei nemici, spari della torre, danni, morti.
import { TOWER } from '../state.js';
import { dist, fmt, angleOf } from '../util.js';
import { floatText, burst, ring, shake, sfx } from './fx.js';
import { MITRA } from './abilities.js';
import { makeEnemy } from './waves.js';
import { ENEMIES } from '../data/enemies.js';
import { ANIMALS } from '../data/animals.js';

// Punto da cui partono i colpi: il personaggio sul tetto della torre.
const MUZZLE = { x: TOWER.x + 7, y: TOWER.y - 75 };

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
    if (e.boss) bossMood(run, e);
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    if (e.def.heal) healNearby(run, e, dt);

    const d = dist(e, TOWER);
    const stopAt = e.range > 0 ? e.range : TOWER.radius + e.size * 0.4;
    // Kamikaze: vicino alla torre parte la carica
    if (e.charge && !e.charging && d < e.charge.dist) {
      e.charging = true;
      floatText(run, e.x, e.y - e.size - 6, 'CARICA!', '#ff7b1c', 8);
      sfx(run, 'charge');
    }
    if (d > stopAt) {
      const speed = e.speed * (e.slowT > 0 ? 1 - e.slowF : 1) * (e.charging ? e.charge.mult : 1);
      e.x += (TOWER.x - e.x) / d * speed * dt;
      e.y += (TOWER.y - e.y) / d * speed * dt;
      e.anim += dt * (speed / 30);
      e.moving = true;
    } else if (e.charge) {
      explode(run, e);
      continue;
    } else {
      e.moving = false;
      e.attackCd -= dt;
      if (e.attackCd <= 0) {
        e.attackCd = e.boss ? 1.3 : e.shotCd;
        if (e.range > 0) {
          run.enemyShots.push({ x: e.x, y: e.y - e.size * 0.3, dmg: e.atk, speed: 210, sniper: e.role === 'sniper' });
          e.lunge = 0.12;
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

// Boss: passi pesanti che fanno tremare il terreno e rabbia a metà vita.
function bossMood(run, e) {
  const step = Math.floor(e.anim * 2.5) % 4;
  if (e.moving && step !== e.lastStep && step % 2 === 0) {
    shake(run, e.scale >= 3 ? 1.6 : 0.8);
    burst(run, e.x + (step ? 6 : -6), e.y, '#8a8d93', 4, 40); // polvere
  }
  e.lastStep = step;
  if (!e.enraged && e.hp < e.maxHp * 0.5) {
    e.enraged = true;
    e.speed *= 1.3;
    floatText(run, e.x, e.y - e.size - 12, 'INFURIATO!', '#d7263d', 11);
    shake(run, 6);
    sfx(run, 'enrage');
  }
}

// Il kamikaze arriva alla torre ed esplode: danno enorme, ma muore (senza lasciare oro).
function explode(run, e) {
  e.dead = true;
  damageTower(run, e.atk);
  burst(run, e.x, e.y - 10, '#ff7b1c', 18, 140);
  burst(run, e.x, e.y - 10, '#f2b705', 10, 100);
  ring(run, e.x, e.y - 8, 34, '#ff7b1c');
  floatText(run, e.x, e.y - e.size - 8, 'BOOM!', '#ff7b1c', 11);
  shake(run, 6);
  sfx(run, 'boom');
}

// Chi cura (HR, DevOps, Portavoce) cura i colleghi vicini ogni 3 secondi.
function healNearby(run, healer, dt) {
  healer.healCd -= dt;
  if (healer.healCd > 0) return;
  healer.healCd = 3;
  let healed = false;
  for (const o of run.enemies) {
    if (o.dead || o.boss || o.hp >= o.maxHp || dist(o, healer) > 60) continue;
    o.hp = Math.min(o.maxHp, o.hp + o.maxHp * healer.def.heal);
    healed = true;
  }
  if (healed) {
    ring(run, healer.x, healer.y - 10, 60, '#7bd332');
    floatText(run, healer.x, healer.y - healer.size - 6, '+', '#7bd332', 10);
  }
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
  sfx(run, 'hurt');
  if (t.hp <= 0) {
    t.hp = 0;
    run.phase = 'over';
    shake(run, 10);
    sfx(run, 'over');
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

  const targets = pickTargets(run.enemies, TOWER, s.range, s.multishot);
  if (!targets.length) return;

  const mitra = run.mitraT > 0;
  t.cooldown = 1 / (s.rate * (mitra ? MITRA.rateMult : 1));
  t.recoil = 0.08;
  sfx(run, mitra ? 'mitra' : 'shoot');
  const effects = { slow: s.slow, dot: s.dot, aoeRadius: s.aoeRadius, aoeDmg: s.aoeDmg };
  for (const target of targets) {
    fire(run, MUZZLE.x, MUZZLE.y, target, {
      dmg: s.dmg, bounces: s.bounce, hitIds: new Set(), speed: s.shotSpeed, effects, kind: 'tower',
    });
  }
}

// Sceglie i bersagli: prima i tank (attirano i colpi), poi i più vicini.
export function pickTargets(enemies, from, range, count, filter = () => true) {
  return enemies
    .filter(e => !e.dead && dist(e, from) <= range && filter(e))
    .sort((a, b) => (b.taunt - a.taunt) || (dist(a, from) - dist(b, from)))
    .slice(0, count);
}

// Spara un colpo che insegue il bersaglio. opts: dmg, bounces, hitIds, speed, effects, kind
export function fire(run, x, y, target, opts) {
  const crit = Math.random() < run.stats.crit;
  run.shots.push({
    ...opts, x, y, target, ox: x, oy: y,
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
  // i numeri dei colleghi sono azzurri, quelli del palazzo chiari
  dealDamage(run, e, shot.dmg, { crit: shot.crit, color: shot.kind === 'tower' ? null : '#2de2e6' });
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

// ─── Recinto elettrico ──────────────────────────────────────────
// Fulmina i nemici vicini alla torre, solo nei quarti di cerchio già costruiti:
// liv.1 = 0-90°, liv.2 = fino a 180°, liv.3 = fino a 270°, liv.4 = tutto il giro.
export const FENCE = { inner: 28, outer: 62 };

export function updateFence(run, dt) {
  const q = run.stats.fence;
  if (!q) return;
  const dps = run.stats.dmg * 1.2;
  for (const e of run.enemies) {
    if (e.dead) continue;
    const d = dist(e, TOWER);
    if (d < FENCE.inner || d > FENCE.outer) continue;
    if (Math.floor(angleOf(TOWER, e) / 90) >= q) continue;
    dealDamage(run, e, dps * dt, { silent: true });
    if (Math.random() < dt * 6) burst(run, e.x, e.y - 8, '#2de2e6', 3, 60);
  }
}

// ─── Danni e morti ──────────────────────────────────────────────

export function dealDamage(run, e, amount, { crit = false, silent = false, color = null } = {}) {
  if (e.dead) return;
  const dmg = amount * (1 - e.armor);
  e.hp -= dmg;
  if (!silent) {
    e.hitFlash = 0.08;
    floatText(run, e.x + (Math.random() * 10 - 5), e.y - e.size * 0.8, fmt(Math.max(1, dmg)) + (crit ? '!' : ''), crit ? '#d7263d' : color || '#e8e2d0', crit ? 10 : 7);
  }
  if (e.hp <= 0) killEnemy(run, e);
}

// Il boss a vita finita non muore: lampo bianco e torna come il suo animale GIGANTE.
function transformBoss(run, e) {
  const A = ANIMALS[e.animalId];
  e.beast = true;
  e.animal = e.animalId;
  e.maxHp *= 0.8;
  e.hp = e.maxHp;
  e.scale *= 1.4;
  e.size = 18 * e.scale;
  e.speed = A.speed * 0.45;
  e.atk *= 1.3;
  e.enraged = false;
  e.slowT = e.stunT = e.dotT = 0;
  e.name = `${A.name} GIGANTE`;
  if (run.boss && run.boss.list.includes(e)) run.boss.name = `${e.bossName}: ${A.name} GIGANTE`;
  run.fx.flash = 1;
  shake(run, 14);
  burst(run, e.x, e.y - e.size * 0.4, '#ffffff', 30, 160);
  ring(run, e.x, e.y - e.size * 0.3, e.size, '#ffffff');
  floatText(run, e.x, e.y - e.size - 12, 'FORMA BESTIALE!', '#ff3e8a', 11);
  floatText(run, TOWER.x, TOWER.y - 110, 'USA IL MITRA! (tasto 5)', '#f2b705', 9);
  run.mitraReady = true;
  sfx(run, 'transform');
}

function killEnemy(run, e) {
  if (e.boss && e.animalId && !e.beast) { transformBoss(run, e); return; }
  e.dead = true;
  run.kills++;
  sfx(run, e.boss ? 'bossdown' : 'kill');
  run.fx.corpses.push({ look: e.look, animal: e.animal, scale: e.scale, x: e.x, y: e.y, size: e.size, dir: e.x < TOWER.x ? -1 : 1, life: 0.6, max: 0.6 });
  const gold = Math.max(1, Math.round(e.gold * run.stats.goldMult));
  run.gold += gold;
  floatText(run, e.x, e.y - e.size, '+' + fmt(gold) + '💰', '#f2b705', 7);
  // fogli di carta e schizzi rossi
  burst(run, e.x, e.y - e.size * 0.3, '#e8e2d0', e.boss ? 24 : 6, e.boss ? 140 : 80);
  burst(run, e.x, e.y - e.size * 0.3, '#d7263d', e.boss ? 16 : 4, e.boss ? 120 : 60);
  if (run.stats.healOnKill) run.tower.hp = Math.min(run.stats.maxHp, run.tower.hp + run.stats.healOnKill);
  // Capo vendite e vicedirettore: quando cadono, delegano a due sottoposti.
  if (e.def.split) {
    for (const dx of [-8, 8]) {
      run.enemies.push(makeEnemy(ENEMIES[e.def.split], run.wave, { x: e.x + dx, y: e.y, age: 0.4 }));
    }
    floatText(run, e.x, e.y - e.size - 10, 'DELEGA!', '#ff3e8a', 8);
    sfx(run, 'split');
  }
  if (e.boss) {
    shake(run, 8);
    if (run.boss && run.boss.list.every(b => b.dead)) {
      run.bossesKilled++;
      run.boss = null;
    }
  }
}
