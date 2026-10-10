// Rinforzi: ogni REINFORCE_EVERY ondate arriva un collega gratis (se ne sceglie 1 fra 3).
// Se scegli un collega che hai già, sale di livello.
//   dmg    frazione del danno della torre (così i colleghi crescono insieme a lei)
//   rate   colpi al secondo
//   kind   aspetto del colpo: 'laser' | 'bolt' | 'pc'
//   aura   i maghi non sparano: danno un bonus a torre e colleghi ('rate' o 'dmg')
export const REINFORCE_EVERY = 5;

export const ALLIES = [
  { id: 'pm',    icon: '📊', name: 'Project Manager', look: 'pm',  kind: 'laser', dmg: 0.3, rate: 2.2, range: 210, desc: 'Laser rapido a lunga gittata' },
  { id: 'sm',    icon: '🎯', name: 'Service Manager', look: 'sm',  kind: 'bolt',  dmg: 0.9,  rate: 0.6, range: 190, slow: 0.4, desc: 'Balestra: colpi forti che rallentano' },
  { id: 'dev',   icon: '💻', name: 'Dev',             look: 'dev', kind: 'pc',    dmg: 0.6,  rate: 0.5, range: 170, aoe: 42, desc: 'Lancia PC che esplodono ad area' },
  { id: 'agile', icon: '🏃', name: 'Mago Agile',      look: 'agile', aura: 'rate', auraPer: 0.10, desc: '+10% velocità di fuoco a tutti, per livello' },
  { id: 'scrum', icon: '📋', name: 'Mago Scrum',      look: 'scrum', aura: 'dmg',  auraPer: 0.12, desc: '+12% danno a tutti, per livello' },
];

export const ALLY_LEVELS = ['Junior', 'Middle', 'Professional', 'Senior', '👑 King'];
// Vita dei colleghi: cresce con le promozioni.
export function allyHp(level) {
  return 500 + 250 * (level - 1);
}
// Vita persa da OGNI collega, al secondo, per OGNI nemico vivo dentro al cortile.
export const YARD_DRAIN = 100;
// Moltiplicatore del danno per livello (Junior = 1).
export const ALLY_LEVEL_MULT = [1, 1.5, 2.2, 3.2, 4.5];

// Postazioni intorno al palazzo: angolo in gradi (0 = destra, 90 = su, come in geometria).
// Ogni collega difende uno SPICCHIO centrato sulla sua postazione: 90° al livello 1,
// e ogni promozione lo allarga di altri 90° (dal livello 4 copre tutto il giro).
export const ALLY_SLOTS = [45, 135, 225, 315, 0, 180];
export const ALLY_RING = 200; // postazioni in midfield, tra i nemici
export function allyArc(level) {
  return Math.min(360, 90 * level);
}
