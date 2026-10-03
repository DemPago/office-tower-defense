// Animali in pixel art HD disegnati via codice, visti di profilo (rivolti a destra:
// quando vanno a sinistra il render li specchia). Griglia 64×40, zampe sulla riga 39.
// Come per i personaggi, un pixel della griglia vale mezzo pixel del mondo.
export const AGRID = { w: 64, h: 40 };
const GROUND = 39;
const EYE = '#ff2a3d', INK = '#141416', WHITE = '#e8e2d0';

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function drawAnimal(g, A, frame) {
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (A.kind === 'bird') return drawBird(px, A, frame);
  if (A.kind === 'snake') return drawSnake(px, A, frame);
  drawQuad(px, A, frame);
}

// ─── Quattro zampe (cane, toro, lupo, orso, leone, ratto, gorilla, drago) ──

function drawQuad(px, A, frame) {
  const fur = A.fur, dk = shade(fur, 0.7), lt = shade(fur, 1.3), belly = A.belly;
  const ape = A.kind === 'ape';
  const legF = ape ? A.leg + 4 : A.leg, legB = A.leg;   // il gorilla ha le braccia più lunghe
  const bottom = GROUND - legB;
  const bx0 = 32 - A.len / 2, bx1 = 32 + A.len / 2;
  const top = bottom - A.bh;
  const stride = [2, 0, -2, 0][frame];
  const legW = A.len > 28 ? 4 : 3;

  // Ali a membrana del drago (dietro al corpo): punta in alto, sbattono coi fotogrammi
  if (A.kind === 'dragon') {
    const tipX = bx0 + 3, tipY = top - 18 + (frame % 2 ? 6 : 0);
    const baseL = bx0 + 8, baseR = bx0 + 24, baseY = top + 1;
    for (let y = tipY; y <= baseY; y++) {
      const k = (y - tipY) / (baseY - tipY);
      const xl = Math.round(tipX + (baseL - tipX) * k), xr = Math.round(tipX + (baseR - tipX) * k);
      px(xl, y, Math.max(1, xr - xl), 1, shade(fur, 1.25));
      for (const bx of [baseL, baseL + 6, baseL + 11, baseR]) px(Math.round(tipX + (bx - tipX) * k), y, 1, 1, shade(fur, 0.7)); // nervature
    }
    for (let x = baseL; x < baseR; x += 4) px(x + 1, baseY - 1, 2, 2, A.belly); // bordo frastagliato
  }

  // Zampe lontane (più scure), poi coda, corpo, zampe vicine
  const legs = [
    [bx0 + 4, -stride, legB, true], [bx1 - 7, stride, legF, true],
    [bx0 + 1, stride, legB, false], [bx1 - 4, -stride, legF, false],
  ];
  for (const [lx, off, len, far] of legs.filter(l => l[3])) {
    px(lx + off, GROUND - len + 1, legW, len - 1, dk);
    px(lx + off - 1, GROUND - 1, legW + 1, 2, shade(fur, 0.5));
  }

  // Coda
  const tc = A.tailColor || fur;
  if (A.tail === 'short') px(bx0 - 3, top + 2, 4, 2, fur);
  if (A.tail === 'bushy') { px(bx0 - 6, top + 1, 7, 4, fur); px(bx0 - 9, top - 1, 5, 4, lt); px(bx0 - 10, top - 2, 3, 2, WHITE); }
  if (A.tail === 'tuft') { for (let i = 0; i < 9; i++) px(bx0 - 1 - i, top + 2 + (i >> 1), 1, 1, fur); px(bx0 - 12, top + 6, 3, 4, INK); }
  if (A.tail === 'long') {
    for (let i = 0; i < 16; i++) px(bx0 - i, top + 4 + Math.round(Math.sin(i / 3 + frame) * 2), 2, 2, tc);
    if (A.kind === 'dragon') for (let i = 2; i < 16; i += 4) px(bx0 - i, top + 2 + Math.round(Math.sin(i / 3 + frame) * 2), 1, 2, A.belly);
  }

  // Corpo arrotondato con luce sul dorso e pancia più chiara
  for (let r = 0; r < A.bh; r++) {
    const inset = r === 0 ? 3 : r === 1 ? 1 : r === A.bh - 1 ? 2 : 0;
    px(bx0 + inset, top + r, A.len - inset * 2, 1, fur);
  }
  px(bx0 + 3, top, A.len - 6, 1, lt);
  px(bx0 + 1, top + 1, A.len - 2, 1, lt);
  px(bx0 + A.len - 7, top + 2, 4, 2, lt);
  px(bx0 + 3, bottom - 3, A.len - 6, 3, belly);
  px(bx0, top + 1, 1, A.bh - 2, dk);
  if (ape) {
    // spalle enormi, petto chiaro e braccia lunghe fino a terra con i pugni
    px(bx1 - 11, top - 4, 13, A.bh + 3, fur); px(bx1 - 10, top - 3, 10, 3, lt); px(bx1 - 8, top + 4, 7, 7, belly);
    const sw = [1, 0, -1, 0][frame];
    px(bx1 - 2 + sw, top, 5, GROUND - top - 2, shade(fur, 0.85)); px(bx1 - 2 + sw, top, 1, GROUND - top - 2, lt);
    px(bx1 - 3 + sw, GROUND - 3, 7, 4, shade(fur, 0.6));
  }
  for (let i = 0; i < 6; i++) px(bx0 + 3 + i * 4, top + 4 + (i % 2) * 3, 2, 1, dk); // pelo
  if (A.mane) { px(bx1 - 9, top - 5, 10, A.bh + 4, A.mane); px(bx1 - 8, top - 6, 7, 2, shade(A.mane, 1.2)); px(bx1 - 10, top + 2, 2, 8, shade(A.mane, 0.8)); }
  if (A.kind === 'dragon') { for (let i = 0; i < A.len - 4; i += 3) px(bx0 + 2 + i, top - 2, 2, 2, A.belly); } // cresta

  for (const [lx, off, len] of legs.filter(l => !l[3])) {
    px(lx + off, GROUND - len + 1, legW, len - 1, fur);
    px(lx + off, GROUND - len + 1, 1, len - 1, lt);
    px(lx + off - (ape ? 1 : 0), GROUND - 1, legW + 1, 2, shade(fur, 0.55)); // zoccoli/zampe
    if (A.kind === 'dragon' || A.ear === 'pointy') px(lx + off + legW, GROUND, 1, 1, WHITE); // artigli
  }

  // Testa
  const H = A.head;
  const hx = bx1 - (ape ? 4 : 3), hy = top - Math.round(H.h * (ape ? 0.2 : 0.45));
  px(hx + 1, hy, H.w - 2, 1, fur);
  px(hx, hy + 1, H.w, H.h - 2, fur);
  px(hx + 1, hy + H.h - 1, H.w - 2, 1, fur);
  px(hx + 1, hy + 1, H.w - 2, 1, lt);
  px(hx + H.w - 1, hy + 1, 1, H.h - 2, dk);
  if (ape) { px(hx + 3, hy + 3, H.w - 3, H.h - 4, A.face); px(hx + 3, hy + 2, H.w - 2, 2, dk); } // faccia e arcata
  if (H.snout) {
    const sy = hy + Math.floor(H.h * 0.45);
    px(hx + H.w, sy, H.snout, H.h - Math.floor(H.h * 0.45), fur);
    px(hx + H.w, sy, H.snout, 1, lt);
    px(hx + H.w + H.snout - 2, sy, 2, 2, A.ring ? shade(fur, 0.5) : INK); // naso
    px(hx + H.w, hy + H.h - 1, H.snout, 1, shade(fur, 0.5));             // bocca
    px(hx + H.w + 1, hy + H.h - 2, 1, 1, WHITE);                         // zanne
    px(hx + H.w + H.snout - 3, hy + H.h - 2, 1, 1, WHITE);
    if (A.ring) { px(hx + H.w + H.snout - 2, sy + 2, 2, 2, '#f2b705'); }
  }
  // occhio rosso cattivo con sopracciglio
  px(hx + H.w - 4, hy + 3, 3, 2, EYE);
  px(hx + H.w - 3, hy + 3, 1, 1, '#ffd0d6');
  px(hx + H.w - 5, hy + 2, 4, 1, INK);
  // orecchie, corna
  if (A.ear === 'pointy') { px(hx + 1, hy - 4, 2, 4, fur); px(hx + 3, hy - 3, 2, 3, dk); px(hx + 1, hy - 4, 1, 1, lt); }
  if (A.ear === 'round') { px(hx + 1, hy - 2, 3, 3, fur); px(hx + 2, hy - 1, 1, 1, A.belly); }
  if (A.ear === 'side') px(hx - 1, hy + 2, 3, 2, dk);
  if (A.horns) {
    px(hx + 2, hy - 2, 2, 2, WHITE); px(hx + 1, hy - 4, 2, 2, WHITE); px(hx, hy - 6, 2, 2, shade(WHITE, 0.8));
    px(hx + 6, hy - 2, 2, 2, WHITE); px(hx + 7, hy - 4, 2, 2, WHITE); px(hx + 8, hy - 6, 2, 2, shade(WHITE, 0.8));
  }
  if (A.collar) {
    px(hx - 1, hy + H.h - 2, 4, 3, INK);
    for (let i = 0; i < 3; i++) px(hx - 1 + i * 2, hy + H.h - 3, 1, 1, '#c0c4cc'); // borchie
  }
  if (A.kind === 'dragon' && frame % 2 === 0) { px(hx + H.w + H.snout, hy + 5, 3, 2, '#ff7b1c'); px(hx + H.w + H.snout + 3, hy + 4, 2, 3, '#f2b705'); } // fiammata
}

// ─── Uccello (corvo) ────────────────────────────────────────────

function drawBird(px, A, frame) {
  const fur = A.fur, sheen = A.belly;
  const bob = [0, -1, 0, 1][frame];
  const y = 18 + bob;
  // ali: su e giù
  const up = frame % 2 === 0;
  for (let r = 0; r < 8; r++) {
    const w = 14 - r;
    if (up) px(22 + r, y - 10 + r, w, 1, r % 2 ? sheen : fur);
    else px(22 + r, y + 6 - r + 8, w, 1, r % 2 ? sheen : fur);
  }
  px(20, y, 22, 9, fur);               // corpo
  px(22, y + 1, 16, 2, sheen);
  px(14, y + 2, 7, 3, fur);            // coda
  px(12, y + 3, 3, 2, sheen);
  px(40, y - 4, 9, 9, fur);            // testa
  px(41, y - 3, 6, 1, sheen);
  px(49, y - 1, 6, 3, '#5b5f66');      // becco
  px(49, y + 1, 5, 1, '#3a3c42');
  px(45, y - 2, 2, 2, EYE);
  for (const lx of [27, 32]) { px(lx, y + 9, 1, 6, '#3a3c42'); px(lx - 1, y + 15, 3, 1, '#3a3c42'); } // zampe
}

// ─── Serpente ───────────────────────────────────────────────────

function drawSnake(px, A, frame) {
  const fur = A.fur, band = A.belly;
  for (let x = 2; x < 50; x++) {
    const y = 32 + Math.round(Math.sin(x / 5 + frame * 1.5) * 3);
    px(x, y, 1, 5, fur);
    px(x, y, 1, 1, shade(fur, 1.3));
    px(x, y + 4, 1, 1, shade(fur, 0.6));
    if (x % 6 < 2) px(x, y + 1, 1, 3, band); // anelli colorati
  }
  // testa alzata, pronta a mordere
  px(48, 22, 4, 12, fur);
  px(48, 22, 1, 12, shade(fur, 1.3));
  px(48, 18, 11, 7, fur);
  px(49, 18, 9, 1, shade(fur, 1.3));
  px(55, 19, 2, 2, EYE);
  px(59, 22, 3, 1, '#d7263d'); px(62, 21, 1, 1, '#d7263d'); px(62, 23, 1, 1, '#d7263d'); // lingua
  px(57, 24, 1, 2, WHITE); // zanna
}
