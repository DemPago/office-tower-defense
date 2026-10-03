// Piccole funzioni di uso generale.

// 1234 -> "1.2K", 2500000 -> "2.5M"
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const units = ['K', 'M', 'B', 'T'];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return (n < 10 ? n.toFixed(1) : Math.floor(n)) + units[i];
}

// Angolo in gradi (0-360) del punto p visto da "from": 0 = destra, 90 = su.
export function angleOf(from, p) {
  const a = Math.atan2(-(p.y - from.y), p.x - from.x) * 180 / Math.PI;
  return (a + 360) % 360;
}

// true se l'angolo sta nello spicchio largo "width" gradi centrato su "center".
export function inArc(angle, center, width) {
  if (width >= 360) return true;
  const d = Math.abs(((angle - center + 540) % 360) - 180);
  return d <= width / 2;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
