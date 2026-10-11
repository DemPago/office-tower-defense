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
  { wave: 10,  name: 'TEAM LEADER',       sub: 'Meeting tyrant',          look: 'teamleader', weapon: 'mazza',         hpFactor: 30,  atkFactor: 1.5, speed: 18, scale: 3,   aura: '#d7263d', animal: 'pitbull', escort: 4 },
  { wave: 20,  name: 'AREA MANAGER',      sub: 'Sparkling water only',    look: 'capoarea',   weapon: 'palla_ferrata', hpFactor: 40,  atkFactor: 1.5, speed: 18, scale: 3,   aura: '#a67c00', animal: 'toro',    escort: 3 },
  { wave: 30,  name: 'DEPT. DIRECTOR',    sub: '€4000 ergonomic chair',   look: 'direttore',  weapon: 'spada',         hpFactor: 50,  atkFactor: 1.0, speed: 16, scale: 3,   aura: '#7a0f1c', trail: 'smoke',  animal: 'lupo',    escort: 5 },
  { wave: 40,  name: 'LEADERSHIP TEAM',   sub: 'They arrive in a Tesla',  look: 'leadership', weapon: 'pistola',       hpFactor: 60,  atkFactor: 0.5, speed: 22, scale: 2,   aura: '#f2b705', group: 4,        animal: 'gorilla', escort: 2 },
  { wave: 50,  name: 'GENERAL DIRECTOR',  sub: 'Bonus > salary',          look: 'dg',         weapon: 'fucile',        hpFactor: 70,  atkFactor: 2.5, speed: 16, scale: 3,   aura: '#f2b705', trail: 'smoke',  animal: 'orso',    escort: 3 },
  { wave: 60,  name: 'BOARD OF DIR.',     sub: 'Pie charts only',         look: 'consiglio',  weapon: 'arco',          hpFactor: 80,  atkFactor: 0.4, speed: 22, scale: 1.5, aura: '#2f4f8f', group: 10,       animal: 'corvo',   escort: 6 },
  { wave: 70,  name: 'CEO',               sub: '"Disruption & Synergy"',  look: 'ceo',        weapon: 'laser',         hpFactor: 90,  atkFactor: 1.5, speed: 15, scale: 3,   aura: '#2de2e6', trail: 'code',   animal: 'serpente',escort: 4 },
  { wave: 80,  name: 'THE BIG PARTNER',   sub: '51% of shares',           look: 'socio',      weapon: 'fiocina',       hpFactor: 100, atkFactor: 5.0, speed: 14, scale: 3.5, aura: '#5d275d', trail: 'smoke',  animal: 'leone',   escort: 4 },
  { wave: 90,  name: 'DOC BROWN',         sub: 'Back from the future',    look: 'docbrown',   weapon: 'balestra',      hpFactor: 110, atkFactor: 6.0, speed: 26, scale: 3,   aura: '#2de2e6', trail: 'sparks', animal: 'ratto',   escort: 8 },
  { wave: 100, name: 'GALACTIC DIRECTOR', sub: 'The boss of all bosses',  look: 'galattico',  weapon: 'laser',         hpFactor: 130, atkFactor: 2.0, speed: 14, scale: 3.5, aura: '#ff3e8a', trail: 'stars',  animal: 'drago',   escort: 3 },
];

// Dopo l'ondata 100 i boss ricominciano dal primo, con un "+" nel nome.
export function bossForWave(wave: number) {
  if (wave % 10 !== 0) return null;
  const i = (wave / 10 - 1) % BOSSES.length;
  const loop = Math.floor((wave / 10 - 1) / BOSSES.length);
  const b = BOSSES[i];
  return { ...b, name: b.name + '+'.repeat(loop) };
}
