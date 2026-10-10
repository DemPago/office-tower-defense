// Muro di cinta disegnato a ogni frame: cambia materiale con le carte (sacchi di sabbia,
// cemento, acciaio, filo spinato) e si rovina man mano che viene colpito.
import { YARD } from '../state.js';
import { PAL } from './palette.js';
import * as P from './props.js';
import { wallLook } from '../data/wall.js';

export function drawWall(ctx, run, time) {
  const look = wallLook(run.stats);
  for (const seg of run.wall) drawSegment(ctx, seg, look, run.stats.wallThorns > 0, time);
}

// Posizioni dei "mattoni" lungo un tratto: [x, y] di ognuno.
function bricks(seg) {
  const out = [];
  if (seg.side === 'top' || seg.side === 'bottom') {
    const y = seg.side === 'top' ? YARD.y - 7 : YARD.y + YARD.h - 2;
    for (let x = seg.a + 1; x < seg.b - 4; x += 12) out.push([x, y]);
  } else {
    const x = seg.side === 'left' ? YARD.x - 8 : YARD.x + YARD.w - 3;
    for (let y = seg.a + 1; y < seg.b - 3; y += 9) out.push([x, y]);
  }
  return out;
}

function drawSegment(ctx, seg, look, thorns, time) {
  const k = seg.maxHp ? seg.hp / seg.maxHp : 1;
  const list = bricks(seg);
  if (k <= 0) { drawRubble(ctx, list, look); return; }
  // più è rovinato, più "mattoni" mancano (sempre gli stessi, per non sfarfallare)
  const missing = k > 0.66 ? 0 : k > 0.33 ? 3 : 2;
  list.forEach(([x, y], i) => {
    if (missing && i % missing === 1) { drawRubble(ctx, [[x, y]], look); return; }
    if (look === 'concrete') concreteBlock(ctx, x, y, k);
    else if (look === 'steel') steelPlate(ctx, x, y, k);
    else P.sandbag(ctx, x, y);
  });
  if (thorns) barbedWire(ctx, seg, list, time);
  if (seg.hit > 0) {
    const fi = seg.hit / 0.15;
    const [x0, y0] = list[0], [x1, y1] = list[list.length - 1];
    const rw = x1 - x0 + 13, rh = y1 - y0 + 9;
    ctx.fillStyle = `rgba(232,100,27,${(fi * 0.55).toFixed(2)})`;
    ctx.fillRect(x0 - 1, y0 - 1, rw, rh);
    ctx.strokeStyle = `rgba(215,38,61,${(fi * 0.8).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 - 1, y0 - 1, rw, rh);
  }
  // barra della vita del tratto, solo se danneggiato
  if (k < 1) {
    const w = 14, x = seg.x - w / 2, y = seg.y - 10;
    ctx.fillStyle = PAL.black; ctx.fillRect(x - 0.5, y - 0.5, w + 1, 2.5);
    ctx.fillStyle = k > 0.5 ? '#bfa574' : k > 0.25 ? PAL.hazard : PAL.red;
    ctx.fillRect(x, y, w * k, 1.5);
  }
}

function concreteBlock(ctx, x, y, k) {
  P.rect(ctx, x - 1, y - 1.5, 13, 9.5, PAL.black);
  P.rect(ctx, x - 0.5, y - 1, 12, 8.5, '#8f8a80');
  P.rect(ctx, x - 0.5, y - 1, 12, 1.5, '#a8a296');
  P.rect(ctx, x - 0.5, y + 5.5, 12, 2, '#6e6a64');
  P.rect(ctx, x + 5, y - 1, 0.5, 8.5, '#6e6a64');
  if (k < 0.66) { P.rect(ctx, x + 2, y + 1, 3, 0.5, PAL.black); P.rect(ctx, x + 4, y + 1.5, 0.5, 2.5, PAL.black); } // crepe
  if (k < 0.4) P.rect(ctx, x + 8, y, 2, 2, '#4a4743');
}

function steelPlate(ctx, x, y, k) {
  P.rect(ctx, x - 1, y - 1.5, 13, 9.5, PAL.black);
  P.rect(ctx, x - 0.5, y - 1, 12, 8.5, '#6b7078');
  P.rect(ctx, x - 0.5, y - 1, 12, 1, '#a0a6ae');
  P.rect(ctx, x + 10.5, y - 1, 1, 8.5, '#4a4e55');
  for (const [rx, ry] of [[1, 0.5], [9.5, 0.5], [1, 5.5], [9.5, 5.5]]) P.rect(ctx, x + rx, y + ry, 1, 1, '#c0c4cc'); // rivetti
  if (k < 0.66) P.rect(ctx, x + 4, y + 2, 3, 2, '#3a3c42'); // ammaccatura
  if (k < 0.4) P.rect(ctx, x + 2, y + 4, 2, 1.5, 'rgba(138,59,30,0.8)');
}

function drawRubble(ctx, list, look) {
  const col = look === 'concrete' ? '#8f8a80' : look === 'steel' ? '#6b7078' : '#bfa574';
  for (const [x, y] of list) {
    P.stain(ctx, x + 5, y + 5, 6, 2, 'rgba(0,0,0,0.3)');
    P.rect(ctx, x, y + 4, 3, 2, col);
    P.rect(ctx, x + 5, y + 5, 2, 1.5, col);
    P.rect(ctx, x + 8, y + 3.5, 3, 2, col);
    P.rect(ctx, x + 3, y + 6, 2, 1, PAL.black);
  }
}

function barbedWire(ctx, seg, list, time) {
  ctx.strokeStyle = '#c0c4cc';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const horizontal = seg.side === 'top' || seg.side === 'bottom';
  const [x0, y0] = list[0];
  const [x1, y1] = list[list.length - 1];
  if (horizontal) {
    for (let x = x0; x <= x1 + 11; x += 1.5) ctx.lineTo(x, y0 - 2.5 + Math.sin(x * 1.3) * 1.5);
  } else {
    for (let y = y0; y <= y1 + 7; y += 1.5) ctx.lineTo(x0 + 5.5 + Math.sin(y * 1.3) * 2, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#e8e2d0';
  if (horizontal) for (let x = x0; x <= x1 + 11; x += 4) ctx.fillRect(x, y0 - 3, 0.5, 1.5); // spine
  else for (let y = y0; y <= y1 + 7; y += 4) ctx.fillRect(x0 + 5, y, 1.5, 0.5);
}
