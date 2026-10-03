// Simulazione del bilanciamento senza grafica: un "bot" gioca molte partite
// e stampa a che ondata arriva con strategie diverse.
//   node tools/sim.mjs
// I moduli in src/ non toccano il DOM (tranne render/ e ui/), quindi girano anche in Node.
const R = new URL('../src/', import.meta.url).href;
const { createRun } = await import(R + 'state.js');
const { update } = await import(R + 'systems/game.js');
const { buyUpgrade, upgradeCost } = await import(R + 'systems/economy.js');
const { pickCard } = await import(R + 'systems/cards.js');
const { pickAlly } = await import(R + 'systems/allies.js');
const { useAbility } = await import(R + 'systems/abilities.js');
const { defaultMeta } = await import(R + 'save.js');

function play(strategy, meta = defaultMeta(), cap = 80) {
  if (strategy.weapon) meta = { ...meta, weapon: strategy.weapon };
  const run = createRun(meta);
  const dt = 1 / 30;
  let t = 0;
  while (run.phase !== 'over' && run.wave <= cap && t < 4 * 3600) {
    t += dt;
    update(run, dt);
    if (run.phase === 'ally') pickAlly(run, meta, Math.floor(Math.random() * run.allyChoices.length));
    if (run.phase === 'cards') {
      if (strategy.cards) pickCard(run, meta, Math.floor(Math.random() * run.cardChoices.length));
      else { run.cardChoices = null; run.phase = 'break'; run.breakTimer = 1.5; }
    }
    if (strategy.buy) {
      for (let k = 0; k < 5; k++) {
        const c = ['dmg', 'rate', 'hp', 'regen', 'range', 'fence']
          .map(id => [id, upgradeCost(run, id)])
          .filter(x => x[1] !== null)
          .sort((a, b) => a[1] - b[1]);
        if (!c.length || !buyUpgrade(run, meta, c[0][0])) break;
      }
    }
    if (strategy.abil) {
      for (const id of ['mitra', 'bomb', 'coffee', 'meeting', 'audit']) if (run.enemies.length > 8 || run.boss) useAbility(run, id);
    }
  }
  return run.wave;
}

function report(label, strategy, meta, cap, n = 15) {
  const r = Array.from({ length: n }, () => play(strategy, meta, cap)).sort((a, b) => a - b);
  console.log(label.padEnd(10), 'min', r[0], 'med', r[n >> 1], 'max', r[n - 1]);
}

const only = process.argv[2]; // node tools/sim.mjs armi  → confronta solo le armi
if (only === 'armi') {
  for (const weapon of ['pistol', 'crossbow', 'laser', 'wave']) report(weapon, { buy: 1, cards: 1, abil: 1, weapon }, undefined, 80, 21);
  process.exit(0);
}
report('niente', {});
report('solo oro', { buy: 1 });
report('solo carte', { cards: 1 });
report('tutto', { buy: 1, cards: 1, abil: 1 });
const meta = defaultMeta();
meta.levels = { dmg: 8, hp: 8, rate: 4, gold: 5, start: 5, reroll: 1 };
report('tutto+meta', { buy: 1, cards: 1, abil: 1 }, meta, 150);
