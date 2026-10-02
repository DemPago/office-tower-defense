// Il "regista" della partita: fa avanzare tutti i sistemi di un passo
// e decide quando un'ondata finisce, quando scegliere le carte e quando si perde.
import { updateSpawns, startWave } from './waves.js';
import { updateEnemies, updateEnemyShots, updateTower, updateShots } from './combat.js';
import { updateAbilities } from './abilities.js';
import { offerCards } from './cards.js';
import { offerAllies, updateAllies } from './allies.js';
import { REINFORCE_EVERY } from '../data/allies.js';
import { updateFx, floatText } from './fx.js';
import { TOWER } from '../state.js';

export function update(run, dt) {
  updateFx(run, dt);
  if (run.phase === 'over' || run.phase === 'cards' || run.phase === 'ally') return;
  run.time += dt;

  if (run.phase === 'break') {
    updateTower(run, dt); // la torre si rigenera anche in pausa
    run.breakTimer -= dt;
    if (run.breakTimer <= 0) startWave(run);
    return;
  }

  // phase === 'wave'
  updateSpawns(run, dt);
  updateEnemies(run, dt);
  updateEnemyShots(run, dt);
  updateTower(run, dt);
  updateAllies(run, dt);
  updateShots(run, dt);
  updateAbilities(run, dt);

  if (run.phase === 'wave' && !run.spawnQueue.length && !run.enemies.length) {
    const bonus = 5 + run.wave * 2;
    run.gold += bonus;
    floatText(run, TOWER.x, TOWER.y - 90, `Ondata superata! +${bonus}💰`, '#7bd332', 9);
    run.enemyShots = [];
    run.shots = [];
    // Ogni tot ondate arrivano i rinforzi, poi si sceglie comunque la carta.
    if (run.wave % REINFORCE_EVERY === 0) offerAllies(run);
    else offerCards(run);
  }
}

// Buoni pasto guadagnati a fine partita (valuta permanente).
export function runReward(run) {
  const cleared = Math.max(0, run.wave - 1);
  return Math.floor(cleared ** 1.25) + run.bossesKilled * 10;
}
