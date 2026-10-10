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

// Pattern scanlines (creato una volta sola)
let _scanPat = null;
function scanlinePattern(ctx) {
  if (_scanPat) return _scanPat;
  const pc = document.createElement('canvas');
  pc.width = 1; pc.height = 2;
  const pg = pc.getContext('2d');
  pg.fillStyle = 'rgba(0,0,0,0.07)';
  pg.fillRect(0, 0, 1, 1);
  _scanPat = ctx.createPattern(pc, 'repeat');
  return _scanPat;
}

export function drawGrade(ctx, canvas, run) {
  const w = canvas.width, h = canvas.height;
  const hp = (run && run.stats) ? run.tower.hp / run.stats.maxHp : 1;

  // Tonalità atmosferica: calda e arancione, vira al rosso quando la vita è bassa
  const danger = Math.max(0, 1 - hp / 0.4); // 0 sopra 40% HP, 1 quando quasi morti
  ctx.fillStyle = `rgba(255,${Math.round(100 - danger * 80)},${Math.round(20 - danger * 20)},${(0.05 + danger * 0.08).toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);

  // Scanlines: riga scura ogni 2px per unificare la texture pixel art
  ctx.fillStyle = scanlinePattern(ctx);
  ctx.fillRect(0, 0, w, h);

  // Vignette più marcata e rettangolare
  const v = ctx.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.22, w / 2, h * 0.52, Math.max(w, h) * 0.76);
  v.addColorStop(0,   'rgba(13,13,15,0)');
  v.addColorStop(0.6, 'rgba(13,13,15,0.15)');
  v.addColorStop(1,   `rgba(13,13,15,${(0.82 + danger * 0.1).toFixed(2)})`);
  ctx.fillStyle = v;
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
  for (const w of run.fx.waves) {
    ctx.save();
    if (w.energy) {
      // esplosione della sfera energetica: viola con il centro bianco
      const k = w.life / 0.35;
      ctx.globalAlpha = k;
      ctx.fillStyle = `rgba(160,90,255,${0.35 * k})`;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c8a0ff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.3 * k, 0, Math.PI * 2); ctx.fill();
    } else {
      // onda sonica: tre anelli concentrici che si allargano dal palazzo
      const k = w.life / 0.45;
      ctx.globalAlpha = k;
      for (const [f, lw] of [[1, 3], [0.82, 1.5], [0.64, 1]]) {
        ctx.strokeStyle = f === 1 ? '#e8e2d0' : PAL.cyan;
        ctx.lineWidth = lw;
        ctx.setLineDash(f === 1 ? [] : [4, 3]);
        ctx.beginPath();
        ctx.arc(TOWER.x, TOWER.y - 10, w.r * f, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Laser della torre: raggio istantaneo con bagliore
  for (const b of run.fx.beams) {
    ctx.globalAlpha = Math.min(1, b.life / 0.07 + 0.3);
    line(ctx, b.x1, b.y1, b.x2, b.y2, b.crit ? 'rgba(255,123,28,0.5)' : 'rgba(215,38,61,0.5)', 4);
    line(ctx, b.x1, b.y1, b.x2, b.y2, b.crit ? PAL.orange : PAL.red, 2);
    line(ctx, b.x1, b.y1, b.x2, b.y2, '#ffe0e4', 0.5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(b.x2 - 1.5, b.y2 - 1.5, 3, 3);
    ctx.globalAlpha = 1;
  }
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
    } else if (s.kind === 'energy') {
      // sfera di energia che pulsa, con la scia
      const p = 1 + Math.sin(time * 30) * 0.2;
      line(ctx, x - dx * 10, y - dy * 10, x, y, 'rgba(160,90,255,0.4)', 4);
      ctx.fillStyle = 'rgba(160,90,255,0.35)';
      ctx.beginPath(); ctx.arc(x, y, 5 * p, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b880ff';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    } else if (s.kind === 'heart') {
      // cuore che pulsa, con scia di brillantini
      const p = 1 + Math.sin(time * 20) * 0.12;
      ctx.fillStyle = 'rgba(255,62,138,0.35)';
      ctx.fillRect(x - dx * 6 - 1, y - dy * 6 - 1, 2, 2);
      drawHeart(ctx, x, y, 3.2 * p, '#ff3e8a', '#ffd0e0');
    } else if (s.kind === 'dagger') {
      // pugnale che gira: lama d'acciaio e manico
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 25);
      ctx.fillStyle = PAL.black; ctx.fillRect(-4.5, -1.5, 9, 3);
      ctx.fillStyle = PAL.silver; ctx.fillRect(-1, -1, 5, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -1, 4, 0.5);
      ctx.fillStyle = PAL.wood; ctx.fillRect(-4, -1, 3, 2);
      ctx.fillStyle = PAL.hazard; ctx.fillRect(-1.5, -1.5, 1, 3);
      ctx.restore();
    } else if (s.kind === 'xbow') {
      // dardo della balestra: lungo, con la punta d'acciaio e le alette
      line(ctx, x - dx * 20, y - dy * 20, x, y, PAL.black, 4);
      line(ctx, x - dx * 19, y - dy * 19, x, y, PAL.woodHi, 2);
      line(ctx, x - dx * 20, y - dy * 20, x - dx * 15, y - dy * 15, PAL.red, 3);
      line(ctx, x - dx * 2, y - dy * 2, x + dx * 2, y + dy * 2, PAL.silver, 3);
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

// Anello quadrato in pixel art — più coerente con gli sprite fillRect.
function pixelRing(ctx, x, y, r, color, k) {
  const rd = Math.round(r * (1.2 - k * 0.4));
  const px = Math.round(x), py = Math.round(y);
  const th = Math.max(2, Math.round(rd * 0.08 + 1));
  ctx.fillStyle = color;
  ctx.globalAlpha = k * 0.85;
  ctx.fillRect(px - rd,      py - rd,      rd * 2, th);         // top
  ctx.fillRect(px - rd,      py + rd - th, rd * 2, th);         // bottom
  ctx.fillRect(px - rd,      py - rd + th, th,     rd * 2 - th * 2); // left
  ctx.fillRect(px + rd - th, py - rd + th, th,     rd * 2 - th * 2); // right
  // riempimento centrale semitrasparente
  ctx.fillStyle = color.replace('#', 'rgba(').replace(/(..)(..)(..)$/, (_, r, g, b) =>
    `${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.06)`);
  ctx.fillRect(px - rd + th, py - rd + th, rd * 2 - th * 2, rd * 2 - th * 2);
}

export function drawFx(ctx, run) {
  const fx = run.fx;
  for (const r of fx.rings) {
    const k = r.life / r.max;
    pixelRing(ctx, r.x, r.y, r.radius, r.color, k);
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

// Cuore in pixel art centrato in (x, y), grande r.
export function drawHeart(ctx, x, y, r, color, light) {
  ctx.fillStyle = PAL.black;
  ctx.beginPath();
  ctx.arc(x - r * 0.5, y - r * 0.2, r * 0.62, 0, Math.PI * 2);
  ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.62, 0, Math.PI * 2);
  ctx.moveTo(x - r * 1.1, y);
  ctx.lineTo(x, y + r * 1.15);
  ctx.lineTo(x + r * 1.1, y);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - r * 0.5, y - r * 0.2, r * 0.5, 0, Math.PI * 2);
  ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.5, 0, Math.PI * 2);
  ctx.moveTo(x - r * 0.95, y);
  ctx.lineTo(x, y + r * 0.95);
  ctx.lineTo(x + r * 0.95, y);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.fillRect(x - r * 0.75, y - r * 0.45, r * 0.35, r * 0.3);
}
