// Tipi centrali del gioco.
// I file .js li importano via JSDoc (@type {import('./types').Run}) finché
// non vengono convertiti in .ts — a quel punto si usa l'import diretto.

// ─── Meta (progressi permanenti) ────────────────────────────────────────────

export interface Meta {
  buoni: number;
  best: number;
  runs: number;
  levels: Record<string, number>;
  hero?: string;
  tutorialDone?: boolean;
}

// ─── Statistiche calcolate della torre ──────────────────────────────────────

export interface Stats {
  dmg: number;
  rate: number;
  allyRateMult: number;
  range: number;
  maxHp: number;
  regen: number;
  armor: number;
  crit: number;
  critMult: number;
  shotSpeed: number;
  multishot: number;
  bounce: number;
  aoeRadius: number;
  aoeDmg: number;
  slow: number;
  dot: number;
  goldMult: number;
  healOnKill: number;
  manaMult: number;
  manaRegen: number;
  manaMax: number;
  manaOnKill: number;
  wallHp: number;
  wallThorns: number;
  wallReflect: number;
  wallRegen: number;
}

// ─── Effetti visivi ──────────────────────────────────────────────────────────

export interface FloatText {
  x: number; y: number;
  text: string; color: string; size: number;
  life: number; max: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string; size: number;
  life: number; max: number;
}

export interface Ring {
  x: number; y: number;
  radius: number; color: string;
  life: number; max: number;
}

export interface Beam {
  x1: number; y1: number;
  x2: number; y2: number;
  life: number; crit: boolean;
}

export interface WaveRing {
  r: number; max: number; life: number;
}

export interface Banner {
  title: string; sub: string; color: string;
  life: number; max: number;
}

export interface FxState {
  texts: FloatText[];
  parts: Particle[];
  rings: Ring[];
  corpses: Enemy[];
  sounds: string[];
  beams: Beam[];
  waves: WaveRing[];
  shake: number;
  banner: Banner | null;
}

// ─── Nemici ──────────────────────────────────────────────────────────────────

export interface ShotEffects {
  slow: number;
  dot: number;
  aoeRadius: number;
  aoeDmg: number;
  charm: number;
}

export interface ChargeConfig {
  dist: number;
  mult: number;
}

// La definizione statica del nemico (da data/enemies.js).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EnemyDef = Record<string, any>;

export interface Enemy {
  id: number;               // id univoco per hitIds
  x: number; y: number;
  hp: number; maxHp: number;
  size: number;
  speed: number;
  atk: number;
  range: number;
  armor: number;
  dead: boolean;
  boss: boolean;
  age: number;
  hitFlash: number;
  lunge: number;
  attackCd: number;
  moving: boolean;
  dotT: number;
  dotDps: number;
  slowT: number;
  slowF: number;
  stunT: number;
  charmT: number;
  charging: boolean;
  wallTouching: boolean;
  charge: ChargeConfig | null;
  def: EnemyDef;
  bonusPending?: boolean;
}

// ─── Colpi ───────────────────────────────────────────────────────────────────

export interface Shot {
  x: number; y: number;
  target: Enemy;
  dmg: number;
  speed: number;
  bounces: number;
  hitIds: Set<number>;
  effects: ShotEffects;
  kind: string;
  pierce: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EnemyShot = Record<string, any>;

// ─── Carte ───────────────────────────────────────────────────────────────────

export interface CardPick {
  id: string;
  m: number;  // power multiplier al momento della scelta
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CardDef = Record<string, any>;

// ─── Alleati ─────────────────────────────────────────────────────────────────

export interface Ally {
  id: string;
  level: number;
  slot: number;
  x: number; y: number;
  hp: number; maxHp: number;
  spawn: number;
  cooldown: number;
  hitFlash: number;
  dead: boolean;
}

// ─── Stato della torre ───────────────────────────────────────────────────────

export interface TowerState {
  hp: number;
  cooldown: number;
  hitFlash: number;
  recoil?: number;
}

// ─── Fase di gioco ───────────────────────────────────────────────────────────

export type Phase =
  | 'break'
  | 'wave'
  | 'ally'
  | 'cards'
  | 'over'
  | 'bomb-placement'
  | 'bonus-break'
  | 'bonus-wave';

// ─── Run (la partita completa) ───────────────────────────────────────────────

export interface Run {
  meta: Meta;
  hero: string;
  weapon: string | null;
  phase: Phase;
  breakTimer: number;
  wave: number;
  time: number;
  gold: number;
  rerolls: number;
  kills: number;
  bossesKilled: number;
  upgrades: Record<string, number>;
  cards: Record<string, number>;
  cardPicks: CardPick[];
  cardChoices: CardDef[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allies: Ally[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allyChoices: any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wall: any;
  abilityCd: Record<string, number>;
  mana: number;
  tower: TowerState;
  stats: Stats;
  enemies: Enemy[];
  bombs: any[];
  bombPenalty: number;
  bombsLeft?: number;
  bombsPlacedQuadro?: number;
  shots: Shot[];
  enemyShots: EnemyShot[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spawnQueue: any[];
  boss: Enemy | null;
  slowTowerT: number;
  fx: FxState;
  healFull: boolean;
  // modalità scarto carte
  isHeavyMalus?: boolean;
  discarding?: boolean;
  pendingPick?: { card: CardDef };
  lastOffer?: string[];
  // bonus stage
  bonusPending?: boolean;
  bonusStage?: boolean;
  bonusWaveIdx?: number;
  bonusBreakTimer?: number;
  // sblocco personaggio
  newHero?: string | null;
}
