// Bonus stage: ondate di sushi dopo ogni boss. Usa lo stesso spawnQueue delle ondate normali.
import { BONUS_WAVES, BONUS_GOLD, SUSHI_TYPES } from '../data/sushi.js';
import { TOWER, SPAWN_RADIUS } from '../state.js';
import { banner, sfx, floatText } from './fx.js';
import { offerCards } from './cards.js';
import { hpScale } from './waves.js';
import type { Run } from '../types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSushi(type: any, wave: number) {
  const a = Math.random() * Math.PI * 2;
  const r = SPAWN_RADIUS * (0.65 + Math.random() * 0.35);
  const hp = Math.round(type.hp * hpScale(wave));
  return {
    id: Math.random(),
    def: {},
    name: type.name,
    sushi: true,
    sushiType: type.id,
    look: null,
    scale: 1,
    x: TOWER.x + Math.cos(a) * r,
    y: TOWER.y + Math.sin(a) * r,
    hp,
    maxHp: hp,
    speed: type.speed,
    elite: false,
    zombie: false,
    role: null,
    taunt: false,
    charge: null,
    charging: false,
    shotCd: 0,
    healCd: 0,
    atk: type.atk,
    range: 0,
    armor: 0,
    gold: type.gold,
    size: 13,
    attackCd: 1,
    slowT: 0, slowF: 0,
    stunT: 0, charmT: 0,
    dotT: 0, dotDps: 0,
    hitFlash: 0,
    anim: Math.random() * 6,
    boss: false,
    age: 0,
    moving: true,
    lunge: 0,
    dead: false,
  };
}

export function startBonusWave(run: Run) {
  const idx = run.bonusWaveIdx ?? 0;
  const count = BONUS_WAVES[idx];
  const gap = idx === 0 ? 0.28 : idx === 1 ? 0.12 : 0.04;
  const queue = [];
  for (let i = 0; i < count; i++) {
    const type = SUSHI_TYPES[Math.floor(Math.random() * SUSHI_TYPES.length)];
    queue.push({ delay: i === 0 ? 0.5 : gap * (0.7 + Math.random() * 0.6), enemy: () => makeSushi(type, run.wave) });
  }
  run.spawnQueue = queue;
  run.spawnTimer = 0;
  run.phase = 'bonus-wave';
  const label = idx === 0 ? 'PRIMO' : idx === 1 ? 'SECONDO' : 'TERZO';
  banner(run, `ATTACCO SUSHI! (${label} ASSALTO)`, `${count} sushi in arrivo — tieni duro!`, '#ff9f1c');
  sfx(run, 'wave');
}

export function endBonusWave(run: Run) {
  const idx = run.bonusWaveIdx ?? 0;
  const gold = BONUS_GOLD[idx];
  run.gold += gold;
  run.enemyShots = [];
  run.shots = [];
  floatText(run, TOWER.x, TOWER.y - 90, `Sushi sconfitti! +${gold.toLocaleString('it')}💰`, '#ff9f1c', 10);
  sfx(run, idx === 2 ? 'bossdown' : 'kill');
  if (idx < BONUS_WAVES.length - 1) {
    run.bonusWaveIdx = idx + 1;
    run.phase = 'bonus-break';
    run.bonusBreakTimer = 2.5;
  } else {
    banner(run, 'BONUS STAGE COMPLETATO!', 'Hai lo spirito di un samurai — +500.000💰', '#f2b705');
    run.bonusStage = false;
    run.bonusWaveIdx = 0;
    offerCards(run, { noMalus: true });
  }
}
