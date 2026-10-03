// Colpi, particelle, numeri del danno e atmosfera (polvere, bordo scuro, gittata).
import { TOWER } from '../state.js';
import { PAL, FONT } from './palette.js';
import { line } from './view.js';

export function drawDust(ctx, dust, dt, canvas) {
  ctx.fillStyle = 'rgba(232,226,208,0.25)';
  const s = Math.max(1, Math.round(canvas.height / 400));
  for (const d of dust) {
    d.x += d.v * dt;
    d.a += dt;
    if (d.x > 1) { d.x = 0; d.y = Math.random(); }
    ctx.fillRect(Math.round(d.x * canvas.width), Math.round((d.y + Math.sin(d.a) * 0.01) * canvas.height), s, s);
  }
}

export function drawGrade(ctx, canvas) {
  const w = canvas.width, h = canvas.height;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(13,13,15,0)');
  g.addColorStop(1, 'rgba(13,13,15,0.75)');
  ctx.fillStyle = 'rgba(255,140,40,0.04)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawRange(ctx, range, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(242,183,5,0.22)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -time * 6; // il tratteggio ruota piano
  ctx.beginPath();
  ctx.arc(TOWER.x, TOWER.y, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function shotDir(s) {
  const t = s.target;
  if (!t || t.dead) return { dx: 0, dy: -1 };
  const tx = t.x, ty = t.y - t.size * 0.35;
  const d = Math.hypot(tx - s.x, ty - s.y) || 1;
  return { dx: (tx - s.x) / d, dy: (ty - s.y) / d };
}

export function drawShots(ctx, run, time) {
  ctx.lineCap = 'square';
  for (const s of run.shots) {
    const { dx, dy } = shotDir(s);
    const x = Math.round(s.x), y = Math.round(s.y);
    if (s.kind === 'laser') {
      // raggio continuo dalla postazione del PM fino alla punta del colpo
      ctx.globalAlpha = 0.5;
      line(ctx, s.ox, s.oy, x, y, PAL.red, 3);
      ctx.globalAlpha = 1;
      line(ctx, x - dx * 18, y - dy * 18, x, y, PAL.red, 3);
      line(ctx, x - dx * 16, y - dy * 16, x, y, '#ffd0d6', 1);
    } else if (s.kind === 'bolt') {
      line(ctx, x - dx * 14, y - dy * 14, x, y, PAL.black, 4);
      line(ctx, x - dx * 13, y - dy * 13, x, y, PAL.white, 2);
      line(ctx, x - dx * 14, y - dy * 14, x - dx * 10, y - dy * 10, PAL.toxic, 2);
      ctx.fillStyle = PAL.cyan;
      ctx.fillRect(x - 1, y - 1, 3, 3);
    } else if (s.kind === 'pc') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.floor(time * 10) * Math.PI / 4);
      ctx.fillStyle = PAL.black;
      ctx.fillRect(-5, -4, 10, 8);
      ctx.fillStyle = PAL.grey;
      ctx.fillRect(-4, -3, 8, 6);
      ctx.fillStyle = PAL.cyan;
      ctx.fillRect(-3, -2, 6, 3);
      ctx.restore();
    } else {
      // colpo del palazzo: proiettile giallo con la scia tracciante
      const len = s.crit ? 14 : 10;
      line(ctx, x - dx * len, y - dy * len, x, y, s.crit ? 'rgba(215,38,61,0.7)' : 'rgba(242,183,5,0.55)', s.crit ? 3 : 2);
      ctx.fillStyle = PAL.black;
      ctx.fillRect(x - 2, y - 2, 5, 5);
      ctx.fillStyle = s.crit ? PAL.red : PAL.hazard;
      ctx.fillRect(x - 1, y - 1, 3, 3);
      ctx.fillStyle = PAL.white;
      ctx.fillRect(x, y - 1, 1, 1);
    }
  }
  // Colpi dei nemici: tazze di caffè lanciate contro il palazzo
  for (const s of run.enemyShots) {
    const x = Math.round(s.x), y = Math.round(s.y);
    if (s.sniper) {
      ctx.fillStyle = PAL.black;
      ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.fillStyle = PAL.red;
      ctx.fillRect(x - 2, y - 2, 4, 4);
      ctx.fillStyle = '#ffd0d6';
      ctx.fillRect(x - 1, y - 1, 2, 2);
      continue;
    }
    ctx.fillStyle = PAL.black;
    ctx.fillRect(x - 4, y - 3, 8, 7);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x - 3, y - 2, 5, 5);
    ctx.fillRect(x + 2, y - 1, 1, 2);
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(x - 3, y - 2, 5, 1);
  }
}

export function drawFx(ctx, run) {
  const fx = run.fx;
  for (const r of fx.rings) {
    const k = r.life / r.max;
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(242,183,5,0.25)';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius * (1.2 - k * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
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
    ctx.strokeStyle = PAL.black;
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
