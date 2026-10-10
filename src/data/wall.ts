// Muro di cinta del cortile: fatto a tratti, ognuno con la sua vita.
// La vita base cresce con le ondate (come il danno dei nemici); le carte "muro"
// (data/cards.js) cambiano materiale e proprietà.
export const WALL = {
  segment: 28,     // lunghezza di un tratto (pixel del mondo)
  hp: 34,          // vita di un tratto all'ondata 1 (poi × atkScale)
  sniperMult: 1.6, // i cecchini sono specialisti delle brecce
  boomMult: 4,     // un kamikaze che esplode contro il muro
};

// Aspetto in base ai bonus presi (il più "pesante" vince).
export function wallLook(s: { wallReflect: number; wallHp: number }): string {
  if (s.wallReflect > 0) return 'steel';
  if (s.wallHp >= 0.6) return 'concrete';
  return 'sandbag';
}
