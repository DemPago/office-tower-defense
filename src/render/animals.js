// Animali in pixel art HD disegnati via codice, visti di profilo (rivolti a destra:
// quando vanno a sinistra il render li specchia). Griglia 128×80, zampe sulla riga 78.
// Ogni animale è costruito con forme tondeggianti (ellissi "a pixel") ombreggiate:
// prima la sagoma scura, poi il colore pieno, poi la luce in alto a sinistra.
// Nel mondo un pixel di questa griglia vale un quarto di pixel (vedi assets.animal).
export const AGRID = { w: 128, h: 80 };
const GROUND = 78;
const EYE = '#ff2a3d', INK = '#141416', WHITE = '#e8e2d0';

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function drawAnimal(g, A, frame) {
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  // ellisse piena "a pixel"
  const ell = (cx, cy, rx, ry, c) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const dy = (y + 0.5 - cy) / ry;
      if (Math.abs(dy) > 1) continue;
      const half = rx * Math.sqrt(1 - dy * dy);
      px(cx - half, y, half * 2, 1, c);
    }
  };
  // ellisse con volume: bordo scuro, colore, luce in alto a sinistra
  const blob = (cx, cy, rx, ry, c, light = true) => {
    ell(cx, cy, rx, ry, shade(c, 0.6));
    ell(cx - 0.5, cy - 0.8, rx - 1, ry - 1, c);
    if (light && rx > 3 && ry > 3) ell(cx - rx * 0.3, cy - ry * 0.4, rx * 0.5, ry * 0.32, shade(c, 1.22));
  };
  const tools = { px, ell, blob };
  if (A.kind === 'bird') return drawBird(tools, A, frame);
  if (A.kind === 'snake') return drawSnake(tools, A, frame);
  drawQuad(tools, A, frame);
}

// ─── Quattro zampe (cane, toro, lupo, orso, leone, ratto, gorilla, drago) ──

function drawQuad({ px, ell, blob }, A, frame) {
  const fur = A.fur, dk = shade(fur, 0.62), belly = A.belly;
  const ape = A.kind === 'ape';
  const L = A.len * 2.3, BH = A.bh * 2.1, LEG = A.leg * 2.2;
  const cx = 58, cy = GROUND - LEG - BH * 0.42;
  const swing = [4, 0, -4, 0][frame], lift = [0, 1, 0, 1][frame];
  const legW = Math.max(4, BH * 0.28);

  // una zampa: coscia, stinco, piede con artigli
  const leg = (x, len, off, far) => {
    const c = far ? dk : fur;
    blob(x, cy + BH * 0.12, legW * 0.95, BH * 0.38, c, !far);
    px(x - legW * 0.45 + off * 0.5, cy + BH * 0.25, legW * 0.85, GROUND - (cy + BH * 0.25) - 2 - (off ? lift : 0), c);
    if (!far) px(x - legW * 0.45 + off * 0.5, cy + BH * 0.25, 1, GROUND - cy - BH * 0.25 - 3, shade(fur, 1.2));
    ell(x + off * 0.5 + 1, GROUND - 1.5 - (off ? lift : 0), legW * 0.7, 2, shade(c, 0.55));
    if (!far && (A.ear === 'pointy' || A.kind === 'dragon' || A.ear === 'round')) {
      for (let k = 0; k < 3; k++) px(x + off * 0.5 + legW * 0.2 + k * 1.5, GROUND - 1, 1, 1, WHITE);
    }
  };

  // Ali del drago dietro a tutto
  if (A.kind === 'dragon') {
    const tipX = cx - L * 0.35, tipY = cy - BH * 2.2 + (frame % 2 ? 10 : 0);
    const baseL = cx - L * 0.15, baseR = cx + L * 0.28, baseY = cy - BH * 0.3;
    for (let y = Math.round(tipY); y <= baseY; y++) {
      const k = (y - tipY) / (baseY - tipY);
      const xl = tipX + (baseL - tipX) * k, xr = tipX + (baseR - tipX) * k;
      px(xl, y, xr - xl, 1, shade(fur, 1.3));
      for (const bx of [baseL, baseL + 10, baseL + 20, baseR]) px(tipX + (bx - tipX) * k, y, 1, 1, shade(fur, 0.7));
    }
    for (let x = baseL; x < baseR; x += 5) ell(x + 2, baseY, 2.5, 1.5, A.belly);
  }

  // Zampe lontane
  leg(cx - L * 0.3, LEG, -swing, true);
  leg(cx + L * 0.3, LEG, swing, true);

  // Coda
  const tc = A.tailColor || fur;
  const tx = cx - L * 0.5, ty = cy - BH * 0.15;
  if (A.tail === 'short') blob(tx - 3, ty, 5, 3, fur, false);
  if (A.tail === 'bushy') { blob(tx - 7, ty - 4, 10, 6, fur); ell(tx - 14, ty - 8, 5, 4, shade(fur, 1.4)); }
  if (A.tail === 'tuft' || A.tail === 'long') {
    const len = A.tail === 'long' ? 34 : 20;
    for (let i = 0; i < len; i++) ell(tx - i, ty + 2 + Math.sin(i / 5 + frame) * 3 + i * 0.25, A.tail === 'long' ? 2 : 1.3, A.tail === 'long' ? 2 : 1.3, tc);
    if (A.tail === 'tuft') blob(tx - len - 2, ty + 2 + Math.sin(len / 5 + frame) * 3 + len * 0.25, 4, 5, INK, false);
    if (A.kind === 'dragon') for (let i = 4; i < len; i += 6) px(tx - i, ty - 1 + Math.sin(i / 5 + frame) * 3 + i * 0.25, 2, 3, A.belly);
  }

  // Corpo: groppa, torace, petto, pancia
  blob(cx, cy, L * 0.5, BH * 0.5, fur);
  blob(cx - L * 0.32, cy - 1, BH * 0.48, BH * 0.55, fur);          // groppa
  blob(cx + L * 0.3, cy, BH * 0.5, BH * 0.62, fur);                // petto
  ell(cx + 2, cy + BH * 0.3, L * 0.34, BH * 0.18, belly);           // pancia
  for (let i = 0; i < 9; i++) px(cx - L * 0.35 + i * L * 0.08, cy - BH * 0.1 + (i % 3) * 3, 3, 1, dk); // ciuffi di pelo
  if (ape) {
    blob(cx + L * 0.25, cy - BH * 0.35, BH * 0.7, BH * 0.75, fur); // spalle enormi
    ell(cx + L * 0.3, cy, BH * 0.35, BH * 0.4, belly);              // petto chiaro
  }
  if (A.kind === 'dragon') for (let i = 0; i < L * 0.8; i += 5) px(cx - L * 0.4 + i, cy - BH * 0.5 - 2, 3, 3, A.belly); // cresta

  // Zampe vicine (il gorilla ha braccia lunghe con i pugni)
  leg(cx - L * 0.3 + 3, LEG, swing, false);
  if (ape) {
    const ax = cx + L * 0.38 + swing * 0.4;
    blob(ax, cy - 2, legW * 1.2, BH * 0.45, fur);
    px(ax - legW * 0.7, cy, legW * 1.4, GROUND - cy - 6, fur);
    px(ax - legW * 0.7, cy, 2, GROUND - cy - 6, shade(fur, 1.25));
    blob(ax + 1, GROUND - 4, legW * 1.1, 4, shade(fur, 0.75));
  } else {
    leg(cx + L * 0.3 + 3, LEG, -swing, false);
  }

  // Criniera (dietro alla testa)
  const H = A.head;
  const hw = H.w * 1.15, hh = H.h * 1.05;
  const hx = cx + L * 0.5 + (ape ? 0 : 4), hy = cy - BH * (ape ? 0.55 : 0.62);
  if (A.mane) {
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * (0.55 + i / 13 * 1.1);
      blob(hx - 2 + Math.cos(a) * hw * 0.95, hy + Math.sin(a) * hh * 0.95, 6, 6, i % 2 ? A.mane : shade(A.mane, 1.15), false);
    }
    blob(hx - 6, hy + 6, hw * 0.9, hh * 1.1, A.mane);
  }
  // Collo e testa
  if (!ape) blob(cx + L * 0.43, cy - BH * 0.35, BH * 0.32, BH * 0.45, fur);
  blob(hx, hy, hw, hh, fur);
  if (ape) { ell(hx + 2, hy + 2, hw * 0.7, hh * 0.65, A.face); px(hx - hw * 0.4, hy - hh * 0.35, hw * 1.3, 2, shade(fur, 0.5)); } // faccia e arcata
  // Muso con mascella e denti
  if (H.snout) {
    const sx = hx + hw * 0.75, sy = hy + hh * 0.3, sw = H.snout * 1.4 + 3;
    blob(sx + sw * 0.5, sy, sw, hh * 0.45, fur);
    px(sx, sy + hh * 0.3, sw * 1.4, 1.5, INK);                              // bocca
    for (let k = 0; k < 4; k++) px(sx + 2 + k * (sw * 0.3), sy + hh * 0.3 + 1, 1, 2, WHITE); // denti
    ell(sx + sw * 1.35, sy - 1, 2.5, 2, A.ring ? shade(fur, 0.4) : INK);   // naso
    if (A.ring) { ell(sx + sw * 1.3, sy + 3, 3, 3, '#f2b705'); ell(sx + sw * 1.3, sy + 3, 1.5, 1.5, fur); }
  } else if (ape) {
    px(hx, hy + hh * 0.45, hw * 0.9, 1.5, INK);
    px(hx + 1, hy + hh * 0.45 + 1, 1, 2, WHITE); px(hx + hw * 0.6, hy + hh * 0.45 + 1, 1, 2, WHITE);
  }
  // Occhio rosso cattivo, con sopracciglio aggrottato
  const ex = hx + hw * 0.35, ey = hy - hh * 0.15;
  ell(ex, ey, 2.6, 2, EYE);
  px(ex, ey - 1, 1, 1, '#ffd0d6');
  px(ex - 3, ey - 3.5, 7, 1.5, INK);
  px(ex + 3, ey - 2.5, 2, 1, INK);
  // Orecchie e corna
  if (A.ear === 'pointy') {
    for (let r = 0; r < 9; r++) px(hx - hw * 0.35 + r * 0.25, hy - hh - 6 + r, 6 - r * 0.6, 1, r < 2 ? shade(fur, 1.3) : fur);
    for (let r = 2; r < 8; r++) px(hx - hw * 0.35 + 1.5 + r * 0.25, hy - hh - 6 + r, 2, 1, '#c88a8a');
  }
  if (A.ear === 'round') { blob(hx - hw * 0.4, hy - hh * 0.85, 4, 4, fur); ell(hx - hw * 0.4, hy - hh * 0.85, 2, 2, belly); }
  if (A.ear === 'side') blob(hx - hw * 0.8, hy - 1, 5, 3, dk, false);
  if (A.horns) {
    for (const dir of [-1, 1]) {
      for (let i = 0; i < 10; i++) {
        const a = Math.PI * (dir < 0 ? 1.15 : 1.85) + dir * i * 0.12;
        ell(hx + dir * 4 + Math.cos(a) * i * 1.2, hy - hh * 0.7 - i * 1.1, 2.2 - i * 0.12, 2.2 - i * 0.12, i > 6 ? shade(WHITE, 0.8) : WHITE);
      }
    }
  }
  if (A.collar) {
    blob(cx + L * 0.43, cy - BH * 0.1, BH * 0.33, 3.5, INK, false);
    for (let i = 0; i < 5; i++) px(cx + L * 0.43 - BH * 0.28 + i * BH * 0.14, cy - BH * 0.1 - 4, 1.5, 2, '#c0c4cc'); // borchie
  }
  if (A.kind === 'dragon' && frame % 2 === 0) {
    const fx = hx + hw + H.snout * 3;
    ell(fx + 4, hy + 4, 6, 3.5, '#ff7b1c');
    ell(fx + 9, hy + 4, 4, 2.5, '#f2b705');
    ell(fx + 12, hy + 4, 2, 1.5, '#fff3b0');
  }
}

// ─── Uccello (corvo) ────────────────────────────────────────────

function drawBird({ px, ell, blob }, A, frame) {
  const fur = A.fur, sheen = A.belly;
  const y = 36 + [0, -2, 0, 2][frame];
  const up = frame % 2 === 0;
  // ala dietro
  for (let r = 0; r < 18; r++) px(46 + r * 0.6, up ? y - 22 + r : y + 2 + (18 - r) * 0.5, 28 - r * 1.2, 1, r % 3 ? fur : sheen);
  blob(36, y + 4, 9, 4, fur, false);                       // coda a ventaglio
  for (let i = 0; i < 4; i++) px(26 + i, y + 2 + i * 1.5, 6, 1, sheen);
  blob(56, y + 4, 20, 10, fur);                            // corpo
  ell(58, y + 1, 14, 3, sheen);                            // riflessi blu
  blob(78, y - 6, 10, 9, fur);                             // testa
  ell(80, y - 9, 6, 2, sheen);
  for (let i = 0; i < 10; i++) px(86 + i, y - 6 + i * 0.25, 10 - i, 2, i < 3 ? '#5b5f66' : '#3a3c42'); // becco
  ell(82, y - 7, 2, 1.8, EYE);
  px(79, y - 10, 6, 1.5, INK);
  for (const lx of [50, 60]) { px(lx, y + 13, 1.5, 12, '#3a3c42'); for (let k = -2; k <= 2; k += 2) px(lx + k, y + 25, 1.5, 1.5, '#3a3c42'); } // zampe con artigli
}

// ─── Serpente ───────────────────────────────────────────────────

function drawSnake({ px, ell, blob }, A, frame) {
  const fur = A.fur, band = A.belly;
  for (let x = 4; x < 92; x += 1.5) {
    const y = 66 + Math.sin(x / 9 + frame * 1.5) * 6;
    const r = 4 + Math.min(x, 92 - x) * 0.05;
    ell(x, y, 2.5, r, shade(fur, 0.6));
    ell(x - 0.3, y - 0.8, 2, r - 1, (Math.floor(x / 7) % 2) ? fur : band);
    px(x, y - r + 1, 1, 1, shade(fur, 1.4)); // squame lucide
  }
  // collo alzato e testa pronta a mordere
  for (let i = 0; i < 16; i++) ell(92 + i * 0.6, 62 - i * 2, 5, 3, i % 4 < 2 ? fur : band);
  blob(102, 28, 13, 8, fur);
  ell(100, 24, 8, 2, shade(fur, 1.3));
  ell(106, 25, 2.5, 2, EYE);
  px(102, 22, 7, 1.5, INK);
  px(112, 32, 8, 1, '#d7263d'); px(119, 31, 2, 1, '#d7263d'); px(119, 33, 2, 1, '#d7263d'); // lingua
  px(108, 33, 1.5, 4, WHITE); px(111, 33, 1.5, 3, WHITE);                               // zanne
}
