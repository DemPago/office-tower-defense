// Disegno del mondo di gioco sul canvas. Legge lo stato, non lo modifica mai.
// Stile: grunge urbano in pixel art (asfalto, cemento, ruggine, segnaletica da cantiere).
import { WORLD, TOWER } from '../state.js';
import { ALLY_SLOTS } from '../data/allies.js';
import { allyDef } from '../systems/allies.js';
import { LOOKS } from './people.js';

// Palette grunge (la stessa usata in style.css).
export const PAL = {
  black: '#0d0d0f', ink: '#141416',
  asphalt: '#2a2a2e', asphalt2: '#323237', asphaltHi: '#44444b', road: '#222226',
  concrete: '#6e6a64', concreteHi: '#8f8a80', concreteDk: '#4a4743',
  rust: '#8a3b1e', rustHi: '#b8592a', brick: '#6d2e1f', brickHi: '#86402a',
  sand: '#9c8457', sandHi: '#bfa574', wood: '#6b4a2b',
  hazard: '#f2b705', hazardDk: '#a67c00', white: '#e8e2d0', grey: '#8a8d93',
  red: '#d7263d', blood: '#7a0f1c', pink: '#ff3e8a', cyan: '#2de2e6',
  toxic: '#7bd332', weed: '#3e6b2a', fluo: '#e9f08a', glass: '#1c2430', steel: '#5b5f66',
};
const FONT = '"Press Start 2P", monospace';
const SPRAY = '"Permanent Marker", "Press Start 2P", cursive';
const MARGIN = 160; // sfondo disegnato anche oltre i bordi del mondo

// Misure del palazzo (la torre).
const B = { w: 60, h: 96 };
B.x0 = TOWER.x - B.w / 2;
B.base = TOWER.y + 24;
B.top = B.base - B.h;
// La "base" fortificata intorno al palazzo.
const YARD = { x: TOWER.x - 104, y: TOWER.y - 96, w: 208, h: 172 };

export function createRenderer(canvas, assets) {
  const ctx = canvas.getContext('2d');
  const bg = buildBackground();
  const view = { scale: 1, ox: 0, oy: 0 };
  // Fumo e polvere sono solo decorazione: vivono qui e non nello stato del gioco.
  const smoke = [];
  const dust = Array.from({ length: 50 }, () => ({ x: Math.random() * WORLD.w, y: Math.random() * WORLD.h, v: 4 + Math.random() * 8, a: Math.random() }));
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
    ctx.fillStyle = PAL.asphalt;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shake = run ? run.fx.shake : 0;
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox + sx * view.scale, view.oy + sy * view.scale);
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(bg, -MARGIN, -MARGIN);
    drawStreetLights(ctx, time);

    if (run) {
      drawRange(ctx, run.stats.range, time);
      for (const c of run.fx.corpses) drawCorpse(ctx, assets, c);
      for (const e of run.enemies) drawShadow(ctx, e);
    }
    drawTower(ctx, assets, run, time);
    if (run) for (const a of run.allies) drawAlly(ctx, assets, a, time);
    updateSmoke(smoke, run, dt);
    drawSmoke(ctx, smoke);
    if (run) {
      // Prima i nemici più in alto, così quelli più vicini allo schermo stanno davanti.
      const sorted = [...run.enemies].sort((a, b) => a.y - b.y);
      for (const e of sorted) drawEnemy(ctx, assets, e);
      drawShots(ctx, run, time);
      drawFx(ctx, run);
    }
    drawDust(ctx, dust, dt);
    drawGrade(ctx);
    if (run) {
      drawBanner(ctx, run);
      drawBossBar(ctx, run);
    }
  }

  return { resize, draw };
}

// ─── Sfondo (disegnato una volta sola) ───────────────────────────

function buildBackground() {
  const c = document.createElement('canvas');
  c.width = WORLD.w + MARGIN * 2;
  c.height = WORLD.h + MARGIN * 2;
  const g = c.getContext('2d');
  g.translate(MARGIN, MARGIN); // da qui in poi si disegna in coordinate del mondo
  const rnd = seeded(11);
  const R = (a, b) => a + rnd() * (b - a);
  const all = { x: -MARGIN, y: -MARGIN, w: WORLD.w + MARGIN * 2, h: WORLD.h + MARGIN * 2 };
  const inYard = (x, y, pad = 0) => x > YARD.x - pad && x < YARD.x + YARD.w + pad && y > YARD.y - pad && y < YARD.y + YARD.h + pad;
  const ROAD_V = { x: 148, w: 64 }, ROAD_H = { y: 92, h: 56 };
  const onRoad = (x, y) => (x > ROAD_V.x - 4 && x < ROAD_V.x + ROAD_V.w + 4 && y < YARD.y) || (y > ROAD_H.y - 4 && y < ROAD_H.y + ROAD_H.h + 4);

  // Asfalto sporco
  g.fillStyle = PAL.asphalt;
  g.fillRect(all.x, all.y, all.w, all.h);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = [PAL.asphalt2, PAL.asphaltHi, PAL.black][Math.floor(rnd() * 3)];
    g.fillRect(Math.floor(R(all.x, all.x + all.w)), Math.floor(R(all.y, all.y + all.h)), 1, 1);
  }
  // Rattoppi di asfalto più nuovo
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(R(-60, WORLD.w + 20)), y = Math.floor(R(-40, WORLD.h + 20));
    const w = Math.floor(R(24, 80)), h = Math.floor(R(16, 50));
    g.fillStyle = PAL.black;
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = '#303035';
    g.fillRect(x, y, w, h);
  }

  // Strade: una verticale verso il palazzo e una orizzontale in alto
  g.fillStyle = PAL.road;
  g.fillRect(ROAD_V.x, all.y, ROAD_V.w, YARD.y - all.y);
  g.fillRect(all.x, ROAD_H.y, all.w, ROAD_H.h);
  g.fillStyle = PAL.concreteDk;
  g.fillRect(ROAD_V.x - 3, ROAD_H.y + ROAD_H.h, 3, YARD.y - ROAD_H.y - ROAD_H.h);
  g.fillRect(ROAD_V.x + ROAD_V.w, ROAD_H.y + ROAD_H.h, 3, YARD.y - ROAD_H.y - ROAD_H.h);
  g.fillRect(all.x, ROAD_H.y - 3, ROAD_V.x - all.x, 3);
  g.fillRect(ROAD_V.x + ROAD_V.w, ROAD_H.y - 3, all.w, 3);
  g.fillRect(all.x, ROAD_H.y + ROAD_H.h, ROAD_V.x - 3 - all.x, 3);
  g.fillRect(ROAD_V.x + ROAD_V.w + 3, ROAD_H.y + ROAD_H.h, all.w, 3);
  // Segnaletica sbiadita
  for (let y = ROAD_H.y + ROAD_H.h + 6; y < YARD.y - 10; y += 18) {
    if (rnd() < 0.2) continue; // pezzi di striscia mancanti
    g.fillStyle = 'rgba(242,183,5,0.55)';
    g.fillRect(ROAD_V.x + ROAD_V.w / 2 - 1, y, 2, 10);
  }
  for (let x = all.x; x < all.x + all.w; x += 20) {
    if (x > ROAD_V.x - 10 && x < ROAD_V.x + ROAD_V.w) continue;
    if (rnd() < 0.2) continue;
    g.fillStyle = 'rgba(232,226,208,0.45)';
    g.fillRect(x, ROAD_H.y + ROAD_H.h / 2 - 1, 12, 2);
  }
  // Strisce pedonali
  for (let i = 0; i < 8; i++) {
    g.fillStyle = 'rgba(232,226,208,0.35)';
    g.fillRect(ROAD_V.x + 4 + i * 7.5 | 0, ROAD_H.y + ROAD_H.h + 6, 4, 12);
  }

  // Crepe con qualche erbaccia
  for (let i = 0; i < 55; i++) {
    let x = R(-40, WORLD.w + 40), y = R(-40, WORLD.h + 40), a = R(0, Math.PI * 2);
    if (inYard(x, y)) continue;
    g.strokeStyle = PAL.black;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5);
    const steps = Math.floor(R(4, 14));
    for (let k = 0; k < steps; k++) {
      a += R(-0.8, 0.8);
      x += Math.cos(a) * R(3, 6);
      y += Math.sin(a) * R(3, 6);
      g.lineTo(Math.round(x) + 0.5, Math.round(y) + 0.5);
    }
    g.stroke();
    if (rnd() < 0.45) weeds(g, Math.round(x), Math.round(y));
  }

  // Macchie d'olio e pozzanghere
  for (let i = 0; i < 14; i++) {
    const x = R(-20, WORLD.w + 20), y = R(-20, WORLD.h + 20);
    if (inYard(x, y, 6)) continue;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.ellipse(x, y, R(5, 14), R(3, 7), 0, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 6; i++) {
    const x = R(10, WORLD.w - 10), y = R(30, WORLD.h - 20);
    if (inYard(x, y, 10)) continue;
    const w = R(10, 20), h = R(4, 8);
    g.fillStyle = '#3d4a57';
    g.beginPath();
    g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6f8597';
    g.fillRect(Math.round(x - w / 2), Math.round(y - h / 3), Math.round(w * 0.6), 1);
  }
  // Tombini
  for (const [x, y] of [[180, 72], [110, 120], [300, 300], [40, 420]]) manhole(g, x, y);

  // Cortile di cemento intorno al palazzo, bordato da strisce gialle e nere
  g.fillStyle = PAL.black;
  g.fillRect(YARD.x - 5, YARD.y - 5, YARD.w + 10, YARD.h + 10);
  hazardStripes(g, YARD.x - 4, YARD.y - 4, YARD.w + 8, YARD.h + 8);
  g.fillStyle = PAL.concrete;
  g.fillRect(YARD.x, YARD.y, YARD.w, YARD.h);
  for (let y = YARD.y; y < YARD.y + YARD.h; y += 16) {
    for (let x = YARD.x; x < YARD.x + YARD.w; x += 16) {
      g.fillStyle = PAL.concreteDk;
      g.fillRect(x, y, 16, 1);
      g.fillRect(x, y, 1, 16);
      if (rnd() < 0.25) {
        g.fillStyle = 'rgba(20,20,22,0.18)';
        g.fillRect(x + 1, y + 1, 15, 15);
      }
    }
  }
  for (let i = 0; i < 300; i++) {
    g.fillStyle = rnd() < 0.5 ? PAL.concreteHi : PAL.concreteDk;
    g.fillRect(Math.floor(R(YARD.x, YARD.x + YARD.w)), Math.floor(R(YARD.y, YARD.y + YARD.h)), 1, 1);
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(R(YARD.x + 10, YARD.x + YARD.w - 10), R(YARD.y + 10, YARD.y + YARD.h - 10), R(5, 12), R(3, 6), 0, 0, Math.PI * 2);
    g.fill();
  }

  // Sacchi di sabbia lungo il bordo alto del cortile (con un varco per la strada)
  for (let x = YARD.x + 2; x < YARD.x + YARD.w - 10; x += 12) {
    if (x > ROAD_V.x - 6 && x < ROAD_V.x + ROAD_V.w - 4) continue;
    sandbag(g, x, YARD.y - 6);
    if (rnd() < 0.6) sandbag(g, x + 6, YARD.y - 11);
  }
  // Barriere di cemento ai lati del varco
  barrier(g, ROAD_V.x - 22, YARD.y - 14);
  barrier(g, ROAD_V.x + ROAD_V.w + 2, YARD.y - 14);

  // Muro di mattoni in alto, rotto dove passa la strada, con i graffiti
  brickWall(g, all.x, -40, ROAD_V.x - 6 - all.x, 62, rnd);
  brickWall(g, ROAD_V.x + ROAD_V.w + 6, -40, all.w, 62, rnd);
  spray(g, 'SCIOPERO!', 74, 14, PAL.pink, -0.05, 15);
  spray(g, 'NO STRAORDINARI', 290, 12, PAL.cyan, 0.04, 11);

  // Oggetti sparsi: coni, barili, scatoloni, gomme, rifiuti
  const props = [];
  for (let i = 0; i < 70; i++) {
    const x = Math.round(R(-30, WORLD.w + 30)), y = Math.round(R(30, WORLD.h + 30));
    if (inYard(x, y, 18) || onRoad(x, y)) continue;
    props.push({ x, y, k: rnd() });
  }
  props.sort((a, b) => a.y - b.y);
  for (const p of props) {
    if (p.k < 0.16) cone(g, p.x, p.y);
    else if (p.k < 0.28) barrel(g, p.x, p.y, rnd() < 0.5 ? PAL.rust : '#2f4f6f');
    else if (p.k < 0.42) box(g, p.x, p.y);
    else if (p.k < 0.50) tire(g, p.x, p.y);
    else trash(g, p.x, p.y, rnd);
  }
  dumpster(g, 16, 200);
  wreck(g, 286, 214);
  dumpster(g, 300, 470);
  return c;
}

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// ─── Oggetti dello sfondo ───────────────────────────────────────

function hazardStripes(g, x, y, w, h) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = PAL.hazard;
  g.fillRect(x, y, w, h);
  g.fillStyle = PAL.black;
  for (let k = -h; k < w; k += 10) {
    g.beginPath();
    g.moveTo(x + k, y + h);
    g.lineTo(x + k + 5, y + h);
    g.lineTo(x + k + 5 + h, y);
    g.lineTo(x + k + h, y);
    g.fill();
  }
  g.restore();
}

function weeds(g, x, y) {
  g.fillStyle = PAL.weed;
  g.fillRect(x, y - 2, 1, 3);
  g.fillRect(x - 2, y - 1, 1, 2);
  g.fillRect(x + 2, y - 1, 1, 2);
  g.fillStyle = PAL.toxic;
  g.fillRect(x, y - 3, 1, 1);
}

function manhole(g, x, y) {
  g.fillStyle = PAL.black;
  g.beginPath();
  g.arc(x, y, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#3a3a40';
  g.beginPath();
  g.arc(x, y, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PAL.black;
  for (let i = -4; i <= 4; i += 3) g.fillRect(x - 5, y + i, 10, 1);
}

function sandbag(g, x, y) {
  g.fillStyle = PAL.black;
  g.fillRect(x - 1, y, 13, 7);
  g.fillRect(x, y - 1, 11, 9);
  g.fillStyle = PAL.sand;
  g.fillRect(x, y, 11, 7);
  g.fillStyle = PAL.sandHi;
  g.fillRect(x + 1, y + 1, 8, 2);
  g.fillStyle = '#7a6640';
  g.fillRect(x + 5, y + 2, 1, 4);
}

function barrier(g, x, y) {
  g.fillStyle = PAL.black;
  g.fillRect(x - 1, y - 1, 22, 12);
  g.fillStyle = PAL.concreteHi;
  g.fillRect(x, y, 20, 10);
  hazardStripes(g, x, y + 3, 20, 4);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x, y + 7, 20, 3);
}

function brickWall(g, x, y, w, h, rnd) {
  g.fillStyle = PAL.black;
  g.fillRect(x, y, w, h + 2);
  for (let row = 0; row * 6 < h; row++) {
    const off = row % 2 ? 6 : 0;
    for (let bx = x - off; bx < x + w; bx += 12) {
      g.fillStyle = rnd() < 0.15 ? PAL.rust : rnd() < 0.5 ? PAL.brick : PAL.brickHi;
      g.fillRect(Math.max(x, bx + 1), y + row * 6 + 1, Math.min(10, x + w - bx - 1), 5);
    }
  }
  // macchie di umido
  for (let i = 0; i < 10; i++) {
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(Math.floor(x + rnd() * w), y + h - 14 + Math.floor(rnd() * 8), 2, 10);
  }
  g.fillStyle = PAL.concreteDk;
  g.fillRect(x, y + h - 2, w, 3);
}

function spray(g, text, x, y, color, angle, size) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.font = `${size}px ${SPRAY}`;
  g.textAlign = 'center';
  g.fillStyle = PAL.black;
  g.fillText(text, 1, 1);
  g.fillStyle = color;
  g.fillText(text, 0, 0);
  // colature di vernice
  g.fillRect(-size * 1.6, 2, 1, 4);
  g.fillRect(size * 0.4, 3, 1, 6);
  g.fillRect(size * 1.8, 2, 1, 3);
  g.restore();
}

function cone(g, x, y) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x - 4, y + 1, 10, 2);
  g.fillStyle = PAL.black;
  g.fillRect(x - 4, y - 1, 9, 3);
  g.fillRect(x - 2, y - 9, 5, 9);
  g.fillStyle = '#e8641b';
  g.fillRect(x - 3, y - 1, 7, 2);
  g.fillRect(x - 1, y - 8, 3, 8);
  g.fillStyle = PAL.white;
  g.fillRect(x - 1, y - 5, 3, 2);
}

function barrel(g, x, y, color) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x - 3, y + 1, 12, 2);
  g.fillStyle = PAL.black;
  g.fillRect(x - 5, y - 13, 11, 15);
  g.fillStyle = color;
  g.fillRect(x - 4, y - 12, 9, 13);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fillRect(x - 3, y - 12, 2, 13);
  g.fillStyle = PAL.black;
  g.fillRect(x - 4, y - 8, 9, 1);
  g.fillRect(x - 4, y - 3, 9, 1);
  g.fillStyle = PAL.hazard;
  g.fillRect(x - 1, y - 7, 3, 3);
}

function box(g, x, y) {
  g.fillStyle = PAL.black;
  g.fillRect(x - 6, y - 9, 13, 11);
  g.fillStyle = '#8b6a3e';
  g.fillRect(x - 5, y - 8, 11, 9);
  g.fillStyle = '#a5824f';
  g.fillRect(x - 5, y - 8, 11, 2);
  g.fillStyle = '#c9b48a';
  g.fillRect(x, y - 8, 1, 9);
}

function tire(g, x, y) {
  g.fillStyle = PAL.black;
  g.beginPath();
  g.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PAL.asphalt;
  g.beginPath();
  g.ellipse(x, y, 3, 1.5, 0, 0, Math.PI * 2);
  g.fill();
}

function trash(g, x, y, rnd) {
  const n = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const tx = x + Math.floor(rnd() * 10 - 5), ty = y + Math.floor(rnd() * 6 - 3);
    const r = rnd();
    g.fillStyle = r < 0.4 ? PAL.white : r < 0.7 ? PAL.red : PAL.grey;
    g.fillRect(tx, ty, r < 0.4 ? 3 : 2, 2);
  }
}

function dumpster(g, x, y) {
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.fillRect(x + 2, y + 18, 36, 4);
  g.fillStyle = PAL.black;
  g.fillRect(x - 1, y - 1, 38, 21);
  g.fillStyle = '#2e5b3a';
  g.fillRect(x, y, 36, 19);
  g.fillStyle = '#3f7a4e';
  g.fillRect(x, y, 36, 4);
  g.fillStyle = PAL.black;
  for (let i = 6; i < 36; i += 8) g.fillRect(x + i, y + 6, 1, 12);
  g.fillStyle = PAL.white;
  g.fillRect(x + 30, y - 3, 3, 3);
  g.fillRect(x + 4, y - 2, 4, 2);
  spray(g, 'X', x + 18, y + 15, PAL.pink, 0.2, 9);
}

function wreck(g, x, y) {
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.fillRect(x - 2, y + 14, 40, 5);
  g.fillStyle = PAL.black;
  g.fillRect(x - 1, y - 1, 38, 17);
  g.fillRect(x + 3, y + 13, 7, 5);
  g.fillRect(x + 26, y + 13, 7, 5);
  g.fillStyle = PAL.rust;
  g.fillRect(x, y, 36, 15);
  g.fillStyle = PAL.rustHi;
  g.fillRect(x + 2, y + 1, 30, 3);
  g.fillStyle = PAL.glass;
  g.fillRect(x + 9, y + 4, 18, 6);
  g.fillStyle = PAL.black;
  g.fillRect(x + 12, y + 5, 3, 4);
  g.fillRect(x + 20, y + 6, 4, 3);
}

// ─── Atmosfera ──────────────────────────────────────────────────

const LIGHTS = [{ x: 140, y: 170 }, { x: 222, y: 170 }];

// Lampioni sulla strada: uno dei due sfarfalla.
function drawStreetLights(ctx, time) {
  LIGHTS.forEach((l, i) => {
    const on = i === 0 || Math.sin(time * 13) > -0.6 || Math.sin(time * 2.1) > 0.4;
    if (on) {
      ctx.fillStyle = 'rgba(242,183,5,0.10)';
      ctx.beginPath();
      ctx.ellipse(l.x, l.y + 6, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PAL.black;
    ctx.fillRect(l.x - 1, l.y - 26, 3, 30);
    ctx.fillRect(l.x - 4, l.y + 2, 9, 3);
    ctx.fillRect(l.x - 4, l.y - 30, 9, 5);
    ctx.fillStyle = on ? PAL.fluo : PAL.steel;
    ctx.fillRect(l.x - 3, l.y - 29, 7, 3);
  });
}

function drawDust(ctx, dust, dt) {
  ctx.fillStyle = 'rgba(232,226,208,0.22)';
  for (const d of dust) {
    d.x += d.v * dt;
    d.y += Math.sin(d.a += dt) * 3 * dt;
    if (d.x > WORLD.w + 4) { d.x = -4; d.y = Math.random() * WORLD.h; }
    ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
  }
}

let gradeCache = null;
// Bordo scuro e una leggera luce calda da lampione su tutta la scena.
function drawGrade(ctx) {
  if (!gradeCache) {
    const g = ctx.createRadialGradient(TOWER.x, WORLD.h * 0.6, WORLD.h * 0.25, TOWER.x, WORLD.h * 0.6, WORLD.h * 0.8);
    g.addColorStop(0, 'rgba(13,13,15,0)');
    g.addColorStop(1, 'rgba(13,13,15,0.7)');
    gradeCache = g;
  }
  ctx.fillStyle = 'rgba(255,140,40,0.05)';
  ctx.fillRect(-MARGIN, -MARGIN, WORLD.w + MARGIN * 2, WORLD.h + MARGIN * 2);
  ctx.fillStyle = gradeCache;
  ctx.fillRect(-MARGIN, -MARGIN, WORLD.w + MARGIN * 2, WORLD.h + MARGIN * 2);
}

function drawRange(ctx, range, time) {
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

// ─── Palazzo (la torre) ─────────────────────────────────────────

// Stato di ogni finestra (3 colonne × 5 piani): L accesa, D spenta, X rotta, B sbarrata con assi.
const WINDOWS = 'LDL' + 'XLL' + 'LBD' + 'DLX' + 'LLB';
const STAINS = [[6, 22, 12], [21, 40, 9], [36, 18, 16], [10, 70, 8], [33, 60, 14]];
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
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x0 + 6, base - 2, w + 14, 7);

  // Facciata di cemento sporco
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 - 2, top - 2, w + 4, h + 4);
  ctx.fillStyle = PAL.concrete;
  ctx.fillRect(x0, top, w, h);
  ctx.fillStyle = PAL.concreteHi;
  ctx.fillRect(x0, top, 2, h);
  ctx.fillStyle = PAL.concreteDk;
  ctx.fillRect(x0 + w - 10, top, 10, h);
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 + w - 10, top, 1, h);
  // colature di sporco
  for (const [sx, sy, len] of STAINS) {
    ctx.fillStyle = 'rgba(13,13,15,0.35)';
    ctx.fillRect(x0 + sx, top + sy, 1, len);
    ctx.fillRect(x0 + sx + 1, top + sy, 1, len - 4);
  }

  // Piani e finestre
  for (let r = 0; r < 5; r++) {
    const wy = top + 10 + r * 15;
    ctx.fillStyle = 'rgba(13,13,15,0.45)';
    ctx.fillRect(x0 + 2, wy + 12, w - 12, 1);
    for (let col = 0; col < 3; col++) {
      const i = r * 3 + col;
      const wx = x0 + 5 + col * 15;
      let kind = WINDOWS[i];
      if (dead && kind === 'L') kind = 'D';
      if (hpRatio < 0.3 && kind === 'L' && i % 2) kind = 'X';
      // le luci al neon ogni tanto sfarfallano
      const flick = kind === 'L' && Math.sin(time * 9 + i * 3.1) > 0.92;
      ctx.fillStyle = PAL.black;
      ctx.fillRect(wx, wy, 12, 10);
      if (kind === 'L') {
        ctx.fillStyle = flick ? '#9aa05a' : PAL.fluo;
        ctx.fillRect(wx + 1, wy + 1, 10, 8);
        ctx.fillStyle = 'rgba(13,13,15,0.4)';
        ctx.fillRect(wx + 1, wy + 6, 10, 3);  // sagome dietro il vetro
      } else if (kind === 'D') {
        ctx.fillStyle = PAL.glass;
        ctx.fillRect(wx + 1, wy + 1, 10, 8);
        ctx.fillStyle = '#34465a';
        ctx.fillRect(wx + 2, wy + 2, 2, 2);
      } else if (kind === 'X') {
        ctx.fillStyle = PAL.black;
        ctx.fillRect(wx + 1, wy + 1, 10, 8);
        ctx.fillStyle = PAL.grey;
        ctx.fillRect(wx + 1, wy + 1, 3, 1);
        ctx.fillRect(wx + 1, wy + 2, 1, 2);
        ctx.fillRect(wx + 8, wy + 7, 3, 1);
        ctx.fillRect(wx + 10, wy + 5, 1, 2);
      } else {
        ctx.fillStyle = PAL.glass;
        ctx.fillRect(wx + 1, wy + 1, 10, 8);
        ctx.fillStyle = PAL.wood;
        ctx.fillRect(wx - 1, wy + 2, 14, 2);
        ctx.fillRect(wx - 1, wy + 6, 14, 2);
        ctx.fillStyle = PAL.black;
        ctx.fillRect(wx + 2, wy + 2, 1, 1);
        ctx.fillRect(wx + 9, wy + 6, 1, 1);
      }
    }
  }

  // Graffito sulla facciata
  ctx.save();
  ctx.font = `9px ${SPRAY}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = PAL.black;
  ctx.fillText('OTD', x0 + 4, base - 7);
  ctx.fillStyle = PAL.pink;
  ctx.fillText('OTD', x0 + 3, base - 8);
  ctx.restore();

  // Ingresso: saracinesca mezza alzata, con architrave a strisce
  const dx = TOWER.x - 9;
  hazardStripes(ctx, dx - 3, base - 22, 24, 4);
  ctx.fillStyle = PAL.black;
  ctx.fillRect(dx - 1, base - 18, 20, 18);
  ctx.fillStyle = PAL.steel;
  ctx.fillRect(dx, base - 17, 18, 10);
  ctx.fillStyle = PAL.black;
  for (let i = 0; i < 5; i++) ctx.fillRect(dx, base - 15 + i * 2, 18, 1);
  ctx.fillStyle = '#060607';
  ctx.fillRect(dx, base - 7, 18, 7);
  // sacchi di sabbia davanti all'ingresso
  sandbag(ctx, dx - 16, base - 6);
  sandbag(ctx, dx + 23, base - 6);

  // Tetto: cornicione, filo spinato, condizionatore arrugginito, parabola
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 - 4, top - 4, w + 8, 6);
  ctx.fillStyle = PAL.concreteDk;
  ctx.fillRect(x0 - 3, top - 3, w + 6, 4);
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 + 2, top - 14, 15, 11);
  ctx.fillStyle = PAL.rust;
  ctx.fillRect(x0 + 3, top - 13, 13, 9);
  ctx.fillStyle = PAL.rustHi;
  ctx.fillRect(x0 + 3, top - 13, 13, 2);
  ctx.fillStyle = PAL.black;
  for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 5 + i * 4, top - 10, 2, 5);
  ctx.fillStyle = 'rgba(138,59,30,0.5)';
  ctx.fillRect(x0 + 8, top + 1, 1, 12);       // colatura di ruggine sulla facciata
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 + w - 14, top - 15, 11, 9);
  ctx.fillStyle = PAL.grey;
  ctx.fillRect(x0 + w - 13, top - 14, 9, 6);
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 + w - 9, top - 9, 1, 6);
  ctx.strokeStyle = PAL.grey;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= w + 6; i += 3) ctx.lineTo(x0 - 3 + i + 0.5, top - 6 + (i / 3 % 2 ? 0 : 2) + 0.5);
  ctx.stroke();

  // Insegna al neon con una lettera che fa i capricci
  ctx.fillStyle = PAL.black;
  ctx.fillRect(x0 + 4, top + 1, w - 18, 8);
  ctx.save();
  ctx.font = `5px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.shadowColor = PAL.pink;
  ctx.shadowBlur = dead ? 0 : 6;
  const letters = 'UFFICIO';
  const broken = Math.sin(time * 17) > 0.2 || Math.sin(time * 1.3) > 0.7;
  for (let i = 0; i < letters.length; i++) {
    const off = dead || (i === 4 && broken);
    ctx.fillStyle = off ? '#4a1830' : PAL.pink;
    ctx.fillText(letters[i], x0 + 6 + i * 5.6, top + 7.5);
  }
  ctx.restore();

  // Crepe quando la vita scende
  if (hpRatio < 0.6) {
    ctx.strokeStyle = PAL.black;
    ctx.lineWidth = 1;
    const n = hpRatio < 0.3 ? CRACKS.length : 1;
    for (let k = 0; k < n; k++) {
      ctx.beginPath();
      CRACKS[k].forEach(([cx, cy], j) => (j ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + cx + 0.5, top + cy + 0.5));
      ctx.stroke();
    }
  }

  // Lampo rosso quando viene colpito
  if (run && run.tower.hitFlash > 0) {
    ctx.fillStyle = 'rgba(215,38,61,0.35)';
    ctx.fillRect(x0 - 2, top - 2, w + 4, h + 4);
  }

  if (dead) return;

  // Il protagonista sul tetto: elmetto e giubbotto catarifrangente
  const recoil = run && run.tower.recoil > 0 ? 1 : 0;
  const bob = Math.round(Math.sin(time * 2.2) * 0.6);
  const feet = top - 2 + recoil + bob;
  drawPersonAt(ctx, assets.person('player', 0, 1), TOWER.x, feet);
  // Lampo allo sparo
  if (recoil) {
    const fx = TOWER.x + 1, fy = feet - 15;
    ctx.fillStyle = PAL.white;
    ctx.fillRect(fx - 2, fy - 2, 5, 5);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(fx - 5, fy - 1, 11, 3);
    ctx.fillRect(fx - 1, fy - 5, 3, 11);
  }
}

// Disegna uno sprite di personaggio con i piedi nel punto (x, feetY).
function drawPersonAt(ctx, img, x, feetY) {
  ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(feetY - img.height + 2));
}

function updateSmoke(smoke, run, dt) {
  const ratio = run ? run.tower.hp / run.stats.maxHp : 1;
  const over = run && run.phase === 'over';
  const rate = over ? 34 : ratio < 0.3 ? 10 : ratio < 0.6 ? 4 : 0.6;
  if (Math.random() < rate * dt) {
    smoke.push({
      x: B.x0 + 8 + Math.random() * (B.w - 16), y: B.top + 4 + Math.random() * (ratio < 0.6 ? 50 : 4),
      vx: (Math.random() - 0.3) * 6, size: 3, life: 1.8, max: 1.8,
      fire: over || (ratio < 0.3 && Math.random() < 0.5),
    });
  }
  for (const s of smoke) { s.life -= dt; s.y -= 16 * dt; s.x += s.vx * dt; s.size += 4 * dt; }
  for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].life <= 0) smoke.splice(i, 1);
}

function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    const k = s.life / s.max;
    ctx.globalAlpha = k * 0.75;
    ctx.fillStyle = s.fire && k > 0.75 ? PAL.hazard : s.fire && k > 0.55 ? '#e8641b' : k > 0.5 ? '#3a3a40' : '#1e1e22';
    const z = Math.round(s.size);
    ctx.fillRect(Math.round(s.x - z / 2), Math.round(s.y - z / 2), z, z);
  }
  ctx.globalAlpha = 1;
}

// ─── Rinforzi (colleghi) ────────────────────────────────────────

function drawAlly(ctx, assets, ally, time) {
  const def = allyDef(ally.id);
  const slot = ALLY_SLOTS[ally.slot];
  const x = TOWER.x + slot.x, y = TOWER.y + slot.y;
  const drop = Math.round((1 - ally.spawn) * -40); // arriva "paracadutato" dall'alto

  // postazione di sacchi di sabbia
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x - 12, y, 26, 4);
  if (def.aura) {
    const pulse = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = def.aura === 'rate' ? `rgba(45,226,230,${0.15 + pulse * 0.2})` : `rgba(255,62,138,${0.15 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + pulse * 3, 7 + pulse, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const recoil = ally.recoil > 0 ? 1 : 0;
  ctx.globalAlpha = ally.spawn;
  drawPersonAt(ctx, assets.person(def.look, 0, 1), x, y - 1 + drop + recoil);
  ctx.globalAlpha = 1;
  sandbag(ctx, x - 12, y - 5);
  sandbag(ctx, x + 1, y - 5);

  // segno di riconoscimento: freccia gialla e tacche del livello
  if (ally.spawn >= 1) {
    const by = y - (def.aura ? 44 : 38) + Math.round(Math.sin(time * 3 + ally.slot));
    ctx.fillStyle = PAL.black;
    ctx.fillRect(x - 4, by - 1, 9, 5);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(x - 3, by, 7, 1);
    ctx.fillRect(x - 2, by + 1, 5, 1);
    ctx.fillRect(x - 1, by + 2, 3, 1);
    for (let i = 0; i < ally.level; i++) {
      ctx.fillStyle = PAL.black;
      ctx.fillRect(x - 10 + i * 4, y + 4, 4, 4);
      ctx.fillStyle = i === 4 ? PAL.pink : PAL.hazard;
      ctx.fillRect(x - 9 + i * 4, y + 5, 2, 2);
    }
  }
}

// ─── Nemici ─────────────────────────────────────────────────────

function drawShadow(ctx, e) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.size * 0.32, e.size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx, assets, e) {
  const s = e.size, k = e.scale || 1;
  const frame = e.moving ? Math.floor(e.anim * 2) % 2 : 0;
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
  if (e.boss) {
    ctx.fillStyle = 'rgba(215,38,61,0.4)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, s * 0.55, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawPersonAt(ctx, assets.person(e.look, frame, k), x, feet);
  if (e.hitFlash > 0) {
    ctx.globalAlpha = 0.6;
    drawPersonAt(ctx, assets.person(e.look, frame, k, true), x, feet);
  }
  ctx.globalAlpha = 1;
  x = Math.round(x - s / 2);

  if (e.slowT > 0) {
    ctx.fillStyle = 'rgba(45,226,230,0.6)';
    ctx.fillRect(x + Math.round(s * 0.25), y + Math.round(s * 0.88), Math.round(s * 0.5), 2);
  }
  if (e.dotT > 0) {
    ctx.fillStyle = PAL.toxic;
    ctx.fillRect(Math.round(e.x - 1 + Math.sin(e.anim * 9) * 4), y + 2, 2, 2);
    ctx.fillRect(Math.round(e.x + 3 + Math.cos(e.anim * 7) * 3), y + 6, 1, 1);
  }
  if (e.stunT > 0) {
    ctx.font = `6px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.fillText('zZ', e.x, y - 2);
  }
  if (e.boss && !LOOKS[e.look].hat) {
    // corona d'oro sporca
    const cx = Math.round(e.x), cy = Math.round(y + s * 0.06);
    ctx.fillStyle = PAL.black;
    ctx.fillRect(cx - 9, cy - 5, 18, 9);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(cx - 8, cy, 16, 3);
    ctx.fillRect(cx - 8, cy - 4, 3, 4);
    ctx.fillRect(cx - 1, cy - 4, 3, 4);
    ctx.fillRect(cx + 5, cy - 4, 3, 4);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(cx - 1, cy, 2, 2);
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
}

// Nemico sconfitto: cade di lato e svanisce, lasciando una macchia.
function drawCorpse(ctx, assets, c) {
  const k = 1 - c.life / c.max;
  ctx.save();
  ctx.fillStyle = `rgba(13,13,15,${0.35 * (1 - k)})`;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.size * 0.45, c.size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.max(0, 1 - k * 1.3);
  ctx.translate(Math.round(c.x), Math.round(c.y));
  ctx.rotate(c.dir * Math.min(1, k * 3) * Math.PI / 2);
  drawPersonAt(ctx, assets.person(c.look, 0, c.scale || 1), 0, 0);
  if (k < 0.2) {
    ctx.globalAlpha = 0.6 * (1 - k / 0.2); // breve lampo bianco all'inizio
    drawPersonAt(ctx, assets.person(c.look, 0, c.scale || 1, true), 0, 0);
  }
  ctx.restore();
}

// ─── Colpi ed effetti ───────────────────────────────────────────

function shotDir(s) {
  const t = s.target;
  if (!t || t.dead) return { dx: 0, dy: -1 };
  const tx = t.x, ty = t.y - t.size * 0.35;
  const d = Math.hypot(tx - s.x, ty - s.y) || 1;
  return { dx: (tx - s.x) / d, dy: (ty - s.y) / d };
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawShots(ctx, run, time) {
  ctx.lineCap = 'square';
  for (const s of run.shots) {
    const { dx, dy } = shotDir(s);
    const x = Math.round(s.x), y = Math.round(s.y);
    if (s.kind === 'laser') {
      line(ctx, x - dx * 16, y - dy * 16, x, y, PAL.red, 3);
      line(ctx, x - dx * 14, y - dy * 14, x, y, '#ffd0d6', 1);
    } else if (s.kind === 'bolt') {
      line(ctx, x - dx * 10, y - dy * 10, x, y, PAL.black, 3);
      line(ctx, x - dx * 9, y - dy * 9, x, y, PAL.white, 1);
      ctx.fillStyle = PAL.grey;
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
    ctx.fillStyle = PAL.black;
    ctx.fillRect(x - 4, y - 3, 8, 7);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x - 3, y - 2, 5, 5);
    ctx.fillRect(x + 2, y - 1, 1, 2);
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(x - 3, y - 2, 5, 1);
  }
}

function drawFx(ctx, run) {
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

function drawBanner(ctx, run) {
  const b = run.fx.banner;
  if (!b) return;
  const k = b.life / b.max;
  // entra da sinistra, resta fermo, poi svanisce
  const slide = k > 0.85 ? (k - 0.85) / 0.15 * -WORLD.w : 0;
  ctx.globalAlpha = Math.min(1, k * 5);
  const h = b.sub ? 58 : 40;
  ctx.fillStyle = 'rgba(13,13,15,0.85)';
  ctx.fillRect(0, 150, WORLD.w, h);
  hazardStripes(ctx, 0, 150, WORLD.w, 4);
  hazardStripes(ctx, 0, 150 + h - 4, WORLD.w, 4);
  ctx.textAlign = 'center';
  ctx.font = `22px ${SPRAY}`;
  ctx.fillStyle = PAL.black;
  ctx.fillText(b.title, WORLD.w / 2 + slide + 2, 182);
  ctx.fillStyle = b.color;
  ctx.fillText(b.title, WORLD.w / 2 + slide, 180);
  if (b.sub) {
    ctx.font = `7px ${FONT}`;
    ctx.fillStyle = PAL.white;
    ctx.fillText(b.sub, WORLD.w / 2 + slide, 198);
  }
  ctx.globalAlpha = 1;
}

function drawBossBar(ctx, run) {
  if (!run.boss) return;
  const list = run.boss.list;
  const hp = list.reduce((a, e) => a + Math.max(0, e.hp), 0);
  const max = list.reduce((a, e) => a + e.maxHp, 0);
  const x = 20, y = 30, w = WORLD.w - 40;
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
  ctx.strokeText(run.boss.name, WORLD.w / 2, y + 24);
  ctx.fillStyle = PAL.white;
  ctx.fillText(run.boss.name, WORLD.w / 2, y + 24);
}
