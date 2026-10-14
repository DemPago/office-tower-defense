// Genera un'immagine 400×400 condivisibile per ogni badge romano.
// Stile: medaglione su sfondo scuro, bordo dorato, nome in grande.
import type { BadgeDef } from '../data/badges.js';
import { GAME_URL } from './share.js';

const W = 400, H = 400;

function hex(c: string, a = 1): string {
  const n = parseInt(c.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export function drawBadgeCanvas(b: BadgeDef, heroName: string, wave: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;

  // ── Sfondo
  g.fillStyle = '#0c0a08';
  g.fillRect(0, 0, W, H);

  // Texture marmo: righe orizzontali sottili
  g.strokeStyle = 'rgba(255,255,255,0.025)';
  g.lineWidth = 1;
  for (let y = 0; y < H; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

  // ── Bordo esterno dorato
  const outerR = 180;
  const cx = W / 2, cy = H / 2 - 10;
  g.strokeStyle = b.color;
  g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cy, outerR, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = hex(b.color, 0.3);
  g.lineWidth = 8;
  g.beginPath(); g.arc(cx, cy, outerR + 7, 0, Math.PI * 2); g.stroke();

  // ── Sfondo medaglione
  const grad = g.createRadialGradient(cx, cy - 40, 0, cx, cy, outerR);
  grad.addColorStop(0, hex(b.color, 0.18));
  grad.addColorStop(0.6, 'rgba(20,16,10,0.95)');
  grad.addColorStop(1, 'rgba(8,6,4,0.98)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(cx, cy, outerR, 0, Math.PI * 2); g.fill();

  // ── Corona laurea (archi decorativi)
  g.save();
  g.strokeStyle = hex(b.color, 0.5);
  g.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r1 = outerR - 14, r2 = outerR - 26;
    g.beginPath();
    g.arc(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 6, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    g.lineTo(cx + Math.cos(a) * (outerR - 10), cy + Math.sin(a) * (outerR - 10));
    g.stroke();
  }
  g.restore();

  // ── SPQR — piccolo sopra
  g.textAlign = 'center';
  g.font = 'bold 13px serif';
  g.fillStyle = hex(b.color, 0.6);
  g.fillText('S · P · Q · R', cx, cy - 118);

  // ── Nome del personaggio — grande al centro
  g.font = `bold ${b.name.length > 16 ? 26 : 32}px serif`;
  g.fillStyle = b.color;
  g.shadowColor = b.color;
  g.shadowBlur = 18;
  g.fillText(b.name, cx, cy - 22);
  g.shadowBlur = 0;

  // ── Ruolo — sotto il nome
  g.font = 'italic 14px serif';
  g.fillStyle = '#c8c0a8';
  g.fillText(b.role, cx, cy + 10);

  // ── Date storiche
  g.font = '12px monospace';
  g.fillStyle = hex(b.color, 0.55);
  g.fillText(b.years, cx, cy + 34);

  // ── Divisore
  g.strokeStyle = hex(b.color, 0.35);
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx - 70, cy + 48); g.lineTo(cx + 70, cy + 48); g.stroke();

  // ── Numero ondata
  g.font = 'bold 11px monospace';
  g.fillStyle = '#888880';
  g.fillText(`WAVE ${wave}`, cx, cy + 66);

  // ── Striscia inferiore — branding
  g.fillStyle = 'rgba(0,0,0,0.7)';
  g.fillRect(0, H - 44, W, 44);
  g.strokeStyle = hex(b.color, 0.25);
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, H - 44); g.lineTo(W, H - 44); g.stroke();

  g.font = 'bold 11px monospace';
  g.fillStyle = b.color;
  g.fillText('OFFICE TOWER DEFENSE', cx, H - 26);
  g.font = '9px monospace';
  g.fillStyle = '#665858';
  g.fillText(GAME_URL, cx, H - 10);

  return c;
}

// Scarica il badge come PNG sul dispositivo dell'utente.
export function downloadBadge(b: BadgeDef, heroName: string, wave: number) {
  const c = drawBadgeCanvas(b, heroName, wave);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `badge-${b.id}-wave${wave}.png`;
  a.click();
}

// Condivide il badge usando il Web Share API (se disponibile) o scarica.
export async function shareBadge(b: BadgeDef, heroName: string, wave: number) {
  const c = drawBadgeCanvas(b, heroName, wave);
  const text = `I unlocked ${b.name} — ${b.role} — at wave ${wave} of Office Tower Defense! ${GAME_URL}`;

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise<Blob>(res => c.toBlob(blob => res(blob!), 'image/png'));
      const file = new File([blob], `badge-${b.id}.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Badge: ${b.name}`, text, files: [file] });
        return;
      }
    } catch { /* annullato o non supportato */ }
  }
  // Fallback: scarica l'immagine
  downloadBadge(b, heroName, wave);
}
