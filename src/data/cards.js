// Carte potenziamento: dopo ogni ondata se ne sceglie 1 fra 3.
//   rarity  'common' | 'rare' | 'epic' (più rara = esce meno spesso)
//   max     quante volte si può prendere al massimo
//   mod(c)  modifica i bonus delle carte (vedi systems/stats.js);
//           viene chiamata una volta per ogni copia presa
//   onPick  effetto immediato, solo nel momento della scelta
export const CARDS = [
  { id: 'caffe',      icon: '☕', name: 'Caffè doppio',       rarity: 'common', max: 10, desc: '+20% velocità di fuoco',           mod: c => { c.rate += 0.20; } },
  { id: 'straord',    icon: '⏰', name: 'Straordinari',       rarity: 'common', max: 10, desc: '+25% danno',                       mod: c => { c.dmg += 0.25; } },
  { id: 'vision',     icon: '🔭', name: 'Vision aziendale',   rarity: 'common', max: 5,  desc: '+12% gittata',                     mod: c => { c.range += 0.12; } },
  { id: 'smart',      icon: '🏠', name: 'Smart working',      rarity: 'common', max: 10, desc: '+30 vita massima e cura completa', mod: c => { c.hpFlat += 30; }, onPick: run => { run.healFull = true; } },
  { id: 'ferie',      icon: '🏖️', name: 'Ferie arretrate',    rarity: 'common', max: 10, desc: '+1,5 vita al secondo',             mod: c => { c.regen += 1.5; } },
  { id: 'bonus',      icon: '💰', name: 'Premio produzione',  rarity: 'common', max: 5,  desc: '+25% oro dai nemici',              mod: c => { c.gold += 0.25; } },
  { id: 'rimborso',   icon: '🧾', name: 'Rimborso spese',     rarity: 'common', max: 99, desc: 'Ricevi subito oro (10 × ondata)',  mod: () => {}, onPick: run => { run.gold += 10 * run.wave; } },
  { id: 'sindacato',  icon: '🛡️', name: 'Sindacato',          rarity: 'rare',   max: 5,  desc: '+10% armatura (riduce i danni)',   mod: c => { c.armor += 0.10; } },
  { id: 'cc',         icon: '📧', name: 'Mail in CC al capo', rarity: 'rare',   max: 5,  desc: '+10% probabilità di critico',      mod: c => { c.crit += 0.10; } },
  { id: 'replyall',   icon: '📨', name: 'Rispondi a tutti',   rarity: 'rare',   max: 5,  desc: '+60% danno dei critici',           mod: c => { c.critMult += 0.6; } },
  { id: 'pm',         icon: '📊', name: 'Laser del PM',       rarity: 'rare',   max: 4,  desc: 'Spari a 1 bersaglio in più',       mod: c => { c.multishot += 1; } },
  { id: 'sm',         icon: '🎯', name: 'Balestra del SM',    rarity: 'rare',   max: 3,  desc: 'I colpi rallentano del 20%',       mod: c => { c.slow += 0.20; } },
  { id: 'stagista',   icon: '🧑‍🎓', name: 'Stagista volenteroso', rarity: 'rare', max: 4, desc: 'I colpi rimbalzano su 1 nemico in più', mod: c => { c.bounce += 1; } },
  { id: 'excel',      icon: '📗', name: 'Excel avvelenato',   rarity: 'rare',   max: 5,  desc: 'I colpi bruciano: +40% del danno in 3 s', mod: c => { c.dot += 0.40; } },
  { id: 'pausa',      icon: '🥪', name: 'Pausa pranzo',       rarity: 'rare',   max: 5,  desc: 'Ogni nemico ucciso cura 1 vita',   mod: c => { c.healOnKill += 1; } },
  { id: 'dev',        icon: '💻', name: 'PC lanciato dal Dev', rarity: 'epic',  max: 3,  desc: 'I colpi esplodono: 50% di danno ad area', mod: c => { c.aoe += 1; } },
  { id: 'itil',       icon: '📚', name: 'Manuale ITIL',       rarity: 'epic',   max: 3,  desc: 'Poteri: -20% di ricarica',         mod: c => { c.cdr += 0.20; } },
  { id: 'scrum',      icon: '📋', name: 'Scrum Master',       rarity: 'epic',   max: 3,  desc: '+60% danno e +15% velocità',       mod: c => { c.dmg += 0.6; c.rate += 0.15; } },
];

export const RARITY = {
  common: { weight: 60, label: 'Comune', color: '#9ca3af' },
  rare:   { weight: 30, label: 'Rara',   color: '#60a5fa' },
  epic:   { weight: 10, label: 'Epica',  color: '#c084fc' },
};
