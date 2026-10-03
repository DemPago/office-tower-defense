// Danni e morti: danni ai nemici e alla torre, morte dei nemici e trasformazione dei boss.
import { TOWER, SPAWN_RADIUS } from '../state.js';
import { fmt } from '../util.js';
import { floatText, burst, ring, shake, sfx, banner } from './fx.js';
import { makeEnemy } from './waves.js';
import { ENEMIES } from '../data/enemies.js';
import { ANIMALS } from '../data/animals.js';

export function dealDamage(run, e, amount, { crit = false, silent = false, color = null } = {}) {
  if (e.dead) return;
  const dmg = amount * (1 - e.armor);
  const before = e.hp;
  e.hp -= dmg;
  if (e.zombie && !silent) zombieGore(run, e, before);
  if (!silent) {
    e.hitFlash = 0.08;
    floatText(run, e.x + (Math.random() * 10 - 5), e.y - e.size * 0.8, fmt(Math.max(1, dmg)) + (crit ? '!' : ''), crit ? '#d7263d' : color || '#e8e2d0', crit ? 10 : 7);
  }
  if (e.hp <= 0) killEnemy(run, e);
}

// Zombie colpito: schizzi verdi e rossi; quando perde un pezzo (braccio, testa…) ne vola via uno grosso.
function zombieGore(run, e, hpBefore) {
  const stage = hp => Math.floor((1 - Math.max(0, hp) / e.maxHp) * 4);
  burst(run, e.x, e.y - e.size * 0.5, '#8aa070', 3, 60);
  burst(run, e.x, e.y - e.size * 0.5, '#7a0f1c', 2, 50);
  if (e.hp > 0 && stage(e.hp) > stage(hpBefore)) {
    burst(run, e.x, e.y - e.size * 0.55, '#8aa070', 10, 110);
    burst(run, e.x, e.y - e.size * 0.55, '#d9d4c7', 4, 90);
    burst(run, e.x, e.y - e.size * 0.55, '#a01828', 8, 100);
    floatText(run, e.x, e.y - e.size - 8, ['SPLAT!', 'CRACK!', 'SQUISH!'][stage(e.hp) - 1] || 'SPLAT!', '#7bd332', 8);
  }
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
  burst(run, e.x, e.y - 20, '#ffffff', 30, 160);
  ring(run, e.x, e.y - 15, 60, '#ffffff');
  floatText(run, e.x, e.y - 50, 'FORMA BESTIALE!', '#ff3e8a', 11);
  // sparisce nel lampo e rientra dal bordo, dal lato opposto
  const a = Math.atan2(e.y - TOWER.y, e.x - TOWER.x) + Math.PI + (Math.random() - 0.5);
  e.x = TOWER.x + Math.cos(a) * SPAWN_RADIUS;
  e.y = TOWER.y + Math.sin(a) * SPAWN_RADIUS;
  e.age = 0;
  e.moving = true;
  // il power-up: si annuncia in grande, con la sirena
  banner(run, "È INIZIATA LA REPERIBILITÀ!", 'Il mitra è pronto: premi 💥 MITRA o il tasto 5', '#f2b705');
  run.fx.banner.life = run.fx.banner.max = 4;
  sfx(run, 'siren');
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
  if (run.stats.manaOnKill) run.mana += run.stats.manaOnKill; // il massimo lo applica updateAbilities
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

export function damageTower(run, amount) {
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
