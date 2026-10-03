// Nemici "normali". Tutti i numeri sono i valori all'ondata 1:
// hpScale/atkScale/goldScale in systems/waves.js li fanno crescere con le ondate.
//   hp     punti vita
//   speed  pixel al secondo
//   atk    danno per colpo alla torre (un colpo al secondo)
//   range  0 = corpo a corpo, altrimenti distanza da cui spara
//   gold   oro lasciato alla morte
//   armor  frazione di danno assorbita (0.3 = -30%)
//   heal   cura i nemici vicini (frazione della loro vita, ogni 3 secondi)
//   split  quando muore si divide in 2 nemici di questo tipo
export const ENEMIES = {
  // 1-10 Open Space
  stagista:     { name: 'Stagista',       look: 'stagista',      hp: 10,  speed: 34, atk: 2,  range: 0,   gold: 1 },
  impiegato:    { name: 'Impiegato',      look: 'impiegato',     hp: 12,  speed: 28, atk: 2,  range: 130, gold: 2 },
  hr:           { name: 'Resp. HR',       look: 'hr',            hp: 16,  speed: 30, atk: 3,  range: 0,   gold: 2, heal: 0.10 },
  // 11-20 Amministrazione
  contabile:    { name: 'Contabile',      look: 'contabile',     hp: 40,  speed: 20, atk: 6,  range: 0,   gold: 4, armor: 0.3 },
  avvocato:     { name: 'Avvocato',       look: 'avvocato',      hp: 22,  speed: 26, atk: 5,  range: 150, gold: 3 },
  consulente:   { name: 'Consulente',     look: 'consulente',    hp: 14,  speed: 58, atk: 3,  range: 0,   gold: 2 },
  // 21-30 Reparto IT
  tecnico:      { name: 'Tecnico',        look: 'tecnico',       hp: 26,  speed: 32, atk: 5,  range: 0,   gold: 3 },
  sistemista:   { name: 'Sistemista',     look: 'sistemista',    hp: 22,  speed: 26, atk: 5,  range: 140, gold: 3 },
  ingegnere:    { name: 'Ingegnere',      look: 'ingegnere',     hp: 60,  speed: 24, atk: 8,  range: 0,   gold: 5, armor: 0.2 },
  // 31-40 Commerciale
  venditore:    { name: 'Venditore',      look: 'venditore',     hp: 20,  speed: 60, atk: 4,  range: 0,   gold: 3 },
  marketing:    { name: 'Marketing',      look: 'marketing',     hp: 24,  speed: 28, atk: 5,  range: 150, gold: 3 },
  capovendite:  { name: 'Capo Vendite',   look: 'capovendite',   hp: 40,  speed: 26, atk: 6,  range: 0,   gold: 4, split: 'venditore' },
  // 41-50 Sicurezza
  guardia:      { name: 'Guardia',        look: 'guardia',       hp: 55,  speed: 24, atk: 8,  range: 0,   gold: 5, armor: 0.4 },
  vigilante:    { name: 'Vigilante',      look: 'vigilante',     hp: 30,  speed: 28, atk: 7,  range: 160, gold: 4 },
  buttafuori:   { name: 'Buttafuori',     look: 'buttafuori',    hp: 110, speed: 18, atk: 14, range: 0,   gold: 8 },
  // 51-60 Piani Alti
  assistente:   { name: 'Assistente',     look: 'assistente',    hp: 28,  speed: 62, atk: 5,  range: 0,   gold: 3 },
  segretaria:   { name: 'Segretaria',     look: 'segretaria',    hp: 34,  speed: 28, atk: 6,  range: 0,   gold: 4, heal: 0.12 },
  vicedirettore:{ name: 'Vicedirettore',  look: 'vicedirettore', hp: 60,  speed: 24, atk: 9,  range: 0,   gold: 6, split: 'assistente' },
};

// Ogni 10 ondate cambia reparto: nemici nuovi. Dopo l'ondata 60 si ricomincia
// dal primo reparto con i nemici in versione ÉLITE (occhi rossi, più veloci).
export const DECADES = [
  { name: 'OPEN SPACE',      enemies: ['stagista', 'impiegato', 'hr'] },
  { name: 'AMMINISTRAZIONE', enemies: ['contabile', 'avvocato', 'consulente'] },
  { name: 'REPARTO IT',      enemies: ['tecnico', 'sistemista', 'ingegnere'] },
  { name: 'COMMERCIALE',     enemies: ['venditore', 'marketing', 'capovendite'] },
  { name: 'SICUREZZA',       enemies: ['guardia', 'vigilante', 'buttafuori'] },
  { name: 'PIANI ALTI',      enemies: ['assistente', 'segretaria', 'vicedirettore'] },
];

export function decadeFor(wave) {
  const i = Math.floor((wave - 1) / 10);
  return { ...DECADES[i % DECADES.length], elite: i >= DECADES.length };
}
