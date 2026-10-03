// Spari: la torre (e i colleghi) scelgono i bersagli e lanciano colpi che inseguono il nemico.
import { TOWER } from '../state.js';
import { dist } from '../util.js';
import { burst, ring, sfx } from './fx.js';
import { MITRA } from './abilities.js';
import { dealDamage } from './damage.js';

// Punto da cui partono i colpi: il personaggio sul tetto della torre.
const MUZZLE = { x: TOWER.x + 7, y: TOWER.y - 75 };

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
