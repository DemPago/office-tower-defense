// Sprite dei personaggi: generati via codice da render/people.js e messi in cache.
// Ogni sprite ha un contorno nero di 1 pixel ed esiste in versione normale e
// tutta bianca (per il lampo quando un personaggio viene colpito).
import { LOOKS, GRID, drawPerson } from './people.js';

function silhouette(src, color) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function build(lookId, frame, scale) {
  // 1) personaggio alla risoluzione base, con 1 pixel di margine per il contorno
  const base = document.createElement('canvas');
  base.width = GRID.w + 2;
  base.height = GRID.h + 2;
  const bg = base.getContext('2d');
  bg.translate(1, 1);
  drawPerson(bg, LOOKS[lookId], frame);
  // 2) contorno nero
  const out = document.createElement('canvas');
  out.width = base.width;
  out.height = base.height;
  const og = out.getContext('2d');
  const black = silhouette(base, '#0d0d0f');
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) og.drawImage(black, dx, dy);
  og.drawImage(base, 0, 0);
  if (scale === 1) return out;
  // 3) ingrandimento a pixel netti (per i boss)
  const big = document.createElement('canvas');
  big.width = out.width * scale;
  big.height = out.height * scale;
  const bg2 = big.getContext('2d');
  bg2.imageSmoothingEnabled = false;
  bg2.drawImage(out, 0, 0, big.width, big.height);
  return big;
}

export async function loadAssets() {
  const cache = new Map();
  // Restituisce lo sprite pronto: i piedi sono sul bordo in basso, al centro.
  function person(lookId, frame = 0, scale = 1, white = false) {
    const key = `${lookId}|${frame}|${scale}|${white}`;
    let s = cache.get(key);
    if (!s) {
      s = white ? silhouette(person(lookId, frame, scale), '#ffffff') : build(lookId, frame, scale);
      cache.set(key, s);
    }
    return s;
  }
  return { person };
}
