// Poteri attivi (vedi data/abilities.js per nomi e ricariche).
import { ABILITIES, MANA } from '../data/abilities.js';
import { dealDamage } from './combat.js';
import { banner, burst, shake, sfx } from './fx.js';

const EFFECTS = {
  mitra(run) {
    run.mitraReady = false;
    run.mitraT = MITRA.time;
  },
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

export function manaCost(run, id) {
  return Math.round(ABILITIES.find(a => a.id === id).mana * run.stats.manaMult);
}

export const MITRA = { time: 12, rateMult: 4 };

export function canUse(run, id) {
  if (id === 'mitra') return run.phase === 'wave' && !!run.mitraReady;
  return run.phase === 'wave' && run.abilityCd[id] <= 0 && run.enemies.length > 0 && run.mana >= manaCost(run, id);
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
  run.mana = Math.min(MANA.max, run.mana + MANA.regen * dt);
  run.mitraT = Math.max(0, (run.mitraT || 0) - dt);
  // se la bestia muore prima di usarlo, il mitra non serve più
  if (run.mitraReady && !run.enemies.some(e => e.beast)) run.mitraReady = false;
  for (const id in run.abilityCd) run.abilityCd[id] = Math.max(0, run.abilityCd[id] - dt);
}
