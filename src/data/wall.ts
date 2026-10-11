// Muro di cinta del cortile: fatto a tratti, ognuno con la sua vita.
// La vita base cresce con le ondate (come il danno dei nemici); le carte "muro"
// (data/cards.js) cambiano materiale e proprietà.
export const WALL = {
  segment: 28,     // lunghezza di un tratto (pixel del mondo)
  hp: 34,          // vita di un tratto all'ondata 1 (poi × atkScale)
  sniperMult: 1.6, // i cecchini sono specialisti delle brecce
  boomMult: 4,     // un kamikaze che esplode contro il muro
};

// Materiale del muro: avanza ogni 10 ondate (quadro), le carte di muro possono
// saltare avanti o rafforzare il materiale corrente.
export function wallLook(s: { wallReflect: number; wallHp: number }, wave = 1): string {
  if (s.wallReflect > 0) return 'steel';
  const dept = Math.floor((Math.max(1, wave) - 1) / 10);
  if (dept === 0) return s.wallHp >= 0.6 ? 'iron' : 'wood';
  if (dept === 1) return s.wallHp >= 0.6 ? 'iron' : 'tin';
  if (dept === 2) return 'iron';
  if (dept === 3) return 'steel';
  return 'adamantium';
}
