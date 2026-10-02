// Caricamento delle immagini (sprite Kenney, licenza CC0).
const CHARS = ['dark_hair', 'elder', 'green_shirt', 'purple_hair', 'red_shirt', 'worker_helmet'];
const TERRAIN = ['grass', 'path_stone', 'path_stone2', 'tree_green'];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Immagine non trovata: ' + src));
    img.src = src;
  });
}

// Versione tutta bianca dello sprite, per il lampo quando un nemico viene colpito.
function whiteSilhouette(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

export async function loadAssets() {
  const chars = {};
  await Promise.all(CHARS.map(async name => {
    const frames = await Promise.all([0, 1].map(f => loadImage(`sprites/kenney/char_${name}_f${f}.png`)));
    chars[name] = { frames, white: frames.map(whiteSilhouette) };
  }));
  const terrain = {};
  await Promise.all(TERRAIN.map(async name => {
    terrain[name] = await loadImage(`sprites/kenney/terrain/terrain_${name}.png`);
  }));
  return { chars, terrain };
}
