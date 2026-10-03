// Poteri attivi (vedi data/abilities.js per nomi e ricariche).
import { ABILITIES } from '../data/abilities.js';
import { dealDamage } from './combat.js';
import { banner, burst, shake, sfx } from './fx.js';

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
};

export function canUse(run, id) {
  return run.phase === 'wave' && run.abilityCd[id] <= 0 && run.enemies.length > 0;
}

export function useAbility(run, id) {
  if (!canUse(run, id)) return false;
  const def = ABILITIES.find(a => a.id === id);
  EFFECTS[id](run);
  sfx(run, id);
  run.abilityCd[id] = def.cd * run.stats.cdMult;
  banner(run, `${def.icon} ${def.name.toUpperCase()}`, '', '#2de2e6');
  run.fx.banner.life = run.fx.banner.max = 1.2;
  return true;
}

export function updateAbilities(run, dt) {
  for (const id in run.abilityCd) run.abilityCd[id] = Math.max(0, run.abilityCd[id] - dt);
}
