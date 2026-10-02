// Un boss ogni 10 ondate. hpFactor e atkFactor moltiplicano le statistiche
// di uno stagista della stessa ondata; group = quanti ne arrivano insieme
// (la vita viene divisa fra loro).
export const BOSSES = [
  { wave: 10,  name: 'TEAM LEADER',          sub: 'Il tiranno delle riunioni', char: 'red_shirt',     hpFactor: 30,  atkFactor: 6,  speed: 18 },
  { wave: 20,  name: 'CAPO AREA',            sub: 'Solo acqua minerale',       char: 'purple_hair',   hpFactor: 40,  atkFactor: 7,  speed: 18 },
  { wave: 30,  name: 'DIR. DIPARTIMENTO',    sub: 'Poltrona da 4000€',         char: 'dark_hair',     hpFactor: 50,  atkFactor: 8,  speed: 16 },
  { wave: 40,  name: 'LEADERSHIP TEAM',      sub: 'Arrivano in Tesla',         char: 'elder',         hpFactor: 60,  atkFactor: 4,  speed: 22, group: 4 },
  { wave: 50,  name: 'DIRETTORE GENERALE',   sub: 'Bonus > stipendio',         char: 'dark_hair',     hpFactor: 70,  atkFactor: 10, speed: 16 },
  { wave: 60,  name: 'CONSIGLIO DI AMM.',    sub: 'Solo grafici a torta',      char: 'elder',         hpFactor: 80,  atkFactor: 3,  speed: 22, group: 10 },
  { wave: 70,  name: 'CEO',                  sub: '"Disruption & Synergy"',    char: 'red_shirt',     hpFactor: 90,  atkFactor: 12, speed: 15 },
  { wave: 80,  name: 'IL GRANDE SOCIO',      sub: '51% delle quote',           char: 'worker_helmet', hpFactor: 100, atkFactor: 14, speed: 14 },
  { wave: 90,  name: 'DOC BROWN',            sub: 'Torna dal futuro',          char: 'elder',         hpFactor: 110, atkFactor: 15, speed: 26 },
  { wave: 100, name: 'DIRETTORE GALATTICO',  sub: 'Il capo di tutti i capi',   char: 'purple_hair',   hpFactor: 130, atkFactor: 18, speed: 14 },
];

// Dopo l'ondata 100 i boss ricominciano dal primo, con un "+" nel nome.
export function bossForWave(wave) {
  if (wave % 10 !== 0) return null;
  const i = (wave / 10 - 1) % BOSSES.length;
  const loop = Math.floor((wave / 10 - 1) / BOSSES.length);
  const b = BOSSES[i];
  return { ...b, name: b.name + '+'.repeat(loop) };
}
