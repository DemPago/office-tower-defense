// Carte potenziamento: dopo ogni ondata se ne sceglie 1 fra 3.
// Le carte crescono con il gioco: il loro effetto è moltiplicato per cardPower(ondata)
// nel momento in cui le prendi (una carta presa all'ondata 30 vale molto di più).
//   rarity   'common' | 'rare' | 'epic' (più rara = esce meno spesso)
//   max      quante volte si può prendere al massimo (le copie si sommano)
//   linear   l'effetto cresce in proporzione alle copie (per mostrare il totale)
//   desc(m)  testo della carta con la potenza m
//   mod(c,m) modifica i bonus delle carte (vedi systems/stats.js), una volta per copia
//   onPick   effetto immediato, solo nel momento della scelta
// Ogni carta vale di più se la prendi tardi: +2% per ondata (era +4%, ridotto per bilanciamento).
// Ondata 1 → 1.0×  |  Ondata 10 → 1.18×  |  Ondata 20 → 1.38×
export const MAX_HAND = 5;
export function cardPower(wave) {
  return 1 + 0.02 * (wave - 1);
}
const pct = (v, m) => Math.round(v * m * 100);
const num = (v, m) => Math.round(v * m * 10) / 10;

export const CARDS = [
  { id: 'caffe',     icon: '☕', name: 'Caffè doppio',        rarity: 'common', max: 10, linear: true, desc: m => `+${pct(0.20, m)}% velocità di fuoco`,           mod: (c, m) => { c.rate += 0.20 * m; } },
  { id: 'straord',   icon: '⏰', name: 'Straordinari',        rarity: 'common', max: 10, linear: true, desc: m => `+${pct(0.25, m)}% danno`,                        mod: (c, m) => { c.dmg += 0.25 * m; } },
  { id: 'vision',    icon: '🔭', name: 'Vision aziendale',    rarity: 'common', max: 5,  linear: true, desc: m => `+${pct(0.12, m)}% gittata`,                      mod: (c, m) => { c.range += 0.12 * m; } },
  { id: 'smart',     icon: '🏠', name: 'Smart working',       rarity: 'common', max: 10, linear: true, desc: m => `+${Math.round(30 * m)} vita massima e cura completa`, mod: (c, m) => { c.hpFlat += 30 * m; }, onPick: run => { run.healFull = true; } },
  { id: 'ferie',     icon: '🏖️', name: 'Ferie arretrate',     rarity: 'common', max: 10, linear: true, desc: m => `+${num(1.5, m)} vita al secondo`,                mod: (c, m) => { c.regen += 1.5 * m; } },
  { id: 'bonus',     icon: '💰', name: 'Premio produzione',   rarity: 'common', max: 5,  linear: true, desc: m => `+${pct(0.25, m)}% oro dai nemici`,               mod: (c, m) => { c.gold += 0.25 * m; } },
  { id: 'rimborso',  icon: '🧾', name: 'Rimborso spese',      rarity: 'common', max: 99, desc: () => 'Ricevi subito oro (10 × ondata)',              mod: () => {}, onPick: run => { run.gold += 10 * run.wave; } },
  { id: 'sindacato', icon: '🛡️', name: 'Sindacato',           rarity: 'rare',   max: 5,  linear: true, desc: m => `+${pct(0.10, m)}% armatura (riduce i danni)`,    mod: (c, m) => { c.armor += 0.10 * m; } },
  { id: 'cc',        icon: '📧', name: 'Mail in CC al capo',  rarity: 'rare',   max: 5,  linear: true, desc: m => `+${pct(0.10, m)}% probabilità di critico`,       mod: (c, m) => { c.crit += 0.10 * m; } },
  { id: 'replyall',  icon: '📨', name: 'Rispondi a tutti',    rarity: 'rare',   max: 5,  linear: true, desc: m => `+${pct(0.6, m)}% danno dei critici`,             mod: (c, m) => { c.critMult += 0.6 * m; } },
  { id: 'pm',        icon: '📊', name: 'Laser del PM',        rarity: 'rare',   max: 4,  desc: () => 'Spari a 1 bersaglio in più',                   mod: c => { c.multishot += 1; } },
  { id: 'sm',        icon: '🎯', name: 'Balestra del SM',     rarity: 'rare',   max: 3,  linear: true, desc: m => `I colpi rallentano del ${Math.min(60, pct(0.20, m))}%`, mod: (c, m) => { c.slow += 0.20 * m; } },
  { id: 'stagista',  icon: '🧑‍🎓', name: 'Stagista volenteroso', rarity: 'rare', max: 4, desc: () => 'I colpi rimbalzano su 1 nemico in più',      mod: c => { c.bounce += 1; } },
  { id: 'excel',     icon: '📗', name: 'Excel avvelenato',    rarity: 'rare',   max: 5,  linear: true, desc: m => `I colpi bruciano: +${pct(0.40, m)}% del danno in 3 s`, mod: (c, m) => { c.dot += 0.40 * m; } },
  { id: 'pausa',     icon: '🥪', name: 'Pausa pranzo',        rarity: 'rare',   max: 5,  linear: true, desc: m => `Ogni nemico ucciso cura ${num(1, m)} vita`,      mod: (c, m) => { c.healOnKill += m; } },
  { id: 'dev',       icon: '💻', name: 'PC lanciato dal Dev', rarity: 'epic',   max: 3,  desc: () => 'I colpi esplodono: 50% di danno ad area',      mod: c => { c.aoe += 1; } },
  { id: 'itil',      icon: '📚', name: 'Manuale ITIL',        rarity: 'epic',   max: 3,  desc: () => 'Poteri: -20% costo in mana',                    mod: c => { c.cdr += 0.20; } },
  { id: 'energy',    icon: '🔋', name: 'Pausa caffè extra',   rarity: 'common', max: 5,  linear: true, desc: m => `+${num(0.3, m)} mana al secondo`,   mod: (c, m) => { c.manaRegen += 0.3 * m; } },
  { id: 'reserve',   icon: '🗄️', name: 'Riserva di cancelleria', rarity: 'common', max: 5, linear: true, desc: m => `+${Math.round(25 * m)} mana massimo`, mod: (c, m) => { c.manaMax += 25 * m; } },
  { id: 'inbox',     icon: '📥', name: 'Inbox zero',          rarity: 'rare',   max: 3,  linear: true, desc: m => `Ogni nemico eliminato dà ${num(1, m)} mana`, mod: (c, m) => { c.manaOnKill += m; } },
  { id: 'concrete',  icon: '🧱', name: 'Muro di cemento',     rarity: 'rare',   max: 3,  linear: true, desc: m => `Muro: +${pct(0.6, m)}% vita (blocchi di cemento)`, mod: (c, m) => { c.wallHp += 0.6 * m; } },
  { id: 'barbed',    icon: '➰', name: 'Filo spinato',        rarity: 'rare',   max: 3,  linear: true, desc: m => `Chi prende a colpi il muro si ferisce (${pct(0.5, m)}% del tuo danno)`, mod: (c, m) => { c.wallThorns += 0.5 * m; } },
  { id: 'steel',     icon: '🛡️', name: "Lastre d'acciaio",    rarity: 'epic',   max: 2,  linear: true, desc: m => `Muro: +${pct(0.4, m)}% vita e respinge il ${pct(0.35, m)}% dei colpi dei cecchini`, mod: (c, m) => { c.wallHp += 0.4 * m; c.wallReflect += 0.35 * m; } },
  { id: 'selfrepair',icon: '🔧', name: 'Muro autoriparante',  rarity: 'rare',   max: 3,  linear: true, desc: m => `Il muro si ripara: ${num(2, m)}% vita/s in combattimento`, mod: (c, m) => { c.wallRegen += 0.02 * m; } },
  { id: 'scrum',     icon: '📋', name: 'Scrum Master',        rarity: 'epic',   max: 3,  linear: true, desc: m => `+${pct(0.6, m)}% danno e +${pct(0.15, m)}% velocità`, mod: (c, m) => { c.dmg += 0.6 * m; c.rate += 0.15 * m; } },
];

// Malus pesanti: dopo ogni ondata zombie (7, 17, 27…) le 3 scelte sono TUTTE negative.
// Scegli il male minore. Nessun compenso in oro, nessun reroll.
export const HEAVY_MALUS_CARDS = [
  { id: 'licenziamento', icon: '📋', name: 'Licenziamento',    malus: true, heavy: true,
    desc: () => 'Rimuove l\'ultima carta che hai scelto',
    mod: () => {},
    onPick: run => {
      // licenziamento è già in cardPicks come ultimo elemento; rimuoviamo il penultimo
      if (run.cardPicks.length >= 2) {
        const victim = run.cardPicks[run.cardPicks.length - 2];
        run.cardPicks.splice(run.cardPicks.length - 2, 1);
        if (run.cards[victim.id] > 0) run.cards[victim.id]--;
      }
    } },
  { id: 'crisi',         icon: '📉', name: 'Crisi aziendale',  malus: true, heavy: true,
    desc: () => '-30% danno e -30% velocità di fuoco',
    mod: c => { c.dmg -= 0.30; c.rate -= 0.30; } },
  { id: 'burnout',       icon: '🔥', name: 'Burnout del team', malus: true, heavy: true,
    desc: () => '-2 vita al secondo (rigenera meno)',
    mod: c => { c.regen -= 2; } },
  { id: 'blackout',      icon: '🌑', name: 'Blackout sistemico', malus: true, heavy: true,
    desc: () => '+50% costo mana per i poteri',
    mod: c => { c.cdr -= 0.50; } },
  { id: 'tagli',         icon: '✂️', name: 'Tagli al budget',  malus: true, heavy: true,
    desc: () => '-35% oro dai nemici',
    mod: c => { c.gold -= 0.35; } },
  { id: 'downgrade',     icon: '⬇️', name: 'Downgrade forzato', malus: true, heavy: true,
    desc: () => '-25% gittata',
    mod: c => { c.range -= 0.25; } },
];

// Carte malus: compaiono quando vinci troppo facilmente (vita > 80%).
// Penalità fissa, mai in pool normale — compenso in oro che scala con l'ondata.
export const MALUS_CARDS = [
  { id: 'riunione',  icon: '😴', name: 'Riunione infinita',     malus: true, max: 1,
    desc: () => '-15% velocità di fuoco',
    reward: wave => `+${30 + wave * 2}💰 in compenso`,
    mod: c => { c.rate -= 0.15; },
    onPick: run => { run.gold += 30 + run.wave * 2; } },
  { id: 'bug_prod',  icon: '🐛', name: 'Bug in produzione',     malus: true, max: 1,
    desc: () => '-20% danno',
    reward: wave => `+${40 + wave * 2}💰 in compenso`,
    mod: c => { c.dmg -= 0.20; },
    onPick: run => { run.gold += 40 + run.wave * 2; } },
  { id: 'reorg',     icon: '📉', name: 'Ristrutturazione',      malus: true, max: 1,
    desc: () => '-0.8 vita/s rigenera',
    reward: wave => `+${25 + wave * 2}💰 in compenso`,
    mod: c => { c.regen -= 0.8; },
    onPick: run => { run.gold += 25 + run.wave * 2; } },
];

// Lookup unificato (usato da computeStats per trovare il mod di ogni carta presa).
export function findCard(id) {
  return CARDS.find(c => c.id === id)
    || MALUS_CARDS.find(c => c.id === id)
    || HEAVY_MALUS_CARDS.find(c => c.id === id);
}

export const RARITY = {
  common: { weight: 60, label: 'Comune', color: '#8a8d93' },
  rare:   { weight: 30, label: 'Rara',   color: '#2de2e6' },
  epic:   { weight: 10, label: 'Epica',  color: '#ff3e8a' },
};
