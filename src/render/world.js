// Disegno del mondo di gioco sul canvas. Legge lo stato, non lo modifica mai.
// Stile: grunge urbano in pixel art. Gli sfondi (uno per reparto) sono in scenery.js,
// gli oggetti di scena in props.js, i personaggi in people.js.
import { TOWER } from '../state.js';
import { allyDef, allyPos } from '../systems/allies.js';
import { ALLY_SLOTS, allyArc } from '../data/allies.js';
import { FENCE } from '../systems/combat.js';
import { LOOKS } from './people.js';
import { PAL, FONT, SPRAY } from './palette.js';
import { hazardStripes, sandbag } from './props.js';
import { buildScene, sceneIndexForWave, MARGIN } from './scenery.js';

// Raggio (in pixel del mondo) visibile intorno al palazzo sul lato corto dello schermo:
// più è piccolo, più la visuale è ravvicinata e tutto appare grande.
const VIEW_R = 205;
const CAMERA = { x: TOWER.x, y: TOWER.y - 16 };

// Misure del palazzo (la torre).
const B = { w: 60, h: 84 };
B.x0 = TOWER.x - B.w / 2;
B.base = TOWER.y + 24;
B.top = B.base - B.h;

const ALLY_COLOR = { pm: PAL.red, sm: PAL.toxic, dev: PAL.cyan };

export function createRenderer(canvas, assets) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, ox: 0, oy: 0, ui: 1 };
  const scenes = new Map(); // scenari già disegnati (si tengono gli ultimi due)
  let sceneIdx = 0, prevIdx = null, fade = 0;
  // Fumo e polvere sono solo decorazione: vivono qui e non nello stato del gioco.
  const smoke = [];
  const dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: 0.01 + Math.random() * 0.02, a: Math.random() * 6 }));
  let lastTime = performance.now() / 1000;

  function scene(i) {
    if (!scenes.has(i)) {
      scenes.set(i, buildScene(i));
      for (const k of scenes.keys()) if (k !== i && k !== sceneIdx && scenes.size > 2) scenes.delete(k);
    }
    return scenes.get(i);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    view.scale = Math.min(canvas.width, canvas.height) / (VIEW_R * 2);
    view.ox = canvas.width / 2 - CAMERA.x * view.scale;
    view.oy = canvas.height / 2 - CAMERA.y * view.scale;
    // scala per scritte e barre disegnate "sopra" al mondo
    view.ui = dpr * Math.max(1, Math.min(2.4, Math.min(w, h) / 380));
  }

  function draw(run) {
    const time = performance.now() / 1000;
    const dt = Math.min(0.05, time - lastTime);
    lastTime = time;

    // Scenario del reparto attuale: quando cambia, dissolvenza dal vecchio al nuovo.
    const wanted = sceneIndexForWave(run ? run.wave : 1);
    if (wanted !== sceneIdx) { prevIdx = sceneIdx; sceneIdx = wanted; fade = 1; }
    fade = Math.max(0, fade - dt / 1.5);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shake = run ? run.fx.shake : 0;
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox + sx * view.scale, view.oy + sy * view.scale);
    ctx.imageSmoothingEnabled = false;

    const cur = scene(sceneIdx);
    ctx.drawImage(cur.canvas, -MARGIN, -MARGIN);
    if (cur.ambient) cur.ambient(ctx, time);
    if (fade > 0 && prevIdx !== null) {
      ctx.globalAlpha = fade;
      ctx.drawImage(scene(prevIdx).canvas, -MARGIN, -MARGIN);
      ctx.globalAlpha = 1;
    }

    if (run) {
      drawSectors(ctx, run, time);
      drawRange(ctx, run.stats.range, time);
      for (const c of run.fx.corpses) drawCorpse(ctx, assets, c);
      for (const e of run.enemies) drawShadow(ctx, e);
    }

    // Profondità: chi sta più in alto (dietro al palazzo) si disegna prima.
    const actors = run ? [
      ...run.enemies.map(e => ({ y: e.y, draw: () => drawEnemy(ctx, assets, e), e })),
      ...run.allies.map(a => ({ y: allyPos(a).y, draw: () => drawAlly(ctx, assets, a, time) })),
    ].sort((a, b) => a.y - b.y) : [];
    const behind = actors.filter(a => a.y < TOWER.y + 20);
    for (const a of behind) a.draw();
    drawFence(ctx, run, time, true);
    drawTower(ctx, assets, run, time);
    drawFence(ctx, run, time, false);
    // Nemici nascosti dietro al palazzo: si vedono in trasparenza
    for (const a of behind) if (a.e && hiddenByTower(a.e)) drawGhost(ctx, assets, a.e);
    for (const a of actors) if (a.y >= TOWER.y + 20) a.draw();
    updateSmoke(smoke, run, dt);
    drawSmoke(ctx, smoke);
    if (run) {
      drawShots(ctx, run, time);
      drawFx(ctx, run);
    }

    // Da qui si disegna in coordinate dello schermo
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawDust(ctx, dust, dt, canvas);
    drawGrade(ctx, canvas);
    ctx.setTransform(view.ui, 0, 0, view.ui, 0, 0);
    const W = canvas.width / view.ui, H = canvas.height / view.ui;
    if (fade > 0.2) drawSceneTitle(ctx, cur.name, W, H, fade);
    if (run) {
      drawBanner(ctx, run, W, H);
      drawBossBar(ctx, run, W);
    }
  }

  return { resize, draw };
}

// ─── Atmosfera ──────────────────────────────────────────────────

function drawDust(ctx, dust, dt, canvas) {
  ctx.fillStyle = 'rgba(232,226,208,0.25)';
  const s = Math.max(1, Math.round(canvas.height / 400));
  for (const d of dust) {
    d.x += d.v * dt;
    d.a += dt;
    if (d.x > 1) { d.x = 0; d.y = Math.random(); }
    ctx.fillRect(Math.round(d.x * canvas.width), Math.round((d.y + Math.sin(d.a) * 0.01) * canvas.height), s, s);
  }
}

function drawGrade(ctx, canvas) {
  const w = canvas.width, h = canvas.height;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(13,13,15,0)');
  g.addColorStop(1, 'rgba(13,13,15,0.75)');
  ctx.fillStyle = 'rgba(255,140,40,0.04)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
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

// Angolo "da geometria" (0 = destra, 90 = su) → angolo del canvas (y verso il basso).
const rad = deg => -deg * Math.PI / 180;

// Spicchi difesi dai colleghi: un arco colorato a terra.
function drawSectors(ctx, run, time) {
  for (const ally of run.allies) {
    const color = ALLY_COLOR[ally.id];
    if (!color) continue; // i maghi non hanno spicchio
    const width = allyArc(ally.level), center = ALLY_SLOTS[ally.slot];
    const r = 104 + ally.slot * 3;
    ctx.save();
    ctx.globalAlpha = run.phase === 'wave' ? 0.35 : 0.6 + Math.sin(time * 4) * 0.2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    if (width >= 360) ctx.arc(TOWER.x, TOWER.y, r, 0, Math.PI * 2);
    else ctx.arc(TOWER.x, TOWER.y, r, rad(center + width / 2), rad(center - width / 2));
    ctx.stroke();
    ctx.restore();
  }
}

// Recinto elettrico: pali e fili sui quarti di cerchio costruiti.
// back=true disegna la metà dietro al palazzo, back=false quella davanti.
function drawFence(ctx, run, time, back) {
  if (!run || !run.stats.fence) return;
  const q = run.stats.fence, r = FENCE.outer - 4;
  for (let deg = 0; deg < q * 90; deg += 12) {
    const a = rad(deg + 6);
    const x = TOWER.x + Math.cos(a) * r, y = TOWER.y + Math.sin(a) * r * 0.8;
    if ((y < TOWER.y) !== back) continue;
    ctx.fillStyle = PAL.black;
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 12, 3, 13);
    ctx.fillStyle = PAL.steel;
    ctx.fillRect(Math.round(x), Math.round(y) - 11, 1, 11);
    ctx.fillStyle = PAL.hazard;
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 13, 3, 2);
  }
  ctx.save();
  ctx.strokeStyle = 'rgba(45,226,230,0.75)';
  ctx.lineWidth = 1;
  for (const h of [-10, -5]) {
    ctx.beginPath();
    for (let deg = 0; deg <= q * 90; deg += 3) {
      const a = rad(deg);
      const y = TOWER.y + Math.sin(a) * r * 0.8;
      if ((y < TOWER.y) !== back) { ctx.moveTo(TOWER.x + Math.cos(a) * r, y + h); continue; }
      const jitter = Math.random() < 0.08 ? (Math.random() - 0.5) * 3 : 0;
      ctx.lineTo(TOWER.x + Math.cos(a) * r, y + h + jitter);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function hiddenByTower(e) {
  return Math.abs(e.x - TOWER.x) < B.w / 2 + 8 && e.y > B.top && e.y < B.base;
}

function drawGhost(ctx, assets, e) {
  ctx.globalAlpha = 0.4;
  drawPersonAt(ctx, assets.person(e.look, 0, e.scale || 1, true), e.x, e.y);
  ctx.globalAlpha = 1;
}

// ─── Palazzo (la torre) ─────────────────────────────────────────

// Stato di ogni finestra (3 colonne × 4 piani): L accesa, D spenta, X rotta, B sbarrata con assi.
const WINDOWS = 'LDL' + 'XLL' + 'LBD' + 'DLX';
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
  for (let r = 0; r < 4; r++) {
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
  const { x, y } = allyPos(ally);
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
  if (ally.promoFlash > 0) {
    // promozione: colonna di luce dorata
    ctx.fillStyle = `rgba(242,183,5,${0.35 * ally.promoFlash / 1.5})`;
    ctx.fillRect(x - 8, y - 70, 16, 72);
  }
  ctx.globalAlpha = ally.spawn;
  drawPersonAt(ctx, assets.person(def.look, 0, 1), x, y - 1 + drop + recoil);
  ctx.globalAlpha = 1;
  if (recoil) {
    // lampo allo sparo, sopra la testa
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x - 2, y - 24, 5, 5);
    ctx.fillStyle = PAL.cyan;
    ctx.fillRect(x - 4, y - 23, 9, 3);
    ctx.fillRect(x - 1, y - 26, 3, 9);
  }
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
  if (e.elite) {
    // ÉLITE: occhi rossi che brillano
    const img = assets.person(e.look, frame, k);
    const left = Math.round(x - img.width / 2), top = Math.round(feet - img.height + 2);
    ctx.fillStyle = 'rgba(215,38,61,0.45)';
    ctx.fillRect(left + 6 * k, top + 12 * k, 5 * k, 3 * k);
    ctx.fillStyle = '#ff2a3d';
    ctx.fillRect(left + 7 * k, top + 13 * k, k, k);
    ctx.fillRect(left + 10 * k, top + 13 * k, k, k);
  }
  if (e.hitFlash > 0) {
    ctx.globalAlpha = 0.6;
    drawPersonAt(ctx, assets.person(e.look, frame, k, true), x, feet);
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


// ─── Scritte sopra al mondo (coordinate dello schermo) ──────────

function drawSceneTitle(ctx, name, W, H, fade) {
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

function drawBanner(ctx, run, W, H) {
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

function drawBossBar(ctx, run, W) {
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
