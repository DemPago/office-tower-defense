// Primitive di disegno pixel art condivise da tutti i prop.
// Nessuna dipendenza da props_items/props_italian — è la base dell'albero.
import { PAL, shade } from './palette.js';

type Ctx = CanvasRenderingContext2D;

export const H = 0.5;
export const snap = (v: number): number => Math.round(v * 2) / 2;

export function rect(g: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  g.fillStyle = c;
  g.fillRect(snap(x), snap(y), w, h);
}

export function framed(g: Ctx, x: number, y: number, w: number, h: number, fill: string, edge: string = PAL.black): void {
  rect(g, x - H, y - H, w + 1, h + 1, edge);
  rect(g, x, y, w, h, fill);
}

export function shadow(g: Ctx, x: number, y: number, w: number, h: number = 3): void {
  rect(g, x, y, w, h, 'rgba(0,0,0,0.22)');
  rect(g, x + 1, y + H, w - 2, h - 1, 'rgba(0,0,0,0.18)');
}

export function hazardStripes(g: Ctx, x: number, y: number, w: number, h: number): void {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = PAL.hazard;
  g.fillRect(x, y, w, h);
  g.fillStyle = PAL.black;
  for (let k = -h; k < w; k += 10) {
    g.beginPath();
    g.moveTo(x + k, y + h);
    g.lineTo(x + k + 5, y + h);
    g.lineTo(x + k + 5 + h, y);
    g.lineTo(x + k + h, y);
    g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(x, y + h - H, w, H);
  g.restore();
}

export function noise(g: Ctx, area: { x: number; y: number; w: number; h: number }, n: number, colors: string[], rnd: () => number, size: number = H): void {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(rnd() * colors.length)];
    g.fillRect(snap(area.x + rnd() * area.w), snap(area.y + rnd() * area.h), size, size);
  }
}

export function crack(g: Ctx, x: number, y: number, rnd: () => number, steps: number = 10, color: string = PAL.black): { x: number; y: number } {
  let a = rnd() * Math.PI * 2;
  const pts: [number, number][] = [[x, y]];
  for (let k = 0; k < steps; k++) {
    a += (rnd() - 0.5) * 1.6;
    x += Math.cos(a) * (3 + rnd() * 3);
    y += Math.sin(a) * (3 + rnd() * 3);
    pts.push([x, y]);
    if (rnd() < 0.15) {
      g.strokeStyle = color;
      g.lineWidth = H;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a + 1.2) * 4, y + Math.sin(a + 1.2) * 4);
      g.stroke();
    }
  }
  for (const [lw, col, off] of [[1, 'rgba(255,255,255,0.08)', H], [H * 1.5, color, 0]] as [number, string, number][]) {
    g.strokeStyle = col;
    g.lineWidth = lw;
    g.beginPath();
    pts.forEach(([px, py], i) => (i ? g.lineTo : g.moveTo).call(g, px + off, py + off));
    g.stroke();
  }
  return { x, y };
}

export function weeds(g: Ctx, x: number, y: number): void {
  for (const [dx, h, c] of [[0, 3.5, PAL.weed], [-1.5, 2.5, PAL.weed], [1.5, 2.5, '#4f8a35'], [-0.5, 2, '#4f8a35'], [1, 3, PAL.weed]] as [number, number, string][]) {
    rect(g, x + dx, y - h, H, h, c);
  }
  rect(g, x, y - 3.5, H, H, PAL.toxic);
  rect(g, x + 1.5, y - 2.5, H, H, PAL.toxic);
}

export function stain(g: Ctx, x: number, y: number, w: number, h: number, color: string = 'rgba(0,0,0,0.3)'): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  g.fill();
}

export function puddle(g: Ctx, x: number, y: number, w: number, h: number, color: string = '#3d4a57', hi: string = '#6f8597'): void {
  stain(g, x, y + H, w + 0.5, h + 0.5, 'rgba(0,0,0,0.35)');
  stain(g, x, y, w, h, color);
  stain(g, x - w * 0.2, y - h * 0.2, w * 0.55, h * 0.45, shade(color, 1.12));
  rect(g, x - w / 2, y - h / 3, Math.round(w * 0.6), H, hi);
  rect(g, x + w / 4, y + h / 4, Math.round(w * 0.3), H, hi);
  rect(g, x - w / 3, y + h / 5, 2, H, 'rgba(255,255,255,0.35)');
}
