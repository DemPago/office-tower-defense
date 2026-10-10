// Oggetti di scena in pixel art HD, riusati dai vari scenari.
// Le coordinate sono in pixel del mondo, ma gli sfondi sono disegnati a risoluzione
// doppia: si può (e si deve) disegnare a passi di mezzo pixel per i dettagli.
// Tutte le funzioni ricevono il contesto e la posizione (x, y = base dell'oggetto).
import { PAL, SPRAY, FONT, shade } from './palette.js';

const H = 0.5; // mezzo pixel: lo spessore dei dettagli fini
const snap = v => Math.round(v * 2) / 2;

export function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(snap(x), snap(y), w, h);
}

// Rettangolo con bordo scuro sottile.
function framed(g, x, y, w, h, fill, edge = PAL.black) {
  rect(g, x - H, y - H, w + 1, h + 1, edge);
  rect(g, x, y, w, h, fill);
}

// Ombra morbida a terra (gli oggetti "poggiano" sul pavimento).
export function shadow(g, x, y, w, h = 3) {
  rect(g, x, y, w, h, 'rgba(0,0,0,0.22)');
  rect(g, x + 1, y + H, w - 2, h - 1, 'rgba(0,0,0,0.18)');
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
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(x, y + h - H, w, H);
  g.restore();
}

export function noise(g, area, n, colors, rnd, size = H) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(rnd() * colors.length)];
    g.fillRect(snap(area.x + rnd() * area.w), snap(area.y + rnd() * area.h), size, size);
  }
}

export function crack(g, x, y, rnd, steps = 10, color = PAL.black) {
  let a = rnd() * Math.PI * 2;
  const pts = [[x, y]];
  for (let k = 0; k < steps; k++) {
    a += (rnd() - 0.5) * 1.6;
    x += Math.cos(a) * (3 + rnd() * 3);
    y += Math.sin(a) * (3 + rnd() * 3);
    pts.push([x, y]);
    if (rnd() < 0.15) { // ramificazione
      g.strokeStyle = color;
      g.lineWidth = H;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a + 1.2) * 4, y + Math.sin(a + 1.2) * 4);
      g.stroke();
    }
  }
  for (const [lw, col, off] of [[1, 'rgba(255,255,255,0.08)', H], [H * 1.5, color, 0]]) {
    g.strokeStyle = col;
    g.lineWidth = lw;
    g.beginPath();
    pts.forEach(([px, py], i) => (i ? g.lineTo : g.moveTo).call(g, px + off, py + off));
    g.stroke();
  }
  return { x, y };
}

export function weeds(g, x, y) {
  for (const [dx, h, c] of [[0, 3.5, PAL.weed], [-1.5, 2.5, PAL.weed], [1.5, 2.5, '#4f8a35'], [-0.5, 2, '#4f8a35'], [1, 3, PAL.weed]]) {
    rect(g, x + dx, y - h, H, h, c);
  }
  rect(g, x, y - 3.5, H, H, PAL.toxic);
  rect(g, x + 1.5, y - 2.5, H, H, PAL.toxic);
}

export function stain(g, x, y, w, h, color = 'rgba(0,0,0,0.3)') {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  g.fill();
}

export function puddle(g, x, y, w, h, color = '#3d4a57', hi = '#6f8597') {
  stain(g, x, y + H, w + 0.5, h + 0.5, 'rgba(0,0,0,0.35)');
  stain(g, x, y, w, h, color);
  stain(g, x - w * 0.2, y - h * 0.2, w * 0.55, h * 0.45, shade(color, 1.12));
  rect(g, x - w / 2, y - h / 3, Math.round(w * 0.6), H, hi);
  rect(g, x + w / 4, y + h / 4, Math.round(w * 0.3), H, hi);
  rect(g, x - w / 3, y + h / 5, 2, H, 'rgba(255,255,255,0.35)');
}

export function manhole(g, x, y) {
  stain(g, x, y, 7.5, 7.5, PAL.black);
  stain(g, x, y, 7, 7, '#45454b');
  stain(g, x, y, 6, 6, '#35353a');
  g.save();
  g.beginPath();
  g.arc(x, y, 5.5, 0, Math.PI * 2);
  g.clip();
  for (let i = -6; i <= 6; i += 1.5) rect(g, x - 6, y + i, 12, H, PAL.black);
  for (let i = -6; i <= 6; i += 3) rect(g, x + i, y - 6, H, 12, 'rgba(0,0,0,0.5)');
  g.restore();
  for (const a of [0.5, 2.1, 3.7, 5.3]) rect(g, x + Math.cos(a) * 6.3 - H / 2, y + Math.sin(a) * 6.3 - H / 2, 1, 1, PAL.grey);
  rect(g, x - 4, y - 5.5, 3, H, 'rgba(255,255,255,0.15)');
}

export function sandbag(g, x, y) {
  rect(g, x - H, y + 6.5, 12, 1.5, 'rgba(0,0,0,0.3)');
  rect(g, x + H, y - 1, 10, H, PAL.black);
  rect(g, x - H, y - H, 12, 7.5, PAL.black);
  rect(g, x + H, y + 7, 10, H, PAL.black);
  rect(g, x, y, 11, 7, PAL.sand);
  rect(g, x + H, y - H, 10, H, PAL.sand);
  rect(g, x + 1, y + H, 8, 1.5, PAL.sandHi);
  rect(g, x + 1.5, y + H, 3, H, '#d8c290');
  rect(g, x, y + 5, 11, 2, shade(PAL.sand, 0.82));
  for (let i = 1.5; i < 10; i += 1.5) rect(g, x + i, y + 3, H, H, '#7a6640'); // cucitura
  rect(g, x + 5, y + 1.5, H, 4, '#7a6640');
}

export function barrier(g, x, y) {
  rect(g, x - 1, y + 10, 23, 2, 'rgba(0,0,0,0.3)');
  framed(g, x, y, 20, 10, PAL.concreteHi);
  rect(g, x, y, 20, 1.5, '#a8a296');
  hazardStripes(g, x, y + 3, 20, 4);
  rect(g, x, y + 7, 20, 3, shade(PAL.concreteHi, 0.75));
  rect(g, x + 3, y + 8, 1, H, PAL.concreteDk); // scheggiature
  rect(g, x + 15, y + 1, 1.5, H, PAL.concreteDk);
}

export function spray(g, text, x, y, color, angle, size) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.font = `${size}px ${SPRAY}`;
  g.textAlign = 'center';
  g.globalAlpha = 0.9;
  g.fillStyle = PAL.black;
  g.fillText(text, 0.75, 0.75);
  g.fillStyle = color;
  g.fillText(text, 0, 0);
  // colature e spruzzi di vernice
  g.fillRect(-size * 1.6, 2, H, 4);
  g.fillRect(size * 0.4, 3, H, 6);
  g.fillRect(size * 1.2, 2, H, 3);
  for (let i = 0; i < 6; i++) g.fillRect(-size * 2 + i * size * 0.8, -size * 0.9 + (i % 2), H, H);
  g.restore();
}

export function cone(g, x, y) {
  shadow(g, x - 3, y + 1, 10, 2);
  rect(g, x - 4.5, y - 1.5, 10, 3, PAL.black);
  rect(g, x - 4, y - 1, 9, 2, '#c4521a');
  rect(g, x - 4, y - 1, 9, H, PAL.orange);
  rect(g, x - 2.5, y - 9.5, 6, 9, PAL.black);
  rect(g, x - 2, y - 9, 5, 8, PAL.orange);
  rect(g, x - 1.5, y - 10, 4, H, PAL.black);
  rect(g, x + 1.5, y - 9, 1.5, 8, '#c4521a');  // lato in ombra
  rect(g, x - 2, y - 9, 1, 8, '#f58a4a');       // lato in luce
  rect(g, x - 2, y - 6, 5, 1.5, PAL.white);     // banda riflettente
  rect(g, x - 2, y - 3.5, 5, 1, '#d8d2c0');
}

export function barrel(g, x, y, color = PAL.rust) {
  shadow(g, x - 3, y + 1, 12, 2);
  rect(g, x - 5.5, y - 13.5, 12, 16, PAL.black);
  rect(g, x - 5, y - 13, 11, 15, color);
  rect(g, x - 5, y - 13, 2, 15, shade(color, 1.35));
  rect(g, x - 3, y - 13, 1, 15, shade(color, 1.15));
  rect(g, x + 3, y - 13, 2, 15, shade(color, 0.7));
  stain(g, x + H, y - 13, 5, 1.5, shade(color, 0.6));        // coperchio
  stain(g, x + H, y - 13, 3.5, 1, shade(color, 0.85));
  for (const ry of [-9, -3.5]) { rect(g, x - 5, ry + y, 11, 1, shade(color, 0.6)); rect(g, x - 5, ry + y - H, 11, H, shade(color, 1.3)); }
  rect(g, x - 1.5, y - 8, 4, 3.5, PAL.hazard);
  rect(g, x - 0.5, y - 7.5, 2, 2.5, PAL.black);
  rect(g, x - 4, y - 1, 2, 1.5, 'rgba(138,59,30,0.8)'); // ruggine
}

export function box(g, x, y, w = 11, h = 9) {
  shadow(g, x - w / 2 + 2, y + 1, w, 2);
  framed(g, x - w / 2, y - h, w, h, '#8b6a3e');
  rect(g, x - w / 2, y - h, w, 2, '#a5824f');
  rect(g, x - w / 2, y - h + 2, w, H, '#6b4a2b');            // bordo delle alette
  rect(g, x + w / 2 - 1.5, y - h, 1.5, h, '#73552f');
  rect(g, x - H, y - h, 1, h, '#c9b48a');                   // nastro adesivo
  rect(g, x - H, y - h, 1, H, '#e2d4b0');
  rect(g, x - w / 2 + 1.5, y - 3.5, 2, H, '#4a3420');       // freccia "questo lato su"
  rect(g, x - w / 2 + 2, y - 4.5, 1, 2.5, '#4a3420');
}

export function tire(g, x, y) {
  stain(g, x, y, 7.5, 4.5, PAL.black);
  stain(g, x, y, 7, 4, '#1d1d20');
  for (let a = 0; a < Math.PI * 2; a += 0.45) rect(g, x + Math.cos(a) * 6, y + Math.sin(a) * 3.5, H, H, '#3a3a40'); // battistrada
  stain(g, x, y, 3, 1.5, PAL.asphalt);
  rect(g, x - 4, y - 3, 3, H, 'rgba(255,255,255,0.12)');
}

export function trash(g, x, y, rnd) {
  const n = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const tx = x + Math.floor(rnd() * 10 - 5), ty = y + Math.floor(rnd() * 6 - 3), r = rnd();
    if (r < 0.4) { // carta appallottolata
      rect(g, tx - H, ty - H, 3.5, 2.5, 'rgba(0,0,0,0.35)');
      rect(g, tx, ty, 2.5, 2, PAL.white);
      rect(g, tx + 1, ty + 1, 1.5, 1, '#b8b2a0');
    } else if (r < 0.7) { // lattina
      rect(g, tx - H, ty - H, 3, 2, PAL.black);
      rect(g, tx, ty, 2, 1, PAL.red);
      rect(g, tx + 1.5, ty, H, 1, PAL.silver);
    } else { // pezzo di plastica
      rect(g, tx, ty, 2, 1.5, PAL.grey);
      rect(g, tx, ty, 2, H, PAL.silver);
    }
  }
}

export function dumpster(g, x, y) {
  shadow(g, x + 2, y + 18, 36, 4);
  framed(g, x, y, 36, 19, '#2e5b3a');
  rect(g, x, y, 36, 4, '#3f7a4e');
  rect(g, x, y, 36, H, '#5a9a6a');
  rect(g, x, y + 4, 36, H, PAL.black);
  for (let i = 4; i < 36; i += 4) { rect(g, x + i, y + 5, H, 13, '#24482e'); rect(g, x + i + H, y + 5, H, 13, '#3f7a4e'); }
  rect(g, x + 33, y + 4, 3, 15, '#24482e');
  rect(g, x + 3, y + 10, 4, 3, PAL.rust);
  rect(g, x + 26, y + 15, 3, 2, PAL.rust);
  for (const wx of [x + 2, x + 31]) { rect(g, wx, y + 18.5, 3, 2, PAL.black); rect(g, wx + H, y + 19, 2, 1, PAL.grey); }
  rect(g, x + 30, y - 3, 3, 3, PAL.white);
  rect(g, x + 4, y - 2, 4, 2, PAL.white);
  rect(g, x + 10, y - 1.5, 3, 1.5, PAL.red);
  spray(g, 'X', x + 18, y + 15, PAL.pink, 0.2, 9);
}

// Auto vista dall'alto (verticale). broken = rottame.
export function car(g, x, y, color, broken = false, rnd = Math.random) {
  const w = 16, h = 28;
  shadow(g, x + 2, y + h - 1, w, 4);
  // ruote che spuntano agli angoli
  for (const [wx, wy] of [[-1, 4], [w - 1, 4], [-1, 20], [w - 1, 20]]) rect(g, x + wx, y + wy, 2, 4.5, '#0b0b0d');
  rect(g, x - H, y + 1, w + 1, h - 1.5, PAL.black);
  rect(g, x + 1, y - H, w - 2, h + 1, PAL.black);
  rect(g, x, y + 1, w, h - 2, color);
  rect(g, x + 1, y, w - 2, h, color);
  rect(g, x, y + 2, 1.5, h - 4, shade(color, 1.3));      // fiancata in luce
  rect(g, x + w - 1.5, y + 2, 1.5, h - 4, shade(color, 0.7));
  rect(g, x + 2, y + 1, w - 4, 3, shade(color, 1.18));   // cofano
  rect(g, x + 2, y + 4, w - 4, H, shade(color, 0.8));
  // parabrezza con riflesso
  rect(g, x + 2, y + 6, w - 4, 5, broken ? '#060607' : PAL.glass);
  if (!broken) { for (let k = 0; k < 4; k++) rect(g, x + 3 + k, y + 6.5 + k, H, H, '#6f8597'); rect(g, x + 9, y + 7, 2, H, '#4b6075'); }
  else { rect(g, x + 3, y + 6.5, 3, H, PAL.grey); rect(g, x + 8, y + 9, 4, H, PAL.grey); rect(g, x + 10, y + 7, H, 3, PAL.grey); }
  rect(g, x + 2, y + 12, w - 4, 8, shade(color, 0.85));  // tetto
  rect(g, x + 3, y + 12.5, w - 6, 1, shade(color, 1.25));
  rect(g, x + 2, y + 21, w - 4, 3, broken ? '#060607' : PAL.glass); // lunotto
  rect(g, x - 1, y + 8, 1, 1.5, color);                   // specchietti
  rect(g, x + w, y + 8, 1, 1.5, color);
  rect(g, x + 1.5, y + H, 3, 1, PAL.fluo);                // fari
  rect(g, x + w - 4.5, y + H, 3, 1, PAL.fluo);
  rect(g, x + 1.5, y + h - 1.5, 3, 1, PAL.red);           // stop
  rect(g, x + w - 4.5, y + h - 1.5, 3, 1, PAL.red);
  rect(g, x + 6, y + h - 1, 4, 1, PAL.white);              // targa
  if (broken) {
    for (let i = 0; i < 8; i++) rect(g, x + rnd() * (w - 2), y + rnd() * (h - 2), 1.5, 1, i % 2 ? PAL.rust : PAL.rustHi);
    rect(g, x + w - 1.5, y + 13, 1.5, 6, PAL.black); // portiera mancante
  }
}

export function lamp(g, x, y) {
  stain(g, x + H, y + 3, 4, 1.5, 'rgba(0,0,0,0.4)');
  rect(g, x - 4, y + 2, 9, 3, PAL.black);
  rect(g, x - 3.5, y + 2.5, 8, 1, PAL.steel);
  rect(g, x - 1.5, y - 26, 3.5, 29, PAL.black);
  rect(g, x - 1, y - 26, 2.5, 28, PAL.steel);
  rect(g, x - 1, y - 26, 1, 28, PAL.grey);
  rect(g, x - 5, y - 31, 11, 6, PAL.black);
  rect(g, x - 4.5, y - 30.5, 10, 1.5, PAL.steel);
  rect(g, x - 4, y - 29, 9, 3, PAL.fluo);
  rect(g, x - 3, y - 28.5, 3, 1, '#fffbd0');
}

export function planterTree(g, x, y, dead = false) {
  shadow(g, x - 8, y + 1, 20, 3);
  framed(g, x - 9, y - 6, 18, 8, PAL.concreteHi);
  rect(g, x - 9, y - 6, 18, 1.5, '#a8a296');
  rect(g, x - 8, y - 4.5, 16, 2, '#3a2a1c'); // terra
  rect(g, x - 9, y, 18, 2, shade(PAL.concreteHi, 0.8));
  rect(g, x - 1, y - 16, 2, 12, PAL.wood);
  rect(g, x - 1, y - 16, H, 12, PAL.woodHi);
  if (dead) {
    for (const [dx, dy, len] of [[-5, -16, 4], [1, -19, 4], [-3, -21, 1], [2, -14, 3]]) rect(g, x + dx, y + dy, len, 1, PAL.wood);
    rect(g, x - 3, y - 21, 1, 5, PAL.wood);
    rect(g, x + 4, y - 22, H, 3, PAL.wood);
  } else {
    stain(g, x, y - 20, 9.5, 7.5, PAL.black);
    stain(g, x, y - 21, 9, 7, '#2f5a26');
    stain(g, x - 2, y - 22, 6, 4.5, PAL.weed);
    stain(g, x + 3, y - 19, 4, 3, PAL.weed);
    stain(g, x - 3, y - 24, 3, 2, '#4f8a35');
    for (let i = 0; i < 10; i++) rect(g, x - 7 + (i * 13) % 14, y - 26 + (i * 7) % 10, H, H, '#6faa45');
  }
}

export function bench(g, x, y) {
  shadow(g, x, y + 1, 22, 2);
  rect(g, x - H, y - 7.5, 23, 7, PAL.black);
  for (const [sy, c] of [[-7, PAL.woodHi], [-5, PAL.wood], [-3, PAL.woodHi]]) {
    rect(g, x, y + sy, 22, 1.5, c);
    rect(g, x, y + sy, 22, H, shade(c, 1.2));
  }
  for (const lx of [x + 2, x + 18]) { rect(g, lx, y - 1, 2, 2, PAL.black); rect(g, lx + H, y - 1, 1, 1.5, PAL.steel); }
}

export function cabinet(g, x, y, color = PAL.steel) {
  shadow(g, x + 2, y, 14, 3);
  framed(g, x, y - 22, 12, 22, color);
  rect(g, x, y - 22, 1.5, 22, shade(color, 1.3));
  rect(g, x + 10.5, y - 22, 1.5, 22, shade(color, 0.7));
  rect(g, x, y - 22, 12, H, shade(color, 1.4));
  for (let i = 0; i < 3; i++) {
    const dy = y - 21 + i * 7;
    rect(g, x + 1, dy, 10, 6, shade(color, 0.88));
    rect(g, x + 1, dy, 10, H, shade(color, 1.15));
    rect(g, x + 3, dy + 1.5, 5, 1.5, PAL.white);             // etichetta
    rect(g, x + 3.5, dy + 2, 3, H, PAL.grey);
    rect(g, x + 4.5, dy + 4, 3, 1, PAL.silver);              // maniglia
    rect(g, x + 4.5, dy + 4.5, 3, H, PAL.black);
  }
  rect(g, x + 8, y - 12, 1.5, 1, 'rgba(0,0,0,0.3)'); // ammaccatura
}

export function paperStack(g, x, y, h = 6) {
  shadow(g, x - 4, y + 1, 12, 2);
  const tabs = [PAL.red, PAL.blue, PAL.hazard, PAL.toxic];
  for (let i = 0; i < h; i++) {
    const off = (i * 7) % 3 * H;
    rect(g, x - 5.5 + off, y - i * 2 - 2.5, 11, 2.5, PAL.black);
    rect(g, x - 5 + off, y - i * 2 - 2, 10, 2, i % 3 ? PAL.white : '#cfc8b4');
    rect(g, x - 5 + off, y - i * 2 - 1, 10, H, '#b8b2a0');
    if (i % 2) rect(g, x + 4.5 + off, y - i * 2 - 2, 1.5, 1, tabs[i % 4]); // linguette colorate
  }
}

export function chair(g, x, y) {
  rect(g, x - 4.5, y - 12.5, 10, 8, PAL.black);
  rect(g, x - 4, y - 12, 9, 7, '#2a2a2e');
  rect(g, x - 4, y - 12, 9, 1, '#3a3c42');
  rect(g, x - 5.5, y - 6.5, 12, 3.5, PAL.black);
  rect(g, x - 5, y - 6, 11, 2.5, '#3a3c42');
  rect(g, x - H, y - 3, 1.5, 3, PAL.black);
  for (const dx of [-4.5, -2, 2.5, 4.5]) rect(g, x + dx, y, 1.5, 1.5, PAL.black); // rotelle
  rect(g, x - 4, y - H, 9, 1, PAL.steel);
}

export function desk(g, x, y) {
  shadow(g, x + 2, y + 1, 30, 3);
  framed(g, x, y - 12, 30, 8, PAL.woodHi);
  rect(g, x, y - 12, 30, 1.5, '#a5824f');
  for (let i = 3; i < 30; i += 7) rect(g, x + i, y - 10, 4, H, PAL.wood); // venature
  rect(g, x, y - 5, 30, 1, PAL.wood);
  rect(g, x + 1, y - 4, 2, 4, PAL.black);
  rect(g, x + 27, y - 4, 2, 4, PAL.black);
  framed(g, x + 18, y - 19, 9, 6, '#2a2a2e');                  // monitor
  rect(g, x + 19, y - 18, 7, 4, '#24364a');
  rect(g, x + 19.5, y - 17.5, 3, H, '#5a7a9a');
  rect(g, x + 21.5, y - 13, 2, 1, PAL.black);
  rect(g, x + 4, y - 11, 9, 2, '#c0c4cc');                     // tastiera
  rect(g, x + 4.5, y - 10.5, 8, H, PAL.grey);
  rect(g, x + 14, y - 11.5, 2, 2, PAL.white);                  // tazza
}

export function serverRack(g, x, y, leds) {
  const w = 16, h = 34;
  shadow(g, x + 3, y, w, 4);
  framed(g, x, y - h, w, h, '#1d2026');
  rect(g, x, y - h, 1.5, h, '#2c313a');
  rect(g, x + w - 1.5, y - h, 1.5, h, '#14161b');
  rect(g, x, y - h, w, H, '#3a404a');
  for (let i = 0; i < 7; i++) {
    const ry = y - h + 2 + i * 4.5;
    rect(g, x + 2, ry, w - 4, 3.5, '#2a2f38');
    rect(g, x + 2, ry, w - 4, H, '#3a414c');
    for (let k = 0; k < 4; k++) rect(g, x + 3 + k * 1.5, ry + 1.5, H, 1, '#11141a'); // prese d'aria
    rect(g, x + 9, ry + 1, 2, 1.5, '#11141a');
    leds.push({ x: x + 11.5, y: ry + 1, c: i % 3 === 0 ? PAL.toxic : i % 3 === 1 ? PAL.cyan : PAL.hazard });
    leds.push({ x: x + 13, y: ry + 1, c: PAL.toxic });
  }
  rect(g, x + 1, y - h + 1, H, h - 2, '#4a515c'); // maniglia della porta
}

export function container(g, x, y, color, w = 56, h = 26) {
  shadow(g, x + 4, y + h, w, 5);
  framed(g, x, y, w, h, color);
  rect(g, x, y, w, 2.5, shade(color, 1.35));
  rect(g, x, y + 2.5, w, H, shade(color, 0.7));
  for (let i = 3; i < w - 6; i += 3) {             // lamiera ondulata
    rect(g, x + i, y + 3, 1, h - 4, shade(color, 1.12));
    rect(g, x + i + 1, y + 3, H, h - 4, shade(color, 0.72));
  }
  rect(g, x + w - 6, y + 2, 5, h - 3, shade(color, 0.6));    // porte
  rect(g, x + w - 5, y + 4, H, h - 6, PAL.silver);
  rect(g, x + w - 3, y + 4, H, h - 6, PAL.silver);
  rect(g, x + 4, y + h - 3, 10, 1, shade(color, 0.5));        // scritta logistica
  for (let i = 0; i < 4; i++) rect(g, x + 6 + i * 12, y + 4 + (i * 5) % (h - 8), 2, 1.5, 'rgba(138,59,30,0.75)'); // ruggine
}

export function fence(g, x1, y1, x2, y2) {
  // rete metallica: pali ogni 16 px e maglia a rombi
  const len = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / len, dy = (y2 - y1) / len;
  g.strokeStyle = 'rgba(192,196,204,0.4)';
  g.lineWidth = H;
  for (let t = 0; t < len; t += 3) {
    g.beginPath();
    g.moveTo(x1 + dx * t, y1 + dy * t - 12);
    g.lineTo(x1 + dx * (t + 4), y1 + dy * (t + 4));
    g.moveTo(x1 + dx * (t + 4), y1 + dy * (t + 4) - 12);
    g.lineTo(x1 + dx * t, y1 + dy * t);
    g.stroke();
  }
  for (let t = 0; t <= len; t += 16) {
    rect(g, x1 + dx * t - 1, y1 + dy * t - 14.5, 2.5, 15.5, PAL.black);
    rect(g, x1 + dx * t - H, y1 + dy * t - 14, 1.5, 15, PAL.steel);
    rect(g, x1 + dx * t - H, y1 + dy * t - 14, H, 15, PAL.silver);
  }
  g.strokeStyle = PAL.grey;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x1, y1 - 13);
  g.lineTo(x2, y2 - 13);
  g.stroke();
}

export function palm(g, x, y) {
  shadow(g, x - 6, y + 1, 16, 3);
  framed(g, x - 8, y - 6, 16, 7, '#b8592a');
  rect(g, x - 8, y - 6, 16, 1.5, '#d47a44');
  rect(g, x - 7, y - 4.5, 14, 1.5, '#3a2a1c');
  for (let i = 0; i < 9; i++) {               // tronco a scaglie
    rect(g, x - 1.5, y - 7 - i * 2, 3.5, 2, i % 2 ? '#7a5a35' : '#8b6a3e');
    rect(g, x - 1.5, y - 7 - i * 2, 3.5, H, '#5a3a22');
  }
  for (const [dx, dy, len, dir] of [[-11, -26, 11, 1], [1, -27, 11, -1], [-8, -31, 7, 1], [2, -31, 7, -1], [-4, -24, 9, 0]]) {
    rect(g, x + dx, y + dy, len, 2.5, PAL.black);
    rect(g, x + dx + H, y + dy + H, len - 1, 1.5, '#3f7a2e');
    for (let k = 0; k < len; k += 1.5) rect(g, x + dx + k, y + dy + 2 + (dir ? (k % 3) * H : 0), H, 1, '#4f8a35'); // foglioline
  }
}

export function kiosk(g, x, y, color, label) {
  shadow(g, x + 2, y + 1, 34, 4);
  framed(g, x, y - 23, 34, 24, '#3a3c42');
  for (let i = 0; i < 34; i += 4) {               // tendina a strisce
    rect(g, x + i, y - 23, 4, 6, (i / 4) % 2 ? PAL.white : color);
    rect(g, x + i, y - 17.5, 4, H, shade((i / 4) % 2 ? PAL.white : color, 0.7));
  }
  framed(g, x + 3, y - 14, 28, 7, PAL.glass);
  rect(g, x + 4, y - 13.5, 6, H, '#6f8597');
  for (let i = 0; i < 6; i++) rect(g, x + 5 + i * 4, y - 10, 2, 2, [PAL.red, PAL.hazard, PAL.cyan][i % 3]); // merce
  rect(g, x, y - 6, 34, 1, PAL.steel);
  g.font = `5px ${FONT}`;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.fillText(label, x + 17, y - 1);
}

export function skylight(g, x, y, w = 30, h = 18) {
  rect(g, x - 1, y - 1, w + 2, h + 2, PAL.black);
  rect(g, x - H, y - H, w + 1, h + 1, PAL.steel);
  rect(g, x, y, w, h, '#24364a');
  for (let i = 6; i < w; i += 6) rect(g, x + i, y, 1, h, PAL.steel);
  rect(g, x, y + h / 2, w, H, PAL.steel);
  for (let i = 0; i < w; i += 6) for (let k = 0; k < 4; k++) rect(g, x + i + 1 + k, y + 1 + k, H, H, 'rgba(255,255,255,0.25)'); // riflessi
  rect(g, x + 2, y + h / 2 + 2, w - 4, H, 'rgba(255,255,255,0.08)');
}

export function acUnit(g, x, y) {
  shadow(g, x + 2, y + 1, 22, 3);
  framed(g, x, y - 14, 22, 14, PAL.steel);
  rect(g, x, y - 14, 22, 2, PAL.silver);
  rect(g, x + 20, y - 14, 2, 14, shade(PAL.steel, 0.7));
  stain(g, x + 11, y - 7, 5.5, 5.5, PAL.black);
  g.strokeStyle = PAL.grey;
  g.lineWidth = H;
  for (const r of [2, 3.5, 5]) { g.beginPath(); g.arc(x + 11, y - 7, r, 0, Math.PI * 2); g.stroke(); } // griglia
  rect(g, x + 7, y - 7.25, 8, H, PAL.grey);
  rect(g, x + 10.75, y - 11, H, 8, PAL.grey);
  for (let i = 0; i < 4; i++) rect(g, x + 1.5, y - 11 + i * 2.5, 3, H, PAL.black); // feritoie
  rect(g, x + 2, y - 2, 4, 3, 'rgba(138,59,30,0.6)');
}

// ─── Dettagli italiani ──────────────────────────────────────────

// Auto italiane viste dall'alto (verticali, muso in alto). kind: '500' | 'panda' | 'ape' | 'alfa'
export function italianCar(g, x, y, kind, color, broken = false, rnd = Math.random) {
  if (kind === 'ape') return apeCar(g, x, y, color);
  const w = kind === 'alfa' ? 16 : kind === 'panda' ? 15 : 13;
  const h = kind === 'alfa' ? 28 : kind === 'panda' ? 23 : 20;
  x += (16 - w) / 2;
  shadow(g, x + 2, y + h - 1, w, 4);
  for (const [wx, wy] of [[-1, 3], [w - 1, 3], [-1, h - 7], [w - 1, h - 7]]) rect(g, x + wx, y + wy, 2, 4, '#0b0b0d');
  if (kind === '500') {
    // 500: tutta tonda
    stain(g, x + w / 2, y + h / 2, w / 2 + 0.5, h / 2 + 0.5, PAL.black);
    stain(g, x + w / 2, y + h / 2, w / 2, h / 2, color);
    stain(g, x + w / 2 - 1.5, y + h / 2 - 2, w / 2 - 3, h / 2 - 4, shade(color, 1.18));
    stain(g, x + w / 2, y + 6, w / 2 - 2, 2.5, broken ? '#060607' : PAL.glass);       // parabrezza
    rect(g, x + w / 2 - 3, y + 5, 2, H, '#6f8597');
    rect(g, x + 3, y + 9, w - 6, 6, PAL.white);                                         // tetto in tela
    for (let i = 10; i < 15; i += 1.5) rect(g, x + 3, y + i, w - 6, H, '#cfc8b4');
    stain(g, x + w / 2, y + h - 4, w / 2 - 2.5, 1.8, broken ? '#060607' : PAL.glass);  // lunotto
    stain(g, x + 2.5, y + 1.5, 1.2, 1, PAL.fluo);                                       // fari tondi
    stain(g, x + w - 2.5, y + 1.5, 1.2, 1, PAL.fluo);
  } else {
    // Panda (squadrata) e Alfa (lunga e affusolata)
    rect(g, x - H, y + 1, w + 1, h - 1.5, PAL.black);
    rect(g, x + 1, y - H, w - 2, h + 1, PAL.black);
    rect(g, x, y + 1, w, h - 2, color);
    rect(g, x + 1, y, w - 2, h, color);
    rect(g, x, y + 2, 1.5, h - 4, shade(color, 1.3));
    rect(g, x + w - 1.5, y + 2, 1.5, h - 4, shade(color, 0.7));
    if (kind === 'panda') {
      rect(g, x, y + 2, w, 1.5, '#3a3c42');                                              // paraurti grigio
      rect(g, x + 1.5, y + 5, w - 3, 4, broken ? '#060607' : PAL.glass);
      rect(g, x + 1.5, y + 10, w - 3, 8, shade(color, 0.88));
      rect(g, x + 2, y + 11, w - 4, H, '#3a3c42');                                       // barre portapacchi
      rect(g, x + 2, y + 16, w - 4, H, '#3a3c42');
      rect(g, x + 1.5, y + 19, w - 3, 2.5, broken ? '#060607' : PAL.glass);
    } else {
      rect(g, x + 2, y + 1, w - 4, 4, shade(color, 1.15));                               // cofano lungo
      rect(g, x + w / 2 - 1.5, y, 3, 2.5, PAL.silver);                                   // scudetto Alfa
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

// Ape Piaggio: tre ruote, cabina piccola e cassone dietro
function apeCar(g, x, y, color) {
  shadow(g, x + 3, y + 25, 12, 3);
  rect(g, x + 7, y - H, 3, 2.5, '#0b0b0d');                 // ruota davanti
  rect(g, x + 1, y + 18, 2, 4, '#0b0b0d');
  rect(g, x + 13, y + 18, 2, 4, '#0b0b0d');
  stain(g, x + 8.5, y + 5, 6, 5.5, PAL.black);
  stain(g, x + 8.5, y + 5, 5.5, 5, color);                   // cabina tonda
  stain(g, x + 8.5, y + 3.5, 4, 2, PAL.glass);
  rect(g, x + 7, y + 6, 3, 2, PAL.white);
  rect(g, x + 1.5, y + 10.5, 14, 14, PAL.black);
  rect(g, x + 2, y + 11, 13, 13, shade(color, 0.85));         // cassone
  rect(g, x + 2, y + 11, 13, 1, shade(color, 1.2));
  for (let i = 0; i < 3; i++) box(g, x + 5 + i * 3.5, y + 21 - (i % 2) * 4, 5, 4); // cassette
}

// Nasone romano: fontanella di ghisa con l'acqua che scorre (l'acqua è animata a parte).
export function nasone(g, x, y) {
  shadow(g, x - 4, y + 1, 12, 2);
  stain(g, x + 1, y + 1, 6, 2, '#3d4a57');                   // pozzetto bagnato
  rect(g, x - 1, y - 2, 6, 2, PAL.black);                    // griglia di scolo
  for (let i = 0; i < 6; i += 1.5) rect(g, x - 1 + i, y - 2, H, 2, PAL.steel);
  rect(g, x - 3.5, y - 17, 7, 17, PAL.black);                // colonna di ghisa
  rect(g, x - 3, y - 16.5, 6, 16, '#2f3a33');
  rect(g, x - 3, y - 16.5, 1.5, 16, '#4a5a4f');
  rect(g, x + 1.5, y - 16.5, 1.5, 16, '#1f2622');
  rect(g, x - 3.5, y - 18, 7, 2, '#2f3a33');                 // cappello
  rect(g, x - 2.5, y - 19, 5, 1, '#3a4a40');
  rect(g, x - 2, y - 9, 4, 3, '#4a5a4f');                    // stemma SPQR
  rect(g, x - 1.5, y - 8.5, 3, 2, '#7a6a3a');
  rect(g, x + 3, y - 11, 4, 1.5, PAL.black);                 // il "naso"
  rect(g, x + 3, y - 10.5, 3.5, 1, '#3a4a40');
  return { x: x + 6.5, y: y - 10, ground: y - 1 };           // dove cade l'acqua
}

// Kebabbaro: chiosco con lo spiedo (che gira nell'animazione), insegna e sgabelli.
export function kebab(g, x, y) {
  shadow(g, x + 2, y + 1, 44, 4);
  rect(g, x - H, y - 30.5, 45, 31, PAL.black);
  rect(g, x, y - 30, 44, 30, '#6d2e1f');
  rect(g, x, y - 30, 44, 2, '#86402a');
  for (let i = 0; i < 44; i += 4) rect(g, x + i, y - 28, 4, 5, (i / 4) % 2 ? PAL.white : PAL.red); // tendina
  rect(g, x, y - 23, 44, H, PAL.black);
  rect(g, x + 2, y - 21, 40, 13, '#1c2430');                 // vetrina
  rect(g, x + 3, y - 20.5, 10, H, '#6f8597');
  rect(g, x + 25, y - 21, 6, 13, '#2a2a2e');                 // vano dello spiedo
  rect(g, x + 2, y - 8, 40, 3, PAL.steel);                   // bancone
  rect(g, x + 2, y - 8, 40, 1, PAL.silver);
  for (let i = 0; i < 3; i++) { rect(g, x + 5 + i * 5, y - 10, 3, 2, i % 2 ? PAL.toxic : PAL.red); } // salse
  rect(g, x + 2, y - 5, 40, 5, '#4a2418');
  for (const sx of [x + 6, x + 18, x + 36]) { rect(g, sx, y + 2, 4, 1.5, PAL.red); rect(g, sx + 1.5, y + 3.5, 1, 3, PAL.steel); } // sgabelli
  return { x: x + 28, y: y - 19, sign: { x: x + 22, y: y - 33 } };
}
