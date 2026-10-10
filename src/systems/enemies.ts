// Nemici: movimento verso il palazzo, attacchi, cariche dei kamikaze, cure, boss infuriati.
import { TOWER } from '../state.js';
import { dist } from '../util.js';
import { floatText, burst, ring, shake, sfx, banner } from './fx.js';
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
    if (e.charmT > 0) { e.charmT -= dt; e.moving = false; continue; } // innamorato (cuori): fermo
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
      // Boss: al primo contatto col muro si rigenera completamente
      if (e.boss && !e.wallTouching) {
        e.hp = e.maxHp;
        e.wallTouching = true;
        e.hitFlash = 0.3;
        ring(run, e.x, e.y, 50, '#ff4488');
        floatText(run, e.x, e.y - 50, '♻ REGEN!', '#ff4488', 10);
      }
      if (e.charge) {
        damageWall(run, wallSeg, e.atk * WALL.boomMult);
        explode(run, e, false);
        continue;
      }
      e.attackCd -= dt;
      if (e.attackCd <= 0) {
        e.attackCd = e.boss ? 1.3 : 1;
        // Il boss sfonda il tratto di muro in un colpo solo
        damageWall(run, wallSeg, e.boss ? wallSeg.maxHp * 2 : e.atk, e);
        e.lunge = 0.15;
      }
    } else if (d > stopAt) {
      if (e.boss) e.wallTouching = false; // reset quando si allontana dal muro
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
        e.attackCd = e.shotCd || (e.boss ? 1.3 : 1);
        if (e.range > 0) {
          // se tra lui e il palazzo c'è un tratto di muro in piedi, spara al muro (breccia)
          const seg = segmentToward(run, e);
          const target = seg && seg.hp > 0 ? seg : null;
          if (e.weaponBeam) {
            // laser: colpo istantaneo — non ha proiettile, danneggia subito
            if (target) damageWall(run, target, e.atk * (e.weaponPierce ? 1 : 1) * 1.5, e);
            else damageTower(run, e.atk * 1.5);
            ring(run, e.x, e.y - e.size * 0.5, 22, '#2de2e6');
          } else {
            run.enemyShots.push({ x: e.x, y: e.y - e.size * 0.3, dmg: e.atk, speed: 210,
              sniper: e.role === 'sniper' || e.weaponType === 'fucile',
              pierce: e.weaponPierce,
              slow: e.weaponSlow,
              seg: target, from: e });
          }
          e.lunge = 0.12;
        } else {
          damageTower(run, e.atk);
          if (e.weaponAoe) aoeWallHit(run, e); // palla ferrata: splash
          e.lunge = 0.15;
        }
      }
    }
    if (e.lunge > 0) e.lunge -= dt;
  }
  run.enemies = run.enemies.filter(e => !e.dead);
}

// Palla ferrata: su ogni colpo al palazzo distrugge anche i muri vicini (splash).
function aoeWallHit(run, e) {
  let hit = false;
  for (const seg of run.wall) {
    if (seg.hp > 0 && dist(seg, e) < 55) {
      damageWall(run, seg, e.atk * 0.6, e);
      hit = true;
    }
  }
  if (hit) {
    burst(run, e.x, e.y, '#8a3b1e', 8, 70);
    ring(run, e.x, e.y - 10, 42, '#a67c00');
  }
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
      if (goal === TOWER) {
        damageTower(run, s.dmg);
        if (s.slow) run.slowTowerT = (run.slowTowerT || 0) + 2.5; // fiocina: rallenta attacchi torre
        continue;
      }
      if (Math.random() < reflectChance(run) && s.from && !s.from.dead) {
        // lastre d'acciaio: il colpo torna indietro su chi l'ha sparato
        dealDamage(run, s.from, s.dmg * 3);
        burst(run, s.x, s.y, '#c0c4cc', 5, 70);
        continue;
      }
      // balestra (pierce): ignora l'armor del tratto di muro
      const wallDmg = s.sniper ? WALL.sniperMult : 1;
      if (s.pierce) {
        const seg = s.seg;
        seg.hp -= s.dmg * wallDmg;
        if (seg.hp <= 0) { seg.hp = 0; burst(run, seg.x, seg.y, '#c0c4cc', 6, 80); }
      } else {
        damageWall(run, s.seg, s.dmg * wallDmg);
      }
      continue;
    }
    s.x += (goal.x - s.x) / d * s.speed * dt;
    s.y += (goal.y - s.y) / d * s.speed * dt;
  }
  run.enemyShots = run.enemyShots.filter(s => !s.done);
}
