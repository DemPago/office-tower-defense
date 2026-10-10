// Un boss ogni 10 ondate. hpFactor e atkFactor moltiplicano le statistiche
// di un dipendente medio della stessa ondata; group = quanti ne arrivano insieme
// (la vita viene divisa fra loro).
//   scale   grandezza rispetto a un nemico normale
//   aura    colore dell'alone pulsante
//   trail   scia di particelle: smoke | sparks | stars | code
//   animal  il suo animale (data/animals.js)
//   weapon  arma portata nell'altra mano: cambia range, shotCd e comportamento speciale
export const WEAPONS = {
  mazza:        { range: 0,   shotCd: 1.1, atkMult: 1.6 },
  arco:         { range: 185, shotCd: 1.8, atkMult: 1.0 },
  spada:        { range: 0,   shotCd: 0.7, atkMult: 1.3, speedMult: 1.3 },
  balestra:     { range: 195, shotCd: 2.5, atkMult: 1.2, pierce: true },
  palla_ferrata:{ range: 0,   shotCd: 1.7, atkMult: 2.0, aoe: true },
  laser:        { range: 165, shotCd: 0.4, atkMult: 0.7, beam: true },
  pistola:      { range: 150, shotCd: 1.0, atkMult: 1.0 },
  fucile:       { range: 240, shotCd: 3.0, atkMult: 2.5 },
  fiocina:      { range: 205, shotCd: 2.8, atkMult: 1.5, slow: true },
};

export const BOSSES = [
  { wave: 10,  name: 'TEAM LEADER',          sub: 'Il tiranno delle riunioni', look: 'teamleader', weapon: 'mazza',         hpFactor: 30,  atkFactor: 6,  speed: 18, scale: 3,   aura: '#d7263d', animal: 'pitbull', escort: 4 },
  { wave: 20,  name: 'CAPO AREA',            sub: 'Solo acqua minerale',       look: 'capoarea',   weapon: 'palla_ferrata', hpFactor: 40,  atkFactor: 7,  speed: 18, scale: 3,   aura: '#a67c00', animal: 'toro',    escort: 3 },
  { wave: 30,  name: 'DIR. DIPARTIMENTO',    sub: 'Poltrona da 4000€',         look: 'direttore',  weapon: 'spada',         hpFactor: 50,  atkFactor: 8,  speed: 16, scale: 3,   aura: '#7a0f1c', trail: 'smoke',  animal: 'lupo',    escort: 5 },
  { wave: 40,  name: 'LEADERSHIP TEAM',      sub: 'Arrivano in Tesla',         look: 'leadership', weapon: 'pistola',       hpFactor: 60,  atkFactor: 4,  speed: 22, scale: 2,   aura: '#f2b705', group: 4,        animal: 'gorilla', escort: 2 },
  { wave: 50,  name: 'DIRETTORE GENERALE',   sub: 'Bonus > stipendio',         look: 'dg',         weapon: 'fucile',        hpFactor: 70,  atkFactor: 10, speed: 16, scale: 3,   aura: '#f2b705', trail: 'smoke',  animal: 'orso',    escort: 3 },
  { wave: 60,  name: 'CONSIGLIO DI AMM.',    sub: 'Solo grafici a torta',      look: 'consiglio',  weapon: 'arco',          hpFactor: 80,  atkFactor: 3,  speed: 22, scale: 1.5, aura: '#2f4f8f', group: 10,       animal: 'corvo',   escort: 6 },
  { wave: 70,  name: 'CEO',                  sub: '"Disruption & Synergy"',    look: 'ceo',        weapon: 'laser',         hpFactor: 90,  atkFactor: 12, speed: 15, scale: 3,   aura: '#2de2e6', trail: 'code',   animal: 'serpente',escort: 4 },
  { wave: 80,  name: 'IL GRANDE SOCIO',      sub: '51% delle quote',           look: 'socio',      weapon: 'fiocina',       hpFactor: 100, atkFactor: 14, speed: 14, scale: 3.5, aura: '#5d275d', trail: 'smoke',  animal: 'leone',   escort: 4 },
  { wave: 90,  name: 'DOC BROWN',            sub: 'Torna dal futuro',          look: 'docbrown',   weapon: 'balestra',      hpFactor: 110, atkFactor: 15, speed: 26, scale: 3,   aura: '#2de2e6', trail: 'sparks', animal: 'ratto',   escort: 8 },
  { wave: 100, name: 'DIRETTORE GALATTICO',  sub: 'Il capo di tutti i capi',   look: 'galattico',  weapon: 'laser',         hpFactor: 130, atkFactor: 18, speed: 14, scale: 3.5, aura: '#ff3e8a', trail: 'stars',  animal: 'drago',   escort: 3 },
];

// Dopo l'ondata 100 i boss ricominciano dal primo, con un "+" nel nome.
export function bossForWave(wave) {
  if (wave % 10 !== 0) return null;
  const i = (wave / 10 - 1) % BOSSES.length;
  const loop = Math.floor((wave / 10 - 1) / BOSSES.length);
  const b = BOSSES[i];
  return { ...b, name: b.name + '+'.repeat(loop) };
}
