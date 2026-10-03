// Rinforzi: scelta del collega e i loro spari.
import { ALLIES, ALLY_LEVELS, ALLY_LEVEL_MULT, ALLY_SLOTS, ALLY_RING, allyArc } from '../data/allies.js';
import { TOWER } from '../state.js';
import { dist } from '../util.js';
import { fire } from './combat.js';
import { offerCards } from './cards.js';
import { refreshStats } from './economy.js';
import { banner, ring, sfx } from './fx.js';
import { angleOf, inArc } from '../util.js';

// Velocità dei colpi: abbastanza lente da vederli partire dalla postazione.
const SHOT_SPEED = { laser: 650, bolt: 360, pc: 230 };
const AURA_COLOR = { rate: '#2de2e6', dmg: '#ff3e8a' };

export function allyDef(id) {
  return ALLIES.find(a => a.id === id);
}

export function allyPos(ally) {
  const a = ALLY_SLOTS[ally.slot] * Math.PI / 180;
  return { x: TOWER.x + Math.cos(a) * ALLY_RING, y: TOWER.y - Math.sin(a) * ALLY_RING };
}

// Il collega spara solo ai nemici dentro il suo spicchio (visto dal centro della torre).
export function allyCovers(ally, enemy) {
  return inArc(angleOf(TOWER, enemy), ALLY_SLOTS[ally.slot], allyArc(ally.level));
}

export function offerAllies(run) {
  let pool = ALLIES.filter(def => {
    const have = run.allies.find(a => a.id === def.id);
    return !have || have.level < ALLY_LEVELS.length;
  });
  if (!pool.length) { offerCards(run); return; } // tutti al massimo
  const picked = [];
  while (picked.length < 3 && pool.length) {
    const def = pool[Math.floor(Math.random() * pool.length)];
    picked.push(def);
    pool = pool.filter(d => d !== def);
  }
  run.allyChoices = picked;
  run.phase = 'ally';
}

export function pickAlly(run, meta, index) {
  const def = run.allyChoices?.[index];
  if (run.phase !== 'ally' || !def) return false;
  const have = run.allies.find(a => a.id === def.id);
  if (have) {
    have.level++;
  } else {
    run.allies.push({ id: def.id, level: 1, slot: run.allies.length, cooldown: 0, recoil: 0, spawn: 0 });
  }
  const lv = (have ? have.level : 1) - 1;
  banner(run, `${def.icon} ${def.name.toUpperCase()}`, have ? `Promosso a ${ALLY_LEVELS[lv]}!` : 'si unisce alla difesa!', '#ffd23f');
  run.allyChoices = null;
  sfx(run, 'pick');
  refreshStats(run, meta);
  offerCards(run);
  return true;
}

export function updateAllies(run, dt) {
  for (const ally of run.allies) {
    ally.spawn = Math.min(1, ally.spawn + dt * 2);
    ally.recoil = Math.max(0, ally.recoil - dt);
    const def = allyDef(ally.id);
    if (def.aura) {
      // I maghi "lanciano" il loro bonus sul palazzo ogni tanto, così si vede che lavorano.
      ally.pulse = (ally.pulse || 0) - dt;
      if (ally.pulse <= 0) {
        ally.pulse = 3;
        const pos = allyPos(ally);
        ring(run, pos.x, pos.y - 12, 22, AURA_COLOR[def.aura]);
        ring(run, TOWER.x, TOWER.y - 40, 46, AURA_COLOR[def.aura]);
      }
      continue;
    }
    ally.cooldown -= dt;
    if (ally.cooldown > 0) continue;

    const pos = allyPos(ally);
    let target = null, best = def.range;
    for (const e of run.enemies) {
      const d = dist(e, pos);
      if (!e.dead && d < best && allyCovers(ally, e)) { target = e; best = d; }
    }
    if (!target) continue;

    ally.cooldown = 1 / (def.rate * run.stats.allyRateMult);
    ally.recoil = 0.1;
    sfx(run, 'ally');
    fire(run, pos.x, pos.y - 20, target, {
      dmg: run.stats.dmg * def.dmg * ALLY_LEVEL_MULT[ally.level - 1],
      bounces: 0,
      hitIds: new Set(),
      speed: SHOT_SPEED[def.kind],
      effects: { slow: def.slow || 0, dot: 0, aoeRadius: def.aoe || 0, aoeDmg: def.aoe ? 0.7 : 0 },
      kind: def.kind,
    });
  }
}
