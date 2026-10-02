// Caricamento delle immagini (sprite Kenney, licenza CC0) e loro "sporcatura":
// colori meno saturi e più contrastati + contorno nero, per lo stile grunge.
const CHARS = ['dark_hair', 'elder', 'green_shirt', 'purple_hair', 'red_shirt', 'worker_helmet'];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Immagine non trovata: ' + src));
    img.src = src;
  });
}

// Rimpicciolisce lo sprite alla misura voluta (senza sfocare) e lo "invecchia".
function gritty(img, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    const lum = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
    for (let k = 0; k < 3; k++) {
      let v = p[i + k] * 0.6 + lum * 0.4;   // meno saturo
      v = (v - 128) * 1.2 + 118;            // più contrasto, un po' più scuro
      p[i + k] = Math.max(0, Math.min(255, v));
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// Copia tutta di un colore (per il contorno e per il lampo quando viene colpito).
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

// Aggiunge un contorno nero di 1 pixel tutto intorno.
function outlined(src) {
  const c = document.createElement('canvas');
  c.width = src.width + 2;
  c.height = src.height + 2;
  const g = c.getContext('2d');
  const black = silhouette(src, '#0d0d0f');
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(black, dx, dy);
  g.drawImage(src, 1, 1);
  return c;
}

export async function loadAssets() {
  const raw = {};
  await Promise.all(CHARS.map(async name => {
    raw[name] = await Promise.all([0, 1].map(f => loadImage(`sprites/kenney/char_${name}_f${f}.png`)));
  }));

  // Gli sprite pronti vengono preparati una volta per ogni misura e poi riusati.
  const cache = new Map();
  function sprite(char, size, frame, white = false) {
    const key = `${char}|${size}|${frame}|${white}`;
    let s = cache.get(key);
    if (!s) {
      const base = outlined(gritty(raw[char][frame], size));
      s = white ? silhouette(base, '#ffffff') : base;
      cache.set(key, s);
    }
    return s;
  }
  return { sprite };
}
