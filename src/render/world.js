// Disegno del mondo di gioco: mette insieme i pezzi (ognuno nel suo file) nell'ordine giusto.
// Legge lo stato, non lo modifica mai.
//   view.js     camera, zoom a pixel nitidi, disegno degli sprite
//   scenery.js  sfondi dei 6 scenari (oggetti in props.js)
//   tower.js    palazzo, protagonista, fumo
//   allies.js   colleghi, spicchi, recinto elettrico
//   enemies.js  nemici, boss, scie, corpi
//   effects.js  colpi, particelle, numeri, atmosfera
//   overlay.js  scritte sopra al mondo (banner, barra del boss, avvisi)
import { TOWER, YARD } from '../state.js';
import { allyPos } from '../systems/allies.js';
import { PAL } from './palette.js';
import { buildScene, sceneIndexForWave, MARGIN, AREA } from './scenery.js';
import { VIEW_R, CAMERA, setPixelSize } from './view.js';
import { drawTower, updateSmoke, drawSmoke, hiddenByTower } from './tower.js';
import { drawSectors, drawFence, drawAlly } from './allies.js';
import { drawShadow, drawEnemy, drawGhost, updateTrails, drawTrails, drawCorpse, drawYardAlarm } from './enemies.js';
import { drawDust, drawGrade, drawRange, drawShots, drawFx } from './effects.js';
import { drawZombieWorld, drawZombieGrade } from './zombie.js';
import { isZombieWave } from '../data/enemies.js';
import { drawWall } from './wall.js';
import { drawSceneTitle, drawBanner, drawBossBar, drawIntruderWarning, drawBossPointer } from './overlay.js';

function drawBombs(ctx, run, time) {
  for (const b of run.bombs) {
    if (b.detonated) continue;
    // Corpo bomba (piccolo)
    ctx.fillStyle = '#1a1a1c';
    ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#444450';
    ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    // Miccia
    ctx.strokeStyle = '#c87820';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x + 3, b.y - 4);
    ctx.quadraticCurveTo(b.x + 7, b.y - 9, b.x + 5, b.y - 12);
    ctx.stroke();
    // Scintilla lampeggiante
    if (Math.sin(time * 12 + b.x) > 0.3) {
      ctx.fillStyle = '#ffe040';
      ctx.beginPath(); ctx.arc(b.x + 5, b.y - 12, 2, 0, Math.PI * 2); ctx.fill();
    }
    // Raggio di detonazione (solo durante la fase di piazzamento)
    if (run.phase === 'bomb-placement') {
      ctx.strokeStyle = 'rgba(255,100,0,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(b.x, b.y, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

export function createRenderer(canvas, assets) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, ox: 0, oy: 0, ui: 1 };
  const scenes = new Map(); // scenari già disegnati (si tengono gli ultimi due)
  let sceneIdx = 0, prevIdx = null, fade = 0;
  // Fumo e polvere sono solo decorazione: vivono qui e non nello stato del gioco.
  const smoke = [];
  const trails = [];
  const dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: 0.01 + Math.random() * 0.02, a: Math.random() * 6 }));
  let lastTime = performance.now() / 1000;
  let zombieK = 0; // intensità dell'atmosfera zombie (sale e scende piano)

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
    // Pixel nitidi: i disegni hanno pixel da mezzo pixel del mondo, quindi lo zoom è sempre
    // un multiplo di 2 (ogni pixel del disegno = un numero intero di pixel dello schermo).
    const raw = Math.min(canvas.width, canvas.height) / (VIEW_R * 2);
    const n = Math.max(1, Math.round(raw * 0.5 + 0.25));
    view.scale = n * 2;
    setPixelSize(view.scale);
    view.ox = Math.round(canvas.width / 2 - CAMERA.x * view.scale);
    view.oy = Math.round(canvas.height / 2 - CAMERA.y * view.scale);
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
    ctx.setTransform(view.scale, 0, 0, view.scale, Math.round(view.ox + sx * view.scale), Math.round(view.oy + sy * view.scale));
    ctx.imageSmoothingEnabled = false;

    const cur = scene(sceneIdx);
    ctx.drawImage(cur.canvas, -MARGIN, -MARGIN, AREA.w, AREA.h);
    if (cur.ambient) cur.ambient(ctx, time);
    const zombieWanted = run && isZombieWave(run.wave) ? 1 : 0;
    zombieK += Math.max(-dt / 2, Math.min(dt / 2, zombieWanted - zombieK));
    if (zombieK > 0) drawZombieWorld(ctx, time, zombieK);
    if (fade > 0 && prevIdx !== null) {
      ctx.globalAlpha = fade;
      ctx.drawImage(scene(prevIdx).canvas, -MARGIN, -MARGIN, AREA.w, AREA.h);
      ctx.globalAlpha = 1;
    }

    if (run?.bonusStage) {
      // notte giapponese: velo blu scuro + luna piena
      ctx.fillStyle = 'rgba(5,5,30,0.72)';
      ctx.fillRect(-MARGIN, -MARGIN, AREA.w, AREA.h);
      const moonX = -MARGIN + AREA.w * 0.78, moonY = -MARGIN + 45;
      const moonR = 16;
      ctx.fillStyle = 'rgba(255,245,200,0.95)';
      ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,200,0.25)';
      ctx.beginPath(); ctx.arc(moonX, moonY, moonR + 6, 0, Math.PI * 2); ctx.fill();
      // petali di ciliegio che cadono
      const t30 = time * 30;
      for (let i = 0; i < 12; i++) {
        const px = ((-MARGIN + (i * 71 + t30 * 0.5) % AREA.w)), py = ((-MARGIN + (i * 53 + t30 * 0.8) % AREA.h));
        ctx.fillStyle = `rgba(255,180,200,${0.5 + 0.3 * Math.sin(time + i)})`;
        ctx.beginPath(); ctx.ellipse(px, py, 3, 2, time + i, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (run && run.intruders > 0) drawYardAlarm(ctx, time);
    if (run) {
      drawWall(ctx, run, time);
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
    updateTrails(trails, run, dt);
    drawTrails(ctx, trails);
    if (run) {
      drawShots(ctx, run, time);
      drawBombs(ctx, run, time);
      drawFx(ctx, run);
    }

    // Da qui si disegna in coordinate dello schermo
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (run && run.fx.flash > 0) {
      // trasformazione del boss: tutto si illumina di bianco
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, run.fx.flash * 1.2)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawDust(ctx, dust, dt, canvas);
    drawGrade(ctx, canvas, run);
    if (zombieK > 0) drawZombieGrade(ctx, canvas, time, zombieK);
    ctx.setTransform(view.ui, 0, 0, view.ui, 0, 0);
    const W = canvas.width / view.ui, H = canvas.height / view.ui;
    if (fade > 0.2) drawSceneTitle(ctx, cur.name, W, H, fade);
    if (run && run.intruders > 0 && run.allies.length) drawIntruderWarning(ctx, run, W, time);
    if (run) {
      drawBossPointer(ctx, run, view, W, H);
      drawBanner(ctx, run, W, H);
      drawBossBar(ctx, run, W);
    }
  }

  // Riquadro sullo schermo (pixel CSS) di una parte del mondo, per il tutorial.
  function screenRect(name) {
    const area = name === 'tower' ? { x: TOWER.x - 40, y: TOWER.y - 110, w: 80, h: 140 } : { x: YARD.x - 10, y: YARD.y - 14, w: YARD.w + 20, h: YARD.h + 26 };
    const c = canvas.getBoundingClientRect(), k = c.width / canvas.width;
    return { left: c.left + (view.ox + area.x * view.scale) * k, top: c.top + (view.oy + area.y * view.scale) * k, width: area.w * view.scale * k, height: area.h * view.scale * k };
  }

  // Converte coordinate CSS (clientX/clientY) in coordinate mondo.
  function screenToWorld(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const px = (cx - rect.left) * (canvas.width / rect.width);
    const py = (cy - rect.top) * (canvas.height / rect.height);
    return { x: (px - view.ox) / view.scale, y: (py - view.oy) / view.scale };
  }

  return { resize, draw, screenRect, screenToWorld };
}
