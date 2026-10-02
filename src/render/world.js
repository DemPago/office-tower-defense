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

export function createRenderer(canvas, assets) {
  const ctx = canvas.getContext('2d');
  const bg = buildBackground(assets);
  const view = { scale: 1, ox: 0, oy: 0 };

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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.green;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shake = run ? run.fx.shake : 0;
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox + sx * view.scale, view.oy + sy * view.scale);
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(bg, -MARGIN, -MARGIN);
    if (!run) { drawTower(ctx, assets, null); return; }

    drawRange(ctx, run.stats.range);
    for (const e of run.enemies) drawShadow(ctx, e);
    // Prima i nemici più in alto, così quelli più vicini allo schermo stanno davanti.
    const sorted = [...run.enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) if (e.y < TOWER.y) drawEnemy(ctx, assets, e);
    drawTower(ctx, assets, run);
    for (const e of sorted) if (e.y >= TOWER.y) drawEnemy(ctx, assets, e);
    drawShots(ctx, run);
    drawFx(ctx, run);
    drawBossBar(ctx, run);
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
  for (let y = 0; y < c.height; y += T) {
    for (let x = 0; x < c.width; x += T) {
      g.drawImage(assets.terrain.grass, x, y, T, T);
    }
  }
  // Piazzetta di pietra attorno alla torre.
  const cx = TOWER.x + MARGIN, cy = TOWER.y + MARGIN;
  for (let y = 0; y < c.height; y += T) {
    for (let x = 0; x < c.width; x += T) {
      const d = Math.hypot(x + T / 2 - cx, (y + T / 2 - cy) * 1.3);
      if (d < 58) g.drawImage(rnd() < 0.7 ? assets.terrain.path_stone : assets.terrain.path_stone2, x, y, T, T);
    }
  }
  // Alberi sparsi, lontani dalla torre.
  for (let i = 0; i < 40; i++) {
    const x = rnd() * c.width, y = rnd() * c.height;
    if (Math.hypot(x - cx, y - cy) < 110) continue;
    g.drawImage(assets.terrain.tree_green, Math.round(x / 2) * 2, Math.round(y / 2) * 2, 32, 32);
  }
  return c;
}

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// ─── Torre ──────────────────────────────────────────────────────

const WINDOWS = [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1];

function drawTower(ctx, assets, run) {
  const w = 52, h = 76;
  const x0 = TOWER.x - w / 2, base = TOWER.y + 22, y0 = base - h;
  const flash = run && run.tower.hitFlash > 0;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x0 - 2, base - 2, w + 8, 6);
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  ctx.fillStyle = flash ? PAL.red : PAL.silver;
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = flash ? PAL.plum : PAL.slate;
  ctx.fillRect(x0 + w - 8, y0, 8, h);          // lato in ombra
  ctx.fillStyle = PAL.dark;
  ctx.fillRect(x0 - 4, y0, w + 8, 5);          // cornicione del tetto

  // Finestre: 3 colonne × 4 piani.
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 3; col++) {
      const lit = WINDOWS[r * 3 + col];
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x0 + 6 + col * 13, y0 + 10 + r * 14, 10, 10);
      ctx.fillStyle = lit ? PAL.yellow : PAL.navy;
      ctx.fillRect(x0 + 7 + col * 13, y0 + 11 + r * 14, 8, 8);
    }
  }
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(TOWER.x - 7, base - 14, 14, 14);  // porta
  ctx.fillStyle = PAL.orange;
  ctx.fillRect(TOWER.x - 5, base - 12, 10, 12);

  // Il protagonista sul tetto (con la coroncina, per distinguerlo dai nemici).
  const recoil = run && run.tower.recoil > 0 ? 2 : 0;
  const px = TOWER.x - 16, py = y0 - 30 + recoil;
  ctx.drawImage(assets.chars.dark_hair.frames[0], px, py, 32, 32);
  ctx.fillStyle = PAL.yellow;
  ctx.fillRect(TOWER.x - 6, py - 2, 12, 3);
  ctx.fillRect(TOWER.x - 6, py - 5, 2, 3);
  ctx.fillRect(TOWER.x - 1, py - 5, 2, 3);
  ctx.fillRect(TOWER.x + 4, py - 5, 2, 3);
}

function drawRange(ctx, range) {
  ctx.save();
  ctx.strokeStyle = 'rgba(244,244,244,0.18)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(TOWER.x, TOWER.y, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ─── Nemici ─────────────────────────────────────────────────────

function drawShadow(ctx, e) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.size * 0.3, e.size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx, assets, e) {
  const s = e.size;
  const sprite = assets.chars[e.char];
  const frame = e.moving ? Math.floor(e.anim * 2) % 2 : 0;
  let x = e.x - s / 2, y = e.y - s;
  if (e.lunge > 0) {
    // piccolo scatto verso la torre quando colpisce
    const d = Math.hypot(TOWER.x - e.x, TOWER.y - e.y) || 1;
    x += (TOWER.x - e.x) / d * 4;
    y += (TOWER.y - e.y) / d * 4;
  }
  if (e.boss) {
    ctx.fillStyle = 'rgba(177,62,83,0.35)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, s * 0.45, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.drawImage(sprite.frames[frame], Math.round(x), Math.round(y), s, s);
  if (e.hitFlash > 0) {
    ctx.globalAlpha = 0.8;
    ctx.drawImage(sprite.white[frame], Math.round(x), Math.round(y), s, s);
    ctx.globalAlpha = 1;
  }
  if (e.slowT > 0) {
    ctx.fillStyle = 'rgba(65,166,246,0.35)';
    ctx.fillRect(Math.round(x + s * 0.25), Math.round(y + s * 0.85), Math.round(s * 0.5), 3);
  }
  if (e.dotT > 0) {
    ctx.fillStyle = PAL.lime;
    ctx.fillRect(Math.round(e.x - 1 + Math.sin(e.anim * 9) * 4), Math.round(y + 2), 2, 2);
  }
  if (e.stunT > 0) {
    ctx.font = `6px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.fillText('zZ', e.x, y - 2);
  }
  if (e.boss) {
    ctx.fillStyle = PAL.yellow;
    const cx = Math.round(e.x), cy = Math.round(y + s * 0.08);
    ctx.fillRect(cx - 8, cy, 16, 3);
    ctx.fillRect(cx - 8, cy - 4, 3, 4);
    ctx.fillRect(cx - 1, cy - 4, 3, 4);
    ctx.fillRect(cx + 5, cy - 4, 3, 4);
  }
  if (e.hp < e.maxHp && !e.boss) {
    const bw = Math.round(s * 0.7), bx = Math.round(e.x - bw / 2), by = Math.round(y + s * 0.05);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(bx, by, Math.max(1, Math.round(bw * e.hp / e.maxHp)), 2);
  }
}

// ─── Colpi ed effetti ───────────────────────────────────────────

function drawShots(ctx, run) {
  for (const s of run.shots) {
    const size = s.crit ? 5 : 4;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(s.x - size / 2) - 1, Math.round(s.y - size / 2) - 1, size + 2, size + 2);
    ctx.fillStyle = s.crit ? PAL.orange : PAL.yellow;
    ctx.fillRect(Math.round(s.x - size / 2), Math.round(s.y - size / 2), size, size);
  }
  for (const s of run.enemyShots) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(s.x) - 3, Math.round(s.y) - 3, 6, 6);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(Math.round(s.x) - 2, Math.round(s.y) - 2, 4, 4);
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
    ctx.globalAlpha = Math.min(1, t.life / t.max * 2);
    ctx.font = `${t.size}px ${FONT}`;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  const b = fx.banner;
  if (b) {
    const k = b.life / b.max;
    ctx.globalAlpha = Math.min(1, k * 4, (1 - k) * 8);
    ctx.fillStyle = 'rgba(26,28,44,0.75)';
    ctx.fillRect(0, 150, WORLD.w, b.sub ? 54 : 36);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = b.color;
    ctx.fillText(b.title, WORLD.w / 2, 176);
    if (b.sub) {
      ctx.font = `7px ${FONT}`;
      ctx.fillStyle = PAL.white;
      ctx.fillText(b.sub, WORLD.w / 2, 194);
    }
    ctx.globalAlpha = 1;
  }
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
  ctx.font = `7px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 3;
  ctx.strokeText(run.boss.name, WORLD.w / 2, y + 22);
  ctx.fillStyle = PAL.white;
  ctx.fillText(run.boss.name, WORLD.w / 2, y + 22);
}
