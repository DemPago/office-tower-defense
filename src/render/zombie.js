// Atmosfera delle ondate zombie (7, 17, 27…): lo scenario si sporca di sangue e
// pozze tossiche, la luce diventa verde malata e una nebbia bassa scorre sul terreno.
import { TOWER } from '../state.js';
import { AREA, MARGIN, SCENE_RES, seeded, free } from './scenes/common.js';
import * as P from './props.js';

let decals = null;

// Macchie, pozze e resti disegnati una volta sola, sopra a qualsiasi scenario.
function buildDecals() {
  const c = document.createElement('canvas');
  c.width = AREA.w * SCENE_RES;
  c.height = AREA.h * SCENE_RES;
  const g = c.getContext('2d');
  g.scale(SCENE_RES, SCENE_RES);
  g.translate(MARGIN, MARGIN);
  const rnd = seeded(777);
  for (let i = 0; i < 90; i++) {
    const x = AREA.x + rnd() * AREA.w, y = AREA.y + rnd() * AREA.h;
    const r = rnd();
    if (r < 0.45) {
      // macchia di sangue con schizzi
      P.stain(g, x, y, 4 + rnd() * 8, 2 + rnd() * 4, 'rgba(110,10,20,0.55)');
      for (let k = 0; k < 6; k++) P.stain(g, x + (rnd() - 0.5) * 22, y + (rnd() - 0.5) * 12, 0.8 + rnd(), 0.6 + rnd() * 0.6, 'rgba(130,15,25,0.6)');
    } else if (r < 0.75) {
      // pozza tossica verde che luccica
      P.puddle(g, x, y, 6 + rnd() * 10, 2.5 + rnd() * 4, '#3e6b2a', '#a8f070');
    } else if (free(x, y, 4)) {
      // ossa e resti
      P.rect(g, x - 3, y, 7, 1.5, '#d9d4c7');
      P.rect(g, x - 4, y - 0.5, 1.5, 2.5, '#d9d4c7');
      P.rect(g, x + 3, y - 0.5, 1.5, 2.5, '#d9d4c7');
      if (rnd() < 0.4) { P.stain(g, x + 8, y, 2.5, 2.2, '#d9d4c7'); P.rect(g, x + 7, y - 0.5, 1, 1, '#141416'); P.rect(g, x + 8.5, y - 0.5, 1, 1, '#141416'); } // teschio
    }
  }
  // impronte trascinate verso il palazzo
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2;
    for (let d = 300; d > 130; d -= 9) {
      const x = TOWER.x + Math.cos(a) * d + (d % 18 ? 2 : -2), y = TOWER.y + Math.sin(a) * d;
      P.rect(g, x, y, 1.5, 1, 'rgba(90,10,20,0.45)');
    }
  }
  return c;
}

// Sopra allo scenario, in coordinate del mondo. k = intensità (0-1, per la dissolvenza).
export function drawZombieWorld(ctx, time, k) {
  if (!decals) decals = buildDecals();
  ctx.globalAlpha = k;
  ctx.drawImage(decals, -MARGIN, -MARGIN, AREA.w, AREA.h);
  // nebbia bassa che scorre
  for (let i = 0; i < 9; i++) {
    const x = ((i * 157 + time * (8 + i)) % (AREA.w + 200)) + AREA.x - 100;
    const y = AREA.y + ((i * 263) % AREA.h);
    ctx.fillStyle = 'rgba(150,200,120,0.07)';
    ctx.beginPath();
    ctx.ellipse(x, y, 110, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Luce verde malata su tutto lo schermo, in coordinate dello schermo.
export function drawZombieGrade(ctx, canvas, time, k) {
  ctx.fillStyle = `rgba(20,45,15,${0.35 * k})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // la luce ogni tanto trema, come un neon che sta per saltare
  if (Math.sin(time * 13) > 0.94) {
    ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
