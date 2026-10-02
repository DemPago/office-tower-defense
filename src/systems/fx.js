// Effetti visivi. I sistemi li "ordinano" qui, il render li disegna.
// Non cambiano le regole del gioco: si potrebbero togliere tutti.

export function floatText(run, x, y, text, color = '#fff', size = 8) {
  if (run.fx.texts.length > 80) return;
  run.fx.texts.push({ x, y, text, color, size, life: 0.9, max: 0.9 });
}

export function burst(run, x, y, color, n = 6, speed = 70) {
  for (let i = 0; i < n && run.fx.parts.length < 300; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    run.fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, color, life: 0.5, max: 0.5, size: 2 + (Math.random() * 2 | 0) });
  }
}

export function ring(run, x, y, radius, color) {
  run.fx.rings.push({ x, y, radius, color, life: 0.35, max: 0.35 });
}

export function shake(run, amount) {
  run.fx.shake = Math.max(run.fx.shake, amount);
}

export function banner(run, title, sub, color = '#fbbf24') {
  run.fx.banner = { title, sub, color, life: 2.6, max: 2.6 };
}

export function updateFx(run, dt) {
  const fx = run.fx;
  for (const t of fx.texts) { t.life -= dt; t.y -= 26 * dt; }
  fx.texts = fx.texts.filter(t => t.life > 0);
  for (const p of fx.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; }
  fx.parts = fx.parts.filter(p => p.life > 0);
  for (const r of fx.rings) r.life -= dt;
  fx.rings = fx.rings.filter(r => r.life > 0);
  fx.shake = Math.max(0, fx.shake - 30 * dt);
  if (fx.banner && (fx.banner.life -= dt) <= 0) fx.banner = null;
}
