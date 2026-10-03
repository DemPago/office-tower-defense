// Scritte disegnate sopra al mondo, in coordinate dello schermo:
// titolo dello scenario, banner, barra del boss, avvisi e freccia del boss.
import { PAL, FONT, SPRAY } from './palette.js';
import { hazardStripes } from './props.js';

export function drawSceneTitle(ctx, name, W, H, fade) {
  ctx.globalAlpha = Math.min(1, (fade - 0.2) * 3);
  ctx.textAlign = 'center';
  ctx.font = `9px ${FONT}`;
  ctx.fillStyle = PAL.white;
  ctx.fillText('NUOVO SCENARIO', W / 2, H * 0.72);
  ctx.font = `20px ${SPRAY}`;
  ctx.fillStyle = PAL.black;
  ctx.fillText(name, W / 2 + 2, H * 0.72 + 26);
  ctx.fillStyle = PAL.hazard;
  ctx.fillText(name, W / 2, H * 0.72 + 24);
  ctx.globalAlpha = 1;
}

export function drawBanner(ctx, run, W, H) {
  const b = run.fx.banner;
  if (!b) return;
  const k = b.life / b.max;
  // entra da sinistra, resta fermo, poi svanisce
  const slide = k > 0.85 ? (k - 0.85) / 0.15 * -W : 0;
  ctx.globalAlpha = Math.min(1, k * 5);
  const h = b.sub ? 58 : 40, y = Math.round(H * 0.24);
  ctx.fillStyle = 'rgba(13,13,15,0.85)';
  ctx.fillRect(0, y, W, h);
  hazardStripes(ctx, 0, y, W, 4);
  hazardStripes(ctx, 0, y + h - 4, W, 4);
  ctx.textAlign = 'center';
  ctx.font = `22px ${SPRAY}`;
  ctx.fillStyle = PAL.black;
  ctx.fillText(b.title, W / 2 + slide + 2, y + 32);
  ctx.fillStyle = b.color;
  ctx.fillText(b.title, W / 2 + slide, y + 30);
  if (b.sub) {
    ctx.font = `7px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.fillText(b.sub, W / 2 + slide, y + 48);
  }
  ctx.globalAlpha = 1;
}

export function drawBossBar(ctx, run, W) {
  if (!run.boss) return;
  const list = run.boss.list;
  const hp = list.reduce((a, e) => a + Math.max(0, e.hp), 0);
  const max = list.reduce((a, e) => a + e.maxHp, 0);
  const w = Math.min(W - 40, 420), x = (W - w) / 2, y = 14;
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x - 3, y - 3, w + 6, 14);
  ctx.fillStyle = PAL.blood;
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x, y, Math.round(w * hp / max), 8);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x, y, Math.round(w * hp / max), 2);
  ctx.font = `12px ${SPRAY}`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = PAL.black;
  ctx.lineWidth = 4;
  ctx.strokeText(run.boss.name, W / 2, y + 24);
  ctx.fillStyle = PAL.white;
  ctx.fillText(run.boss.name, W / 2, y + 24);
}

export function drawIntruderWarning(ctx, run, W, time) {
  if (Math.sin(time * 8) < -0.3) return; // lampeggia
  const y = run.boss ? 58 : 18;
  const text = `⚠ ${run.intruders} INTRUS${run.intruders > 1 ? 'I' : 'O'} NEL CORTILE: i colleghi perdono vita!`;
  ctx.font = `7px ${FONT}`;
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = 'rgba(13,13,15,0.8)';
  ctx.fillRect(W / 2 - w / 2, y - 10, w, 15);
  ctx.fillStyle = PAL.red;
  ctx.fillText(text, W / 2, y);
}

// Freccia sul bordo dello schermo che indica da dove arriva il boss.
export function drawBossPointer(ctx, run, view, W, H) {
  for (const e of run.enemies) {
    if (!e.boss) continue;
    const sx = (view.ox + e.x * view.scale) / view.ui, sy = (view.oy + (e.y - e.size / 2) * view.scale) / view.ui;
    const m = 30;
    if (sx > m && sx < W - m && sy > m + 40 && sy < H - m) continue; // già visibile
    const cx = W / 2, cy = H / 2, dx = sx - cx, dy = sy - cy;
    const t = Math.min((W / 2 - m) / Math.abs(dx || 1), (H / 2 - m) / Math.abs(dy || 1));
    const px = cx + dx * t, py = cy + dy * t, a = Math.atan2(dy, dx);
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = PAL.black;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.fill();
    ctx.fillStyle = PAL.red;
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.fill();
    ctx.restore();
    ctx.font = `7px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.black;
    ctx.fillText('⚠ BOSS', px - Math.cos(a) * 24 + 1, py - Math.sin(a) * 24 + 4);
    ctx.fillStyle = PAL.red;
    ctx.fillText('⚠ BOSS', px - Math.cos(a) * 24, py - Math.sin(a) * 24 + 3);
    return; // un indicatore basta (anche per i gruppi)
  }
}
