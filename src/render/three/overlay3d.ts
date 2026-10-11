// Overlay 2D (canvas HTML sopra al WebGL) del renderer Three.js.
// Estratto da renderer.ts per contenere solo il disegno dell'HUD e degli effetti 2D.
import * as THREE from 'three';
import { TOWER } from '../../state.js';
import { allyPos } from '../../systems/allies.js';
import type { Run } from '../../types.js';
import { S, wx, wz, TOWER_H, hexToRgba } from './utils.js';

export interface SceneTitle { name: string; timer: number; }

export function drawOverlay3d(
  ctx: CanvasRenderingContext2D,
  OW: number, OH: number, dpr: number,
  run: Run | null,
  cam: THREE.OrthographicCamera,
  now: number, dt: number,
  zombieK: number,
  sceneTitle: SceneTitle | null,
): SceneTitle | null {

  ctx.clearRect(0, 0, OW, OH);

  function project3d(wx3: number, wy3: number, wz3: number) {
    const v = new THREE.Vector3(wx3, wy3, wz3).project(cam);
    return { x: (v.x + 1) / 2 * OW, y: (1 - v.y) / 2 * OH, behind: v.z > 1 };
  }

  // Vignette + tinta HP
  {
    const hp     = run?.stats ? run.tower.hp / run.stats.maxHp : 1;
    const danger = Math.max(0, 1 - hp / 0.4);
    ctx.fillStyle = `rgba(255,${Math.round(100 - danger * 80)},${Math.round(20 - danger * 20)},${(0.03 + danger * 0.07).toFixed(3)})`;
    ctx.fillRect(0, 0, OW, OH);
    const v = ctx.createRadialGradient(OW / 2, OH * 0.48, Math.min(OW, OH) * 0.18, OW / 2, OH * 0.52, Math.max(OW, OH) * 0.76);
    v.addColorStop(0,   'rgba(13,13,15,0)');
    v.addColorStop(0.58,'rgba(13,13,15,0.10)');
    v.addColorStop(1,   `rgba(13,13,15,${(0.72 + danger * 0.12).toFixed(2)})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, OW, OH);
  }

  // Zombie grade
  if (zombieK > 0) {
    ctx.fillStyle = `rgba(20,45,15,${(0.35 * zombieK).toFixed(3)})`;
    ctx.fillRect(0, 0, OW, OH);
    if (Math.sin(now * 13) > 0.94) {
      ctx.fillStyle = `rgba(0,0,0,${(0.25 * zombieK).toFixed(3)})`;
      ctx.fillRect(0, 0, OW, OH);
    }
  }

  // Bonus stage: notte giapponese
  if ((run as any)?.bonusStage) {
    ctx.fillStyle = 'rgba(5,5,30,0.72)';
    ctx.fillRect(0, 0, OW, OH);
    const moonX = OW * 0.78, moonY = OH * 0.08, moonR = 22 * dpr;
    ctx.fillStyle = 'rgba(255,245,200,0.95)';
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,200,0.22)';
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 1.35, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 14; i++) {
      const px2 = ((i * 71 + now * 15) % OW);
      const py2 = ((i * 53 + now * 22) % OH);
      ctx.fillStyle = `rgba(255,180,200,${(0.45 + 0.3 * Math.sin(now + i)).toFixed(3)})`;
      ctx.save();
      ctx.translate(px2, py2);
      ctx.rotate(now + i);
      ctx.beginPath(); ctx.ellipse(0, 0, 4 * dpr, 2.5 * dpr, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Barra HP boss
  if (run?.boss) {
    const list = (run as any).boss.list as any[];
    const hp   = list.reduce((s: number, e: any) => s + Math.max(0, e.hp), 0);
    const max  = list.reduce((s: number, e: any) => s + e.maxHp, 0);
    const bw   = Math.min(OW - 40 * dpr, 420 * dpr);
    const bx   = (OW - bw) / 2, bby = 14 * dpr;
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(bx - 3 * dpr, bby - 3 * dpr, bw + 6 * dpr, 14 * dpr);
    ctx.fillStyle = '#7a0f1c';
    ctx.fillRect(bx, bby, bw, 8 * dpr);
    ctx.fillStyle = '#d7263d';
    ctx.fillRect(bx, bby, Math.round(bw * hp / max), 8 * dpr);
    ctx.font = `${Math.round(14 * dpr)}px "Permanent Marker", cursive`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4 * dpr;
    ctx.strokeText((run as any).boss.name, OW / 2, bby + 28 * dpr);
    ctx.fillStyle = '#e8e2d0';
    ctx.fillText((run as any).boss.name, OW / 2, bby + 28 * dpr);
  }

  // Banner
  const bnr = (run as any)?.fx?.banner;
  if (bnr) {
    const k = bnr.life / bnr.max;
    ctx.globalAlpha = Math.min(1, k * 5);
    const bh  = bnr.sub ? 58 * dpr : 40 * dpr;
    const bby2 = Math.round(OH * 0.24);
    ctx.fillStyle = 'rgba(13,13,15,0.88)';
    ctx.fillRect(0, bby2, OW, bh);
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(22 * dpr)}px "Permanent Marker", cursive`;
    ctx.fillStyle = '#0d0d0f';
    ctx.fillText(bnr.title, OW / 2 + 2 * dpr, bby2 + 32 * dpr);
    ctx.fillStyle = bnr.color ?? '#f2b705';
    ctx.fillText(bnr.title, OW / 2, bby2 + 30 * dpr);
    if (bnr.sub) {
      ctx.font = `${Math.round(9 * dpr)}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#e8e2d0';
      ctx.fillText(bnr.sub, OW / 2, bby2 + 48 * dpr);
    }
    ctx.globalAlpha = 1;
  }

  // Aquila di Dem
  if ((run as any)?.hero === 'dem') {
    const flap  = Math.sin(now * 8);
    const driftX = Math.sin(now * 1.3) * 18 * S;
    const eagleH = TOWER_H + (95 - Math.cos(now * 2.1) * 6) * S;
    const { x: ex, y: ey, behind: eb } = project3d(wx(TOWER.x) + driftX, eagleH, wz(TOWER.y));
    if (!eb) {
      const ws = (13 + flap * 4) * dpr;
      const wh = (4  + flap * 3) * dpr;
      ctx.save();
      const { x: shx, y: shy } = project3d(wx(TOWER.x) + driftX, TOWER_H + 0.05, wz(TOWER.y));
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#0d0d0f';
      ctx.beginPath();
      ctx.ellipse(shx, shy, ws * 0.65, 3 * dpr, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#4a3820';
      ctx.beginPath();
      ctx.moveTo(ex, ey); ctx.lineTo(ex - ws, ey - wh); ctx.lineTo(ex - ws + 4 * dpr, ey + 3 * dpr);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ex, ey); ctx.lineTo(ex + ws, ey - wh); ctx.lineTo(ex + ws - 4 * dpr, ey + 3 * dpr);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a4f2c';
      ctx.beginPath(); ctx.ellipse(ex, ey + dpr, 4 * dpr, 6 * dpr, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8e2d0';
      ctx.beginPath(); ctx.ellipse(ex, ey - 5 * dpr, 3 * dpr, 3 * dpr, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2b705';
      ctx.fillRect(ex + 2 * dpr, ey - 6 * dpr, 3 * dpr, 2 * dpr);
      ctx.restore();
    }
  }

  // Aura boss
  if (run) {
    for (const e of run.enemies) {
      if (!e.boss || e.dead) continue;
      const auraCol: string = (e as any).aura ?? '#f2b705';
      const enraged = (e as any).enraged ?? false;
      const { x: bx, y: by, behind: bh } = project3d(wx(e.x), 0.0, wz(e.y));
      if (bh) continue;
      const baseR = (e.size ?? 30) * S * 1.4;
      const { x: edX } = project3d(wx(e.x) + baseR, 0.0, wz(e.y));
      const screenR = Math.abs(edX - bx) * (0.85 + Math.sin(now * 3 + e.id * 0.7) * 0.12);
      if (screenR < 4) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = enraged ? '#ff2a3d' : auraCol;
      const auraAlpha = enraged ? 0.45 : 0.35;
      const grad = ctx.createRadialGradient(bx, by, screenR * 0.08, bx, by, screenR);
      grad.addColorStop(0, hexToRgba(col, auraAlpha));
      grad.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, screenR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      const { x: gx, y: gy } = project3d(wx(e.x), 0.01, wz(e.y));
      const groundR = (e.size ?? 30) * S * 0.55;
      const { x: geX } = project3d(wx(e.x) + groundR, 0.01, wz(e.y));
      const gsR = Math.abs(geX - gx);
      if (gsR > 2) {
        ctx.strokeStyle = hexToRgba(auraCol, 0.6);
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.ellipse(gx, gy, gsR, gsR * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Barre HP boss / elite / alleati
  if (run) {
    const BAR_W = 44 * dpr, BAR_H = 5 * dpr;
    ctx.lineWidth = 0;
    for (const e of run.enemies) {
      if (e.dead) continue;
      if (!e.boss && !(e as any).elite && e.hp >= e.maxHp) continue;
      const { x, y, behind } = project3d(wx(e.x), 0.6, wz(e.y));
      if (behind) continue;
      const ratio = Math.max(0, e.hp / e.maxHp);
      const col = e.boss ? '#d7263d' : '#ff7b1c';
      ctx.fillStyle = '#200000';
      ctx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W, BAR_H);
      ctx.fillStyle = col;
      ctx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W * ratio, BAR_H);
    }
    for (const a of run.allies) {
      if ((a as any).hp >= (a as any).maxHp) continue;
      const pos = allyPos(a);
      const { x, y, behind } = project3d(wx(pos.x), 0.4, wz(pos.y));
      if (behind) continue;
      const ratio = Math.max(0, (a as any).hp / (a as any).maxHp);
      ctx.fillStyle = '#002000';
      ctx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W, BAR_H);
      ctx.fillStyle = ratio > 0.5 ? '#7bd332' : ratio > 0.25 ? '#f2b705' : '#d7263d';
      ctx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W * ratio, BAR_H);
    }
  }

  // Freccia boss fuori schermo
  if (run?.boss) {
    for (const e of run.enemies) {
      if (!e.boss) continue;
      const { x, y } = project3d(wx(e.x), 0, wz(e.y));
      const m2 = 36 * dpr;
      if (x > m2 && x < OW - m2 && y > m2 + 40 * dpr && y < OH - m2) continue;
      const cx2 = OW / 2, cy2 = OH / 2;
      const dx2 = x - cx2, dy2 = y - cy2;
      const t2 = Math.min((OW / 2 - m2) / (Math.abs(dx2) || 1), (OH / 2 - m2) / (Math.abs(dy2) || 1));
      const px2 = cx2 + dx2 * t2, py2 = cy2 + dy2 * t2;
      const a2 = Math.atan2(dy2, dx2);
      const pulse = 1 + Math.sin(now * 6) * 0.12;
      ctx.save();
      ctx.translate(px2, py2);
      ctx.rotate(a2);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#d7263d';
      ctx.beginPath();
      ctx.moveTo(14 * dpr, 0);
      ctx.lineTo(-8 * dpr, -7 * dpr);
      ctx.lineTo(-8 * dpr, 7 * dpr);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Titolo scenario
  if (sceneTitle) {
    sceneTitle.timer -= dt;
    if (sceneTitle.timer > 0) {
      const alpha2 = Math.min(1, sceneTitle.timer * 2.5);
      ctx.globalAlpha = alpha2;
      ctx.textAlign = 'center';
      ctx.font = `${Math.round(9 * dpr)}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#e8e2d0';
      ctx.fillText('NUOVO SCENARIO', OW / 2, OH * 0.72);
      ctx.font = `${Math.round(22 * dpr)}px "Permanent Marker", cursive`;
      ctx.fillStyle = '#000';
      ctx.fillText(sceneTitle.name, OW / 2 + 2 * dpr, OH * 0.72 + 26 * dpr);
      ctx.fillStyle = '#f2b705';
      ctx.fillText(sceneTitle.name, OW / 2, OH * 0.72 + 24 * dpr);
      ctx.globalAlpha = 1;
    } else {
      sceneTitle = null;
    }
  }

  // Float texts
  if (run?.fx?.texts?.length) {
    const FONT = '"Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const t of run.fx.texts) {
      const { x: sx, y: sy, behind } = project3d(wx(t.x), 0.35, wz(t.y));
      if (behind) continue;
      const age = t.max - t.life;
      const pop = age < 0.12 ? 1 + (0.12 - age) / 0.12 * 0.6 : 1;
      ctx.globalAlpha = Math.min(1, t.life / t.max * 2);
      ctx.font = `${Math.round(t.size * pop * dpr)}px ${FONT}`;
      ctx.strokeStyle = '#141416';
      ctx.lineWidth = 3 * dpr;
      ctx.strokeText(t.text, sx, sy);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }
    ctx.globalAlpha = 1;
  }

  // Particelle overlay
  if (run?.fx?.parts?.length) {
    for (const p of run.fx.parts) {
      const { x: sx, y: sy, behind } = project3d(wx(p.x), 0.2, wz(p.y));
      if (behind) continue;
      ctx.globalAlpha = Math.min(1, p.life / p.max * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(sx - p.size * dpr / 2), Math.round(sy - p.size * dpr / 2), Math.round(p.size * dpr), Math.round(p.size * dpr));
    }
    ctx.globalAlpha = 1;
  }

  return sceneTitle;
}
