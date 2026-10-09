// Bonus stage dopo ogni boss: attacco sushi a ondate crescenti.
// 10 → 100 → 1000 nemici, ricompensa progressiva (500K per vittoria completa).

export const BONUS_WAVES = [10, 100, 1000];
export const BONUS_GOLD  = [1_000, 10_000, 500_000];

export const SUSHI_TYPES = [
  { id: 'nigiri', name: 'Nigiri',    speed: 75, hp: 18, atk: 3, gold: 2, color: '#f5e6c8', top: '#d7263d' },
  { id: 'maki',   name: 'Maki Roll', speed: 38, hp: 45, atk: 6, gold: 5, color: '#1a1a1a', top: '#7ec850' },
  { id: 'temaki', name: 'Temaki',    speed: 55, hp: 28, atk: 4, gold: 3, color: '#2a1f0e', top: '#e8806a' },
];
