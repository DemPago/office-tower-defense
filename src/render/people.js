// Personaggi in pixel art disegnati via codice (niente immagini).
// Ogni "look" descrive com'è vestito un personaggio; drawPerson lo disegna
// su una griglia di 16×34 pixel (6 righe in alto servono per i cappelli).
export const GRID = { w: 16, h: 34, top: 6 };

const SKIN = { light: '#e0b08a', mid: '#c8946b', tan: '#a8704a', dark: '#7a4a2e' };

// ─── Look ───────────────────────────────────────────────────────
//   hair/hairStyle  colore e taglio: short | messy | slick | bun | long | bald | wild
//   top             giacca o maglia; shirt = colletto/camicia; tie = cravatta (o null)
//   sleeves         'short' = maniche corte (braccia nude)
//   pants, skirt    pantaloni o gonna; shoes = scarpe
//   build           normal | fat | thin
//   glasses         glasses | shades | goggles
//   facial          beard | mustache | longbeard
//   hat             hardhat | wizard | tophat | cap  (+ hatColor)
//   vest            giubbotto catarifrangente; coat = camice lungo
//   item            oggetto in mano
//   angry           faccia cattiva (i nemici); altrimenti sorride
export const LOOKS = {
  // Nemici
  stagista:   { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'messy', top: '#b9b4a6', shirt: '#b9b4a6', sleeves: 'short', pants: '#3a4a6a', shoes: '#d9d4c7', item: 'mug', lanyard: true, angry: true },
  impiegato:  { skin: SKIN.mid, hair: '#2a2a2e', hairStyle: 'short', glasses: 'glasses', top: '#55585f', shirt: '#d9d4c7', tie: '#2f4f8f', pants: '#44474e', item: 'briefcase', angry: true },
  hr:         { skin: SKIN.light, hair: '#1e1e22', hairStyle: 'bun', top: '#7a1f2b', shirt: '#e8e2d0', skirt: '#2a2a2e', shoes: '#7a1f2b', item: 'clipboard', angry: true },
  consulente: { skin: SKIN.tan, hair: '#141416', hairStyle: 'slick', glasses: 'shades', top: '#1f2a44', shirt: '#e8e2d0', tie: '#b8592a', pants: '#1f2a44', build: 'thin', item: 'phone', angry: true },
  contabile:  { skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'bald', facial: 'beard', glasses: 'glasses', top: '#5a4632', shirt: '#d9d4c7', tie: '#3e6b2a', pants: '#3a3226', build: 'fat', item: 'calculator', angry: true },
  avvocato:   { skin: SKIN.light, hair: '#8a8d93', hairStyle: 'slick', top: '#141416', shirt: '#e8e2d0', tie: '#d7263d', pants: '#141416', item: 'briefcase', itemColor: '#141416', angry: true },
  ingegnere:  { skin: SKIN.dark, hair: '#141416', hairStyle: 'short', facial: 'mustache', hat: 'hardhat', hatColor: '#e8e2d0', top: '#2f4f6f', shirt: '#2f4f6f', vest: '#e8641b', pants: '#3a4a6a', item: 'wrench', angry: true },

  tecnico:    { skin: SKIN.mid, hair: '#5a3a22', hairStyle: 'short', glasses: 'glasses', top: '#2f4f8f', shirt: '#2f4f8f', sleeves: 'short', pants: '#3a3226', item: 'cable', lanyard: true, angry: true },
  sistemista: { skin: SKIN.light, hair: '#141416', hairStyle: 'messy', facial: 'beard', top: '#3a3c42', shirt: '#3a3c42', pants: '#2a2a2e', headphones: true, item: 'keyboard', angry: true },
  venditore:  { skin: SKIN.tan, hair: '#141416', hairStyle: 'slick', top: '#4a5a6a', shirt: '#e8e2d0', tie: '#f2b705', pants: '#4a5a6a', shoes: '#5a3a22', build: 'thin', item: 'phone', angry: true },
  marketing:  { skin: SKIN.light, hair: '#d9b45a', hairStyle: 'long', glasses: 'glasses', top: '#e8641b', shirt: '#e8641b', pants: '#2a2a2e', shoes: '#d9d4c7', item: 'flyers', angry: true },
  capovendite:{ skin: SKIN.mid, hair: '#2a2a2e', hairStyle: 'slick', facial: 'mustache', top: '#5a4632', shirt: '#e8e2d0', tie: '#f2b705', pants: '#3a3226', build: 'fat', item: 'briefcase', itemColor: '#a67c00', angry: true },
  guardia:    { skin: SKIN.tan, hair: '#141416', hairStyle: 'short', hat: 'cap', hatColor: '#1f2a44', top: '#2f3f5f', shirt: '#2f3f5f', tie: '#141416', pants: '#1f2a44', item: 'baton', badge: true, angry: true },
  vigilante:  { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'short', facial: 'mustache', hat: 'cap', hatColor: '#141416', top: '#3a3c42', shirt: '#3a3c42', vest: '#c9d12e', pants: '#2a2a2e', item: 'flashlight', angry: true },
  buttafuori: { skin: SKIN.dark, hair: '#141416', hairStyle: 'bald', glasses: 'shades', top: '#141416', shirt: '#141416', sleeves: 'short', pants: '#2a2a2e', build: 'fat', angry: true },
  assistente: { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'long', top: '#d9d4c7', shirt: '#d9d4c7', pants: '#2a2a2e', build: 'thin', item: 'mug', lanyard: true, angry: true },
  segretaria: { skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'bun', glasses: 'glasses', top: '#5d275d', shirt: '#e8e2d0', skirt: '#3a3c42', shoes: '#141416', item: 'phone', angry: true },
  vicedirettore:{ skin: SKIN.light, hair: '#8a8d93', hairStyle: 'slick', top: '#141416', shirt: '#e8e2d0', tie: '#2f4f8f', pants: '#141416', build: 'fat', item: 'briefcase', itemColor: '#141416', angry: true },

  // Boss
  teamleader: { skin: SKIN.mid, hair: '#8a3b1e', hairStyle: 'short', top: '#7a1f2b', shirt: '#e8e2d0', tie: '#141416', pants: '#2a2a2e', item: 'megaphone', angry: true },
  capoarea:   { skin: SKIN.tan, hair: '#2a2a2e', hairStyle: 'bald', facial: 'mustache', top: '#3a3c42', shirt: '#d9d4c7', tie: '#a67c00', pants: '#2a2a2e', build: 'fat', item: 'phone', angry: true },
  direttore:  { skin: SKIN.light, hair: '#8a8d93', hairStyle: 'slick', top: '#1b1b1e', shirt: '#e8e2d0', tie: '#7a0f1c', pants: '#1b1b1e', build: 'fat', item: 'cigar', angry: true },
  leadership: { skin: SKIN.mid, hair: '#141416', hairStyle: 'slick', glasses: 'shades', top: '#2a2a2e', shirt: '#e8e2d0', tie: '#f2b705', pants: '#2a2a2e', item: 'phone', angry: true },
  dg:         { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'slick', glasses: 'shades', top: '#0d0d0f', shirt: '#e8e2d0', tie: '#f2b705', pants: '#0d0d0f', item: 'cigar', angry: true },
  consiglio:  { skin: SKIN.light, hair: '#8a8d93', hairStyle: 'bald', glasses: 'glasses', top: '#3a3c42', shirt: '#e8e2d0', tie: '#2f4f8f', pants: '#3a3c42', item: 'briefcase', angry: true },
  ceo:        { skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'short', glasses: 'glasses', top: '#141416', shirt: '#141416', pants: '#3a4a6a', shoes: '#d9d4c7', build: 'thin', item: 'laptop', angry: true },
  socio:      { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'bald', facial: 'mustache', glasses: 'glasses', hat: 'tophat', hatColor: '#0d0d0f', top: '#2a2a2e', shirt: '#e8e2d0', tie: '#f2b705', pants: '#2a2a2e', build: 'fat', item: 'cigar', angry: true },
  docbrown:   { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'wild', glasses: 'goggles', top: '#3a3226', shirt: '#d9d4c7', coat: '#e8e2d0', pants: '#3a3226', item: 'wrench', angry: true },
  galattico:  { skin: SKIN.mid, hair: '#c0c4cc', hairStyle: 'slick', glasses: 'shades', top: '#5d275d', shirt: '#2de2e6', tie: '#2de2e6', pants: '#3a1a3a', shoes: '#2de2e6', build: 'fat', item: 'phone', angry: true },

  // Protagonista e colleghi (rinforzi)
  player:     { skin: SKIN.mid, hair: '#141416', hairStyle: 'short', hat: 'hardhat', hatColor: '#f2b705', top: '#2f4f6f', shirt: '#2f4f6f', vest: '#f2b705', pants: '#3a4a6a' },
  pm:         { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'short', glasses: 'glasses', top: '#3a6ea5', shirt: '#e8e2d0', tie: '#141416', pants: '#2a2a2e', item: 'laptop' },
  sm:         { skin: SKIN.tan, hair: '#141416', hairStyle: 'short', hat: 'cap', hatColor: '#141416', top: '#3e6b2a', shirt: '#3e6b2a', pants: '#3a3226', item: 'crossbow' },
  dev:        { skin: SKIN.light, hair: '#8a3b1e', hairStyle: 'messy', facial: 'beard', top: '#2a2a2e', shirt: '#2a2a2e', pants: '#3a4a6a', shoes: '#d9d4c7', headphones: true, item: 'pc' },
  agile:      { skin: SKIN.mid, hair: '#e8e2d0', hairStyle: 'short', facial: 'longbeard', hat: 'wizard', hatColor: '#2f4f8f', top: '#2f4f8f', shirt: '#2f4f8f', pants: '#2f4f8f', shoes: '#d7263d', item: 'sticky' },
  scrum:      { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'short', facial: 'longbeard', hat: 'wizard', hatColor: '#7a1f2b', top: '#7a1f2b', shirt: '#7a1f2b', pants: '#7a1f2b', item: 'clipboard' },
};

// ─── Disegno ────────────────────────────────────────────────────

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// frame 0/1 = passo della camminata (gambe e braccia alternate)
export function drawPerson(g, look, frame) {
  const oy = GRID.top;
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y + oy, w, h); };

  const tw = look.build === 'fat' ? 10 : look.build === 'thin' ? 6 : 8;
  const tx = 8 - tw / 2;
  const legW = look.build === 'fat' ? 3 : 2;
  const pants = look.pants || '#2a2a2e';
  const shoes = look.shoes || '#141416';
  const liftL = frame === 1 ? 1 : 0, liftR = frame === 0 ? 1 : 0;
  const swingL = frame === 0 ? 1 : -1;

  // Gambe e scarpe (o gonna)
  const legs = [[tx + 1, liftL, -1], [tx + tw - 1 - legW, liftR, 1]];
  if (look.skirt) {
    px(tx, 19, tw, 4, look.skirt);
    px(tx - 1, 21, tw + 2, 2, look.skirt);
    for (const [lx, lift] of legs) px(lx, 23, legW, 3 - lift, look.skin);
  } else {
    for (const [lx, lift] of legs) {
      px(lx, 20, legW, 6 - lift, pants);
      px(lx, 20, 1, 6 - lift, shade(pants, 1.25));
    }
  }
  for (const [lx, lift, side] of legs) px(side < 0 ? lx - 1 : lx, 26 - lift, legW + 1, 2, shoes);

  // Camice lungo (Doc Brown) dietro le gambe
  if (look.coat) px(tx - 1, 11, tw + 2, 13, look.coat);

  // Busto: giacca con lato in ombra, colletto e cravatta
  px(tx, 11, tw, 9, look.top);
  px(tx, 11, 1, 9, shade(look.top, 1.3));
  px(tx + tw - 1, 11, 1, 9, shade(look.top, 0.7));
  px(7, 11, 2, 2, look.shirt);
  px(6, 11, 1, 1, look.shirt);
  px(9, 11, 1, 1, look.shirt);
  if (look.tie) {
    px(7, 12, 2, 1, look.tie);
    px(7, 13, 2, 4, shade(look.tie, 0.85));
    px(7, 17, 1, 1, shade(look.tie, 0.85));
  }
  if (look.coat) {
    px(tx - 1, 11, 2, 13, look.coat);
    px(tx + tw - 1, 11, 2, 13, shade(look.coat, 0.8));
  }
  if (look.vest) {
    px(tx, 11, 3, 9, look.vest);
    px(tx + tw - 3, 11, 3, 9, shade(look.vest, 0.85));
    px(tx, 16, tw, 1, '#c0c4cc');
  }
  if (look.badge) px(tx + 1, 13, 2, 2, '#f2b705');
  if (look.lanyard) {
    px(6, 12, 1, 3, '#d7263d');
    px(6, 15, 2, 2, '#e8e2d0');
  }
  px(tx, 19, tw, 1, shade(look.top, 0.6)); // cintura

  // Braccia (dondolano mentre cammina) e mani
  const armTop = look.sleeves === 'short' ? 14 : 19;
  for (const [ax, sw] of [[tx - 2, swingL], [tx + tw, -swingL]]) {
    const sleeve = look.coat || look.top;
    px(ax, 11 + sw, 2, Math.min(armTop, 19) - 11, sleeve);
    if (armTop < 19) px(ax, 14 + sw, 2, 5, look.skin);
    px(ax, 19 + sw, 2, 2, look.skin);
  }

  // Collo e testa
  px(7, 10, 2, 1, shade(look.skin, 0.8));
  px(5, 3, 6, 7, look.skin);
  px(10, 3, 1, 7, shade(look.skin, 0.85));
  px(4, 6, 1, 2, look.skin);
  px(11, 6, 1, 2, shade(look.skin, 0.85));

  // Occhi, sopracciglia, bocca
  const eye = '#141416';
  px(6, 6, 1, 1, eye);
  px(9, 6, 1, 1, eye);
  if (look.angry) {
    px(5, 4, 1, 1, eye); px(6, 5, 1, 1, eye);   // sopracciglia a "V"
    px(10, 4, 1, 1, eye); px(9, 5, 1, 1, eye);
    px(7, 8, 2, 1, '#5a1e1e');                   // smorfia
    px(6, 9, 1, 1, '#5a1e1e');
  } else {
    px(6, 8, 1, 1, '#5a1e1e');                   // sorriso
    px(7, 9, 2, 1, '#5a1e1e');
    px(9, 8, 1, 1, '#5a1e1e');
  }
  if (look.glasses === 'glasses') {
    px(5, 6, 6, 1, '#141416');
    px(6, 6, 1, 1, '#9fc3d6');
    px(9, 6, 1, 1, '#9fc3d6');
  } else if (look.glasses === 'shades') {
    px(5, 5, 6, 2, '#0d0d0f');
    px(6, 5, 1, 1, '#5b5f66');
  } else if (look.glasses === 'goggles') {
    px(4, 5, 8, 3, '#5a4632');
    px(5, 5, 2, 2, '#2de2e6');
    px(9, 5, 2, 2, '#2de2e6');
  }

  // Barba e baffi
  if (look.facial === 'beard') { px(5, 8, 6, 2, look.hair); px(6, 10, 4, 1, look.hair); px(7, 8, 2, 1, '#5a1e1e'); }
  if (look.facial === 'mustache') px(6, 7, 4, 1, look.hair);
  if (look.facial === 'longbeard') { px(5, 8, 6, 2, look.hair); px(6, 10, 4, 3, look.hair); px(7, 13, 2, 2, look.hair); }

  // Capelli
  const h = look.hair;
  const hs = look.hairStyle;
  if (hs === 'short' || hs === 'messy' || hs === 'bun' || hs === 'long') {
    px(5, 2, 6, 2, h);
    px(5, 4, 1, 1, h);
    px(10, 4, 1, 2, h);
  }
  if (hs === 'messy') { px(5, 1, 1, 1, h); px(7, 1, 1, 1, h); px(9, 1, 2, 1, h); px(4, 3, 1, 2, h); }
  if (hs === 'bun') { px(7, 0, 3, 2, h); px(4, 3, 1, 5, h); px(11, 3, 1, 5, h); }
  if (hs === 'long') { px(4, 3, 1, 8, h); px(11, 3, 1, 8, h); }
  if (hs === 'slick') { px(5, 2, 6, 2, h); px(6, 2, 2, 1, shade(h, 1.3)); px(10, 3, 1, 3, h); px(5, 4, 1, 1, h); }
  if (hs === 'bald') { px(4, 5, 1, 2, h); px(11, 5, 1, 2, h); px(6, 3, 2, 1, shade(look.skin, 1.15)); }
  if (hs === 'wild') { px(3, 0, 10, 4, h); px(2, 1, 1, 2, h); px(13, 1, 1, 2, h); px(3, 4, 2, 4, h); px(11, 4, 2, 4, h); px(5, -1, 1, 1, h); px(9, -1, 2, 1, h); }

  if (look.headphones) { px(5, 2, 6, 1, '#141416'); px(4, 5, 1, 3, '#2de2e6'); px(11, 5, 1, 3, '#2de2e6'); }

  // Cappelli
  const hc = look.hatColor;
  if (look.hat === 'hardhat') { px(5, 0, 6, 3, hc); px(3, 3, 10, 1, hc); px(6, 0, 2, 1, shade(hc, 1.2)); px(7, 1, 2, 1, shade(hc, 0.8)); }
  if (look.hat === 'cap') { px(5, 1, 6, 2, hc); px(9, 3, 4, 1, hc); }
  if (look.hat === 'tophat') { px(5, -5, 6, 7, hc); px(5, -1, 6, 1, '#7a0f1c'); px(3, 2, 10, 1, hc); }
  if (look.hat === 'wizard') {
    px(7, -6, 2, 2, hc); px(6, -4, 4, 2, hc); px(5, -2, 6, 3, hc); px(3, 1, 10, 2, hc);
    px(7, -3, 1, 1, '#f2b705'); px(8, -1, 1, 1, '#f2b705');
  }

  // Oggetto in mano (lato destro)
  const hx = tx + tw, hy = 19 - swingL;
  switch (look.item) {
    case 'briefcase':
      px(hx - 1, hy + 1, 5, 4, look.itemColor || '#6b4a2b');
      px(hx, hy, 3, 1, '#141416');
      px(hx + 1, hy + 2, 1, 1, '#a67c00');
      break;
    case 'mug':
      px(hx, hy - 2, 2, 3, '#e8e2d0'); px(hx + 2, hy - 1, 1, 1, '#e8e2d0'); px(hx, hy - 2, 2, 1, '#5a3a22');
      break;
    case 'clipboard':
      px(hx, hy - 5, 3, 6, '#6b4a2b'); px(hx, hy - 4, 3, 4, '#e8e2d0'); px(hx + 1, hy - 5, 1, 1, '#8a8d93');
      break;
    case 'phone':
      px(11, 5, 1, 3, '#141416'); px(tx + tw, 8, 2, 3, look.skin); // telefono all'orecchio
      break;
    case 'wrench':
      px(hx + 1, hy - 4, 1, 6, '#8a8d93'); px(hx, hy - 5, 3, 2, '#8a8d93');
      break;
    case 'calculator':
      px(hx, hy - 3, 3, 4, '#5b5f66'); px(hx, hy - 3, 3, 1, '#7bd332');
      break;
    case 'megaphone':
      px(hx, 9, 2, 3, '#e8e2d0'); px(hx + 2, 8, 2, 5, '#d7263d'); px(tx + tw, 12, 2, 3, look.skin);
      break;
    case 'laptop':
      px(hx - 2, hy - 1, 5, 1, '#c0c4cc'); px(hx - 2, hy - 4, 5, 3, '#5b5f66'); px(hx - 1, hy - 3, 3, 1, '#2de2e6');
      break;
    case 'pc':
      px(hx - 1, hy - 4, 4, 4, '#8a8d93'); px(hx, hy - 3, 2, 2, '#2de2e6');
      break;
    case 'crossbow':
      px(hx - 3, 15, 6, 1, '#6b4a2b'); px(hx + 2, 13, 1, 5, '#6b4a2b'); px(hx + 3, 14, 1, 3, '#e8e2d0');
      break;
    case 'cigar':
      px(9, 8, 3, 1, '#6b4a2b'); px(12, 8, 1, 1, '#e8641b'); px(12, 6, 1, 1, '#8a8d93');
      break;
    case 'cable':
      px(hx, hy - 1, 3, 3, '#141416'); px(hx + 1, hy, 1, 1, look.skin); px(hx + 3, hy + 1, 1, 3, '#141416');
      break;
    case 'keyboard':
      px(hx - 3, hy - 1, 7, 3, '#c0c4cc'); px(hx - 2, hy, 5, 1, '#5b5f66');
      break;
    case 'flyers':
      px(hx, hy - 3, 3, 3, '#ff3e8a'); px(hx + 1, hy - 4, 3, 3, '#f2b705'); px(hx + 1, hy - 2, 1, 1, '#141416');
      break;
    case 'baton':
      px(hx + 1, hy - 3, 1, 6, '#141416'); px(hx, hy - 1, 3, 1, '#141416');
      break;
    case 'flashlight':
      px(hx, hy - 1, 3, 2, '#5b5f66'); px(hx + 3, hy - 2, 1, 4, '#fff3b0');
      break;
    case 'sticky':
      px(tx + 1, 13, 2, 2, '#f2b705'); px(tx + tw - 3, 15, 2, 2, '#ff3e8a'); px(hx, hy - 2, 2, 2, '#7bd332');
      break;
  }
}
