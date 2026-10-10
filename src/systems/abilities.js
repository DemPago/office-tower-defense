// Poteri attivi (vedi data/abilities.js per nomi e ricariche).
import { ABILITIES, maxMana } from '../data/abilities.js';
import { dealDamage, fire } from './combat.js';
import { MUZZLE } from './shooting.js';
import { banner, burst, shake, sfx } from './fx.js';
import { TOWER } from '../state.js';
import { dist } from '../util.js';

const EFFECTS = {
  bomb(run) {
    for (const e of [...run.enemies]) {
      dealDamage(run, e, run.stats.dmg * 12);
      burst(run, e.x, e.y - e.size * 0.3, '#f97316', 8, 90);
    }
    shake(run, 7);
  },
  coffee(run) {
    for (const e of run.enemies) { e.slowT = 5; e.slowF = 0.6; }
  },
  meeting(run) {
    for (const e of run.enemies) e.stunT = e.boss ? 1.2 : 3;
  },
  audit(run) {
    for (const e of run.enemies) {
      const loss = e.hp * (e.boss ? 0.15 : 0.5);
      dealDamage(run, e, loss / (1 - e.armor)); // ignora l'armatura
    }
  },
  sniper(run) {
    const target = run.enemies
      .filter(e => !e.dead && dist(e, TOWER) > run.stats.range)
      .sort((a, b) => dist(a, TOWER) - dist(b, TOWER))[0];
    if (!target) return;
    fire(run, MUZZLE.x, MUZZLE.y, target, {
      dmg: run.stats.dmg * 5,
      bounces: 0,
      hitIds: new Set(),
      speed: run.stats.shotSpeed * 2.5,
      effects: {},
      kind: 'sniper',
    });
    run.fx.beams.push({ x1: MUZZLE.x, y1: MUZZLE.y, x2: target.x, y2: target.y - target.size * 0.35, life: 0.08, crit: true });
    burst(run, target.x, target.y - target.size * 0.3, '#ffffff', 4, 80);
  },
};

export function manaCost(run, id) {
  return Math.round(ABILITIES.find(a => a.id === id).mana * run.stats.manaMult);
}

export function canUse(run, id) {
  if (run.phase !== 'wave' || run.abilityCd[id] > 0 || run.mana < manaCost(run, id)) return false;
  if (id === 'sniper') return run.enemies.some(e => !e.dead && dist(e, TOWER) > run.stats.range);
  return run.enemies.length > 0;
}

export function useAbility(run, id) {
  if (!canUse(run, id)) return false;
  const def = ABILITIES.find(a => a.id === id);
  run.mana -= manaCost(run, id);
  EFFECTS[id](run);
  sfx(run, id);
  run.abilityCd[id] = def.cd;
  banner(run, `${def.icon} ${def.name.toUpperCase()}`, '', '#2de2e6');
  run.fx.banner.life = run.fx.banner.max = 1.2;
  return true;
}

// Ricarica del mana e della piccola pausa dopo l'uso.
export function updateAbilities(run, dt) {
  run.mana = Math.min(maxMana(run), run.mana + run.stats.manaRegen * dt);
  for (const id in run.abilityCd) run.abilityCd[id] = Math.max(0, run.abilityCd[id] - dt);
}
