// Nemici "normali". Tutti i numeri sono i valori all'ondata 1:
// hpScale/atkScale/goldScale in systems/waves.js li fanno crescere con le ondate.
//   hp     punti vita
//   speed  pixel al secondo
//   atk    danno per colpo alla torre (un colpo al secondo)
//   range  0 = corpo a corpo, altrimenti distanza da cui spara
//   gold   oro lasciato alla morte
//   from   prima ondata in cui può comparire
export const ENEMIES = [
  { id: 'stagista',   name: 'Stagista',   look: 'stagista',     hp: 10, speed: 34, atk: 2, range: 0,   gold: 1, size: 28, from: 1 },
  { id: 'impiegato',  name: 'Impiegato',  look: 'impiegato',    hp: 12, speed: 28, atk: 2, range: 130, gold: 2, size: 28, from: 3 },
  { id: 'hr',         name: 'Resp. HR',   look: 'hr',           hp: 24, speed: 30, atk: 4, range: 0,   gold: 2, size: 28, from: 6 },
  { id: 'consulente', name: 'Consulente', look: 'consulente',    hp: 14, speed: 58, atk: 3, range: 0,   gold: 2, size: 28, from: 9 },
  { id: 'contabile',  name: 'Contabile',  look: 'contabile',    hp: 45, speed: 20, atk: 7, range: 0,   gold: 4, size: 28, from: 12, armor: 0.3 },
  { id: 'avvocato',   name: 'Avvocato',   look: 'avvocato',      hp: 26, speed: 26, atk: 5, range: 150, gold: 3, size: 28, from: 15 },
  { id: 'ingegnere',  name: 'Ingegnere',  look: 'ingegnere',    hp: 70, speed: 24, atk: 9, range: 0,   gold: 5, size: 28, from: 20 },
];
