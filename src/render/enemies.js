// Nemici e boss: sprite, segnali del ruolo, aura dei boss, scie, corpi a terra.
import { TOWER, YARD } from '../state.js';
import { LOOKS, EYES, FRAMES } from './people.js';
import { PAL, FONT } from './palette.js';
import { drawPersonAt, enemySprite, facesLeft, hexA } from './view.js';
import { drawHeart } from './effects.js';

// Colori badge per tier (Graduate→Junior→Middle→Senior→Focal).
const TIER_COLORS = {
  graduate: '#7bd332', // verde
  junior:   '#2de2e6', // ciano
  middle:   '#f2b705', // giallo
  senior:   '#ff7b1c', // arancio
  focal:    '#ff3e8a', // rosa/magenta
};

export function drawShadow(ctx, e) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.size * 0.32, e.size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSushiEnemy(ctx, e) {
  const s = e.size;
  const spin = e.moving ? e.anim * 3 : 0;
  const bob  = e.moving ? Math.sin(e.anim * 5) * 1.5 : 0;
  const x = Math.round(e.x), cy = Math.round(e.y - s * 0.5 + bob);
  ctx.save();
  ctx.translate(x, cy);
  ctx.rotate(spin);
  ctx.globalAlpha = Math.min(1, (e.age || 0) / 0.4);
  const hit = e.hitFlash > 0;
  const W = hit ? '#fff' : '#f5e6c8'; // riso bianco

  if (e.sushiType === 'nigiri') {
    // Base di riso ovalata
    ctx.fillStyle = W;
    ctx.fillRect(-7, -1, 14, 6); ctx.fillRect(-6, -2, 12, 1); ctx.fillRect(-6, 5, 12, 1);
    // Fascia nori
    ctx.fillStyle = hit ? '#fff' : '#1a1a2e';
    ctx.fillRect(-7, 1, 14, 1);
    // Pesce sopra (salmone arancio-rosso)
    ctx.fillStyle = hit ? '#fff' : '#e8603c';
    ctx.fillRect(-5, -8, 10, 8); ctx.fillRect(-4, -9, 8, 1);
    // Venatura chiara
    ctx.fillStyle = hit ? '#fff' : '#f29070';
    ctx.fillRect(-4, -7, 5, 2); ctx.fillRect(-3, -4, 3, 2);

  } else if (e.sushiType === 'onigiri') {
    // Triangolo di riso bianco
    ctx.fillStyle = W;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, 6); ctx.lineTo(-9, 6); ctx.closePath(); ctx.fill();
    // Fascia nori alla base
    ctx.fillStyle = hit ? '#fff' : '#1a1a2e';
    ctx.fillRect(-9, 3, 18, 4);
    // Bordo nori laterale (piccole strisce)
    ctx.fillRect(-9, 0, 2, 4); ctx.fillRect(7, 0, 2, 4);
    // Umeboshi rosso al centro
    ctx.fillStyle = hit ? '#fff' : '#c8203c';
    ctx.fillRect(-2, -5, 5, 5);
    // Luccichio umeboshi
    ctx.fillStyle = hit ? '#fff' : '#e8607a';
    ctx.fillRect(-1, -4, 2, 2);

  } else if (e.sushiType === 'sashimi') {
    // Fetta di pesce cruda (tonno rosso)
    ctx.fillStyle = hit ? '#fff' : '#c8283c';
    ctx.fillRect(-8, -3, 16, 8); ctx.fillRect(-7, -4, 14, 1); ctx.fillRect(-7, 5, 14, 1);
    // Marmorizzazione (venature bianche)
    ctx.fillStyle = hit ? '#fff' : '#e0687c';
    ctx.fillRect(-6, -1, 10, 2); ctx.fillRect(-5, 2, 8, 2);
    // Bordi scuri (contorno)
    ctx.fillStyle = hit ? '#fff' : '#8a1828';
    ctx.fillRect(-8, -3, 1, 9); ctx.fillRect(7, -3, 1, 9);
    // Sottolineatura wasabi verde
    ctx.fillStyle = hit ? '#fff' : '#5ab040';
    ctx.fillRect(-8, 5, 16, 2);

  } else { // uramaki — riso fuori, nori dentro
    // Riso esterno
    ctx.fillStyle = W;
    ctx.fillRect(-8, -8, 16, 16);
    // Anello nori
    ctx.fillStyle = hit ? '#fff' : '#1a1a2e';
    ctx.fillRect(-6, -6, 12, 12);
    // Ripieno avocado
    ctx.fillStyle = hit ? '#fff' : '#6ab830';
    ctx.fillRect(-4, -4, 8, 8);
    // Salmone al centro
    ctx.fillStyle = hit ? '#fff' : '#e8603c';
    ctx.fillRect(-2, -2, 5, 5);
    // Sesamo sopra il riso
    ctx.fillStyle = hit ? '#fff' : '#d4b896';
    ctx.fillRect(-6, -9, 2, 1); ctx.fillRect(-2, -9, 2, 1); ctx.fillRect(2, -9, 2, 1);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  if (e.hp < e.maxHp) {
    const bw = Math.round(s * 0.9), bx = Math.round(e.x - bw / 2), by = Math.round(e.y - s - 4);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = '#d7263d'; ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = '#ff6b8a'; ctx.fillRect(bx, by, Math.max(1, Math.round(bw * e.hp / e.maxHp)), 2);
  }
}

export function drawEnemy(ctx, assets, e) {
  if (e.sushi) { drawSushiEnemy(ctx, e); return; }
  const s = e.size, k = e.scale || 1;
  const frame = e.moving ? Math.floor(e.anim * 2.5) % FRAMES : 1;
  let x = e.x, feet = e.y;
  if (e.moving) feet -= Math.abs(Math.sin(e.anim * Math.PI)) * k; // saltello mentre cammina
  if (e.lunge > 0) {
    // scatto verso il palazzo quando colpisce
    const d = Math.hypot(TOWER.x - e.x, TOWER.y - e.y) || 1;
    x += (TOWER.x - e.x) / d * 5;
    feet += (TOWER.y - e.y) / d * 5;
  }
  const y = Math.round(feet - s); // cima della testa, per barre e simboli

  ctx.globalAlpha = Math.min(1, (e.age || 0) / 0.4); // compare in dissolvenza
  if (e.boss) drawBossAura(ctx, e, x, feet, s);
  if (e.zombie) {
    // barcolla: lo sprite oscilla attorno ai piedi
    ctx.save();
    ctx.translate(x, feet);
    ctx.rotate(Math.sin(e.anim * 2.2) * 0.09);
    ctx.translate(-x, -feet);
  }
  drawPersonAt(ctx, enemySprite(assets, e, frame), x, feet, facesLeft(e));
  if (e.zombie) ctx.restore();
  if (e.enraged) {
    // infuriato: trema e pulsa di rosso
    x += Math.round(Math.sin((e.age || 0) * 30) * 1.5);
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 120);
    drawPersonAt(ctx, enemySprite(assets, e, frame, '#ff2a3d'), x, feet, facesLeft(e));
    ctx.globalAlpha = 1;
  }
  if ((e.elite || e.boss) && !e.animal) {
    // ÉLITE e boss: occhi rossi che brillano
    const sp = assets.person(e.look, frame, k);
    const left = x - sp.w / 2, top = feet - sp.h + sp.k * 2;
    const ey = top + (EYES.y + 1) * sp.k;
    ctx.fillStyle = 'rgba(215,38,61,0.45)';
    ctx.fillRect(left + (EYES.xs[0]) * sp.k, ey - sp.k, 10 * sp.k, 4 * sp.k);
    ctx.fillStyle = '#ff2a3d';
    for (const ex of EYES.xs) ctx.fillRect(left + (ex + 1) * sp.k, ey, 2 * sp.k, 2 * sp.k);
  }
  if (e.hitFlash > 0) {
    ctx.globalAlpha = 0.6;
    drawPersonAt(ctx, enemySprite(assets, e, frame, true), x, feet, facesLeft(e));
  }
  ctx.globalAlpha = 1;
  x = Math.round(x - s / 2);

  drawRoleCue(ctx, e, x, y, s);
  if (e.slowT > 0) {
    ctx.fillStyle = 'rgba(45,226,230,0.6)';
    ctx.fillRect(x + Math.round(s * 0.25), y + Math.round(s * 0.88), Math.round(s * 0.5), 2);
  }
  if (e.dotT > 0) {
    ctx.fillStyle = PAL.toxic;
    ctx.fillRect(Math.round(e.x - 1 + Math.sin(e.anim * 9) * 4), y + 2, 2, 2);
    ctx.fillRect(Math.round(e.x + 3 + Math.cos(e.anim * 7) * 3), y + 6, 1, 1);
  }
  if (e.charmT > 0) drawHeart(ctx, e.x, y - 5 + Math.sin(performance.now() / 120), 3, '#ff3e8a', '#ffd0e0');
  if (e.stunT > 0) {
    ctx.font = `6px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.fillText('zZ', e.x, y - 2);
  }
  if (e.boss && !e.animal && !LOOKS[e.look].hat && LOOKS[e.look].hairStyle !== 'wild') {
    // corona d'oro, in proporzione al boss
    const c = k / 2, cx = e.x, cy = y + s * 0.02;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(cx - 9 * c, cy - 5 * c, 18 * c, 9 * c);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(cx - 8 * c, cy, 16 * c, 3 * c);
    ctx.fillRect(cx - 8 * c, cy - 4 * c, 3 * c, 4 * c);
    ctx.fillRect(cx - 1.5 * c, cy - 4 * c, 3 * c, 4 * c);
    ctx.fillRect(cx + 5 * c, cy - 4 * c, 3 * c, 4 * c);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(cx - 7 * c, cy, 2 * c, c);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(cx - c, cy + c * 0.5, 2 * c, 2 * c);
  }
  if (e.hp < e.maxHp && !e.boss) {
    const bw = Math.round(s * 0.7), bx = Math.round(e.x - bw / 2), by = y - 2;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = PAL.blood;
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(bx, by, Math.max(1, Math.round(bw * e.hp / e.maxHp)), 2);
  }
  // Tier badge: piccolo indicatore visivo del livello del nemico
  if (!e.boss && e.tier) {
    const tc = TIER_COLORS[e.tier];
    if (tc) {
      const bx = Math.round(e.x + s * 0.28), by = y + 1;
      ctx.fillStyle = PAL.black;
      ctx.fillRect(bx - 1, by - 1, 6, 6);
      ctx.fillStyle = tc;
      ctx.fillRect(bx, by, 4, 4);
    }
  }
}

export function drawGhost(ctx, assets, e) {
  if (e.sushi) return;
  ctx.globalAlpha = 0.4;
  drawPersonAt(ctx, enemySprite(assets, e, 0, true), e.x, e.y, facesLeft(e));
  ctx.globalAlpha = 1;
}

// Segnali del ruolo: scudo per i tank, mirino per i cecchini, scia per i kamikaze.
function drawRoleCue(ctx, e, x, y, s) {
  if (e.role === 'tank' && !e.boss) {
    const sx = Math.round(e.x) - 3, sy = y - 11;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(sx - 1, sy - 1, 8, 8);
    ctx.fillStyle = PAL.silver;
    ctx.fillRect(sx, sy, 6, 4);
    ctx.fillRect(sx + 1, sy + 4, 4, 1);
    ctx.fillRect(sx + 2, sy + 5, 2, 1);
    ctx.fillStyle = PAL.steel;
    ctx.fillRect(sx + 3, sy, 3, 4);
  }
  if (e.role === 'sniper' && !e.moving && e.attackCd < 0.6) {
    // mirino laser: il colpo sta per partire
    ctx.save();
    ctx.globalAlpha = 0.35 + (0.6 - e.attackCd);
    ctx.strokeStyle = PAL.red;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - s * 0.4);
    ctx.lineTo(TOWER.x, TOWER.y - 20);
    ctx.stroke();
    ctx.restore();
  }
  if (e.charging) {
    const d = Math.hypot(TOWER.x - e.x, TOWER.y - e.y) || 1;
    const dx = (e.x - TOWER.x) / d, dy = (e.y - TOWER.y) / d;
    ctx.strokeStyle = 'rgba(255,123,28,0.7)';
    ctx.lineWidth = 1;
    for (const off of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(e.x + dy * off + dx * 6, e.y - 12 - dx * off + dy * 6);
      ctx.lineTo(e.x + dy * off + dx * 18, e.y - 12 - dx * off + dy * 18);
      ctx.stroke();
    }
    if (Math.floor(performance.now() / 90) % 2) {
      ctx.fillStyle = 'rgba(255,123,28,0.35)';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y - s * 0.45, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Alone pulsante dietro al boss, del suo colore.
function drawBossAura(ctx, e, x, feet, s) {
  const t = performance.now() / 1000;
  const r = s * (0.75 + Math.sin(t * 3) * 0.06);
  const cy = feet - s * 0.45;
  const g = ctx.createRadialGradient(x, cy, s * 0.1, x, cy, r);
  g.addColorStop(0, e.enraged ? 'rgba(255,42,61,0.45)' : hexA(e.aura, 0.4));
  g.addColorStop(1, hexA(e.aura, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - r, cy - r, r * 2, r * 2);
  ctx.restore();
  // cerchio a terra
  ctx.strokeStyle = hexA(e.aura, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, feet, s * 0.5, s * 0.16, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Scie di particelle dei boss (solo decorazione: vivono nel renderer).
export function updateTrails(trails, run, dt) {
  if (run) {
    for (const e of run.enemies) {
      if (!e.boss || !e.trail || Math.random() > dt * 18) continue;
      const s = e.size;
      if (e.trail === 'smoke') trails.push({ x: e.x + s * 0.18, y: e.y - s * 0.7, vx: 4, vy: -14, life: 1.6, max: 1.6, c: '#8a8d93', size: 1.5, grow: 2 });
      if (e.trail === 'sparks') trails.push({ x: e.x + (Math.random() - 0.5) * s * 0.6, y: e.y - Math.random() * s, vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50, life: 0.35, max: 0.35, c: Math.random() < 0.5 ? PAL.cyan : PAL.white, size: 1, grow: 0 });
      if (e.trail === 'stars') trails.push({ x: e.x + (Math.random() - 0.5) * s * 0.9, y: e.y - Math.random() * s * 0.8, vx: 0, vy: 6, life: 1.2, max: 1.2, c: Math.random() < 0.4 ? PAL.cyan : PAL.white, size: 1, grow: 0, twinkle: true });
      if (e.trail === 'code') trails.push({ x: e.x + (Math.random() - 0.5) * s * 0.8, y: e.y - s * 0.9, vx: 0, vy: 18, life: 1, max: 1, c: PAL.toxic, size: 1, grow: 0 });
    }
  }
  for (const p of trails) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.size += p.grow * dt; }
  for (let i = trails.length - 1; i >= 0; i--) if (trails[i].life <= 0) trails.splice(i, 1);
}

export function drawTrails(ctx, trails) {
  for (const p of trails) {
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5) * (p.twinkle && Math.random() < 0.3 ? 0.3 : 1);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// Nemico sconfitto: cade di lato e svanisce, lasciando una macchia.
export function drawCorpse(ctx, assets, c) {
  const k = 1 - c.life / c.max;
  ctx.save();
  ctx.fillStyle = `rgba(13,13,15,${0.35 * (1 - k)})`;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.size * 0.45, c.size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.max(0, 1 - k * 1.3);
  ctx.translate(Math.round(c.x), Math.round(c.y));
  ctx.rotate(c.dir * Math.min(1, k * 3) * Math.PI / 2);
  drawPersonAt(ctx, enemySprite(assets, c, 0), 0, 0);
  if (k < 0.2) {
    ctx.globalAlpha = 0.6 * (1 - k / 0.2); // breve lampo bianco all'inizio
    drawPersonAt(ctx, enemySprite(assets, c, 0, true), 0, 0);
  }
  ctx.restore();
}

// Cortile violato: il bordo lampeggia di rosso.
export function drawYardAlarm(ctx, time) {
  const a = 0.35 + 0.35 * Math.sin(time * 10);
  ctx.save();
  ctx.strokeStyle = `rgba(215,38,61,${a})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(YARD.x - 7, YARD.y - 7, YARD.w + 14, YARD.h + 14);
  ctx.fillStyle = `rgba(215,38,61,${a * 0.12})`;
  ctx.fillRect(YARD.x, YARD.y, YARD.w, YARD.h);
  ctx.restore();
}
