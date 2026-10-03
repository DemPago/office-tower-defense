// Un boss ogni 10 ondate. hpFactor e atkFactor moltiplicano le statistiche
// di un dipendente medio della stessa ondata; group = quanti ne arrivano insieme
// (la vita viene divisa fra loro).
//   scale  grandezza rispetto a un nemico normale
//   aura   colore dell'alone pulsante
//   trail  scia di particelle: smoke (fumo) | sparks (scintille) | stars (stelle) | code (bit)
export const BOSSES = [
  { wave: 10,  name: 'TEAM LEADER',          sub: 'Il tiranno delle riunioni', look: 'teamleader', hpFactor: 30,  atkFactor: 6,  speed: 18, scale: 3, aura: '#d7263d' },
  { wave: 20,  name: 'CAPO AREA',            sub: 'Solo acqua minerale',       look: 'capoarea', hpFactor: 40,  atkFactor: 7,  speed: 18, scale: 3, aura: '#a67c00' },
  { wave: 30,  name: 'DIR. DIPARTIMENTO',    sub: 'Poltrona da 4000€',         look: 'direttore', hpFactor: 50,  atkFactor: 8,  speed: 16, scale: 3, aura: '#7a0f1c', trail: 'smoke' },
  { wave: 40,  name: 'LEADERSHIP TEAM',      sub: 'Arrivano in Tesla',         look: 'leadership', hpFactor: 60,  atkFactor: 4,  speed: 22, group: 4, scale: 2, aura: '#f2b705' },
  { wave: 50,  name: 'DIRETTORE GENERALE',   sub: 'Bonus > stipendio',         look: 'dg', hpFactor: 70,  atkFactor: 10, speed: 16, scale: 3, aura: '#f2b705', trail: 'smoke' },
  { wave: 60,  name: 'CONSIGLIO DI AMM.',    sub: 'Solo grafici a torta',      look: 'consiglio', hpFactor: 80,  atkFactor: 3,  speed: 22, group: 10, scale: 1.5, aura: '#2f4f8f' },
  { wave: 70,  name: 'CEO',                  sub: '"Disruption & Synergy"',    look: 'ceo', hpFactor: 90,  atkFactor: 12, speed: 15, scale: 3, aura: '#2de2e6', trail: 'code' },
  { wave: 80,  name: 'IL GRANDE SOCIO',      sub: '51% delle quote',           look: 'socio', hpFactor: 100, atkFactor: 14, speed: 14, scale: 3.5, aura: '#5d275d', trail: 'smoke' },
  { wave: 90,  name: 'DOC BROWN',            sub: 'Torna dal futuro',          look: 'docbrown', hpFactor: 110, atkFactor: 15, speed: 26, scale: 3, aura: '#2de2e6', trail: 'sparks' },
  { wave: 100, name: 'DIRETTORE GALATTICO',  sub: 'Il capo di tutti i capi',   look: 'galattico', hpFactor: 130, atkFactor: 18, speed: 14, scale: 3.5, aura: '#ff3e8a', trail: 'stars' },
];

// Dopo l'ondata 100 i boss ricominciano dal primo, con un "+" nel nome.
export function bossForWave(wave) {
  if (wave % 10 !== 0) return null;
  const i = (wave / 10 - 1) % BOSSES.length;
  const loop = Math.floor((wave / 10 - 1) / BOSSES.length);
  const b = BOSSES[i];
  return { ...b, name: b.name + '+'.repeat(loop) };
}
