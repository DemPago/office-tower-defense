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

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
