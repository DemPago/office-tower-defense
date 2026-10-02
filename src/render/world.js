// Disegno del mondo di gioco sul canvas. Legge lo stato, non lo modifica mai.
// Stile unico: pixel art (sprite Kenney + forme piatte con la palette qui sotto).
import { WORLD, TOWER } from '../state.js';

// Palette "Sweetie 16": la stessa usata in style.css.
export const PAL = {
  ink: '#1a1c2c', plum: '#5d275d', red: '#b13e53', orange: '#ef7d57',
  yellow: '#ffcd75', lime: '#a7f070', green: '#38b764', teal: '#257179',
  navy: '#29366f', blue: '#3b5dc9', sky: '#41a6f6', cyan: '#73eff7',
  white: '#f4f4f4', silver: '#94b0c2', slate: '#566c86', dark: '#333c57',
};
const FONT = '"Press Start 2P", monospace';
const MARGIN = 160; // erba disegnata anche oltre i bordi del mondo

// Misure del palazzo (la torre).
const B = { w: 60, h: 96 };
B.x0 = TOWER.x - B.w / 2;
B.base = TOWER.y + 24;
B.top = B.base - B.h;

export function createRenderer(canvas, assets) {
  const ctx = canvas.getContext('2d');
  const bg = buildBackground(assets);
  const view = { scale: 1, ox: 0, oy: 0 };
  // Fumo del palazzo danneggiato: è solo decorazione, quindi vive qui e non nello stato.
  const smoke = [];
  let lastTime = performance.now() / 1000;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    view.scale = Math.min(canvas.width / WORLD.w, canvas.height / WORLD.h);
    view.ox = (canvas.width - WORLD.w * view.scale) / 2;
    view.oy = (canvas.height - WORLD.h * view.scale) / 2;
  }

  function draw(run) {
    const time = performance.now() / 1000;
    const dt = Math.min(0.05, time - lastTime);
    lastTime = time;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.green;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shake = run ? run.fx.shake : 0;
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox + sx * view.scale, view.oy + sy * view.scale);
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(bg, -MARGIN, -MARGIN);
    drawCloudShadows(ctx, time);

    if (run) {
      drawRange(ctx, run.stats.range, time);
      for (const c of run.fx.corpses) drawCorpse(ctx, assets, c);
      for (const e of run.enemies) drawShadow(ctx, e);
    }
    drawTower(ctx, assets, run, time);
    updateSmoke(smoke, run, dt);
    drawSmoke(ctx, smoke);
    if (run) {
      // Prima i nemici più in alto, così quelli più vicini allo schermo stanno davanti.
      const sorted = [...run.enemies].sort((a, b) => a.y - b.y);
      for (const e of sorted) drawEnemy(ctx, assets, e);
      drawShots(ctx, run, time);
      drawFx(ctx, run);
    }
    drawVignette(ctx);
    if (run) {
      drawBanner(ctx, run);
      drawBossBar(ctx, run);
    }
  }

  return { resize, draw };
}

// ─── Sfondo (disegnato una volta sola) ───────────────────────────

function buildBackground(assets) {
  const c = document.createElement('canvas');
  c.width = WORLD.w + MARGIN * 2;
  c.height = WORLD.h + MARGIN * 2;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const T = 16;
  const rnd = seeded(7);
  const cx = TOWER.x + MARGIN, cy = TOWER.y + MARGIN;
  const plaza = (x, y) => Math.hypot(x - cx, (y - cy) * 1.25);

  // Erba
  for (let y = 0; y < c.height; y += T) {
    for (let x = 0; x < c.width; x += T) g.drawImage(assets.terrain.grass, x, y, T, T);
  }
  // Ciuffi d'erba chiari e scuri, per non avere una superficie piatta
  for (let i = 0; i < 1400; i++) {
    const x = Math.floor(rnd() * c.width), y = Math.floor(rnd() * c.height);
    g.fillStyle = rnd() < 0.5 ? 'rgba(37,113,121,0.35)' : 'rgba(167,240,112,0.30)';
    g.fillRect(x, y, 1, 2);
    g.fillRect(x + 2, y + 1, 1, 1);
  }
  // Macchie d'erba più scura
  for (let i = 0; i < 26; i++) {
    const x = rnd() * c.width, y = rnd() * c.height, r = 10 + rnd() * 22;
    g.fillStyle = 'rgba(37,113,121,0.16)';
    for (let k = 0; k < 18; k++) {
      const a = rnd() * Math.PI * 2, d = rnd() * r;
      g.fillRect(Math.floor(x + Math.cos(a) * d), Math.floor(y + Math.sin(a) * d * 0.6), 6, 3);
    }
  }
  // Fiori
  const flowerColors = [PAL.yellow, PAL.white, PAL.orange, PAL.cyan];
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * c.width), y = Math.floor(rnd() * c.height);
    if (plaza(x, y) < 80) continue;
    g.fillStyle = flowerColors[Math.floor(rnd() * flowerColors.length)];
    g.fillRect(x, y, 2, 2);
    g.fillRect(x + 3, y + 1, 2, 2);
    g.fillRect(x + 1, y + 3, 2, 2);
  }
  // Sassolini
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * c.width), y = Math.floor(rnd() * c.height);
    g.fillStyle = PAL.dark;
    g.fillRect(x, y + 1, 4, 2);
    g.fillStyle = PAL.silver;
    g.fillRect(x + 1, y, 2, 2);
  }

  // Piazza di pietra attorno al palazzo, con un bordo più scuro
  for (let y = 0; y < c.height; y += T) {
    for (let x = 0; x < c.width; x += T) {
      const d = plaza(x + T / 2, y + T / 2);
      if (d < 70) {
        g.drawImage(rnd() < 0.7 ? assets.terrain.path_stone : assets.terrain.path_stone2, x, y, T, T);
        if (d > 58) {
          g.fillStyle = 'rgba(26,28,44,0.28)';
          g.fillRect(x, y, T, T);
        }
      }
    }
  }
  // Aiuole ai lati della porta
  flowerBed(g, cx - 34, cy + 8, rnd);
  flowerBed(g, cx + 20, cy + 8, rnd);
  // Lampioni
  lamp(g, cx - 50, cy - 6);
  lamp(g, cx + 48, cy - 6);

  // Alberi e cespugli, lontani dal palazzo
  const trees = [];
  for (let i = 0; i < 46; i++) {
    const x = rnd() * c.width, y = rnd() * c.height;
    if (plaza(x, y) < 120) continue;
    trees.push({ x, y, s: [24, 32, 32, 40][Math.floor(rnd() * 4)], bush: rnd() < 0.3 });
  }
  trees.sort((a, b) => a.y - b.y);
  for (const t of trees) {
    const x = Math.round(t.x / 2) * 2, y = Math.round(t.y / 2) * 2;
    if (t.bush) {
      bush(g, x, y);
    } else {
      g.fillStyle = 'rgba(26,28,44,0.25)';
      g.fillRect(x + t.s * 0.2, y + t.s - 3, t.s * 0.7, 4);
      g.drawImage(assets.terrain.tree_green, x, y, t.s, t.s);
    }
  }
  return c;
}

function flowerBed(g, x, y, rnd) {
  g.fillStyle = PAL.ink;
  g.fillRect(x - 1, y - 1, 16, 9);
  g.fillStyle = PAL.plum;
  g.fillRect(x, y, 14, 7);
  g.fillStyle = PAL.green;
  g.fillRect(x + 1, y + 1, 12, 5);
  const cols = [PAL.yellow, PAL.red, PAL.white];
  for (let i = 0; i < 5; i++) {
    g.fillStyle = cols[Math.floor(rnd() * cols.length)];
    g.fillRect(x + 1 + i * 2.4 | 0, y + 1 + (i % 2) * 2, 2, 2);
  }
}

function lamp(g, x, y) {
  g.fillStyle = 'rgba(255,205,117,0.18)';
  g.fillRect(x - 6, y - 26, 14, 10);
  g.fillStyle = PAL.ink;
  g.fillRect(x, y - 22, 2, 24);
  g.fillRect(x - 2, y, 6, 2);
  g.fillRect(x - 3, y - 26, 8, 5);
  g.fillStyle = PAL.yellow;
  g.fillRect(x - 2, y - 25, 6, 3);
}

// Cespuglio tondeggiante disegnato riga per riga (larghezza di ogni riga).
const BUSH_ROWS = [6, 12, 16, 18, 18, 16, 12];
function bush(g, x, y) {
  g.fillStyle = 'rgba(26,28,44,0.25)';
  g.fillRect(x + 2, y + BUSH_ROWS.length * 2 - 1, 18, 3);
  BUSH_ROWS.forEach((w, r) => {
    const rx = x + (18 - w) / 2;
    g.fillStyle = PAL.ink;
    g.fillRect(rx - 1, y + r * 2 - 1, w + 2, 4);
  });
  BUSH_ROWS.forEach((w, r) => {
    const rx = x + (18 - w) / 2;
    g.fillStyle = r < 3 ? PAL.green : PAL.teal;
    g.fillRect(rx, y + r * 2, w, 2);
  });
  g.fillStyle = PAL.lime;
  g.fillRect(x + 6, y + 2, 3, 2);
  g.fillRect(x + 10, y + 4, 2, 1);
}

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// ─── Atmosfera ──────────────────────────────────────────────────

const CLOUDS = [{ x: 0, y: 80, r: 70, v: 6 }, { x: 220, y: 300, r: 90, v: 4 }, { x: 120, y: 520, r: 60, v: 7 }];

function drawCloudShadows(ctx, time) {
  ctx.fillStyle = 'rgba(26,28,44,0.07)';
  const span = WORLD.w + 300;
  for (const c of CLOUDS) {
    const x = ((c.x + time * c.v) % span) - 150;
    ctx.beginPath();
    ctx.ellipse(x, c.y, c.r, c.r * 0.45, 0, 0, Math.PI * 2);
    ctx.ellipse(x + c.r * 0.6, c.y + 10, c.r * 0.6, c.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

let vignetteCache = null;
function drawVignette(ctx) {
  if (!vignetteCache) {
    const g = ctx.createRadialGradient(TOWER.x, WORLD.h * 0.55, WORLD.h * 0.3, TOWER.x, WORLD.h * 0.55, WORLD.h * 0.85);
    g.addColorStop(0, 'rgba(26,28,44,0)');
    g.addColorStop(1, 'rgba(26,28,44,0.55)');
    vignetteCache = g;
  }
  ctx.fillStyle = vignetteCache;
  ctx.fillRect(-MARGIN, -MARGIN, WORLD.w + MARGIN * 2, WORLD.h + MARGIN * 2);
}

function drawRange(ctx, range, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(244,244,244,0.16)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.lineDashOffset = -time * 6; // il tratteggio ruota piano
  ctx.beginPath();
  ctx.arc(TOWER.x, TOWER.y, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ─── Palazzo (la torre) ─────────────────────────────────────────

// 1 = finestra accesa all'inizio. 3 colonne × 5 piani.
const WINDOWS = [1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1];
// Crepe che compaiono quando il palazzo è danneggiato.
const CRACKS = [
  [[8, 30], [12, 36], [10, 42], [15, 48]],
  [[44, 20], [40, 27], [43, 33]],
  [[30, 60], [26, 66], [29, 72], [25, 78]],
];

function drawTower(ctx, assets, run, time) {
  const { w, h, x0, base, top } = B;
  const hpRatio = run ? run.tower.hp / run.stats.maxHp : 1;
  const dead = run && run.phase === 'over';

  // Ombra a terra
  ctx.fillStyle = 'rgba(26,28,44,0.35)';
  ctx.fillRect(x0 + 4, base - 2, w + 12, 6);

  // Contorno e facciata
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x0 - 2, top - 2, w + 4, h + 4);
  ctx.fillStyle = PAL.silver;
  ctx.fillRect(x0, top, w, h);
  ctx.fillStyle = PAL.white;
  ctx.fillRect(x0, top, 2, h);                 // spigolo illuminato
  ctx.fillStyle = PAL.slate;
  ctx.fillRect(x0 + w - 10, top, 10, h);       // lato in ombra
  ctx.fillStyle = PAL.dark;
  ctx.fillRect(x0 + w - 10, top, 2, h);

  // Piani: 5 file di finestre con una fascia scura fra un piano e l'altro
  for (let r = 0; r < 5; r++) {
    const wy = top + 10 + r * 15;
    ctx.fillStyle = 'rgba(51,60,87,0.35)';
    ctx.fillRect(x0 + 2, wy + 12, w - 12, 1);
    for (let col = 0; col < 3; col++) {
      const i = r * 3 + col;
      const wx = x0 + 5 + col * 15;
      // ogni tanto qualcuno accende o spegne la luce
      const flick = Math.sin(time * 0.35 + i * 7.3) > 0.93;
      const lit = !dead && (WINDOWS[i] ^ flick) && !(hpRatio < 0.3 && i % 4 === 0);
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(wx, wy, 12, 10);
      ctx.fillStyle = lit ? PAL.yellow : PAL.navy;
      ctx.fillRect(wx + 1, wy + 1, 10, 8);
      ctx.fillStyle = lit ? PAL.white : PAL.blue;
      ctx.fillRect(wx + 2, wy + 2, 3, 2);       // riflesso sul vetro
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(wx + 6, wy + 1, 1, 8);       // telaio centrale
    }
  }

  // Ingresso con tendina a righe
  const dx = TOWER.x - 10;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? PAL.white : PAL.red;
    ctx.fillRect(dx - 2 + i * 4, base - 22, 4, 4);
  }
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(dx - 2, base - 18, 24, 1);
  ctx.fillRect(dx, base - 17, 18, 17);
  ctx.fillStyle = PAL.sky;
  ctx.fillRect(dx + 1, base - 16, 7, 16);
  ctx.fillRect(dx + 10, base - 16, 7, 16);
  ctx.fillStyle = PAL.cyan;
  ctx.fillRect(dx + 2, base - 15, 2, 5);
  ctx.fillRect(dx + 11, base - 15, 2, 5);

  // Tetto: cornicione, condizionatore, antenna con luce rossa
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x0 - 4, top - 4, w + 8, 6);
  ctx.fillStyle = PAL.dark;
  ctx.fillRect(x0 - 3, top - 3, w + 6, 4);
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x0 + 3, top - 13, 14, 10);
  ctx.fillStyle = PAL.silver;
  ctx.fillRect(x0 + 4, top - 12, 12, 8);
  ctx.fillStyle = PAL.slate;
  for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 6 + i * 3, top - 10, 2, 5);
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x0 + w - 9, top - 26, 2, 23);
  ctx.fillRect(x0 + w - 12, top - 18, 8, 1);
  ctx.fillStyle = Math.sin(time * 4) > 0 ? PAL.red : PAL.plum;
  ctx.fillRect(x0 + w - 10, top - 29, 4, 4);

  // Crepe quando la vita scende
  if (hpRatio < 0.6) {
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1;
    const n = hpRatio < 0.3 ? CRACKS.length : 1;
    for (let k = 0; k < n; k++) {
      ctx.beginPath();
      CRACKS[k].forEach(([cx, cy], j) => (j ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + cx + 0.5, top + cy + 0.5));
      ctx.stroke();
    }
  }

  // Lampo bianco quando viene colpito
  if (run && run.tower.hitFlash > 0) {
    ctx.fillStyle = 'rgba(244,244,244,0.45)';
    ctx.fillRect(x0 - 2, top - 2, w + 4, h + 4);
  }

  if (dead) return;

  // Il protagonista sul tetto (con la coroncina, per distinguerlo dai nemici)
  const recoil = run && run.tower.recoil > 0 ? 2 : 0;
  const bob = Math.round(Math.sin(time * 2.2));
  const px = TOWER.x - 16, py = top - 33 + recoil + bob;
  ctx.drawImage(assets.chars.dark_hair.frames[0], px, py, 32, 32);
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(TOWER.x - 7, py - 6, 14, 5);
  ctx.fillStyle = PAL.yellow;
  ctx.fillRect(TOWER.x - 6, py - 3, 12, 2);
  ctx.fillRect(TOWER.x - 6, py - 5, 2, 2);
  ctx.fillRect(TOWER.x - 1, py - 5, 2, 2);
  ctx.fillRect(TOWER.x + 4, py - 5, 2, 2);
  // Lampo allo sparo
  if (recoil) {
    ctx.fillStyle = PAL.white;
    ctx.fillRect(TOWER.x - 2, py + 4, 4, 4);
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(TOWER.x - 4, py + 5, 8, 2);
    ctx.fillRect(TOWER.x - 1, py + 2, 2, 8);
  }
}

function updateSmoke(smoke, run, dt) {
  const ratio = run ? run.tower.hp / run.stats.maxHp : 1;
  const rate = run && run.phase === 'over' ? 30 : ratio < 0.3 ? 8 : ratio < 0.6 ? 3 : 0;
  if (Math.random() < rate * dt) {
    smoke.push({
      x: B.x0 + 8 + Math.random() * (B.w - 16), y: B.top + 10 + Math.random() * 40,
      vx: (Math.random() - 0.3) * 6, size: 3, life: 1.6, max: 1.6,
      fire: run.phase === 'over' || ratio < 0.3 && Math.random() < 0.4,
    });
  }
  for (const s of smoke) { s.life -= dt; s.y -= 16 * dt; s.x += s.vx * dt; s.size += 4 * dt; }
  for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].life <= 0) smoke.splice(i, 1);
}

function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    const k = s.life / s.max;
    ctx.globalAlpha = k * 0.7;
    ctx.fillStyle = s.fire && k > 0.6 ? PAL.orange : k > 0.5 ? PAL.slate : PAL.dark;
    const z = Math.round(s.size);
    ctx.fillRect(Math.round(s.x - z / 2), Math.round(s.y - z / 2), z, z);
  }
  ctx.globalAlpha = 1;
}

// ─── Nemici ─────────────────────────────────────────────────────

function drawShadow(ctx, e) {
  ctx.fillStyle = 'rgba(26,28,44,0.32)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.size * 0.3, e.size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx, assets, e) {
  const s = e.size;
  const sprite = assets.chars[e.char];
  const frame = e.moving ? Math.floor(e.anim * 2) % 2 : 0;
  let x = e.x - s / 2, y = e.y - s;
  if (e.moving) y -= Math.abs(Math.sin(e.anim * Math.PI)) * 2; // saltello mentre cammina
  if (e.lunge > 0) {
    // piccolo scatto verso il palazzo quando colpisce
    const d = Math.hypot(TOWER.x - e.x, TOWER.y - e.y) || 1;
    x += (TOWER.x - e.x) / d * 4;
    y += (TOWER.y - e.y) / d * 4;
  }
  x = Math.round(x);
  y = Math.round(y);

  ctx.globalAlpha = Math.min(1, (e.age || 0) / 0.4); // compare in dissolvenza
  if (e.boss) {
    ctx.fillStyle = 'rgba(177,62,83,0.35)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, s * 0.5, s * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.drawImage(sprite.frames[frame], x, y, s, s);
  if (e.hitFlash > 0) {
    ctx.globalAlpha = 0.55;
    ctx.drawImage(sprite.white[frame], x, y, s, s);
  }
  ctx.globalAlpha = 1;

  if (e.slowT > 0) {
    ctx.fillStyle = 'rgba(115,239,247,0.55)';
    ctx.fillRect(x + Math.round(s * 0.25), y + Math.round(s * 0.88), Math.round(s * 0.5), 2);
  }
  if (e.dotT > 0) {
    ctx.fillStyle = PAL.lime;
    ctx.fillRect(Math.round(e.x - 1 + Math.sin(e.anim * 9) * 4), y + 2, 2, 2);
    ctx.fillRect(Math.round(e.x + 3 + Math.cos(e.anim * 7) * 3), y + 6, 1, 1);
  }
  if (e.stunT > 0) {
    ctx.font = `6px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.fillText('zZ', e.x, y - 2);
  }
  if (e.boss) {
    const cx = Math.round(e.x), cy = Math.round(y + s * 0.06);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(cx - 9, cy - 5, 18, 9);
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(cx - 8, cy, 16, 3);
    ctx.fillRect(cx - 8, cy - 4, 3, 4);
    ctx.fillRect(cx - 1, cy - 4, 3, 4);
    ctx.fillRect(cx + 5, cy - 4, 3, 4);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(cx - 1, cy, 2, 2);
  }
  if (e.hp < e.maxHp && !e.boss) {
    const bw = Math.round(s * 0.7), bx = Math.round(e.x - bw / 2), by = y + Math.round(s * 0.02);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = PAL.plum;
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(bx, by, Math.max(1, Math.round(bw * e.hp / e.maxHp)), 2);
  }
}

// Nemico sconfitto: cade di lato e svanisce.
function drawCorpse(ctx, assets, c) {
  const k = 1 - c.life / c.max;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - k * 1.3);
  ctx.translate(Math.round(c.x), Math.round(c.y));
  ctx.rotate(c.dir * Math.min(1, k * 3) * Math.PI / 2);
  ctx.drawImage(assets.chars[c.char].frames[0], -c.size / 2, -c.size, c.size, c.size);
  if (k < 0.2) {
    ctx.globalAlpha = 0.6 * (1 - k / 0.2); // breve lampo bianco all'inizio
    ctx.drawImage(assets.chars[c.char].white[0], -c.size / 2, -c.size, c.size, c.size);
  }
  ctx.restore();
}

// ─── Colpi ed effetti ───────────────────────────────────────────

function drawShots(ctx, run, time) {
  for (const s of run.shots) {
    // direzione del volo, per disegnare la scia
    const t = s.target;
    let dx = 0, dy = -1;
    if (t && !t.dead) {
      const d = Math.hypot(t.x - s.x, t.y - t.size * 0.35 - s.y) || 1;
      dx = (t.x - s.x) / d;
      dy = (t.y - t.size * 0.35 - s.y) / d;
    }
    for (let i = 3; i >= 1; i--) {
      ctx.globalAlpha = 0.18 * (4 - i);
      ctx.fillStyle = s.crit ? PAL.orange : PAL.white;
      ctx.fillRect(Math.round(s.x - dx * i * 4) - 1, Math.round(s.y - dy * i * 4) - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
    // un foglio di carta che gira (i critici sono dorati e più grandi)
    ctx.save();
    ctx.translate(Math.round(s.x), Math.round(s.y));
    ctx.rotate(Math.floor(time * 12) * Math.PI / 4);
    const w = s.crit ? 7 : 5, h = s.crit ? 8 : 6;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
    ctx.fillStyle = s.crit ? PAL.yellow : PAL.white;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = s.crit ? PAL.orange : PAL.silver;
    ctx.fillRect(-w / 2 + 1, -h / 2 + 2, w - 2, 1);
    ctx.fillRect(-w / 2 + 1, -h / 2 + 4, w - 3, 1);
    ctx.restore();
  }
  // Colpi dei nemici: tazzine di caffè lanciate contro il palazzo
  for (const s of run.enemyShots) {
    const x = Math.round(s.x), y = Math.round(s.y);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 4, y - 3, 8, 7);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x - 3, y - 2, 5, 5);
    ctx.fillRect(x + 2, y - 1, 1, 2);
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(x - 3, y - 2, 5, 1);
  }
}

function drawFx(ctx, run) {
  const fx = run.fx;
  for (const r of fx.rings) {
    ctx.globalAlpha = r.life / r.max;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius * (1.2 - r.life / r.max * 0.4), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of fx.parts) {
    ctx.globalAlpha = Math.min(1, p.life / p.max * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const t of fx.texts) {
    // i numeri "saltano" appena compaiono, poi svaniscono
    const age = t.max - t.life;
    const pop = age < 0.12 ? 1 + (0.12 - age) / 0.12 * 0.6 : 1;
    ctx.globalAlpha = Math.min(1, t.life / t.max * 2);
    ctx.font = `${Math.round(t.size * pop)}px ${FONT}`;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, run) {
  const b = run.fx.banner;
  if (!b) return;
  const k = b.life / b.max;
  // entra da sinistra, resta fermo, poi svanisce
  const slide = k > 0.85 ? (k - 0.85) / 0.15 * -WORLD.w : 0;
  ctx.globalAlpha = Math.min(1, k * 5);
  const h = b.sub ? 54 : 36;
  ctx.fillStyle = 'rgba(26,28,44,0.8)';
  ctx.fillRect(0, 150, WORLD.w, h);
  ctx.fillStyle = b.color;
  ctx.fillRect(0, 150, WORLD.w, 2);
  ctx.fillRect(0, 150 + h - 2, WORLD.w, 2);
  ctx.textAlign = 'center';
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = PAL.ink;
  ctx.fillText(b.title, WORLD.w / 2 + slide + 2, 178);
  ctx.fillStyle = b.color;
  ctx.fillText(b.title, WORLD.w / 2 + slide, 176);
  if (b.sub) {
    ctx.font = `7px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.fillText(b.sub, WORLD.w / 2 + slide, 194);
  }
  ctx.globalAlpha = 1;
}

function drawBossBar(ctx, run) {
  if (!run.boss) return;
  const list = run.boss.list;
  const hp = list.reduce((a, e) => a + Math.max(0, e.hp), 0);
  const max = list.reduce((a, e) => a + e.maxHp, 0);
  const x = 20, y = 14, w = WORLD.w - 40;
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x - 2, y - 2, w + 4, 12);
  ctx.fillStyle = PAL.plum;
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x, y, Math.round(w * hp / max), 8);
  ctx.fillStyle = 'rgba(244,244,244,0.35)';
  ctx.fillRect(x, y, Math.round(w * hp / max), 2);
  ctx.font = `7px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 3;
  ctx.strokeText(run.boss.name, WORLD.w / 2, y + 22);
  ctx.fillStyle = PAL.white;
  ctx.fillText(run.boss.name, WORLD.w / 2, y + 22);
}
