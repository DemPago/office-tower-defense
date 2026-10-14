// Costanti, tipi, cache texture, pool e helper condivisi dal renderer 3D.
import * as THREE from 'three';
import { WORLD } from '../../state.js';

export const modelCache = new Map<string, THREE.Group>();

export interface Spr { img: HTMLCanvasElement | HTMLImageElement; w: number; h: number; k: number; }
export interface Assets {
  person: (id: string, frame: number, scale?: number, tint?: boolean) => Spr;
  animal: (id: string, frame: number, scale?: number, tint?: boolean) => Spr;
}

export const S       = 1 / 32;
export const wx      = (x: number) => (x - WORLD.w / 2) * S;
export const wz      = (y: number) => (y - WORLD.h / 2) * S;
export const wy      = (h: number) => h * S;
export const TOWER_H = 2.8;
export const WALL_H  = 0.30;
export const SHOT_R  = 0.13;

export const DEPT_PALETTE = [
  { fog: 0x1a1510, amb: 0xfff0d8, sun: 0xffd080 }, // Open Space (caldo beige)
  { fog: 0x0f1520, amb: 0xd0e0ff, sun: 0xa0c0ff }, // Amministrazione (freddo blu)
  { fog: 0x0a1a14, amb: 0xc0ffd0, sun: 0x60eeaa }, // IT (verde acqua)
  { fog: 0x1a0f08, amb: 0xffd0b0, sun: 0xff9944 }, // Commerciale (arancio)
  { fog: 0x14080a, amb: 0xffb0c0, sun: 0xff4466 }, // Sicurezza (rosso)
  { fog: 0x14120a, amb: 0xfff0a0, sun: 0xffd700 }, // Piani Alti (oro)
];
export const ZOMBIE_PALETTE = { fog: 0x081408, amb: 0xb0ffb0, sun: 0x40cc60 };

// ─── Texture cache ────────────────────────────────────────────────────────────
const imgToTex = new WeakMap<HTMLCanvasElement | HTMLImageElement, THREE.CanvasTexture>();
export function cacheTex(img: HTMLCanvasElement | HTMLImageElement): THREE.CanvasTexture {
  if (!imgToTex.has(img)) {
    const t = new THREE.CanvasTexture(img as HTMLCanvasElement);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    imgToTex.set(img, t);
  }
  return imgToTex.get(img)!;
}

const textTexCache = new Map<string, THREE.CanvasTexture>();
export function textTex(text: string, color: string, size: number): THREE.CanvasTexture {
  const key = `${text}|${color}|${size}`;
  if (!textTexCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 48;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 48);
    ctx.font = `bold ${size * 3}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(text, 65, 25);
    ctx.fillStyle = color;
    ctx.fillText(text, 64, 24);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    textTexCache.set(key, t);
    if (textTexCache.size > 200) {
      const first = textTexCache.keys().next().value!;
      textTexCache.get(first)?.dispose();
      textTexCache.delete(first);
    }
  }
  return textTexCache.get(key)!;
}

// ─── Pool di Sprite ───────────────────────────────────────────────────────────
export class SpritePool {
  private pool: THREE.Sprite[] = [];
  private active: THREE.Sprite[] = [];
  constructor(private scene: THREE.Scene) {}
  get(): THREE.Sprite {
    const sp = this.pool.pop() ?? (() => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
      this.scene.add(s); return s;
    })();
    sp.visible = true; this.active.push(sp); return sp;
  }
  reset() { for (const sp of this.active) { sp.visible = false; this.pool.push(sp); } this.active.length = 0; }
}

// ─── Pool di Mesh ─────────────────────────────────────────────────────────────
export class MeshPool {
  private pool: THREE.Mesh[] = [];
  private active: THREE.Mesh[] = [];
  constructor(private scene: THREE.Scene, private factory: () => THREE.Mesh) {}
  get(): THREE.Mesh {
    const m = this.pool.pop() ?? (() => { const n = this.factory(); this.scene.add(n); return n; })();
    m.visible = true; this.active.push(m); return m;
  }
  reset() { for (const m of this.active) { m.visible = false; this.pool.push(m); } this.active.length = 0; }
}

export function applySprite(sp: THREE.Sprite, spr: Spr, worldX: number, worldY: number, yOff = 0, tint = 0xffffff): void {
  const mat = sp.material as THREE.SpriteMaterial;
  const t = cacheTex(spr.img);
  if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; }
  const h = wy(spr.h) * 0.9, w = wy(spr.w) * 0.9;
  sp.scale.set(w, h, 1);
  sp.position.set(wx(worldX), h / 2 + yOff, wz(worldY));
  mat.color.setHex(tint);
  mat.opacity = 1;
}

export const zStage = (e: { hp: number; maxHp: number }) =>
  Math.max(0, Math.min(3, Math.floor((1 - e.hp / e.maxHp) * 4)));

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}
