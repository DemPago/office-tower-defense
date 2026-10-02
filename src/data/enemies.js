// Nemici "normali". Tutti i numeri sono i valori all'ondata 1:
// hpScale/atkScale/goldScale in systems/waves.js li fanno crescere con le ondate.
//   hp     punti vita
//   speed  pixel al secondo
//   atk    danno per colpo alla torre (un colpo al secondo)
//   range  0 = corpo a corpo, altrimenti distanza da cui spara
//   gold   oro lasciato alla morte
//   from   prima ondata in cui può comparire
export const ENEMIES = [
  { id: 'stagista',   name: 'Stagista',   char: 'green_shirt',   hp: 10, speed: 34, atk: 2, range: 0,   gold: 1, size: 32, from: 1 },
  { id: 'impiegato',  name: 'Impiegato',  char: 'red_shirt',     hp: 12, speed: 28, atk: 2, range: 130, gold: 2, size: 32, from: 3 },
  { id: 'hr',         name: 'Resp. HR',   char: 'purple_hair',   hp: 24, speed: 30, atk: 4, range: 0,   gold: 2, size: 32, from: 6 },
  { id: 'consulente', name: 'Consulente', char: 'dark_hair',     hp: 14, speed: 58, atk: 3, range: 0,   gold: 2, size: 32, from: 9 },
  { id: 'contabile',  name: 'Contabile',  char: 'elder',         hp: 45, speed: 20, atk: 7, range: 0,   gold: 4, size: 32, from: 12, armor: 0.3 },
  { id: 'avvocato',   name: 'Avvocato',   char: 'dark_hair',     hp: 26, speed: 26, atk: 5, range: 150, gold: 3, size: 32, from: 15 },
  { id: 'ingegnere',  name: 'Ingegnere',  char: 'worker_helmet', hp: 70, speed: 24, atk: 9, range: 0,   gold: 5, size: 32, from: 20 },
];
