// Disegno del mondo di gioco: mette insieme i pezzi (ognuno nel suo file) nell'ordine giusto.
// Legge lo stato, non lo modifica mai.
//   view.js     camera, zoom a pixel nitidi, disegno degli sprite
//   scenery.js  sfondi dei 6 scenari (oggetti in props.js)
//   tower.js    palazzo, protagonista, fumo
//   allies.js   colleghi, spicchi, recinto elettrico
//   enemies.js  nemici, boss, scie, corpi
//   effects.js  colpi, particelle, numeri, atmosfera
//   overlay.js  scritte sopra al mondo (banner, barra del boss, avvisi)
import { TOWER } from '../state.js';
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
    drawGrade(ctx, canvas);
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

  return { resize, draw };
}
