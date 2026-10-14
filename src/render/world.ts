// Disegno del mondo di gioco: mette insieme i pezzi (ognuno nel suo file) nell'ordine giusto.
// Legge lo stato, non lo modifica mai.
//   view.js     camera, zoom a pixel nitidi, disegno degli sprite
//   scenery.js  sfondi dei 6 scenari (oggetti in props.js)
//   tower.js    palazzo, protagonista, fumo
//   allies.js   colleghi, spicchi, recinto elettrico
//   enemies.js  nemici, boss, scie, corpi
//   effects.js  colpi, particelle, numeri, atmosfera
//   overlay.js  scritte sopra al mondo (banner, barra del boss, avvisi)
import { Run } from '../types.js';
import type { loadAssets } from './assets.js';
type Assets = Awaited<ReturnType<typeof loadAssets>>;
import { TOWER, YARD } from '../state.js';
import { allyPos } from '../systems/allies.js';
import { PAL } from './palette.js';
import { buildScene, sceneIndexForWave, MARGIN, AREA } from './scenery.js';
import { VIEW_R, CAMERA, setPixelSize } from './view.js';
import { drawTower, updateSmoke, drawSmoke, hiddenByTower } from './tower.js';
import { drawSectors, drawAlly } from './allies.js';
import { drawShadow, drawEnemy, drawGhost, updateTrails, drawTrails, drawCorpse, drawYardAlarm } from './enemies.js';
import { drawDust, drawGrade, drawRange, drawShots, drawFx, drawDemEagle } from './effects.js';
import { drawZombieWorld, drawZombieGrade } from './zombie.js';
import { isZombieWave } from '../data/enemies.js';
import { drawWall } from './wall.js';
import { drawSceneTitle, drawBanner, drawBossBar, drawBossPointer } from './overlay.js';

function drawBombs(ctx: CanvasRenderingContext2D, run: Run, time: number) {
  for (const b of run.bombs) {
    if (b.detonated) continue;
    const pulse = 1 + Math.sin(time * 10 + b.x) * 0.07;
    const r = 8 * pulse;
    const bx = b.x, by = b.y;

    // Raggio esplosione — solo in fase piazzamento, sfumato arancione
    if (run.phase === 'bomb-placement') {
      const grad = ctx.createRadialGradient(bx, by, r, bx, by, 70);
      grad.addColorStop(0,   'rgba(255,100,0,0.18)');
      grad.addColorStop(0.7, 'rgba(255,60,0,0.08)');
      grad.addColorStop(1,   'rgba(255,40,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(bx, by, 70, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,80,0,0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 8;
      ctx.beginPath(); ctx.arc(bx, by, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }

    // Ombra a terra
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath(); ctx.ellipse(bx + 1, by + r * 0.6, r * 0.75, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();

    // Sfera — strati sovrapposti per simulare volume
    ctx.fillStyle = '#111114'; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.arc(bx - r * 0.18, by - r * 0.15, r * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3c3c46'; ctx.beginPath(); ctx.arc(bx - r * 0.28, by - r * 0.28, r * 0.38, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(200,200,220,0.30)'; ctx.beginPath(); ctx.arc(bx - r * 0.36, by - r * 0.38, r * 0.18, 0, Math.PI * 2); ctx.fill();

    // Linguetta metallo in cima
    ctx.fillStyle = '#5a5a68';
    ctx.beginPath();
    ctx.ellipse(bx, by - r + 1, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Miccia — linea intrecciata (tratto arancione + tratto scuro alternati)
    const fx = bx + 2, fy = by - r + 1;
    const fc1x = fx + 5, fc1y = fy - 6, fc2x = fx + 2, fc2y = fy - 13, fex = fx + 4, fey = fy - 18;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#c87820';
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.bezierCurveTo(fc1x, fc1y, fc2x, fc2y, fex, fey); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#7a4410';
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.bezierCurveTo(fc1x, fc1y, fc2x, fc2y, fex, fey); ctx.stroke();
    ctx.setLineDash([]);

    // Scintilla lampeggiante
    const sparkOn = Math.sin(time * 14 + b.x) > 0;
    if (sparkOn) {
      const sx = fex, sy = fey;
      // Alone
      ctx.fillStyle = 'rgba(255,180,0,0.25)';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
      // Raggi
      ctx.strokeStyle = '#ffe040'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time * 8;
        const len = 2.5 + Math.sin(time * 20 + i) * 1.5;
        ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 1.5, sy + Math.sin(a) * 1.5);
        ctx.lineTo(sx + Math.cos(a) * (1.5 + len), sy + Math.sin(a) * (1.5 + len)); ctx.stroke();
      }
      // Nucleo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
      // Brace spenta: puntino rosso scuro
      ctx.fillStyle = '#8a2000';
      ctx.beginPath(); ctx.arc(fex, fey, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export function createRenderer(canvas: HTMLCanvasElement, assets: Assets) {
  const ctx = canvas.getContext('2d')!;
  const view = { scale: 1, ox: 0, oy: 0, ui: 1 };
  const scenes = new Map(); // scenari già disegnati (si tengono gli ultimi due)
  let sceneIdx = 0, prevIdx: number | null = null, fade = 0;
  // Fumo e polvere sono solo decorazione: vivono qui e non nello stato del gioco.
  const smoke: any[] = [];
  const trails: any[] = [];
  const dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: 0.01 + Math.random() * 0.02, a: Math.random() * 6 }));
  let lastTime = performance.now() / 1000;
  let zombieK = 0; // intensità dell'atmosfera zombie (sale e scende piano)
  const actorsBuf: { y: number; kind: 0 | 1; ref: any }[] = [];

  function scene(i: number) {
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

  function draw(run: Run | null) {
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
    const zombieWanted = run && (run.phase === 'wave') && isZombieWave(run.wave) ? 1 : 0;
    const zRate = zombieWanted > zombieK ? dt / 2 : dt * 2; // entra lento (2s), esce veloce (0.5s)
    zombieK += Math.max(-zRate, Math.min(zRate, zombieWanted - zombieK));
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
    if (run) {
      drawWall(ctx, run, time);
      drawSectors(ctx, run, time);
      drawRange(ctx, run.stats.range, time);
      for (const c of run.fx.corpses) drawCorpse(ctx, assets, c);
      for (const e of run.enemies) drawShadow(ctx, e);
      if (run.enemies.some(e => !e.dead && e.x > YARD.x && e.x < YARD.x + YARD.w && e.y > YARD.y && e.y < YARD.y + YARD.h)) drawYardAlarm(ctx, time);
    }

    // Profondità: chi sta più in alto (dietro al palazzo) si disegna prima.
    let bufLen = 0;
    if (run) {
      for (const e of run.enemies) {
        if (bufLen >= actorsBuf.length) actorsBuf.push({ y: 0, kind: 0, ref: null });
        const a = actorsBuf[bufLen++]; a.y = e.y; a.kind = 0; a.ref = e;
      }
      for (const ally of run.allies) {
        if (bufLen >= actorsBuf.length) actorsBuf.push({ y: 0, kind: 1, ref: null });
        const a = actorsBuf[bufLen++]; a.y = allyPos(ally).y; a.kind = 1; a.ref = ally;
      }
      actorsBuf.length = bufLen;
      actorsBuf.sort((a, b) => a.y - b.y);
    }
    const towerThresh = TOWER.y + 20;
    let splitIdx = bufLen;
    for (let i = 0; i < bufLen; i++) { if (actorsBuf[i].y >= towerThresh) { splitIdx = i; break; } }
    for (let i = 0; i < splitIdx; i++) {
      const a = actorsBuf[i];
      if (a.kind === 0) drawEnemy(ctx, assets, a.ref); else drawAlly(ctx, assets, a.ref, time);
    }
    drawTower(ctx, assets, run, time);
    // Nemici nascosti dietro al palazzo: si vedono in trasparenza
    for (let i = 0; i < splitIdx; i++) {
      const a = actorsBuf[i];
      if (a.kind === 0 && hiddenByTower(a.ref)) drawGhost(ctx, assets, a.ref);
    }
    for (let i = splitIdx; i < bufLen; i++) {
      const a = actorsBuf[i];
      if (a.kind === 0) drawEnemy(ctx, assets, a.ref); else drawAlly(ctx, assets, a.ref, time);
    }
    updateSmoke(smoke, run, dt);
    drawSmoke(ctx, smoke);
    updateTrails(trails, run, dt);
    drawTrails(ctx, trails);
    if (run) {
      drawShots(ctx, run, time);
      drawBombs(ctx, run, time);
      drawFx(ctx, run);
      drawDemEagle(ctx, run.hero, time);
    }

    // Da qui si disegna in coordinate dello schermo
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (run && (run.fx as any).flash > 0) {
      // trasformazione del boss: tutto si illumina di bianco
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, (run.fx as any).flash * 1.2)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawDust(ctx, dust, dt, canvas);
    drawGrade(ctx, canvas, run!);
    if (zombieK > 0) drawZombieGrade(ctx, canvas, time, zombieK);
    ctx.setTransform(view.ui, 0, 0, view.ui, 0, 0);
    const W = canvas.width / view.ui, H = canvas.height / view.ui;
    if (fade > 0.2) drawSceneTitle(ctx, cur.name, W, H, fade);
    if (run) {
      drawBossPointer(ctx, run, view, W, H);
      drawBanner(ctx, run, W, H);
      drawBossBar(ctx, run, W);
    }
  }

  // Riquadro sullo schermo (pixel CSS) di una parte del mondo, per il tutorial.
  function screenRect(name: string) {
    const area = name === 'tower' ? { x: TOWER.x - 40, y: TOWER.y - 110, w: 80, h: 140 } : { x: YARD.x - 10, y: YARD.y - 14, w: YARD.w + 20, h: YARD.h + 26 };
    const c = canvas.getBoundingClientRect(), k = c.width / canvas.width;
    return { left: c.left + (view.ox + area.x * view.scale) * k, top: c.top + (view.oy + area.y * view.scale) * k, width: area.w * view.scale * k, height: area.h * view.scale * k };
  }

  // Converte coordinate CSS (clientX/clientY) in coordinate mondo.
  function screenToWorld(cx: number, cy: number) {
    const rect = canvas.getBoundingClientRect();
    const px = (cx - rect.left) * (canvas.width / rect.width);
    const py = (cy - rect.top) * (canvas.height / rect.height);
    return { x: (px - view.ox) / view.scale, y: (py - view.oy) / view.scale };
  }

  return { resize, draw, screenRect, screenToWorld };
}
