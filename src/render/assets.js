// Sprite dei personaggi: generati via codice da render/people.js e messi in cache.
// Ogni sprite ha un contorno nero di 1 pixel ed esiste in versione normale e
// tutta bianca (per il lampo quando un personaggio viene colpito).
import { LOOKS, GRID, WORLD_PER_PX, drawPerson } from './people.js';

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

function build(lookId, frame) {
  // 1) personaggio alla risoluzione della griglia, con 1 pixel di margine per il contorno
  const base = document.createElement('canvas');
  base.width = GRID.w + 2;
  base.height = GRID.h + 2;
  const bg = base.getContext('2d');
  bg.translate(1, 1);
  drawPerson(bg, LOOKS[lookId], frame);
  // 2) contorno scuro tutto intorno
  const out = document.createElement('canvas');
  out.width = base.width;
  out.height = base.height;
  const og = out.getContext('2d');
  const black = silhouette(base, '#0d0d0f');
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) og.drawImage(black, dx, dy);
  og.drawImage(base, 0, 0);
  return out;
}

export async function loadAssets() {
  const cache = new Map();
  // Restituisce { img, w, h }: l'immagine e la sua misura nel mondo di gioco
  // (scale 2 per i boss). I piedi sono sul bordo in basso, al centro.
  // tint: false = normale, true = tutto bianco (colpito), oppure un colore (es. rosso per i boss infuriati)
  function person(lookId, frame = 0, scale = 1, tint = false) {
    const key = `${lookId}|${frame}|${tint}`;
    let img = cache.get(key);
    if (!img) {
      img = tint ? silhouette(person(lookId, frame).img, tint === true ? '#ffffff' : tint) : build(lookId, frame);
      cache.set(key, img);
    }
    const k = WORLD_PER_PX * scale;
    return { img, w: img.width * k, h: img.height * k, k };
  }
  return { person };
}
