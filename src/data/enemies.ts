// ─── Ruoli ───────────────────────────────────────────────────────────────────
// Definiscono il COMPORTAMENTO di ogni nemico.
// Valori all'ondata 1: crescono con hpScale/atkScale/goldScale (systems/waves.ts).
//
// Unità:
//   hp     — punti vita base (×hpScale(w) a runtime)
//   speed  — pixel/sec nel mondo di gioco  (SPAWN_RADIUS=300, torre a ~0-300px)
//   atk    — danno per colpo alla torre    (torre base=150hp)
//   range  — distanza di tiro in px (0 = mischia)
//   gold   — oro base al kill             (×goldScale(w) a runtime)
//   armor  — riduzione danno fissa [0–0.7] (0.2 = −20%)
//   shotCd — secondi tra un colpo e l'altro (solo sniper/ranged)
//   charge — {dist: px da torre per caricare, mult: moltiplicatore velocità}
//
//   tank     tantissima vita, lento, corazzato. Taunt: i proiettili lo cercano prima.
//   sniper   spara da lontano (range 165px), fragile, cooldown 1.8s.
//   charger  a 150px dalla torre si lancia a 2.3× velocità ed ESPLODE all'impatto.
//   special  cura i vicini (heal) oppure si divide in due alla morte (split).
export const ROLES = {
  //              hp  spd  atk  range  gold  extra
  tank:    { hp: 26, speed: 19, atk:  3, range:   0, gold: 4, armor: 0.2, taunt: true },
  sniper:  { hp:  7, speed: 26, atk:  3, range: 165, gold: 3, shotCd: 1.8 },
  charger: { hp: 11, speed: 30, atk: 14, range:   0, gold: 3, charge: { dist: 150, mult: 2.3 } },
  special: { hp: 18, speed: 26, atk:  4, range:   0, gold: 4 },
};

// Probabilità di spawn per ruolo in ogni ondata normale (somma = 1.0).
// Cambiare questi pesi altera l'equilibrio: più tank = più resistenza, più sniper = più pressione.
export const ROLE_WEIGHTS = { tank: 0.38, sniper: 0.24, charger: 0.26, special: 0.12 };

// ─── Tier ────────────────────────────────────────────────────────────────────
// Determinano il LIVELLO visivo e le statistiche scalate del singolo nemico.
// Il ruolo dà il comportamento; il tier amplifica (o riduce) le stat base del ruolo.
//
// Progressione: Graduate (fragile, veloce) → Junior → Middle → Senior → Focal (mini-boss)
//   graduate → charger: stagista kamikaze
//   junior   → sniper:  recluta a distanza
//   middle   → tank:    impiegato rodato
//   senior   → special: veterano strategico
//   focal    → mini-boss che appare 2 ondate prima del boss (ondate 8, 18, 28 …)
//
// Tutti i mult si applicano DOPO hpScale/atkScale: hpMult=1.45 non bilancia w1 vs w50.
export const TIERS = {
  //               hpMult  spdMult atkMult goldMult
  graduate: { hpMult: 0.65, speedMult: 1.10, atkMult: 0.70, goldMult: 0.50 },
  junior:   { hpMult: 1.00, speedMult: 1.00, atkMult: 1.00, goldMult: 1.00 }, // baseline
  middle:   { hpMult: 1.45, speedMult: 0.90, atkMult: 1.25, goldMult: 1.35 },
  senior:   { hpMult: 1.90, speedMult: 0.85, atkMult: 1.55, goldMult: 1.75 },
  focal:    { hpMult: 3.50, speedMult: 0.90, atkMult: 2.50, goldMult: 3.50 },
};

// Mappa ruolo → tier (per applicare i moltiplicatori).
export const ROLE_TIER = { tank: 'middle', sniper: 'junior', charger: 'graduate', special: 'senior' };

// Focal Point: il riferimento organizzativo del reparto.
// Appare 2 ondate prima di ogni boss (ondate 8, 18, 28…).
export const FOCAL_POINT_DEF = {
  name: 'Focal Point', look: 'focal_m', role: 'tank', tier: 'focal',
  hp: 30, speed: 20, atk: 10, range: 0, gold: 12, armor: 0.22, taunt: true,
};

function enemy(name: string, look: string, role: keyof typeof ROLES, extra: Record<string, unknown> = {}) {
  return { name, look, role, ...ROLES[role], ...extra };
}

export const ENEMIES = {
  // 1-10 Open Floor
  impiegato:     enemy('Office Drone',   'impiegato',     'tank'),
  stagista:      enemy('Intern',         'stagista',      'sniper'),
  rider:         enemy('Courier',        'rider',         'charger'),
  hr:            enemy('HR Manager',     'hr',            'special', { heal: 0.12 }),
  // 11-20 Administration
  contabile:     enemy('Accountant',     'contabile',     'tank', { armor: 0.35 }),
  avvocato:      enemy('Lawyer',         'avvocato',      'sniper'),
  consulente:    enemy('Consultant',     'consulente',    'charger'),
  funzionario:   enemy('Officer',        'funzionario',   'special', { split: 'impiegato' }),
  // 21-30 IT Department
  ingegnere:     enemy('Engineer',       'ingegnere',     'tank'),
  sistemista:    enemy('Sysadmin',       'sistemista',    'sniper'),
  tecnico:       enemy('Technician',     'tecnico',       'charger'),
  devops:        enemy('DevOps',         'devops',        'special', { heal: 0.14 }),
  // 31-40 Sales & Logistics
  magazziniere:  enemy('Warehouse Guy',  'magazziniere',  'tank'),
  marketing:     enemy('Marketing',      'marketing',     'sniper'),
  venditore:     enemy('Sales Rep',      'venditore',     'charger'),
  capovendite:   enemy('Sales Lead',     'capovendite',   'special', { split: 'venditore' }),
  // 41-50 Security
  buttafuori:    enemy('Bouncer',        'buttafuori',    'tank', { armor: 0.3 }),
  vigilante:     enemy('Security Guard', 'vigilante',     'sniper'),
  guardia:       enemy('Guard',          'guardia',       'charger'),
  caposquadra:   enemy('Squad Leader',   'caposquadra',   'special', { split: 'guardia' }),
  // 51-60 Executive Floor
  vicedirettore: enemy('Deputy Director','vicedirettore', 'tank', { armor: 0.3 }),
  segretaria:    enemy('Exec. Secretary','segretaria',    'sniper'),
  assistente:    enemy('Assistant',      'assistente',    'charger'),
  portavoce:     enemy('Spokesperson',   'portavoce',     'special', { heal: 0.15 }),
};

// Ogni 10 ondate cambia reparto: un nemico per ruolo. Dopo l'ondata 60 si ricomincia
// dal primo reparto con i nemici in versione ÉLITE (occhi rossi, più veloci).
// I reparti più avanzati hanno nemici un po' più robusti (vedi makeEnemy).
export const DECADES = [
  { name: 'OPEN FLOOR',      enemies: { tank: 'impiegato', sniper: 'stagista', charger: 'rider', special: 'hr' } },
  { name: 'ADMINISTRATION',  enemies: { tank: 'contabile', sniper: 'avvocato', charger: 'consulente', special: 'funzionario' } },
  { name: 'IT DEPARTMENT',   enemies: { tank: 'ingegnere', sniper: 'sistemista', charger: 'tecnico', special: 'devops' } },
  { name: 'SALES & LOGISTICS',enemies: { tank: 'magazziniere', sniper: 'marketing', charger: 'venditore', special: 'capovendite' } },
  { name: 'SECURITY',        enemies: { tank: 'buttafuori', sniper: 'vigilante', charger: 'guardia', special: 'caposquadra' } },
  { name: 'EXECUTIVE FLOOR', enemies: { tank: 'vicedirettore', sniper: 'segretaria', charger: 'assistente', special: 'portavoce' } },
];

// Ondate zombie: la settima di ogni reparto (7, 17, 27…). I nemici diventano zombie:
// più resistenti ma più lenti, e lo scenario si fa verde e nebbioso.
export const ZOMBIE = { every: 10, at: 7, hp: 1.15, speed: 0.8 };
export function isZombieWave(wave: number): boolean {
  return wave % ZOMBIE.every === ZOMBIE.at;
}

export function decadeFor(wave: number): (typeof DECADES)[number] & { index: number; elite: boolean } {
  const i = Math.floor((wave - 1) / 10);
  return { ...DECADES[i % DECADES.length], index: i, elite: i >= DECADES.length };
}
