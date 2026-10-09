// Il "regista" della partita: fa avanzare tutti i sistemi di un passo
// e decide quando un'ondata finisce, quando scegliere le carte e quando si perde.
import { updateSpawns, startWave } from './waves.js';
import { updateEnemies, updateEnemyShots, updateTower, updateShots, updateFence } from './combat.js';
import { updateWall, repairWall, fullRepairWall } from './wall.js';
import { updateAbilities } from './abilities.js';
import { offerCards, offerHeavyMalus } from './cards.js';
import { isZombieWave } from '../data/enemies.js';
import { offerAllies, updateAllies, animateAllies, updateYard, restAllies } from './allies.js';
import { REINFORCE_EVERY } from '../data/allies.js';
import { updateFx, floatText } from './fx.js';
import { TOWER } from '../state.js';
import { UNLOCK_WAVE, unlockNextHero } from '../data/heroes.js';
import { banner } from './fx.js';
import { startBonusWave, endBonusWave } from './bonus.js';

export function update(run, dt) {
  updateFx(run, dt);
  animateAllies(run, dt);
  if (run.phase === 'over' || run.phase === 'cards' || run.phase === 'ally') return;
  run.time += dt;

  if (run.phase === 'break') {
    updateTower(run, dt); // la torre si rigenera anche in pausa
    updateAbilities(run, dt); // e il mana si ricarica
    run.breakTimer -= dt;
    if (run.breakTimer <= 0) startWave(run);
    return;
  }

  if (run.phase === 'bonus-break') {
    updateTower(run, dt);
    updateAbilities(run, dt);
    run.bonusBreakTimer -= dt;
    if (run.bonusBreakTimer <= 0) startBonusWave(run);
    return;
  }

  // phase === 'wave' | 'bonus-wave'
  updateSpawns(run, dt);
  updateEnemies(run, dt);
  updateEnemyShots(run, dt);
  updateTower(run, dt);
  updateAllies(run, dt);
  updateYard(run, dt);
  updateWall(run, dt);
  updateFence(run, dt);
  updateShots(run, dt);
  updateAbilities(run, dt);

  if (run.phase === 'bonus-wave' && !run.spawnQueue.length && !run.enemies.length) {
    endBonusWave(run);
  }

  if (run.phase === 'wave' && !run.spawnQueue.length && !run.enemies.length) {
    const bonus = 5 + run.wave * 2;
    run.gold += bonus;
    floatText(run, TOWER.x, TOWER.y - 90, `Ondata superata! +${bonus}💰`, '#7bd332', 9);
    run.enemyShots = [];
    run.shots = [];
    run.intruders = 0;
    restAllies(run);
    // Ogni 10 ondate (nuovo macro-stage) il muro torna integro, anche le brecce.
    if (run.wave % 10 === 0) {
      fullRepairWall(run);
      banner(run, `SETTORE ${run.wave / 10 + 1}`, 'Muro ripristinato — ma i nemici sono più forti', '#2de2e6');
    } else {
      repairWall(run); // solo i tratti ancora in piedi si riparano
    }
    // Completati tutti i livelli (i 6 reparti): si sblocca un nuovo personaggio.
    if (run.wave % UNLOCK_WAVE === 0) {
      const hero = unlockNextHero(run.meta);
      if (hero) {
        run.newHero = hero.id;
        banner(run, `NUOVO PERSONAGGIO: ${hero.name.toUpperCase()}!`, 'Lo trovi nel menu iniziale', '#ff3e8a');
      }
    }
    // Bonus stage dopo ogni boss: parte prima delle carte.
    if (run.bonusPending) {
      delete run.bonusPending;
      run.bonusStage = true;
      run.bonusWaveIdx = 0;
      run.phase = 'bonus-break';
      run.bonusBreakTimer = 1.5;
      banner(run, 'BONUS STAGE!', 'Un assalto sushi sta per iniziare...', '#ff9f1c');
      return;
    }
    // Ogni tot ondate arrivano i rinforzi; ondate zombie → 3 malus pesanti; altrimenti carta normale.
    if (run.wave % REINFORCE_EVERY === 0) offerAllies(run);
    else if (isZombieWave(run.wave)) offerHeavyMalus(run);
    else offerCards(run);
  }
}

// Buoni pasto guadagnati a fine partita (valuta permanente).
export function runReward(run) {
  const cleared = Math.max(0, run.wave - 1);
  return Math.floor(cleared ** 1.25) + run.bossesKilled * 10;
}
