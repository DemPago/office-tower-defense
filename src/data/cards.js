// Carte potenziamento: dopo ogni ondata se ne sceglie 1 fra 3.
// Le carte crescono con il gioco: il loro effetto è moltiplicato per cardPower(ondata)
// nel momento in cui le prendi (una carta presa all'ondata 30 vale molto di più).
//   rarity   'common' | 'rare' | 'epic' (più rara = esce meno spesso)
//   max      quante volte si può prendere al massimo
//   desc(m)  testo della carta con la potenza m
//   mod(c,m) modifica i bonus delle carte (vedi systems/stats.js), una volta per copia
//   onPick   effetto immediato, solo nel momento della scelta
export function cardPower(wave) {
  return 1 + 0.03 * (Math.max(1, wave) - 1);
}
const pct = (v, m) => Math.round(v * m * 100);
const num = (v, m) => Math.round(v * m * 10) / 10;

export const CARDS = [
  { id: 'caffe',     icon: '☕', name: 'Caffè doppio',        rarity: 'common', max: 10, desc: m => `+${pct(0.20, m)}% velocità di fuoco`,           mod: (c, m) => { c.rate += 0.20 * m; } },
  { id: 'straord',   icon: '⏰', name: 'Straordinari',        rarity: 'common', max: 10, desc: m => `+${pct(0.25, m)}% danno`,                        mod: (c, m) => { c.dmg += 0.25 * m; } },
  { id: 'vision',    icon: '🔭', name: 'Vision aziendale',    rarity: 'common', max: 5,  desc: m => `+${pct(0.12, m)}% gittata`,                      mod: (c, m) => { c.range += 0.12 * m; } },
  { id: 'smart',     icon: '🏠', name: 'Smart working',       rarity: 'common', max: 10, desc: m => `+${Math.round(30 * m)} vita massima e cura completa`, mod: (c, m) => { c.hpFlat += 30 * m; }, onPick: run => { run.healFull = true; } },
  { id: 'ferie',     icon: '🏖️', name: 'Ferie arretrate',     rarity: 'common', max: 10, desc: m => `+${num(1.5, m)} vita al secondo`,                mod: (c, m) => { c.regen += 1.5 * m; } },
  { id: 'bonus',     icon: '💰', name: 'Premio produzione',   rarity: 'common', max: 5,  desc: m => `+${pct(0.25, m)}% oro dai nemici`,               mod: (c, m) => { c.gold += 0.25 * m; } },
  { id: 'rimborso',  icon: '🧾', name: 'Rimborso spese',      rarity: 'common', max: 99, desc: () => 'Ricevi subito oro (10 × ondata)',              mod: () => {}, onPick: run => { run.gold += 10 * run.wave; } },
  { id: 'sindacato', icon: '🛡️', name: 'Sindacato',           rarity: 'rare',   max: 5,  desc: m => `+${pct(0.10, m)}% armatura (riduce i danni)`,    mod: (c, m) => { c.armor += 0.10 * m; } },
  { id: 'cc',        icon: '📧', name: 'Mail in CC al capo',  rarity: 'rare',   max: 5,  desc: m => `+${pct(0.10, m)}% probabilità di critico`,       mod: (c, m) => { c.crit += 0.10 * m; } },
  { id: 'replyall',  icon: '📨', name: 'Rispondi a tutti',    rarity: 'rare',   max: 5,  desc: m => `+${pct(0.6, m)}% danno dei critici`,             mod: (c, m) => { c.critMult += 0.6 * m; } },
  { id: 'pm',        icon: '📊', name: 'Laser del PM',        rarity: 'rare',   max: 4,  desc: () => 'Spari a 1 bersaglio in più',                   mod: c => { c.multishot += 1; } },
  { id: 'sm',        icon: '🎯', name: 'Balestra del SM',     rarity: 'rare',   max: 3,  desc: m => `I colpi rallentano del ${Math.min(60, pct(0.20, m))}%`, mod: (c, m) => { c.slow += 0.20 * m; } },
  { id: 'stagista',  icon: '🧑‍🎓', name: 'Stagista volenteroso', rarity: 'rare', max: 4, desc: () => 'I colpi rimbalzano su 1 nemico in più',      mod: c => { c.bounce += 1; } },
  { id: 'excel',     icon: '📗', name: 'Excel avvelenato',    rarity: 'rare',   max: 5,  desc: m => `I colpi bruciano: +${pct(0.40, m)}% del danno in 3 s`, mod: (c, m) => { c.dot += 0.40 * m; } },
  { id: 'pausa',     icon: '🥪', name: 'Pausa pranzo',        rarity: 'rare',   max: 5,  desc: m => `Ogni nemico ucciso cura ${num(1, m)} vita`,      mod: (c, m) => { c.healOnKill += m; } },
  { id: 'dev',       icon: '💻', name: 'PC lanciato dal Dev', rarity: 'epic',   max: 3,  desc: () => 'I colpi esplodono: 50% di danno ad area',      mod: c => { c.aoe += 1; } },
  { id: 'itil',      icon: '📚', name: 'Manuale ITIL',        rarity: 'epic',   max: 3,  desc: () => 'Poteri: -20% di ricarica',                     mod: c => { c.cdr += 0.20; } },
  { id: 'scrum',     icon: '📋', name: 'Scrum Master',        rarity: 'epic',   max: 3,  desc: m => `+${pct(0.6, m)}% danno e +${pct(0.15, m)}% velocità`, mod: (c, m) => { c.dmg += 0.6 * m; c.rate += 0.15 * m; } },
];

export const RARITY = {
  common: { weight: 60, label: 'Comune', color: '#8a8d93' },
  rare:   { weight: 30, label: 'Rara',   color: '#2de2e6' },
  epic:   { weight: 10, label: 'Epica',  color: '#ff3e8a' },
};
