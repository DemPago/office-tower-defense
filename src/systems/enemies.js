// Nemici: movimento verso il palazzo, attacchi, cariche dei kamikaze, cure, boss infuriati.
import { TOWER } from '../state.js';
import { dist } from '../util.js';
import { floatText, burst, ring, shake, sfx } from './fx.js';
import { dealDamage, damageTower } from './damage.js';
import { blockingSegment, segmentToward, damageWall, reflectChance } from './wall.js';
import { WALL } from '../data/wall.js';

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
    const speed = e.speed * (e.slowT > 0 ? 1 - e.slowF : 1) * (e.charging ? e.charge.mult : 1);
    const nx = e.x + (TOWER.x - e.x) / d * speed * dt, ny = e.y + (TOWER.y - e.y) / d * speed * dt;
    // Muro: chi va a piedi si ferma a sfondarlo (il kamikaze ci esplode contro)
    const wallSeg = d > stopAt && e.range === 0 ? blockingSegment(run, e, nx, ny) : null;
    if (wallSeg) {
      e.moving = false;
      if (e.charge) {
        damageWall(run, wallSeg, e.atk * WALL.boomMult);
        explode(run, e, false);
        continue;
      }
      e.attackCd -= dt;
      if (e.attackCd <= 0) {
        e.attackCd = e.boss ? 1.3 : 1;
        damageWall(run, wallSeg, e.atk, e);
        e.lunge = 0.15;
      }
    } else if (d > stopAt) {
      e.x = nx;
      e.y = ny;
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
          // se tra lui e il palazzo c'è un tratto di muro in piedi, spara al muro (breccia)
          const seg = segmentToward(run, e);
          const target = seg && seg.hp > 0 ? seg : null;
          run.enemyShots.push({ x: e.x, y: e.y - e.size * 0.3, dmg: e.atk, speed: 210, sniper: e.role === 'sniper', seg: target, from: e });
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
// hitTower = false quando esplode contro il muro invece che contro il palazzo.
function explode(run, e, hitTower = true) {
  e.dead = true;
  if (hitTower) damageTower(run, e.atk);
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
    const goal = s.seg && s.seg.hp > 0 ? s.seg : TOWER;
    const d = dist(s, goal);
    if (d < (goal === TOWER ? TOWER.radius : 4)) {
      s.done = true;
      if (goal === TOWER) { damageTower(run, s.dmg); continue; }
      if (Math.random() < reflectChance(run) && s.from && !s.from.dead) {
        // lastre d'acciaio: il colpo torna indietro su chi l'ha sparato
        dealDamage(run, s.from, s.dmg * 3);
        burst(run, s.x, s.y, '#c0c4cc', 5, 70);
        continue;
      }
      damageWall(run, s.seg, s.dmg * (s.sniper ? WALL.sniperMult : 1));
      continue;
    }
    s.x += (goal.x - s.x) / d * s.speed * dt;
    s.y += (goal.y - s.y) / d * s.speed * dt;
  }
  run.enemyShots = run.enemyShots.filter(s => !s.done);
}
