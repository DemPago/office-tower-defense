// Oggetti di scena in pixel art, riusati dai vari scenari.
// Tutte le funzioni ricevono il contesto del canvas e la posizione (x, y = base dell'oggetto).
import { PAL, SPRAY, shade } from './palette.js';

export function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

// Ombra morbida a terra (gli oggetti "poggiano" sul pavimento).
export function shadow(g, x, y, w, h = 3) {
  rect(g, x, y, w, h, 'rgba(0,0,0,0.35)');
}

export function hazardStripes(g, x, y, w, h) {
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
  g.restore();
}

export function noise(g, area, n, colors, rnd, size = 1) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(rnd() * colors.length)];
    g.fillRect(Math.floor(area.x + rnd() * area.w), Math.floor(area.y + rnd() * area.h), size, size);
  }
}

export function crack(g, x, y, rnd, steps = 10, color = PAL.black) {
  let a = rnd() * Math.PI * 2;
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5);
  for (let k = 0; k < steps; k++) {
    a += (rnd() - 0.5) * 1.6;
    x += Math.cos(a) * (3 + rnd() * 3);
    y += Math.sin(a) * (3 + rnd() * 3);
    g.lineTo(Math.round(x) + 0.5, Math.round(y) + 0.5);
  }
  g.stroke();
  return { x, y };
}

export function weeds(g, x, y) {
  rect(g, x, y - 2, 1, 3, PAL.weed);
  rect(g, x - 2, y - 1, 1, 2, PAL.weed);
  rect(g, x + 2, y - 1, 1, 2, PAL.weed);
  rect(g, x, y - 3, 1, 1, PAL.toxic);
}

export function stain(g, x, y, w, h, color = 'rgba(0,0,0,0.3)') {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  g.fill();
}

export function puddle(g, x, y, w, h, color = '#3d4a57', hi = '#6f8597') {
  stain(g, x, y, w, h, color);
  rect(g, x - w / 2, y - h / 3, Math.round(w * 0.6), 1, hi);
  rect(g, x + w / 4, y + h / 4, Math.round(w * 0.3), 1, hi);
}

export function manhole(g, x, y) {
  stain(g, x, y, 7, 7, PAL.black);
  stain(g, x, y, 6, 6, '#3a3a40');
  for (let i = -4; i <= 4; i += 3) rect(g, x - 5, y + i, 10, 1, PAL.black);
}

export function sandbag(g, x, y) {
  rect(g, x - 1, y, 13, 7, PAL.black);
  rect(g, x, y - 1, 11, 9, PAL.black);
  rect(g, x, y, 11, 7, PAL.sand);
  rect(g, x + 1, y + 1, 8, 2, PAL.sandHi);
  rect(g, x + 5, y + 2, 1, 4, '#7a6640');
}

export function barrier(g, x, y) {
  rect(g, x - 1, y - 1, 22, 12, PAL.black);
  rect(g, x, y, 20, 10, PAL.concreteHi);
  hazardStripes(g, x, y + 3, 20, 4);
  rect(g, x, y + 7, 20, 3, 'rgba(0,0,0,0.35)');
}

export function spray(g, text, x, y, color, angle, size) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.font = `${size}px ${SPRAY}`;
  g.textAlign = 'center';
  g.fillStyle = PAL.black;
  g.fillText(text, 1, 1);
  g.fillStyle = color;
  g.fillText(text, 0, 0);
  g.fillRect(-size * 1.6, 2, 1, 4);
  g.fillRect(size * 0.4, 3, 1, 6);
  g.restore();
}

export function cone(g, x, y) {
  shadow(g, x - 4, y + 1, 10, 2);
  rect(g, x - 4, y - 1, 9, 3, PAL.black);
  rect(g, x - 2, y - 9, 5, 9, PAL.black);
  rect(g, x - 3, y - 1, 7, 2, PAL.orange);
  rect(g, x - 1, y - 8, 3, 8, PAL.orange);
  rect(g, x - 1, y - 5, 3, 2, PAL.white);
}

export function barrel(g, x, y, color = PAL.rust) {
  shadow(g, x - 3, y + 1, 12, 2);
  rect(g, x - 5, y - 13, 11, 15, PAL.black);
  rect(g, x - 4, y - 12, 9, 13, color);
  rect(g, x - 3, y - 12, 2, 13, 'rgba(255,255,255,0.18)');
  rect(g, x - 4, y - 8, 9, 1, PAL.black);
  rect(g, x - 4, y - 3, 9, 1, PAL.black);
  rect(g, x - 1, y - 7, 3, 3, PAL.hazard);
}

export function box(g, x, y, w = 11, h = 9) {
  shadow(g, x - w / 2 + 2, y + 1, w, 2);
  rect(g, x - w / 2 - 1, y - h - 1, w + 2, h + 2, PAL.black);
  rect(g, x - w / 2, y - h, w, h, '#8b6a3e');
  rect(g, x - w / 2, y - h, w, 2, '#a5824f');
  rect(g, x - 0.5, y - h, 1, h, '#c9b48a');
}

export function tire(g, x, y) {
  stain(g, x, y, 7, 4, PAL.black);
  stain(g, x, y, 3, 1.5, PAL.asphalt);
}

export function trash(g, x, y, rnd) {
  const n = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const r = rnd();
    rect(g, x + Math.floor(rnd() * 10 - 5), y + Math.floor(rnd() * 6 - 3), r < 0.4 ? 3 : 2, 2, r < 0.4 ? PAL.white : r < 0.7 ? PAL.red : PAL.grey);
  }
}

export function dumpster(g, x, y) {
  shadow(g, x + 2, y + 18, 36, 4);
  rect(g, x - 1, y - 1, 38, 21, PAL.black);
  rect(g, x, y, 36, 19, '#2e5b3a');
  rect(g, x, y, 36, 4, '#3f7a4e');
  for (let i = 6; i < 36; i += 8) rect(g, x + i, y + 6, 1, 12, PAL.black);
  rect(g, x + 30, y - 3, 3, 3, PAL.white);
  rect(g, x + 4, y - 2, 4, 2, PAL.white);
  spray(g, 'X', x + 18, y + 15, PAL.pink, 0.2, 9);
}

// Auto vista dall'alto (verticale). broken = rottame.
export function car(g, x, y, color, broken = false, rnd = Math.random) {
  const w = 16, h = 28;
  shadow(g, x + 2, y + h - 1, w, 4);
  rect(g, x - 1, y - 1, w + 2, h + 2, PAL.black);
  rect(g, x, y, w, h, color);
  rect(g, x + 1, y + 1, w - 2, 3, shade(color, 1.25));          // cofano illuminato
  rect(g, x + 2, y + 6, w - 4, 5, broken ? PAL.black : PAL.glass);   // parabrezza
  rect(g, x + 2, y + 6, 3, 2, broken ? PAL.grey : '#4b6075');
  rect(g, x + 2, y + 12, w - 4, 8, shade(color, 0.8));          // tetto
  rect(g, x + 2, y + 21, w - 4, 3, broken ? PAL.black : PAL.glass);  // lunotto
  rect(g, x + 1, y, 3, 1, PAL.fluo);
  rect(g, x + w - 4, y, 3, 1, PAL.fluo);
  rect(g, x + 1, y + h - 1, 3, 1, PAL.red);
  rect(g, x + w - 4, y + h - 1, 3, 1, PAL.red);
  if (broken) {
    for (let i = 0; i < 6; i++) rect(g, x + rnd() * w, y + rnd() * h, 2, 2, PAL.rust);
  }
}

export function lamp(g, x, y) {
  rect(g, x - 1, y - 26, 3, 30, PAL.black);
  rect(g, x - 4, y + 2, 9, 3, PAL.black);
  rect(g, x - 4, y - 30, 9, 5, PAL.black);
  rect(g, x - 3, y - 29, 7, 3, PAL.fluo);
}

export function planterTree(g, x, y, dead = false) {
  shadow(g, x - 8, y + 1, 20, 3);
  rect(g, x - 9, y - 6, 18, 8, PAL.black);
  rect(g, x - 8, y - 5, 16, 6, PAL.concreteHi);
  rect(g, x - 8, y - 5, 16, 2, PAL.concrete);
  rect(g, x - 1, y - 16, 2, 11, PAL.wood);
  if (dead) {
    rect(g, x - 5, y - 16, 4, 1, PAL.wood);
    rect(g, x + 1, y - 19, 4, 1, PAL.wood);
    rect(g, x - 3, y - 21, 1, 5, PAL.wood);
  } else {
    stain(g, x, y - 20, 9, 7, PAL.black);
    stain(g, x, y - 21, 8, 6, PAL.weed);
    stain(g, x - 2, y - 23, 4, 3, '#4f8a35');
  }
}

export function bench(g, x, y) {
  shadow(g, x, y + 1, 22, 2);
  rect(g, x - 1, y - 7, 24, 6, PAL.black);
  rect(g, x, y - 6, 22, 2, PAL.woodHi);
  rect(g, x, y - 3, 22, 2, PAL.wood);
  rect(g, x + 2, y - 1, 2, 2, PAL.black);
  rect(g, x + 18, y - 1, 2, 2, PAL.black);
}

export function cabinet(g, x, y, color = PAL.steel) {
  shadow(g, x + 2, y, 14, 3);
  rect(g, x - 1, y - 23, 14, 24, PAL.black);
  rect(g, x, y - 22, 12, 22, color);
  rect(g, x, y - 22, 2, 22, shade(color, 1.25));
  for (let i = 0; i < 3; i++) {
    rect(g, x + 1, y - 21 + i * 7, 10, 6, shade(color, 0.85));
    rect(g, x + 5, y - 19 + i * 7, 3, 1, PAL.silver);
  }
}

export function paperStack(g, x, y, h = 6) {
  shadow(g, x - 4, y + 1, 12, 2);
  for (let i = 0; i < h; i++) {
    rect(g, x - 5 + (i % 2), y - i * 2 - 2, 10, 2, i % 3 ? PAL.white : '#cfc8b4');
  }
  rect(g, x - 5, y - h * 2, 10, 1, PAL.black);
}

export function chair(g, x, y) {
  rect(g, x - 4, y - 12, 9, 7, PAL.black);
  rect(g, x - 3, y - 11, 7, 5, '#2a2a2e');
  rect(g, x - 5, y - 6, 11, 3, PAL.black);
  rect(g, x - 4, y - 6, 9, 2, '#3a3c42');
  rect(g, x, y - 3, 1, 3, PAL.black);
  rect(g, x - 4, y, 9, 1, PAL.black);
}

export function desk(g, x, y) {
  shadow(g, x + 2, y + 1, 30, 3);
  rect(g, x - 1, y - 13, 32, 10, PAL.black);
  rect(g, x, y - 12, 30, 8, PAL.woodHi);
  rect(g, x, y - 12, 30, 2, '#a5824f');
  rect(g, x + 1, y - 4, 2, 4, PAL.black);
  rect(g, x + 27, y - 4, 2, 4, PAL.black);
  rect(g, x + 18, y - 18, 9, 6, PAL.black);
  rect(g, x + 19, y - 17, 7, 4, PAL.glass);
}

export function serverRack(g, x, y, leds) {
  const w = 16, h = 34;
  shadow(g, x + 3, y, w, 4);
  rect(g, x - 1, y - h - 1, w + 2, h + 2, PAL.black);
  rect(g, x, y - h, w, h, '#1d2026');
  rect(g, x, y - h, 2, h, '#2c313a');
  for (let i = 0; i < 7; i++) {
    const ry = y - h + 2 + i * 4.5;
    rect(g, x + 2, ry, w - 4, 3, '#2a2f38');
    rect(g, x + 3, ry + 1, 6, 1, '#11141a');
    leds.push({ x: x + 11, y: ry + 1, c: i % 3 === 0 ? PAL.toxic : i % 3 === 1 ? PAL.cyan : PAL.hazard });
    leds.push({ x: x + 13, y: ry + 1, c: PAL.toxic });
  }
}

export function container(g, x, y, color, w = 56, h = 26) {
  shadow(g, x + 4, y + h, w, 5);
  rect(g, x - 1, y - 1, w + 2, h + 2, PAL.black);
  rect(g, x, y, w, h, color);
  rect(g, x, y, w, 3, shade(color, 1.3));
  for (let i = 4; i < w; i += 4) rect(g, x + i, y + 3, 1, h - 4, shade(color, 0.75));
  rect(g, x + w - 6, y + 2, 5, h - 3, shade(color, 0.6));
}

export function fence(g, x1, y1, x2, y2) {
  // rete metallica: pali ogni 16 px e maglia a rombi
  const len = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / len, dy = (y2 - y1) / len;
  g.strokeStyle = 'rgba(192,196,204,0.45)';
  g.lineWidth = 1;
  for (let t = 0; t < len; t += 4) {
    g.beginPath();
    g.moveTo(x1 + dx * t, y1 + dy * t - 12);
    g.lineTo(x1 + dx * (t + 4), y1 + dy * (t + 4));
    g.stroke();
  }
  for (let t = 0; t <= len; t += 16) rect(g, x1 + dx * t - 1, y1 + dy * t - 14, 2, 15, PAL.steel);
  g.strokeStyle = PAL.grey;
  g.beginPath();
  g.moveTo(x1, y1 - 13);
  g.lineTo(x2, y2 - 13);
  g.stroke();
}

export function palm(g, x, y) {
  shadow(g, x - 6, y + 1, 16, 3);
  rect(g, x - 8, y - 6, 16, 7, PAL.black);
  rect(g, x - 7, y - 5, 14, 5, '#b8592a');
  rect(g, x - 1, y - 24, 3, 19, '#7a5a35');
  for (const [dx, dy, w] of [[-10, -26, 10], [1, -27, 10], [-7, -30, 6], [2, -31, 6]]) {
    rect(g, x + dx, y + dy, w, 3, PAL.black);
    rect(g, x + dx + 1, y + dy + 1, w - 2, 1, '#4f8a35');
  }
}

export function kiosk(g, x, y, color, label) {
  shadow(g, x + 2, y + 1, 34, 4);
  rect(g, x - 1, y - 23, 36, 24, PAL.black);
  rect(g, x, y - 14, 34, 14, '#3a3c42');
  for (let i = 0; i < 34; i += 6) rect(g, x + i, y - 22, 6, 6, i % 12 ? PAL.white : color);
  rect(g, x + 3, y - 12, 28, 6, PAL.glass);
  g.font = `5px "Press Start 2P", monospace`;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.fillText(label, x + 17, y - 2);
}

export function skylight(g, x, y, w = 30, h = 18) {
  rect(g, x - 1, y - 1, w + 2, h + 2, PAL.black);
  rect(g, x, y, w, h, '#24364a');
  for (let i = 6; i < w; i += 6) rect(g, x + i, y, 1, h, PAL.steel);
  rect(g, x + 2, y + 2, 4, h - 4, 'rgba(255,255,255,0.18)');
}

export function acUnit(g, x, y) {
  shadow(g, x + 2, y + 1, 22, 3);
  rect(g, x - 1, y - 15, 24, 16, PAL.black);
  rect(g, x, y - 14, 22, 14, PAL.steel);
  rect(g, x, y - 14, 22, 2, PAL.silver);
  stain(g, x + 11, y - 7, 5, 5, PAL.black);
  rect(g, x + 7, y - 7, 9, 1, PAL.grey);
  rect(g, x + 11, y - 11, 1, 9, PAL.grey);
}
