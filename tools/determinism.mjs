// Gioca 5 partite con casualità fissa e stampa un riassunto (ondata, uccisioni, oro, vita).
// Serve dopo una riorganizzazione del codice: il riassunto deve restare IDENTICO.
//   node tools/determinism.mjs              (versione attuale)
//   node tools/determinism.mjs /percorso/src/  (un'altra copia, es. estratta con git archive)
const R = process.argv[2] || new URL('../src/', import.meta.url).href;
let seed = 12345;
Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const { createRun } = await import(R + 'state.js');
const { update } = await import(R + 'systems/game.js');
const { buyUpgrade, upgradeCost } = await import(R + 'systems/economy.js');
const { pickCard } = await import(R + 'systems/cards.js');
const { pickAlly } = await import(R + 'systems/allies.js');
const { useAbility } = await import(R + 'systems/abilities.js');
const { defaultMeta } = await import(R + 'save.js');
const out = [];
for (let g = 0; g < 5; g++) {
  const meta = defaultMeta(); const run = createRun(meta);
  for (let t = 0; t < 30 * 1500 && run.phase !== 'over'; t++) {
    update(run, 1 / 30);
    if (run.phase === 'ally') pickAlly(run, meta, 0);
    if (run.phase === 'cards') pickCard(run, meta, 0);
    for (const id of ['dmg', 'rate', 'hp', 'regen', 'range', 'fence']) if (upgradeCost(run, id) !== null && run.gold > upgradeCost(run, id) * 2) buyUpgrade(run, meta, id);
    for (const id of ['mitra', 'bomb', 'coffee', 'meeting', 'audit']) if (run.enemies.length > 8 || run.boss) useAbility(run, id);
  }
  out.push(`ondata ${run.wave} kill ${run.kills} oro ${Math.round(run.gold)} vita ${Math.round(run.tower.hp)}`);
}
console.log(out.join(' | '));
