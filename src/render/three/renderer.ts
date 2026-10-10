// Renderer 3D completo con Three.js.
// Stessa firma pubblica di world.ts: createThreeRenderer(canvas, assets) → { resize, draw, screenRect, screenToWorld }
//
// Attivato con ?3d nell'URL.

import * as THREE from 'three';
import { TOWER, YARD, WORLD } from '../../state.js';
import { WALL } from '../../data/wall.js';
import { allyPos } from '../../systems/allies.js';
import { isZombieWave } from '../../data/enemies.js';
import type { Run } from '../../types.js';

// ─── Asset ───────────────────────────────────────────────────────────────────
interface Spr { img: HTMLCanvasElement | HTMLImageElement; w: number; h: number; k: number; }
interface Assets {
  person: (id: string, frame: number, scale?: number, tint?: boolean) => Spr;
  animal: (id: string, frame: number, scale?: number, tint?: boolean) => Spr;
}

// ─── Scala ───────────────────────────────────────────────────────────────────
const S  = 1 / 32;
const wx = (x: number) => (x - WORLD.w / 2) * S;
const wz = (y: number) => (y - WORLD.h / 2) * S;
const wy = (h: number) => h * S;
const TOWER_H = 2.0;
const WALL_H  = 0.30;
const SHOT_R  = 0.055;

// ─── Palette per reparto (fog + ambient) ──────────────────────────────────────
const DEPT_PALETTE = [
  { fog: 0x1a1510, amb: 0xfff0d8, sun: 0xffd080 }, // Open Space (caldo beige)
  { fog: 0x0f1520, amb: 0xd0e0ff, sun: 0xa0c0ff }, // Amministrazione (freddo blu)
  { fog: 0x0a1a14, amb: 0xc0ffd0, sun: 0x60eeaa }, // IT (verde acqua)
  { fog: 0x1a0f08, amb: 0xffd0b0, sun: 0xff9944 }, // Commerciale (arancio)
  { fog: 0x14080a, amb: 0xffb0c0, sun: 0xff4466 }, // Sicurezza (rosso)
  { fog: 0x14120a, amb: 0xfff0a0, sun: 0xffd700 }, // Piani Alti (oro)
];
const ZOMBIE_PALETTE = { fog: 0x081408, amb: 0xb0ffb0, sun: 0x40cc60 };

// ─── Texture cache ────────────────────────────────────────────────────────────
const imgToTex = new WeakMap<HTMLCanvasElement | HTMLImageElement, THREE.CanvasTexture>();
function cacheTex(img: HTMLCanvasElement | HTMLImageElement): THREE.CanvasTexture {
  if (!imgToTex.has(img)) {
    const t = new THREE.CanvasTexture(img as HTMLCanvasElement);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    imgToTex.set(img, t);
  }
  return imgToTex.get(img)!;
}

// Cache per floating text (chiave = "text|color|size")
const textTexCache = new Map<string, THREE.CanvasTexture>();
function textTex(text: string, color: string, size: number): THREE.CanvasTexture {
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
    // Max 200 voci in cache
    if (textTexCache.size > 200) {
      const first = textTexCache.keys().next().value!;
      textTexCache.get(first)?.dispose();
      textTexCache.delete(first);
    }
  }
  return textTexCache.get(key)!;
}

// ─── Pool di Sprite ───────────────────────────────────────────────────────────
class SpritePool {
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
class MeshPool {
  private pool: THREE.Mesh[] = [];
  private active: THREE.Mesh[] = [];
  constructor(private scene: THREE.Scene, private factory: () => THREE.Mesh) {}
  get(): THREE.Mesh {
    const m = this.pool.pop() ?? (() => { const n = this.factory(); this.scene.add(n); return n; })();
    m.visible = true; this.active.push(m); return m;
  }
  reset() { for (const m of this.active) { m.visible = false; this.pool.push(m); } this.active.length = 0; }
}

// ─── Helper: applica sprite canvas a uno THREE.Sprite ────────────────────────
function applySprite(sp: THREE.Sprite, spr: Spr, worldX: number, worldY: number, yOff = 0, tint = 0xffffff): void {
  const mat = sp.material as THREE.SpriteMaterial;
  const t = cacheTex(spr.img);
  if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; }
  const h = wy(spr.h) * 0.9, w = wy(spr.w) * 0.9;
  sp.scale.set(w, h, 1);
  sp.position.set(wx(worldX), h / 2 + yOff, wz(worldY));
  mat.color.setHex(tint);
  mat.opacity = 1;
}

// ─── Zombie stage ─────────────────────────────────────────────────────────────
const zStage = (e: { hp: number; maxHp: number }) =>
  Math.max(0, Math.min(3, Math.floor((1 - e.hp / e.maxHp) * 4)));

// ─── Scena base ───────────────────────────────────────────────────────────────
function buildScene() {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x0d0d0f);
  sc.fog = new THREE.Fog(0x0d0d0f, 28, 55);

  const ambLight = new THREE.AmbientLight(0xfff8f0, 0.75);
  ambLight.name = 'amb';
  sc.add(ambLight);
  const sunLight = new THREE.DirectionalLight(0xffe4b5, 1.0);
  sunLight.position.set(-6, 18, -4);
  sunLight.name = 'sun';
  sc.add(sunLight);
  sc.add(Object.assign(new THREE.DirectionalLight(0x8899cc, 0.3), { position: new THREE.Vector3(4, -4, 6) }));

  // Terreno grande (riempie i bordi isometrici)
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x181820 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  sc.add(ground);

  // Griglia dell'area di gioco
  const grid = new THREE.GridHelper(WORLD.w * S, 20, 0x252530, 0x1e1e28);
  grid.position.y = 0.003; sc.add(grid);

  // Cortile
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(YARD.w * S + 0.2, YARD.h * S + 0.2),
    new THREE.MeshLambertMaterial({ color: 0x20202a }),
  );
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(wx(YARD.x + YARD.w / 2), 0.002, wz(YARD.y + YARD.h / 2));
  sc.add(yard);

  return sc;
}

// ─── Torre ────────────────────────────────────────────────────────────────────
function buildTower() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(TOWER.radius * 2 * S * 0.9, TOWER_H, TOWER.radius * 2 * S * 0.9),
    new THREE.MeshLambertMaterial({ color: 0x9e8c7a }),
  );
  body.position.y = TOWER_H / 2; body.name = 'body'; g.add(body);
  g.add(Object.assign(new THREE.Mesh(
    new THREE.BoxGeometry(TOWER.radius * 2 * S + 0.12, 0.12, TOWER.radius * 2 * S + 0.12),
    new THREE.MeshLambertMaterial({ color: 0x6a5a4e }),
  ), { position: new THREE.Vector3(0, TOWER_H + 0.06, 0) }));
  const winMat = new THREE.MeshLambertMaterial({ color: 0x3a4a5a });
  for (let row = 0; row < 3; row++) for (let col = -1; col <= 1; col++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.02), winMat);
    win.position.set(col * 0.19, 0.38 + row * 0.58, TOWER.radius * S * 0.9 + 0.02);
    g.add(win);
  }
  g.position.set(wx(TOWER.x), 0, wz(TOWER.y));
  return g;
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export function createThreeRenderer(canvas: HTMLCanvasElement, _assets: unknown) {
  const assets = _assets as Assets;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene   = buildScene();
  const towerG  = buildTower();
  scene.add(towerG);
  const towerBody = towerG.getObjectByName('body') as THREE.Mesh;
  const ambLight  = scene.getObjectByName('amb') as THREE.AmbientLight;
  const sunLight  = scene.getObjectByName('sun') as THREE.DirectionalLight;
  const groundMesh = scene.getObjectByName('ground') as THREE.Mesh;

  const BASE_F = 12;
  const cam = new THREE.OrthographicCamera(-BASE_F, BASE_F, BASE_F, -BASE_F, 0.1, 100);
  cam.position.set(14, 12, 14); cam.lookAt(0, 0, 0);

  // Pool sprite
  const actorPool  = new SpritePool(scene);
  const corpsePool = new SpritePool(scene);
  const textPool   = new SpritePool(scene);
  const heroSp     = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
  scene.add(heroSp);

  // Pool mesh
  const shotPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(SHOT_R, 5, 4), new THREE.MeshLambertMaterial({ color: 0xffe040 })));
  const eshotPool = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(SHOT_R * 0.9, 5, 4), new THREE.MeshLambertMaterial({ color: 0xff3e8a })));
  const partPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 3), new THREE.MeshLambertMaterial({ color: 0xffffff })));
  const ringPool  = new MeshPool(scene, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true }));
    m.rotation.x = -Math.PI / 2; return m;
  });
  const trailPool = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), new THREE.MeshLambertMaterial({ color: 0xff88aa, transparent: true })));
  const bombPool  = new MeshPool(scene, () => {
    const g = new THREE.Group() as unknown as THREE.Mesh;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshLambertMaterial({ color: 0x1a1a1c }));
    (g as unknown as THREE.Group).add(body);
    scene.add(g); return g;
  });
  const wallPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.BoxGeometry(1, WALL_H, 0.08), new THREE.MeshLambertMaterial({ color: 0xbfa574 })));

  let lastT = performance.now() / 1000;
  let shakeAmt = 0;
  let lastDept = -1;
  let zombieK = 0;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const a = w / h;
    cam.left = -BASE_F * a; cam.right = BASE_F * a;
    cam.top = BASE_F; cam.bottom = -BASE_F;
    cam.updateProjectionMatrix();
  }

  function getSpr(e: any, frame: number): Spr | null {
    try {
      if (e.animal) return assets.animal(e.animal, frame, e.scale ?? 1, e.hitFlash > 0);
      return assets.person(e.zombie ? `z${zStage(e)}:${e.look}` : e.look, frame, e.scale ?? 1, e.hitFlash > 0);
    } catch { return null; }
  }

  function draw(run: Run | null) {
    const now = performance.now() / 1000;
    const dt  = Math.min(0.05, now - lastT);
    lastT = now;
    const frame = Math.floor(now * 6) % 2;

    // ── Atmosfera per reparto ──────────────────────────────────────────────
    const wave  = run?.wave ?? 1;
    const dept  = Math.floor((Math.max(1, wave) - 1) / 10) % DEPT_PALETTE.length;
    const isZombie = run ? isZombieWave(wave) : false;
    zombieK += (Math.min(1, (isZombie ? 1 : 0) - zombieK) * dt * 1.5);
    zombieK  = Math.max(0, Math.min(1, zombieK));

    if (dept !== lastDept || isZombie) {
      lastDept = dept;
      const pal = zombieK > 0.5 ? ZOMBIE_PALETTE : DEPT_PALETTE[dept];
      const fogC = new THREE.Color(pal.fog);
      scene.background = fogC.clone().lerp(new THREE.Color(0x0d0d0f), 0.4);
      (scene.fog as THREE.Fog).color.copy(fogC);
      ambLight.color.set(ZOMBIE_PALETTE.amb).lerp(new THREE.Color(DEPT_PALETTE[dept].amb), 1 - zombieK);
      sunLight.color.set(ZOMBIE_PALETTE.sun).lerp(new THREE.Color(DEPT_PALETTE[dept].sun), 1 - zombieK);
      (groundMesh.material as THREE.MeshLambertMaterial).color
        .setHex(pal.fog).addScalar(0.04);
    }

    // ── Camera shake ──────────────────────────────────────────────────────
    const shake = (run as any)?.fx?.shake ?? 0;
    shakeAmt += (shake * 0.005 - shakeAmt) * 0.4;
    cam.position.set(14 + (Math.random() - 0.5) * shakeAmt, 12, 14 + (Math.random() - 0.5) * shakeAmt);
    cam.lookAt(0, 0, 0);

    // ── Torre: colore dai danni ────────────────────────────────────────────
    if (run) {
      const ratio = run.tower.hp / run.stats.maxHp;
      (towerBody.material as THREE.MeshLambertMaterial).color
        .setHSL(ratio * 0.07, 0.22, 0.30 + ratio * 0.28);
    }

    // ── Hero sul tetto ────────────────────────────────────────────────────
    heroSp.visible = !!run;
    if (run) {
      try {
        const hSpr = assets.person((run as any).hero ?? 'peppe', frame);
        applySprite(heroSp, hSpr, TOWER.x, TOWER.y, TOWER_H);
      } catch { heroSp.visible = false; }
    }

    // ── Cadaveri ──────────────────────────────────────────────────────────
    corpsePool.reset();
    if (run) for (const c of (run as any).fx?.corpses ?? []) {
      try {
        const cSpr = c.animal ? assets.animal(c.animal, 0, c.scale ?? 1, false)
          : assets.person(c.look, 0, c.scale ?? 1, false);
        const sp = corpsePool.get();
        const mat = sp.material as THREE.SpriteMaterial;
        const t = cacheTex(cSpr.img);
        if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; }
        const h = wy(cSpr.h) * 0.7, w = wy(cSpr.w) * 0.7;
        sp.scale.set(w, h, 1);
        sp.position.set(wx(c.x), 0.05, wz(c.y));
        mat.opacity = Math.min(1, c.life / (c.max * 0.5));
        mat.color.setHex(0xaaaaaa);
        mat.needsUpdate = true;
      } catch { /* */ }
    }

    // ── Trails dei boss ───────────────────────────────────────────────────
    trailPool.reset();
    if (run) for (const t of (run as any).fx?.trails ?? []) {
      if (!t || t.life <= 0) continue;
      const m = trailPool.get();
      m.position.set(wx(t.x), 0.2 + t.life * 0.3, wz(t.y));
      const col = t.color ?? '#ff88aa';
      try { (m.material as THREE.MeshLambertMaterial).color.set(col); } catch { /* */ }
      (m.material as THREE.MeshLambertMaterial).opacity = Math.min(1, t.life / (t.max ?? 0.5));
      m.material.transparent = true;
      const sc = 0.5 + t.life * 1.5;
      m.scale.setScalar(sc);
    }

    // ── Nemici ────────────────────────────────────────────────────────────
    actorPool.reset();
    if (run) {
      for (const e of run.enemies) {
        if (e.dead) continue;
        const s = getSpr(e, frame); if (!s) continue;
        const tint = e.boss ? 0xff9999 : e.elite ? 0xffcc77 : 0xffffff;
        applySprite(actorPool.get(), s, e.x, e.y, 0, tint);
      }
      // ── Alleati ─────────────────────────────────────────────────────────
      for (const a of run.allies) {
        const pos = allyPos(a);
        try {
          const aSpr = assets.person((a as any).id ?? 'peppe', frame);
          applySprite(actorPool.get(), aSpr, pos.x, pos.y, 0, 0xaaffee);
        } catch { /* */ }
      }
    }

    // ── Colpi torre ───────────────────────────────────────────────────────
    shotPool.reset();
    if (run) for (const s of (run as any).shots ?? []) {
      const m = shotPool.get();
      m.position.set(wx(s.x), 0.35, wz(s.y));
      (m.material as THREE.MeshLambertMaterial).color.setHex(
        s.kind === 'laser' ? 0x2de2e6 : s.kind === 'bolt' ? 0xff9933 : 0xffe040,
      );
    }

    // ── Colpi nemici ──────────────────────────────────────────────────────
    eshotPool.reset();
    if (run) for (const s of (run as any).enemyShots ?? []) {
      const m = eshotPool.get();
      m.position.set(wx(s.x), 0.35, wz(s.y));
    }

    // ── Particelle ────────────────────────────────────────────────────────
    partPool.reset();
    if (run) for (const p of (run as any).fx?.parts ?? []) {
      if (p.life <= 0) continue;
      const m = partPool.get();
      // p.x e p.y sono già aggiornate dal game loop (vx/vy integrati)
      m.position.set(wx(p.x), Math.max(0.05, p.life * 0.6), wz(p.y));
      try { (m.material as THREE.MeshLambertMaterial).color.set(p.color); } catch { /* */ }
      const sc = 0.4 + (p.life / (p.max ?? 0.5)) * 0.9;
      m.scale.setScalar(sc);
    }

    // ── Rings ─────────────────────────────────────────────────────────────
    ringPool.reset();
    if (run) for (const r of (run as any).fx?.rings ?? []) {
      if (r.life <= 0) continue;
      const m = ringPool.get();
      const prog = 1 - r.life / r.max;
      const ringR = r.radius * S * (0.2 + prog * 0.8);
      m.position.set(wx(r.x), 0.06, wz(r.y));
      m.scale.setScalar(ringR);
      try {
        (m.material as THREE.MeshBasicMaterial).color.set(r.color);
        (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.life / r.max);
      } catch { /* */ }
    }

    // ── Floating text ─────────────────────────────────────────────────────
    textPool.reset();
    if (run) for (const t of (run as any).fx?.texts ?? []) {
      if (t.life <= 0) continue;
      const sp = textPool.get();
      const mat = sp.material as THREE.SpriteMaterial;
      const tt = textTex(t.text, t.color ?? '#fff', t.size ?? 8);
      if (mat.map !== tt) { mat.map = tt; mat.needsUpdate = true; }
      const ratio = t.life / t.max;
      // t.y in coord 2D scende (y -= 26*dt in updateFx), quindi in 3D sale
      const worldY3d = 0.5 + (1 - ratio) * 2.0;
      sp.scale.set(1.0, 0.38, 1);
      sp.position.set(wx(t.x), worldY3d, wz(t.y));
      mat.opacity = Math.min(1, ratio * 3);
      mat.color.setHex(0xffffff);
    }

    // ── Muro ──────────────────────────────────────────────────────────────
    wallPool.reset();
    if (run) for (const seg of (run as any).wall ?? []) {
      if (seg.hp <= 0) continue;
      const m = wallPool.get();
      const ratio = seg.hp / seg.maxHp;
      const horizontal = seg.side === 'top' || seg.side === 'bottom';
      const cx = horizontal ? (seg.a + seg.b) / 2 : seg.x;
      const cy = horizontal ? seg.y : (seg.a + seg.b) / 2;
      m.position.set(wx(cx), WALL_H / 2, wz(cy));
      m.rotation.y = horizontal ? 0 : Math.PI / 2;
      m.scale.set((seg.b - seg.a) * S, 1, 1);
      const hit = seg.hit ?? 0;
      (m.material as THREE.MeshLambertMaterial).color
        .setHSL(hit > 0.05 ? 0.08 : 0.09, 0.38, 0.25 + 0.38 * ratio + hit * 0.35);
    }

    // ── Bombe ─────────────────────────────────────────────────────────────
    bombPool.reset();
    if (run) for (const b of (run as any).bombs ?? []) {
      if (b.detonated) continue;
      const m = bombPool.get();
      m.position.set(wx(b.x), 0.12, wz(b.y));
      // Scintilla: la bomba pulsa leggermente
      const pulse = 1 + Math.sin(now * 12 + b.x) * 0.15;
      m.scale.setScalar(pulse);
    }

    // ── Flash boss ────────────────────────────────────────────────────────
    const flash = (run as any)?.fx?.flash ?? 0;
    if (flash > 0) {
      const bg = new THREE.Color(0x0d0d0f).lerp(new THREE.Color(0xffffff), Math.min(1, flash * 1.5));
      scene.background = bg;
    }

    renderer.render(scene, cam);
  }

  function screenRect(name: string) {
    const area = name === 'tower'
      ? { x: TOWER.x - 40, y: TOWER.y - 110, w: 80, h: 140 }
      : { x: YARD.x - 10, y: YARD.y - 14, w: YARD.w + 20, h: YARD.h + 26 };
    const c = canvas.getBoundingClientRect();
    const a = c.width / c.height;
    return {
      left:   c.left + (wx(area.x) / (BASE_F * a) + 1) / 2 * c.width,
      top:    c.top  + (wz(area.y) / BASE_F + 1) / 2 * c.height,
      width:  area.w * S / (BASE_F * a) * c.width,
      height: area.h * S / BASE_F * c.height,
    };
  }

  function screenToWorld(cx: number, cy: number) {
    const rect = canvas.getBoundingClientRect();
    const ndc  = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    const ray  = new THREE.Raycaster();
    ray.setFromCamera(ndc, cam);
    const pt   = new THREE.Vector3();
    ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
    return { x: pt.x / S + WORLD.w / 2, y: pt.z / S + WORLD.h / 2 };
  }

  resize();
  return { resize, draw, screenRect, screenToWorld };
}
