// Prop specifici per lo scenario italiano e terrazze.
// Dipende da props_base e props_items.
import { PAL, FONT, shade } from './palette.js';
import { H, rect, framed, shadow, stain } from './props_base.js';
import { box, spray } from './props_items.js';

type Ctx = CanvasRenderingContext2D;

export function skylight(g: Ctx, x: number, y: number, w: number = 30, h: number = 18): void {
  rect(g, x - 1, y - 1, w + 2, h + 2, PAL.black);
  rect(g, x - H, y - H, w + 1, h + 1, PAL.steel);
  rect(g, x, y, w, h, '#24364a');
  for (let i = 6; i < w; i += 6) rect(g, x + i, y, 1, h, PAL.steel);
  rect(g, x, y + h / 2, w, H, PAL.steel);
  for (let i = 0; i < w; i += 6) for (let k = 0; k < 4; k++) rect(g, x + i + 1 + k, y + 1 + k, H, H, 'rgba(255,255,255,0.25)');
  rect(g, x + 2, y + h / 2 + 2, w - 4, H, 'rgba(255,255,255,0.08)');
}

export function acUnit(g: Ctx, x: number, y: number): void {
  shadow(g, x + 2, y + 1, 22, 3);
  framed(g, x, y - 14, 22, 14, PAL.steel);
  rect(g, x, y - 14, 22, 2, PAL.silver);
  rect(g, x + 20, y - 14, 2, 14, shade(PAL.steel, 0.7));
  stain(g, x + 11, y - 7, 5.5, 5.5, PAL.black);
  g.strokeStyle = PAL.grey;
  g.lineWidth = H;
  for (const r of [2, 3.5, 5]) { g.beginPath(); g.arc(x + 11, y - 7, r, 0, Math.PI * 2); g.stroke(); }
  rect(g, x + 7, y - 7.25, 8, H, PAL.grey);
  rect(g, x + 10.75, y - 11, H, 8, PAL.grey);
  for (let i = 0; i < 4; i++) rect(g, x + 1.5, y - 11 + i * 2.5, 3, H, PAL.black);
  rect(g, x + 2, y - 2, 4, 3, 'rgba(138,59,30,0.6)');
}

function apeCar(g: Ctx, x: number, y: number, color: string): void {
  shadow(g, x + 3, y + 25, 12, 3);
  rect(g, x + 7, y - H, 3, 2.5, '#0b0b0d');
  rect(g, x + 1, y + 18, 2, 4, '#0b0b0d');
  rect(g, x + 13, y + 18, 2, 4, '#0b0b0d');
  stain(g, x + 8.5, y + 5, 6, 5.5, PAL.black);
  stain(g, x + 8.5, y + 5, 5.5, 5, color);
  stain(g, x + 8.5, y + 3.5, 4, 2, PAL.glass);
  rect(g, x + 7, y + 6, 3, 2, PAL.white);
  rect(g, x + 1.5, y + 10.5, 14, 14, PAL.black);
  rect(g, x + 2, y + 11, 13, 13, shade(color, 0.85));
  rect(g, x + 2, y + 11, 13, 1, shade(color, 1.2));
  for (let i = 0; i < 3; i++) box(g, x + 5 + i * 3.5, y + 21 - (i % 2) * 4, 5, 4);
}

// Auto italiane viste dall'alto (verticali, muso in alto). kind: '500' | 'panda' | 'ape' | 'alfa'
export function italianCar(g: Ctx, x: number, y: number, kind: string, color: string, broken: boolean = false, rnd: () => number = Math.random): void {
  if (kind === 'ape') return apeCar(g, x, y, color);
  const w = kind === 'alfa' ? 16 : kind === 'panda' ? 15 : 13;
  const h = kind === 'alfa' ? 28 : kind === 'panda' ? 23 : 20;
  x += (16 - w) / 2;
  shadow(g, x + 2, y + h - 1, w, 4);
  for (const [wx, wy] of [[-1, 3], [w - 1, 3], [-1, h - 7], [w - 1, h - 7]] as [number, number][]) rect(g, x + wx, y + wy, 2, 4, '#0b0b0d');
  if (kind === '500') {
    stain(g, x + w / 2, y + h / 2, w / 2 + 0.5, h / 2 + 0.5, PAL.black);
    stain(g, x + w / 2, y + h / 2, w / 2, h / 2, color);
    stain(g, x + w / 2 - 1.5, y + h / 2 - 2, w / 2 - 3, h / 2 - 4, shade(color, 1.18));
    stain(g, x + w / 2, y + 6, w / 2 - 2, 2.5, broken ? '#060607' : PAL.glass);
    rect(g, x + w / 2 - 3, y + 5, 2, H, '#6f8597');
    rect(g, x + 3, y + 9, w - 6, 6, PAL.white);
    for (let i = 10; i < 15; i += 1.5) rect(g, x + 3, y + i, w - 6, H, '#cfc8b4');
    stain(g, x + w / 2, y + h - 4, w / 2 - 2.5, 1.8, broken ? '#060607' : PAL.glass);
    stain(g, x + 2.5, y + 1.5, 1.2, 1, PAL.fluo);
    stain(g, x + w - 2.5, y + 1.5, 1.2, 1, PAL.fluo);
  } else {
    rect(g, x - H, y + 1, w + 1, h - 1.5, PAL.black);
    rect(g, x + 1, y - H, w - 2, h + 1, PAL.black);
    rect(g, x, y + 1, w, h - 2, color);
    rect(g, x + 1, y, w - 2, h, color);
    rect(g, x, y + 2, 1.5, h - 4, shade(color, 1.3));
    rect(g, x + w - 1.5, y + 2, 1.5, h - 4, shade(color, 0.7));
    if (kind === 'panda') {
      rect(g, x, y + 2, w, 1.5, '#3a3c42');
      rect(g, x + 1.5, y + 5, w - 3, 4, broken ? '#060607' : PAL.glass);
      rect(g, x + 1.5, y + 10, w - 3, 8, shade(color, 0.88));
      rect(g, x + 2, y + 11, w - 4, H, '#3a3c42');
      rect(g, x + 2, y + 16, w - 4, H, '#3a3c42');
      rect(g, x + 1.5, y + 19, w - 3, 2.5, broken ? '#060607' : PAL.glass);
    } else {
      rect(g, x + 2, y + 1, w - 4, 4, shade(color, 1.15));
      rect(g, x + w / 2 - 1.5, y, 3, 2.5, PAL.silver);
      rect(g, x + w / 2 - 1, y + H, 2, 1.5, PAL.black);
      rect(g, x + 2, y + 7, w - 4, 5, broken ? '#060607' : PAL.glass);
      rect(g, x + 2, y + 13, w - 4, 8, shade(color, 0.85));
      rect(g, x + 2, y + 22, w - 4, 3, broken ? '#060607' : PAL.glass);
    }
    rect(g, x + 2.5, y + 6, 3, H, '#6f8597');
    rect(g, x + 1.5, y + H, 2.5, 1, PAL.fluo);
    rect(g, x + w - 4, y + H, 2.5, 1, PAL.fluo);
    rect(g, x + 1.5, y + h - 1.5, 2.5, 1, PAL.red);
    rect(g, x + w - 4, y + h - 1.5, 2.5, 1, PAL.red);
  }
  if (broken) for (let i = 0; i < 6; i++) rect(g, x + rnd() * (w - 2), y + rnd() * (h - 2), 1.5, 1, i % 2 ? PAL.rust : PAL.rustHi);
}

export function nasone(g: Ctx, x: number, y: number): { x: number; y: number; ground: number } {
  shadow(g, x - 4, y + 1, 12, 2);
  stain(g, x + 1, y + 1, 6, 2, '#3d4a57');
  rect(g, x - 1, y - 2, 6, 2, PAL.black);
  for (let i = 0; i < 6; i += 1.5) rect(g, x - 1 + i, y - 2, H, 2, PAL.steel);
  rect(g, x - 3.5, y - 17, 7, 17, PAL.black);
  rect(g, x - 3, y - 16.5, 6, 16, '#2f3a33');
  rect(g, x - 3, y - 16.5, 1.5, 16, '#4a5a4f');
  rect(g, x + 1.5, y - 16.5, 1.5, 16, '#1f2622');
  rect(g, x - 3.5, y - 18, 7, 2, '#2f3a33');
  rect(g, x - 2.5, y - 19, 5, 1, '#3a4a40');
  rect(g, x - 2, y - 9, 4, 3, '#4a5a4f');
  rect(g, x - 1.5, y - 8.5, 3, 2, '#7a6a3a');
  rect(g, x + 3, y - 11, 4, 1.5, PAL.black);
  rect(g, x + 3, y - 10.5, 3.5, 1, '#3a4a40');
  return { x: x + 6.5, y: y - 10, ground: y - 1 };
}

export function fireHydrant(g: Ctx, x: number, y: number): void {
  shadow(g, x - 4, y + 1, 8, 2);
  rect(g, x - 3.5, y - 1.5, 7, 2, PAL.black);
  rect(g, x - 3, y - 1.5, 6, 1.5, '#b03a10');
  rect(g, x - 2.5, y - 11, 6, 10, PAL.black);
  rect(g, x - 2, y - 10.5, 5, 9, '#cc4418');
  rect(g, x - 2, y - 10.5, 1.5, 9, '#e86030');
  rect(g, x + 1.5, y - 10.5, 1, 9, '#962e0e');
  rect(g, x - 2.5, y - 13, 6, 2.5, PAL.black);
  rect(g, x - 2, y - 12.5, 5, 2, '#b03010');
  rect(g, x - 1, y - 13.5, 3, 1, '#802010');
  for (const [bx, by] of [[-4.5, -7.5], [3, -7.5]] as [number, number][]) {
    rect(g, x + bx, y + by, 2.5, 2.5, PAL.black);
    rect(g, x + bx + 0.5, y + by + 0.5, 1.5, 1.5, '#902010');
    rect(g, x + bx + 0.5, y + by + 0.5, 0.5, 0.5, '#d07060');
  }
  rect(g, x - 1.5, y - 9, 4, 1, PAL.hazard);
}

export function vendingMachine(g: Ctx, x: number, y: number, color: string = '#1a3a6a'): void {
  shadow(g, x - 1, y + 1, 15, 3);
  rect(g, x - 1.5, y - 32.5, 16, 33, PAL.black);
  rect(g, x - 1, y - 32, 15, 32, color);
  rect(g, x - 1, y - 32, 1.5, 32, shade(color, 1.4));
  rect(g, x + 12, y - 32, 1.5, 32, shade(color, 0.6));
  rect(g, x - 1, y - 32, 15, H, shade(color, 1.5));
  rect(g, x + 2, y - 29, 10, 18, '#1c2430');
  rect(g, x + 3, y - 28.5, 3, H, '#6f8597');
  for (let row = 0; row < 3; row++) {
    const vy = y - 26 + row * 5;
    for (let col = 0; col < 2; col++) {
      const vx = x + 3 + col * 5;
      const c = [[PAL.red, PAL.toxic, '#f0a020'], [PAL.cyan, PAL.pink, PAL.hazard]][col][row];
      rect(g, vx, vy, 4, 3.5, shade(c, 0.7));
      rect(g, vx, vy, 4, H, shade(c, 1.3));
    }
  }
  rect(g, x + 2, y - 10, 10, 3, '#0a1020');
  rect(g, x + 3, y - 9, 8, 1.5, '#0f1828');
  rect(g, x + 4, y - 6, 6, 5, '#1c2430');
  rect(g, x + 5, y - 5, 4, 3, PAL.black);
  rect(g, x + 7, y - 5.5, 0.5, 3.5, shade(color, 0.8));
  rect(g, x + 3, y - 22, 3, 2, PAL.pink);
  rect(g, x + 7, y - 22, 3, 2, PAL.cyan);
  rect(g, x + 3, y - 20, 7, H, shade(color, 1.2));
}

export function kebab(g: Ctx, x: number, y: number): { x: number; y: number; sign: { x: number; y: number } } {
  shadow(g, x + 2, y + 1, 44, 4);
  rect(g, x - H, y - 30.5, 45, 31, PAL.black);
  rect(g, x, y - 30, 44, 30, '#6d2e1f');
  rect(g, x, y - 30, 44, 2, '#86402a');
  for (let i = 0; i < 44; i += 4) rect(g, x + i, y - 28, 4, 5, (i / 4) % 2 ? PAL.white : PAL.red);
  rect(g, x, y - 23, 44, H, PAL.black);
  rect(g, x + 2, y - 21, 40, 13, '#1c2430');
  rect(g, x + 3, y - 20.5, 10, H, '#6f8597');
  rect(g, x + 25, y - 21, 6, 13, '#2a2a2e');
  rect(g, x + 2, y - 8, 40, 3, PAL.steel);
  rect(g, x + 2, y - 8, 40, 1, PAL.silver);
  for (let i = 0; i < 3; i++) { rect(g, x + 5 + i * 5, y - 10, 3, 2, i % 2 ? PAL.toxic : PAL.red); }
  rect(g, x + 2, y - 5, 40, 5, '#4a2418');
  for (const sx of [x + 6, x + 18, x + 36]) { rect(g, sx, y + 2, 4, 1.5, PAL.red); rect(g, sx + 1.5, y + 3.5, 1, 3, PAL.steel); }
  return { x: x + 28, y: y - 19, sign: { x: x + 22, y: y - 33 } };
}

// Graffiti (alias di spray) — mantenuto per compatibilità retroattiva
export { spray } from './props_items.js';
