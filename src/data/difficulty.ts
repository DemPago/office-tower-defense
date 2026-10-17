export type DifficultyId = 'easy' | 'normal' | 'hard';

interface DifficultyDef {
  label: string;
  icon: string;
  enemyHp: number;    // moltiplicatore HP nemici
  enemyAtk: number;   // moltiplicatore ATK nemici
  enemyCount: number; // moltiplicatore numero nemici per ondata
  startGold: number;  // oro bonus/malus all'inizio
  towerHp: number;    // moltiplicatore HP torre
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyDef> = {
  easy:   { label: 'Easy',   icon: '🟢', enemyHp: 0.70, enemyAtk: 0.70, enemyCount: 0.75, startGold: +20, towerHp: 1.30 },
  normal: { label: 'Normal', icon: '🟡', enemyHp: 1.00, enemyAtk: 1.00, enemyCount: 1.00, startGold:   0, towerHp: 1.00 },
  hard:   { label: 'Hard',   icon: '🔴', enemyHp: 1.35, enemyAtk: 1.25, enemyCount: 1.20, startGold: -10, towerHp: 0.80 },
};

// Difficoltà attiva per la run in corso. Aggiornata da setDifficulty() in state.ts.
export let DIFF = DIFFICULTIES.normal;

export function setDifficulty(id: DifficultyId) {
  DIFF = DIFFICULTIES[id];
}
