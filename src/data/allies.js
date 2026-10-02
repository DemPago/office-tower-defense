// Rinforzi: ogni REINFORCE_EVERY ondate arriva un collega gratis (se ne sceglie 1 fra 3).
// Se scegli un collega che hai già, sale di livello.
//   dmg    frazione del danno della torre (così i colleghi crescono insieme a lei)
//   rate   colpi al secondo
//   kind   aspetto del colpo: 'laser' | 'bolt' | 'pc'
//   aura   i maghi non sparano: danno un bonus a torre e colleghi ('rate' o 'dmg')
export const REINFORCE_EVERY = 5;

export const ALLIES = [
  { id: 'pm',    icon: '📊', name: 'Project Manager', char: 'red_shirt',     kind: 'laser', dmg: 0.3, rate: 2.2, range: 210, desc: 'Laser rapido a lunga gittata' },
  { id: 'sm',    icon: '🎯', name: 'Service Manager', char: 'purple_hair',   kind: 'bolt',  dmg: 0.9,  rate: 0.6, range: 190, slow: 0.4, desc: 'Balestra: colpi forti che rallentano' },
  { id: 'dev',   icon: '💻', name: 'Dev',             char: 'worker_helmet', kind: 'pc',    dmg: 0.6,  rate: 0.5, range: 170, aoe: 42, desc: 'Lancia PC che esplodono ad area' },
  { id: 'agile', icon: '🏃', name: 'Mago Agile',      char: 'elder',         aura: 'rate', auraPer: 0.10, desc: '+10% velocità di fuoco a tutti, per livello' },
  { id: 'scrum', icon: '📋', name: 'Mago Scrum',      char: 'green_shirt',   aura: 'dmg',  auraPer: 0.12, desc: '+12% danno a tutti, per livello' },
];

export const ALLY_LEVELS = ['Junior', 'Middle', 'Professional', 'Senior', '👑 King'];
// Moltiplicatore del danno per livello (Junior = 1).
export const ALLY_LEVEL_MULT = [1, 1.5, 2.2, 3.2, 4.5];

// Postazioni intorno al palazzo (relative al centro della torre).
export const ALLY_SLOTS = [
  { x: -82, y: -8 }, { x: 82, y: -8 },
  { x: -56, y: -60 }, { x: 56, y: -60 },
  { x: -64, y: 42 }, { x: 64, y: 42 },
];
