// Recinto elettrico intorno al palazzo, a settori.
import { TOWER } from '../state.js';
import { dist, angleOf } from '../util.js';
import { burst } from './fx.js';
import { dealDamage } from './damage.js';

// Fulmina i nemici vicini alla torre, solo nei quarti di cerchio già costruiti:
// liv.1 = 0-90°, liv.2 = fino a 180°, liv.3 = fino a 270°, liv.4 = tutto il giro.
export const FENCE = { inner: 28, outer: 62 };

export function updateFence(run, dt) {
  const q = run.stats.fence;
  if (!q) return;
  const dps = run.stats.dmg * 1.2;
  for (const e of run.enemies) {
    if (e.dead) continue;
    const d = dist(e, TOWER);
    if (d < FENCE.inner || d > FENCE.outer) continue;
    if (Math.floor(angleOf(TOWER, e) / 90) >= q) continue;
    dealDamage(run, e, dps * dt, { silent: true });
    if (Math.random() < dt * 6) burst(run, e.x, e.y - 8, '#2de2e6', 3, 60);
  }
}
