// Bonus stage dopo ogni boss: attacco sushi a ondate crescenti.
// 10 → 100 → 1000 nemici, ricompensa progressiva (500K per vittoria completa).

export const BONUS_WAVES = [10, 100, 1000];
export const BONUS_GOLD  = [1_000, 10_000, 500_000];

export const SUSHI_TYPES = [
  { id: 'nigiri',  name: 'Nigiri',  speed: 78, hp: 16, atk: 3, gold: 2 }, // veloce, fragile
  { id: 'onigiri', name: 'Onigiri', speed: 48, hp: 38, atk: 5, gold: 4 }, // standard, bilanciato
  { id: 'sashimi', name: 'Sashimi', speed: 98, hp:  8, atk: 6, gold: 3 }, // velocissimo, kamikaze
  { id: 'uramaki', name: 'Uramaki', speed: 28, hp: 65, atk: 8, gold: 6 }, // lento, corazzato
];
