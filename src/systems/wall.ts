// Muro di cinta: tratti con vita intorno al cortile. I nemici a piedi si fermano a
// sfondarlo, i cecchini ci aprono brecce da lontano, i kamikaze ci esplodono contro.
// Dalle brecce si entra nel cortile. A fine ondata si ripara.
import { TOWER, YARD } from '../state.js';
import { WALL } from '../data/wall.js';
import { atkScale } from './waves.js';
import { burst, floatText, sfx, shake } from './fx.js';
import { dealDamage } from './damage.js';
import type { Run } from '../types.js';

// Crea i tratti lungo i 4 lati del cortile. Ogni tratto: { side, a, b, x, y, hp, maxHp }
// (a-b = estremi lungo il lato; x, y = centro, usato per mirare e disegnare).
export function buildWall() {
  const segs = [];
  const add = (side, from, to, fixed) => {
    const n = Math.max(1, Math.round((to - from) / WALL.segment));
    const len = (to - from) / n;
    for (let i = 0; i < n; i++) {
      const a = from + i * len, b = a + len, mid = (a + b) / 2;
      const horizontal = side === 'top' || side === 'bottom';
      segs.push({ side, a, b, x: horizontal ? mid : fixed, y: horizontal ? fixed : mid, hp: 1, maxHp: 1 });
    }
  };
  add('top', YARD.x, YARD.x + YARD.w, YARD.y - 3);
  add('bottom', YARD.x, YARD.x + YARD.w, YARD.y + YARD.h + 2);
  add('left', YARD.y, YARD.y + YARD.h, YARD.x - 3);
  add('right', YARD.y, YARD.y + YARD.h, YARD.x + YARD.w + 3);
  return segs;
}

export function wallMaxHp(run: Run): number {
  return WALL.hp * atkScale(Math.max(1, run.wave)) * (1 + run.stats.wallHp);
}

// Ripara solo i tratti ancora in piedi (fine ondata normale).
// I tratti distrutti (hp=0) restano rotti fino al prossimo macro-stage.
export function repairWall(run: Run): void {
  const max = wallMaxHp(run);
  for (const s of run.wall) { s.maxHp = max; if (s.hp > 0) s.hp = max; }
}

// Ripara tutto il muro, comprese le brecce (inizio partita e ogni 10 ondate).
export function fullRepairWall(run: Run): void {
  const max = wallMaxHp(run);
  for (const s of run.wall) { s.maxHp = max; s.hp = max; }
}

export function insideYard(p: { x: number; y: number }): boolean {
  return p.x > YARD.x && p.x < YARD.x + YARD.w && p.y > YARD.y && p.y < YARD.y + YARD.h;
}

// Il tratto di muro che sta sulla linea tra il punto p e il palazzo (o null se p è dentro).
export function segmentToward(run: Run, p: { x: number; y: number }): any {
  if (insideYard(p)) return null;
  const dx = p.x - TOWER.x, dy = p.y - TOWER.y;
  // dove il raggio dal palazzo verso p esce dal rettangolo del cortile
  const tx = dx > 0 ? (YARD.x + YARD.w - TOWER.x) / dx : dx < 0 ? (YARD.x - TOWER.x) / dx : Infinity;
  const ty = dy > 0 ? (YARD.y + YARD.h - TOWER.y) / dy : dy < 0 ? (YARD.y - TOWER.y) / dy : Infinity;
  let side, along;
  if (tx < ty) { side = dx > 0 ? 'right' : 'left'; along = TOWER.y + dy * tx; }
  else { side = dy > 0 ? 'bottom' : 'top'; along = TOWER.x + dx * ty; }
  return run.wall.find(s => s.side === side && along >= s.a && along <= s.b) || null;
}

// Confine esterno del muro (i tratti siedono fuori dal YARD di 3 px).
function insideWallPerimeter(p) {
  return p.x > YARD.x - 3 && p.x < YARD.x + YARD.w + 3 &&
         p.y > YARD.y - 3 && p.y < YARD.y + YARD.h + 2;
}

// Il nemico sta per attraversare il muro di cinta ancora in piedi?
export function blockingSegment(run: Run, e: { x: number; y: number }, nx: number, ny: number): any {
  if (insideYard(e) || !insideWallPerimeter({ x: nx, y: ny })) return null;
  const seg = segmentToward(run, e);
  return seg && seg.hp > 0 ? seg : null;
}

export function damageWall(run: Run, seg: any, amount: number, attacker: any = null): void {
  if (seg.hp <= 0) return;
  seg.hp -= amount;
  seg.hit = 0.15;
  burst(run, seg.x, seg.y, '#bfa574', 4, 55); // sabbia/calcinacci sempre visibili
  burst(run, seg.x, seg.y, '#6e6a64', 2, 40);
  // filo spinato: chi colpisce il muro si ferisce
  if (attacker && run.stats.wallThorns > 0 && attacker.range === 0) {
    dealDamage(run, attacker, run.stats.dmg * run.stats.wallThorns, { silent: true });
  }
  if (seg.hp <= 0) {
    seg.hp = 0;
    const isBoss = attacker && attacker.boss;
    burst(run, seg.x, seg.y, '#bfa574', isBoss ? 28 : 14, isBoss ? 130 : 90);
    burst(run, seg.x, seg.y, '#6e6a64', isBoss ? 16 : 8, isBoss ? 110 : 70);
    if (isBoss) {
      burst(run, seg.x, seg.y, '#d7263d', 10, 90);
      shake(run, 8);
      floatText(run, seg.x, seg.y - 18, 'SFONDATO!', '#d7263d', 11);
    } else {
      floatText(run, seg.x, seg.y - 10, 'BRECCIA!', '#ff7b1c', 8);
    }
    sfx(run, 'breach');
  }
}

// Muro autoriparante: i tratti ancora in piedi recuperano vita durante l'ondata.
export function updateWall(run: Run, dt: number): void {
  const r = run.stats.wallRegen;
  for (const s of run.wall) {
    s.hit = Math.max(0, (s.hit || 0) - dt);
    if (r > 0 && s.hp > 0) s.hp = Math.min(s.maxHp, s.hp + s.maxHp * r * dt);
  }
}

// Lastre d'acciaio: parte del colpo del cecchino torna indietro.
export function reflectChance(run: Run): number {
  return run.stats.wallReflect;
}
