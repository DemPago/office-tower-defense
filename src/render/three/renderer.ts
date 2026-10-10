// Renderer 3D completo con Three.js.
// Stessa firma pubblica di world.ts: createThreeRenderer(canvas, assets) → { resize, draw, screenRect, screenToWorld }
//
// Attivato con ?3d nell'URL.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TOWER, YARD, WORLD } from '../../state.js';
import { WALL } from '../../data/wall.js';
import { allyPos } from '../../systems/allies.js';
import { ALLY_SLOTS, allyArc } from '../../data/allies.js';
import { isZombieWave } from '../../data/enemies.js';
import { SCENES, sceneIndexForWave, buildScene as build2DScene } from '../scenery.js';
import type { Run } from '../../types.js';

// Cache globale modelli GLTF (popolata asincrona, condivisa da tutte le build fn)
const modelCache = new Map<string, THREE.Group>();

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
const SHOT_R  = 0.13;

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
  sc.background = new THREE.Color(0x18140c);
  // Nebbia lontana: non scurisce il mondo vicino
  sc.fog = new THREE.Fog(0x18140c, 45, 70);

  const ambLight = new THREE.AmbientLight(0xfff8f0, 1.1);
  ambLight.name = 'amb';
  sc.add(ambLight);
  const sunLight = new THREE.DirectionalLight(0xffe4b5, 1.4);
  sunLight.position.set(-6, 18, -4);
  sunLight.name = 'sun';
  sc.add(sunLight);
  const fill = new THREE.DirectionalLight(0x8899cc, 0.3);
  fill.position.set(4, -4, 6);
  sc.add(fill);

  // Terreno grande (riempie i bordi isometrici)
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x2a2535 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  sc.add(ground);

  // Griglia dell'area di gioco
  const grid = new THREE.GridHelper(WORLD.w * S, 20, 0x3a3555, 0x302a48);
  grid.position.y = 0.003; sc.add(grid);

  // Cortile
  const yardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(YARD.w * S + 0.2, YARD.h * S + 0.2),
    new THREE.MeshLambertMaterial({ color: 0x1e1c2e }),
  );
  yardMesh.rotation.x = -Math.PI / 2;
  yardMesh.position.set(wx(YARD.x + YARD.w / 2), 0.002, wz(YARD.y + YARD.h / 2));
  sc.add(yardMesh);

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
  const roofMesh = new THREE.Mesh(
    new THREE.BoxGeometry(TOWER.radius * 2 * S + 0.12, 0.12, TOWER.radius * 2 * S + 0.12),
    new THREE.MeshLambertMaterial({ color: 0x6a5a4e }),
  );
  roofMesh.position.set(0, TOWER_H + 0.06, 0);
  g.add(roofMesh);
  const winMat = new THREE.MeshLambertMaterial({ color: 0x3a4a5a });
  for (let row = 0; row < 3; row++) for (let col = -1; col <= 1; col++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.02), winMat);
    win.position.set(col * 0.19, 0.38 + row * 0.58, TOWER.radius * S * 0.9 + 0.02);
    g.add(win);
  }
  g.position.set(wx(TOWER.x), 0, wz(TOWER.y));
  return g;
}

// ─── Prop 3D per dipartimento ─────────────────────────────────────────────────

// Colora la carrozzeria di un modello auto Kenney (le parti chiare = body)
function colorCarModel(model: THREE.Group, bodyHex: number): void {
  model.traverse(child => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const result: THREE.Material[] = [];
    for (const mat of mats) {
      const m = mat as THREE.MeshStandardMaterial;
      if (m.color && (m.color.r + m.color.g + m.color.b) > 1.6) {
        // Parte chiara = carrozzeria: clona e tinta
        const c = m.clone() as THREE.MeshStandardMaterial;
        c.color.setHex(bodyHex);
        result.push(c);
      } else {
        result.push(mat);
      }
    }
    mesh.material = Array.isArray(mesh.material) ? result : result[0];
  });
}

// Lampione: usa il modello Kenney se caricato, altrimenti geometria procedurale.
function placeLampione(
  g: THREE.Group, cx: number, cy: number,
  poleH = 1.25, poleCol = 0x4a4a52, glowCol = 0xffec88,
) {
  const template = modelCache.get('light-curved');
  if (template) {
    const lamp = template.clone();
    lamp.scale.setScalar(0.45);
    lamp.position.set(wx(cx), 0, wz(cy));
    g.add(lamp);
    return;
  }
  // Fallback procedurale
  const matP = new THREE.MeshLambertMaterial({ color: poleCol });
  const matH = new THREE.MeshLambertMaterial({ color: 0x252528 });
  const matG = new THREE.MeshBasicMaterial({ color: glowCol });
  const lamp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, poleH, 6), matP);
  pole.position.y = poleH / 2;
  lamp.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.02), matP);
  arm.position.set(0.12, poleH - 0.04, 0);
  lamp.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.048, 0.07), matH);
  head.position.set(0.23, poleH - 0.07, 0);
  lamp.add(head);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.036, 5, 4), matG);
  glow.position.set(0.23, poleH - 0.11, 0);
  lamp.add(glow);
  lamp.position.set(wx(cx), 0, wz(cy));
  g.add(lamp);
}

function nearTower(cx: number, cy: number, r = 45): boolean {
  if (Math.abs(cx - TOWER.x) < r || Math.abs(cy - TOWER.y) < r) return true;
  if (cx >= YARD.x - 12 && cx <= YARD.x + YARD.w + 12 && cy >= YARD.y - 12 && cy <= YARD.y + YARD.h + 12) return true;
  return false;
}

function buildParkingEnv(g: THREE.Group) {
  // Auto 3D: usa modelli Kenney se caricati, altrimenti box procedurali
  const CAR_MODELS = ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury', 'van', 'taxi'];
  const CAR_COLORS = [0xb02030, 0x2f4f6f, 0xc0c4cc, 0x3e6b2a, 0x141416, 0xd9c040, 0x8a3b1e, 0x4a8a9a, 0xe8641b];
  const winMat = new THREE.MeshLambertMaterial({ color: 0x1c2430 });
  const useModels = modelCache.has('sedan');
  let ci = 0;
  for (let ry = 20; ry < WORLD.h - 30; ry += 76) {
    for (let sx = 10; sx < WORLD.w - 20; sx += 44) {
      const cx = sx + 11, cy = ry + 20;
      if (nearTower(cx, cy, 40)) continue;
      if (useModels) {
        const name = CAR_MODELS[ci % CAR_MODELS.length];
        const tmpl = modelCache.get(name)!;
        const car = tmpl.clone();
        car.scale.setScalar(0.25);
        car.position.set(wx(cx), 0, wz(cy));
        car.rotation.y = (ry / 76 % 2 === 0) ? 0 : Math.PI;
        // Tinta carrozzeria per varietà di colori
        const bodyCol = CAR_COLORS[ci % CAR_COLORS.length];
        colorCarModel(car, bodyCol);
        g.add(car);
      } else {
        const col = CAR_COLORS[ci % CAR_COLORS.length];
        const car = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.18, 0.82),
          new THREE.MeshLambertMaterial({ color: col }),
        );
        car.position.set(wx(cx), 0.09, wz(cy));
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.32), winMat);
        win.position.y = 0.12;
        car.add(win);
        g.add(car);
      }
      ci++;
    }
  }
  // Lampioni lungo i corridoi stradali (ogni 80px, su entrambi i lati)
  for (let cy = 60; cy < WORLD.h; cy += 80) {
    for (const side of [-1, 1]) {
      const lx = TOWER.x + side * 36;
      if (!nearTower(lx, cy, 32)) placeLampione(g, lx, cy);
    }
  }
  for (let cx = 60; cx < WORLD.w; cx += 80) {
    for (const side of [-1, 1]) {
      const ly = TOWER.y + side * 36;
      if (!nearTower(cx, ly, 32)) placeLampione(g, cx, ly);
    }
  }
  // Coni stradali arancioni sparsi
  const matCone = new THREE.MeshLambertMaterial({ color: 0xff6a10 });
  const matStripe = new THREE.MeshLambertMaterial({ color: 0xe8e2d0 });
  for (let i = 0; i < 18; i++) {
    const cx = 60 + (i * 137) % (WORLD.w - 120);
    const cy = 60 + (i * 97 + 50) % (WORLD.h - 120);
    if (nearTower(cx, cy, 50)) continue;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.20, 6), matCone);
    cone.position.set(wx(cx), 0.10, wz(cy));
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.071, 0.071, 0.04, 6), matStripe);
    stripe.position.y = -0.04;
    cone.add(stripe);
    g.add(cone);
  }
}

function buildArchiveEnv(g: THREE.Group) {
  const mat    = new THREE.MeshLambertMaterial({ color: 0x606858 });
  const matTop = new THREE.MeshLambertMaterial({ color: 0x3a4038 });
  let ci = 0;
  for (let ry = 30; ry < WORLD.h - 30; ry += 80) {
    for (let sx = 10; sx < WORLD.w - 20; sx += 60) {
      const cx = sx + 16, cy = ry + 26;
      if (nearTower(cx, cy)) continue;
      const h = (ci % 3 === 0) ? 0.95 : 0.70;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.50, h, 0.38), mat);
      cab.position.set(wx(cx), h / 2, wz(cy));
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.40), matTop);
      lid.position.y = h / 2 + 0.02;
      cab.add(lid);
      g.add(cab); ci++;
    }
  }
  // Lampade a soffitto (stile ufficio): palo corto con diffusore
  const matLamp = new THREE.MeshLambertMaterial({ color: 0x888880 });
  const matDiff = new THREE.MeshBasicMaterial({ color: 0xfff8d8 });
  for (let cx = 120; cx < WORLD.w - 80; cx += 140) {
    for (let cy = 120; cy < WORLD.h - 80; cy += 140) {
      if (nearTower(cx, cy)) continue;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.40, 5), matLamp);
      pole.position.set(wx(cx), 0.50, wz(cy));
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.10, 0.08, 8), matLamp);
      shade.position.y = -0.20;
      pole.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), matDiff);
      bulb.position.y = -0.22;
      pole.add(bulb);
      g.add(pole);
    }
  }
  // Carrelli portadocumenti (box su ruote)
  const matCart = new THREE.MeshLambertMaterial({ color: 0x9a9070 });
  for (let i = 0; i < 12; i++) {
    const cx = 50 + (i * 113) % (WORLD.w - 100);
    const cy = 50 + (i * 89 + 40) % (WORLD.h - 100);
    if (nearTower(cx, cy, 50)) continue;
    const cart = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.50, 0.25), matCart);
    cart.position.set(wx(cx), 0.25, wz(cy));
    g.add(cart);
  }
}

function buildDatacenterEnv(g: THREE.Group) {
  const matRack  = new THREE.MeshLambertMaterial({ color: 0x252830 });
  const matGreen = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
  const matRed   = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  let ci = 0;
  for (let ry = 22; ry < WORLD.h - 30; ry += 90) {
    for (let sx = 10; sx < WORLD.w - 20; sx += 56) {
      const cx = sx + 14, cy = ry + 29;
      if (nearTower(cx, cy)) continue;
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.20, 0.28), matRack);
      rack.position.set(wx(cx), 0.60, wz(cy));
      for (let i = 0; i < 4; i++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.02), i % 4 === 0 ? matRed : matGreen);
        led.position.set(-0.10 + (i % 3) * 0.12, 0.35 - i * 0.20, 0.15);
        rack.add(led);
      }
      g.add(rack); ci++;
    }
  }
  // Lampioni industriali alti (luce fredda bluastra)
  for (let cx = 90; cx < WORLD.w; cx += 130) {
    for (let cy = 90; cy < WORLD.h; cy += 130) {
      if (nearTower(cx, cy, 52)) continue;
      placeLampione(g, cx, cy, 1.55, 0x2a2a34, 0xb0e0ff);
    }
  }
  // Canalette cavi a terra (sottili box scuri)
  const matCable = new THREE.MeshLambertMaterial({ color: 0x1a1c22 });
  for (let i = 0; i < 8; i++) {
    const isH = i % 2 === 0;
    const pos = 80 + i * 70;
    const cable = new THREE.Mesh(
      isH ? new THREE.BoxGeometry(WORLD.w * S * 0.6, 0.05, 0.08)
          : new THREE.BoxGeometry(0.08, 0.05, WORLD.h * S * 0.6),
      matCable,
    );
    cable.position.set(
      isH ? 0 : wx(pos),
      0.025,
      isH ? wz(pos) : 0,
    );
    if (!nearTower(isH ? TOWER.x : pos, isH ? pos : TOWER.y, 35)) g.add(cable);
  }
}

function buildMallEnv(g: THREE.Group) {
  const matKiosk  = new THREE.MeshLambertMaterial({ color: 0xd0c8b8 });
  const matScreen = new THREE.MeshLambertMaterial({ color: 0x1a4a6a });
  const matPlant  = new THREE.MeshLambertMaterial({ color: 0x1c3a28 });
  const matPot    = new THREE.MeshLambertMaterial({ color: 0xc8a87a });
  let ci = 0;
  for (let ry = 32; ry < WORLD.h - 30; ry += 90) {
    for (let sx = 14; sx < WORLD.w - 20; sx += 72) {
      const cx = sx + 18, cy = ry + 28;
      if (nearTower(cx, cy)) continue;
      if (ci % 3 !== 2) {
        const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.58, 0.40), matKiosk);
        kiosk.position.set(wx(cx), 0.29, wz(cy));
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.02), matScreen);
        screen.position.set(0, 0.10, 0.21);
        kiosk.add(screen);
        g.add(kiosk);
      } else {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.22, 6), matPot);
        pot.position.set(wx(cx), 0.11, wz(cy));
        const plant = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), matPlant);
        plant.position.y = 0.28;
        pot.add(plant);
        g.add(pot);
      }
      ci++;
    }
  }
  // Lampioni decorativi dorati stile mall
  for (let cx = 100; cx < WORLD.w; cx += 130) {
    for (let cy = 100; cy < WORLD.h; cy += 130) {
      if (nearTower(cx, cy, 52)) continue;
      placeLampione(g, cx, cy, 1.10, 0xc8a030, 0xfff4c0);
    }
  }
  // Panchine (seduta + schienale)
  const matBench = new THREE.MeshLambertMaterial({ color: 0xa87040 });
  for (let i = 0; i < 14; i++) {
    const cx = 70 + (i * 103) % (WORLD.w - 140);
    const cy = 70 + (i * 83 + 30) % (WORLD.h - 140);
    if (nearTower(cx, cy, 50)) continue;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.22), matBench);
    seat.position.set(wx(cx), 0.28, wz(cy));
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.04), matBench);
    back.position.set(0, 0.14, -0.09);
    seat.add(back);
    g.add(seat);
  }
}

function buildIndustrialEnv(g: THREE.Group) {
  const matRed  = new THREE.MeshLambertMaterial({ color: 0x8a3b1e });
  const matBlue = new THREE.MeshLambertMaterial({ color: 0x2f4f6f });
  const matGray = new THREE.MeshLambertMaterial({ color: 0x44444b });
  let ci = 0;
  for (let ry = 26; ry < WORLD.h - 30; ry += 84) {
    for (let sx = 10; sx < WORLD.w - 20; sx += 58) {
      const cx = sx + 15, cy = ry + 27;
      if (nearTower(cx, cy)) continue;
      const k = ci % 3;
      if (k === 0) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.44, 8), matRed);
        barrel.position.set(wx(cx), 0.22, wz(cy));
        g.add(barrel);
      } else if (k === 1) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.36, 0.40), matGray);
        crate.position.set(wx(cx), 0.18, wz(cy));
        g.add(crate);
      } else {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.50, 8), matBlue);
        barrel.position.set(wx(cx), 0.25, wz(cy));
        g.add(barrel);
      }
      ci++;
    }
  }
  // Torri luce industriali (alte e robuste, luce gialla calda)
  for (let cx = 95; cx < WORLD.w; cx += 140) {
    for (let cy = 95; cy < WORLD.h; cy += 140) {
      if (nearTower(cx, cy, 52)) continue;
      placeLampione(g, cx, cy, 1.70, 0x3a3a40, 0xffcc44);
    }
  }
  // Barriere di sicurezza gialle/nere
  const matSafe = new THREE.MeshLambertMaterial({ color: 0xf0b800 });
  for (let i = 0; i < 10; i++) {
    const cx = 80 + (i * 119) % (WORLD.w - 160);
    const cy = 80 + (i * 73 + 60) % (WORLD.h - 160);
    if (nearTower(cx, cy, 48)) continue;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.10, 0.10), matSafe);
    bar.position.set(wx(cx), 0.30, wz(cy));
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 5), matSafe);
    post1.position.set(-0.22, -0.22, 0);
    bar.add(post1);
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 5), matSafe);
    post2.position.set(0.22, -0.22, 0);
    bar.add(post2);
    g.add(bar);
  }
}

function buildRooftopEnv(g: THREE.Group) {
  const matAC  = new THREE.MeshLambertMaterial({ color: 0xb8b4a8 });
  const matAnt = new THREE.MeshLambertMaterial({ color: 0x5b5f66 });
  const matPar = new THREE.MeshLambertMaterial({ color: 0x8f8a80 });
  const acOff: [number, number][] = [
    [-130, -110], [130, -110], [-130, 110], [130, 110],
    [-190, -20],  [190, -20],  [-190,  40], [190,  40],
    [-60, -190],  [60,  -190], [-60,  190], [60,  190],
    [-210, -80],  [210,   80], [-90,   80], [90,  -80],
  ];
  for (const [ox, oy] of acOff) {
    const cx = TOWER.x + ox, cy = TOWER.y + oy;
    if (cx < 10 || cx > WORLD.w - 10 || cy < 10 || cy > WORLD.h - 10) continue;
    if (nearTower(cx, cy, 50)) continue;
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.28, 0.40), matAC);
    ac.position.set(wx(cx), 0.14, wz(cy));
    g.add(ac);
  }
  // Parapetto ai bordi del mondo
  const hw = WORLD.w * S / 2, hh = WORLD.h * S / 2;
  const parH = 0.22, parT = 0.14;
  for (const [px, pz, pw, pd] of [
    [0, -hh, WORLD.w * S, parT],
    [0,  hh, WORLD.w * S, parT],
    [-hw, 0, parT, WORLD.h * S],
    [ hw, 0, parT, WORLD.h * S],
  ] as [number, number, number, number][]) {
    const par = new THREE.Mesh(new THREE.BoxGeometry(pw, parH, pd), matPar);
    par.position.set(px, parH / 2, pz);
    g.add(par);
  }
  // Antenne agli angoli
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
    const cx = TOWER.x + ox * 220, cy = TOWER.y + oy * 220;
    if (cx < 0 || cx > WORLD.w || cy < 0 || cy > WORLD.h) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), matAnt);
    post.position.set(wx(cx), 0.80, wz(cy));
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.025, 0.025), matAnt);
    bar.position.y = 0.55;
    post.add(bar);
    g.add(post);
  }
  // Lampioni sul tetto (bassi, warm)
  for (let cx = 110; cx < WORLD.w; cx += 150) {
    for (let cy = 110; cy < WORLD.h; cy += 150) {
      if (nearTower(cx, cy, 55)) continue;
      placeLampione(g, cx, cy, 0.90, 0x8f8a80, 0xffeebb);
    }
  }
  // Parabole satellite (disco inclinato + braccio)
  const matDish = new THREE.MeshLambertMaterial({ color: 0x9a9698 });
  const dishOff: [number, number][] = [[-160, -80], [160, 80], [-80, 160], [80, -160], [0, -200], [200, 0]];
  for (const [ox, oy] of dishOff) {
    const cx = TOWER.x + ox, cy = TOWER.y + oy;
    if (cx < 20 || cx > WORLD.w - 20 || cy < 20 || cy > WORLD.h - 20) continue;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.40, 5), matDish);
    base.position.set(wx(cx), 0.20, wz(cy));
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.01, 0.06, 12), matDish);
    dish.rotation.x = Math.PI / 4;
    dish.position.y = 0.30;
    base.add(dish);
    g.add(base);
  }
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

  const BASE_F = 5;
  const cam = new THREE.OrthographicCamera(-BASE_F, BASE_F, BASE_F, -BASE_F, 0.1, 100);
  cam.position.set(7, 14, 7); cam.lookAt(0, 0, 0);

  // Pool sprite
  const actorPool  = new SpritePool(scene);
  const corpsePool = new SpritePool(scene);
  const textPool   = new SpritePool(scene);
  const heroSp     = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
  scene.add(heroSp);

  // Pool mesh
  const shotPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(SHOT_R, 5, 4), new THREE.MeshLambertMaterial({ color: 0xffe040 })));
  const eshotPool = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(SHOT_R * 0.9, 5, 4), new THREE.MeshLambertMaterial({ color: 0xff3e8a })));
  const partPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.07, 4, 3), new THREE.MeshLambertMaterial({ color: 0xffffff })));
  const ringPool  = new MeshPool(scene, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.88, 1.0, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true }));
    m.rotation.x = -Math.PI / 2; return m;
  });
  const trailPool    = new MeshPool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), new THREE.MeshLambertMaterial({ color: 0xff88aa, transparent: true })));
  const shotTrailPool = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.006, 1, 4),
    new THREE.MeshBasicMaterial({ color: 0xf2b705, transparent: true }),
  ));
  // ─── Ombre a terra ────────────────────────────────────────────────────────
  const shadowPool = new MeshPool(scene, () => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1, 10),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.003;
    return m;
  });

  const bombPool  = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0x1a1a1c }),
  ));
  const wallPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.BoxGeometry(1, WALL_H, 0.08), new THREE.MeshLambertMaterial({ color: 0xbfa574 })));

  // ─── Beams: flash laser istantaneo (fx.beams) ─────────────────────────────
  const beamPool = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1, 4),
    new THREE.MeshBasicMaterial({ color: 0xff2a3d, transparent: true }),
  ));

  // ─── Onde d'urto / esplosioni (fx.waves) ──────────────────────────────────
  const wavePool = new MeshPool(scene, () => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 1.0, 48),
      new THREE.MeshBasicMaterial({ color: 0xe8e2d0, side: THREE.DoubleSide, transparent: true }),
    );
    m.rotation.x = -Math.PI / 2; return m;
  });

  // ─── Sfondo scenario (canvas 2D come texture sul terreno) ────────────────
  const SCENE_W = (WORLD.w + 480) * S; // 480 = 2 × MARGIN(240)
  const scenePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(SCENE_W, SCENE_W),
    new THREE.MeshLambertMaterial({ transparent: false }),
  );
  scenePlane.rotation.x = -Math.PI / 2;
  scenePlane.position.y = 0.001;
  scene.add(scenePlane);
  const sceneTexCache = new Map<number, THREE.CanvasTexture>();
  function applySceneTex(deptIdx: number) {
    if (!sceneTexCache.has(deptIdx)) {
      const built = build2DScene(deptIdx);
      const tex = new THREE.CanvasTexture(built.canvas);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      sceneTexCache.set(deptIdx, tex);
    }
    const mat = scenePlane.material as THREE.MeshLambertMaterial;
    const newTex = sceneTexCache.get(deptIdx)!;
    if (mat.map !== newTex) { mat.map = newTex; mat.needsUpdate = true; }
  }
  applySceneTex(0);

  // ─── Prop 3D dipartimento (lazy, cached per dept) ─────────────────────────
  let modelsLoaded = false;
  const envPropsCache = new Map<number, THREE.Group>();
  let currentEnvGroup: THREE.Group | null = null;
  function applyEnvDept(deptIdx: number) {
    if (currentEnvGroup) currentEnvGroup.visible = false;
    if (!envPropsCache.has(deptIdx)) {
      const g = new THREE.Group();
      if (deptIdx === 0)      buildParkingEnv(g);
      else if (deptIdx === 1) buildArchiveEnv(g);
      else if (deptIdx === 2) buildDatacenterEnv(g);
      else if (deptIdx === 3) buildMallEnv(g);
      else if (deptIdx === 4) buildIndustrialEnv(g);
      else if (deptIdx === 5) buildRooftopEnv(g);
      scene.add(g);
      envPropsCache.set(deptIdx, g);
    }
    currentEnvGroup = envPropsCache.get(deptIdx)!;
    currentEnvGroup.visible = true;
    // Nascondi la texture 2D per il parcheggio quando i modelli 3D sono pronti
    if (modelsLoaded) scenePlane.visible = deptIdx !== 0;
  }
  applyEnvDept(0);

  // ─── Settori alleati + cerchio gittata (canvas texture sul terreno) ────────
  const SC = 512;
  const sectorCanvas = document.createElement('canvas');
  sectorCanvas.width = sectorCanvas.height = SC;
  const sectorCtx = sectorCanvas.getContext('2d')!;
  const sectorTex = new THREE.CanvasTexture(sectorCanvas);
  const sectorPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.w * S, WORLD.h * S),
    new THREE.MeshBasicMaterial({ map: sectorTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  sectorPlane.rotation.x = -Math.PI / 2;
  sectorPlane.position.y = 0.008;
  scene.add(sectorPlane);

  // ─── Overlay HTML: banner + barra boss ────────────────────────────────────
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10';
  canvas.parentElement?.appendChild(overlayCanvas);
  const overlayCtx = overlayCanvas.getContext('2d')!;

  // ─── Fumo dalla torre (locale, non nel game state) ────────────────────────
  interface Smoke3d { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; r: number; }
  const smoke3d: Smoke3d[] = [];
  const smokePool = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0x554433, transparent: true, depthWrite: false }),
  ));

  let lastT = performance.now() / 1000;
  let shakeAmt = 0;
  let lastDept = -1;
  let zombieK = 0;
  let sceneTitle: { name: string; timer: number } | null = null;

  // Polvere ambientale (locale)
  const dust3d = Array.from({ length: 35 }, () => ({
    x: (Math.random() - 0.5) * 22, y: 0.15 + Math.random() * 3.0,
    z: (Math.random() - 0.5) * 22, vx: 0.04 + Math.random() * 0.06,
    vy: (Math.random() - 0.5) * 0.015, vz: (Math.random() - 0.5) * 0.03,
  }));
  const dustSpritePool = new SpritePool(scene);

  // ─── Caricamento modelli GLTF (asincrono) ────────────────────────────────
  {
    const loader = new GLTFLoader();
    const BASE = (import.meta as any).env?.BASE_URL ?? '/office-tower-defense/';
    const MODELS = ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury',
                    'van', 'taxi', 'light-curved', 'construction-cone'];
    Promise.all(MODELS.map(name => new Promise<void>(ok => {
      loader.load(`${BASE}models/${name}.glb`,
        gltf => { modelCache.set(name, gltf.scene); ok(); },
        undefined, () => ok(),
      );
    }))).then(() => {
      modelsLoaded = true;
      // Le auto 2D non servono più: nascondi la texture 2D (solo per parcheggio)
      scenePlane.visible = Math.max(0, lastDept) !== 0;
      // Ricostruisce ambiente con i modelli reali
      for (const grp of envPropsCache.values()) scene.remove(grp);
      envPropsCache.clear();
      currentEnvGroup = null;
      applyEnvDept(Math.max(0, lastDept));
    });
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const a = w / h;
    cam.left = -BASE_F * a; cam.right = BASE_F * a;
    cam.top = BASE_F; cam.bottom = -BASE_F;
    cam.updateProjectionMatrix();
    const dpr = window.devicePixelRatio || 1;
    overlayCanvas.width = Math.round(w * dpr);
    overlayCanvas.height = Math.round(h * dpr);
    overlayCanvas.style.width = w + 'px';
    overlayCanvas.style.height = h + 'px';
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
      if (dept !== lastDept) {
        applySceneTex(dept);
        applyEnvDept(dept);
        if (lastDept >= 0) sceneTitle = { name: SCENES[dept].name, timer: 3.5 };
      }
      lastDept = dept;
      const pal = zombieK > 0.5 ? ZOMBIE_PALETTE : DEPT_PALETTE[dept];
      const fogC = new THREE.Color(pal.fog);
      scene.background = fogC.clone().lerp(new THREE.Color(0x0d0d0f), 0.4);
      (scene.fog as THREE.Fog).color.copy(fogC);
      ambLight.color.set(ZOMBIE_PALETTE.amb).lerp(new THREE.Color(DEPT_PALETTE[dept].amb), 1 - zombieK);
      sunLight.color.set(ZOMBIE_PALETTE.sun).lerp(new THREE.Color(DEPT_PALETTE[dept].sun), 1 - zombieK);
      (groundMesh.material as THREE.MeshLambertMaterial).color
        .lerpColors(new THREE.Color(pal.fog), new THREE.Color(0x2a2535), 0.55);
    }

    // ── Camera: orbita lenta nel menu, shake durante il gioco ────────────────
    if (!run) {
      // Nel menu ruotiamo lentamente intorno al palazzo come un "attract mode"
      const angle = now * 0.18;
      const r = 9.5;
      cam.position.set(Math.sin(angle) * r, 13, Math.cos(angle) * r);
      cam.lookAt(0, 0, 0);
      shakeAmt = 0;
    } else {
      const shake = (run as any)?.fx?.shake ?? 0;
      shakeAmt += (shake * 0.005 - shakeAmt) * 0.4;
      cam.position.set(7 + (Math.random() - 0.5) * shakeAmt, 14, 7 + (Math.random() - 0.5) * shakeAmt);
      cam.lookAt(0, 0, 0);
    }

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

    // ── Ombre a terra ─────────────────────────────────────────────────────
    shadowPool.reset();
    if (run) {
      for (const e of run.enemies) {
        if (e.dead) continue;
        const m = shadowPool.get();
        m.position.set(wx(e.x), 0.003, wz(e.y));
        const r = (e.size ?? 10) * S * 0.26;
        m.scale.set(r, 1, r * 0.4);
      }
      for (const a of run.allies) {
        const pos = allyPos(a);
        const m = shadowPool.get();
        m.position.set(wx(pos.x), 0.003, wz(pos.y));
        m.scale.set(0.09, 1, 0.04);
      }
      const hs = shadowPool.get();
      hs.position.set(wx(TOWER.x), TOWER_H + 0.01, wz(TOWER.y));
      hs.scale.set(0.09, 1, 0.04);
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
        const tint = e.boss ? 0xff9999 : (e as any).elite ? 0xffcc77 : 0xffffff;
        applySprite(actorPool.get(), s, e.x, e.y, 0, tint);
      }
      // ── Alleati ─────────────────────────────────────────────────────────
      for (const a of run.allies) {
        const pos = allyPos(a);
        try {
          const aany = a as any;
          const aframe = aany.recoil > 0 ? 1 : frame;
          const tint = aany.promoFlash > 0 ? 0xffd060
            : aany.hurt > 0 ? 0xff6060
            : aany.recoil > 0 ? 0xffffff
            : 0xaaffee;
          const aSpr = assets.person(aany.id ?? 'peppe', aframe);
          applySprite(actorPool.get(), aSpr, pos.x, pos.y, 0, tint);
        } catch { /* */ }
      }
    }

    // ── Polvere ambientale ────────────────────────────────────────────────
    dustSpritePool.reset();
    {
      const dustTex = (() => {
        if ((createThreeRenderer as any)._dustTex) return (createThreeRenderer as any)._dustTex;
        const c = document.createElement('canvas'); c.width = c.height = 4;
        const g = c.getContext('2d')!;
        g.fillStyle = '#e8e2d0'; g.fillRect(1, 1, 2, 2);
        const t = cacheTex(c);
        (createThreeRenderer as any)._dustTex = t;
        return t;
      })();
      for (const d of dust3d) {
        d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        if (d.x > 12) d.x = -12;
        const sp = dustSpritePool.get();
        const mat = sp.material as THREE.SpriteMaterial;
        if (mat.map !== dustTex) { mat.map = dustTex; mat.needsUpdate = true; }
        sp.position.set(d.x, d.y, d.z);
        sp.scale.set(0.04, 0.04, 1);
        mat.opacity = 0.18 + Math.sin(now * 2 + d.x) * 0.06;
        mat.color.setHex(0xe8e2d0);
      }
    }

    // ── Colpi torre (testa + trail direzionale) ───────────────────────────
    shotPool.reset();
    shotTrailPool.reset();
    if (run) for (const s of (run as any).shots ?? []) {
      const sx = wx(s.x), sz = wz(s.y);
      let ddx = 0, ddz = -1;
      if (s.target && !s.target.dead) {
        const tdx = wx(s.target.x) - sx, tdz = wz(s.target.y) - sz;
        const td = Math.sqrt(tdx * tdx + tdz * tdz) || 1;
        ddx = tdx / td; ddz = tdz / td;
      }
      const head = shotPool.get();
      head.position.set(sx, 0.35, sz);
      const kind = s.kind;
      const headColor = kind === 'laser' ? 0x2de2e6 : kind === 'bolt' ? 0x00ffcc
        : kind === 'energy' ? 0xc080ff : kind === 'heart' ? 0xff3e8a
        : kind === 'dagger' ? 0xc0c4cc : kind === 'xbow' ? 0x8b6a3e
        : kind === 'pc' ? 0x2de2e6 : 0xffe040;
      (head.material as THREE.MeshLambertMaterial).color.setHex(headColor);

      const tr = shotTrailPool.get();
      const sany = s as any;
      if (kind === 'laser' && sany.ox != null) {
        const ox2 = wx(sany.ox), oz2 = wz(sany.oy);
        const lx = sx - ox2, lz = sz - oz2, ll = Math.sqrt(lx * lx + lz * lz) || 0.001;
        tr.position.set((ox2 + sx) / 2, 0.35, (oz2 + sz) / 2);
        tr.scale.set(1, ll, 1);
        tr.rotation.set(Math.PI / 2, Math.atan2(lx, lz), 0);
        (tr.material as THREE.MeshBasicMaterial).color.setHex(0xff2a3d);
        (tr.material as THREE.MeshBasicMaterial).opacity = 0.55;
      } else {
        const tlen = kind === 'bolt' ? 0.30 : kind === 'xbow' ? 0.38 : 0.22;
        tr.position.set(sx - ddx * tlen / 2, 0.35, sz - ddz * tlen / 2);
        tr.scale.set(1, tlen, 1);
        tr.rotation.set(Math.PI / 2, Math.atan2(ddx, ddz), 0);
        const trailColor = kind === 'bolt' ? 0x7bd332 : kind === 'energy' ? 0x8040cc
          : kind === 'heart' ? 0xff3e8a : 0xf2b705;
        (tr.material as THREE.MeshBasicMaterial).color.setHex(trailColor);
        (tr.material as THREE.MeshBasicMaterial).opacity = 0.55;
      }
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

    // ── Fumo dalla torre ──────────────────────────────────────────────────
    if (run?.stats) {
      const ratio = run.tower.hp / run.stats.maxHp;
      const rate  = Math.max(0, (1 - ratio - 0.5) * 5);
      if (rate > 0 && Math.random() < rate * dt * 30) {
        smoke3d.push({
          x: wx(TOWER.x) + (Math.random() - 0.5) * 0.25,
          y: TOWER_H + 0.05,
          z: wz(TOWER.y) + (Math.random() - 0.5) * 0.25,
          vx: (Math.random() - 0.5) * 0.15,
          vy: 0.35 + Math.random() * 0.35,
          vz: (Math.random() - 0.5) * 0.15,
          life: 1.4 + Math.random() * 0.8,
          max: 2.0,
          r: 0.06 + Math.random() * 0.06,
        });
      }
    }
    for (const sm of smoke3d) {
      sm.x += sm.vx * dt; sm.y += sm.vy * dt; sm.z += sm.vz * dt;
      sm.r  = Math.min(sm.r + dt * 0.14, 0.55);
      sm.life -= dt;
    }
    smoke3d.splice(0, smoke3d.length, ...smoke3d.filter(sm => sm.life > 0));
    smokePool.reset();
    for (const sm of smoke3d) {
      const m = smokePool.get();
      m.position.set(sm.x, sm.y, sm.z);
      m.scale.setScalar(sm.r);
      const alpha = Math.min(0.42, sm.life / sm.max * 0.5);
      (m.material as THREE.MeshLambertMaterial).opacity = alpha;
    }

    // ── Settori alleati + cerchio gittata ─────────────────────────────────
    sectorCtx.clearRect(0, 0, SC, SC);
    if (run?.stats) {
      const tcx = TOWER.x * SC / WORLD.w, tcy = TOWER.y * SC / WORLD.h;
      const rr  = run.stats.range * SC / WORLD.w;
      sectorCtx.strokeStyle = 'rgba(242,183,5,0.28)';
      sectorCtx.lineWidth = 1.5;
      sectorCtx.setLineDash([8, 8]);
      sectorCtx.lineDashOffset = -now * 6;
      sectorCtx.beginPath(); sectorCtx.arc(tcx, tcy, rr, 0, Math.PI * 2); sectorCtx.stroke();
      sectorCtx.setLineDash([]);
    }
    if (run) {
      const SECTOR_COLOR: Record<string, string> = { pm: '#d7263d', sm: '#7bd332', dev: '#2de2e6' };
      const tcx = TOWER.x * SC / WORLD.w, tcy = TOWER.y * SC / WORLD.h;
      for (const ally of run.allies) {
        const col = SECTOR_COLOR[(ally as any).id]; if (!col) continue;
        const c = ALLY_SLOTS[(ally as any).slot] * Math.PI / 180;
        const a = allyArc((ally as any).level) * Math.PI / 180;
        const r = (104 + (ally as any).slot * 3) * SC / WORLD.w;
        sectorCtx.strokeStyle = col;
        sectorCtx.lineWidth = 2.5;
        sectorCtx.setLineDash([4, 5]);
        sectorCtx.globalAlpha = run.phase === 'wave' ? 0.45 : 0.7 + Math.sin(now * 4) * 0.2;
        sectorCtx.beginPath();
        if (a >= Math.PI * 2) sectorCtx.arc(tcx, tcy, r, 0, Math.PI * 2);
        else sectorCtx.arc(tcx, tcy, r, -c - a / 2, -c + a / 2);
        sectorCtx.stroke();
        sectorCtx.setLineDash([]);
      }
      sectorCtx.globalAlpha = 1;
    }
    sectorTex.needsUpdate = true;

    // ── Beams (raggi laser istantanei, fx.beams) ──────────────────────────
    beamPool.reset();
    if (run) for (const b of (run as any).fx?.beams ?? []) {
      if (b.life <= 0) continue;
      const m  = beamPool.get();
      const x1 = wx(b.x1), z1 = wz(b.y1), x2 = wx(b.x2), z2 = wz(b.y2);
      const ddx = x2 - x1, ddz = z2 - z1;
      const len = Math.sqrt(ddx * ddx + ddz * ddz);
      if (len < 0.001) { m.visible = false; continue; }
      m.position.set((x1 + x2) / 2, 0.3, (z1 + z2) / 2);
      m.scale.set(1, len, 1);
      m.rotation.set(Math.PI / 2, Math.atan2(ddx, ddz), 0);
      const bmat = m.material as THREE.MeshBasicMaterial;
      bmat.opacity = Math.min(1, b.life / 0.07 + 0.3);
      bmat.color.setHex(b.crit ? 0xff7b1c : 0xff2a3d);
      bmat.needsUpdate = true;
    }

    // ── Onde d'urto (fx.waves) ────────────────────────────────────────────
    wavePool.reset();
    if (run) for (const w of (run as any).fx?.waves ?? []) {
      if (!w || w.life <= 0) continue;
      const m    = wavePool.get();
      const prog = w.energy ? w.life / 0.35 : w.life / 0.45;
      m.position.set(w.x != null ? wx(w.x) : wx(TOWER.x), 0.04, w.y != null ? wz(w.y) : wz(TOWER.y));
      m.scale.setScalar(w.r * S * 1.1);
      const wmat = m.material as THREE.MeshBasicMaterial;
      wmat.color.setHex(w.energy ? 0xa05aff : 0xe8e2d0);
      wmat.opacity = prog * 0.65;
      wmat.needsUpdate = true;
    }

    // ── Overlay HTML: banner + barra boss ────────────────────────────────
    const OW = overlayCanvas.width, OH = overlayCanvas.height;
    const dpr = OW / (canvas.clientWidth || 1);
    overlayCtx.clearRect(0, 0, OW, OH);

    // Vignette + tinta HP (riproduce drawGrade del 2D)
    {
      const hp     = run?.stats ? run.tower.hp / run.stats.maxHp : 1;
      const danger = Math.max(0, 1 - hp / 0.4);
      overlayCtx.fillStyle = `rgba(255,${Math.round(100 - danger * 80)},${Math.round(20 - danger * 20)},${(0.03 + danger * 0.07).toFixed(3)})`;
      overlayCtx.fillRect(0, 0, OW, OH);
      const v = overlayCtx.createRadialGradient(OW / 2, OH * 0.48, Math.min(OW, OH) * 0.18, OW / 2, OH * 0.52, Math.max(OW, OH) * 0.76);
      v.addColorStop(0,   'rgba(13,13,15,0)');
      v.addColorStop(0.58,'rgba(13,13,15,0.10)');
      v.addColorStop(1,   `rgba(13,13,15,${(0.72 + danger * 0.12).toFixed(2)})`);
      overlayCtx.fillStyle = v;
      overlayCtx.fillRect(0, 0, OW, OH);
    }

    if (run?.boss) {
      const list = (run as any).boss.list as any[];
      const hp   = list.reduce((s: number, e: any) => s + Math.max(0, e.hp), 0);
      const max  = list.reduce((s: number, e: any) => s + e.maxHp, 0);
      const bw   = Math.min(OW - 40 * dpr, 420 * dpr);
      const bx   = (OW - bw) / 2, bby = 14 * dpr;
      overlayCtx.fillStyle = '#0d0d0f';
      overlayCtx.fillRect(bx - 3 * dpr, bby - 3 * dpr, bw + 6 * dpr, 14 * dpr);
      overlayCtx.fillStyle = '#7a0f1c';
      overlayCtx.fillRect(bx, bby, bw, 8 * dpr);
      overlayCtx.fillStyle = '#d7263d';
      overlayCtx.fillRect(bx, bby, Math.round(bw * hp / max), 8 * dpr);
      overlayCtx.font = `${Math.round(14 * dpr)}px "Permanent Marker", cursive`;
      overlayCtx.textAlign = 'center';
      overlayCtx.strokeStyle = '#000'; overlayCtx.lineWidth = 4 * dpr;
      overlayCtx.strokeText((run as any).boss.name, OW / 2, bby + 28 * dpr);
      overlayCtx.fillStyle = '#e8e2d0';
      overlayCtx.fillText((run as any).boss.name, OW / 2, bby + 28 * dpr);
    }
    const bnr = (run as any)?.fx?.banner;
    if (bnr) {
      const k = bnr.life / bnr.max;
      overlayCtx.globalAlpha = Math.min(1, k * 5);
      const bh  = bnr.sub ? 58 * dpr : 40 * dpr;
      const bby2 = Math.round(OH * 0.24);
      overlayCtx.fillStyle = 'rgba(13,13,15,0.88)';
      overlayCtx.fillRect(0, bby2, OW, bh);
      overlayCtx.textAlign = 'center';
      overlayCtx.font = `${Math.round(22 * dpr)}px "Permanent Marker", cursive`;
      overlayCtx.fillStyle = '#0d0d0f';
      overlayCtx.fillText(bnr.title, OW / 2 + 2 * dpr, bby2 + 32 * dpr);
      overlayCtx.fillStyle = bnr.color ?? '#f2b705';
      overlayCtx.fillText(bnr.title, OW / 2, bby2 + 30 * dpr);
      if (bnr.sub) {
        overlayCtx.font = `${Math.round(9 * dpr)}px "Press Start 2P", monospace`;
        overlayCtx.fillStyle = '#e8e2d0';
        overlayCtx.fillText(bnr.sub, OW / 2, bby2 + 48 * dpr);
      }
      overlayCtx.globalAlpha = 1;
    }

    // Funzione helper: 3D world → pixel overlay
    function project3d(wx3: number, wy3: number, wz3: number) {
      const v = new THREE.Vector3(wx3, wy3, wz3).project(cam);
      return { x: (v.x + 1) / 2 * OW, y: (1 - v.y) / 2 * OH, behind: v.z > 1 };
    }

    // Barre HP per boss / elite / alleati danneggiati
    if (run) {
      const BAR_W = 44 * dpr, BAR_H = 5 * dpr;
      overlayCtx.lineWidth = 0;
      for (const e of run.enemies) {
        if (e.dead) continue;
        if (!e.boss && !(e as any).elite && e.hp >= e.maxHp) continue;
        const { x, y, behind } = project3d(wx(e.x), 0.6, wz(e.y));
        if (behind) continue;
        const ratio = Math.max(0, e.hp / e.maxHp);
        const col = e.boss ? '#d7263d' : '#ff7b1c';
        overlayCtx.fillStyle = '#200000';
        overlayCtx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W, BAR_H);
        overlayCtx.fillStyle = col;
        overlayCtx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W * ratio, BAR_H);
      }
      for (const a of run.allies) {
        if ((a as any).hp >= (a as any).maxHp) continue;
        const pos = allyPos(a);
        const { x, y, behind } = project3d(wx(pos.x), 0.4, wz(pos.y));
        if (behind) continue;
        const ratio = Math.max(0, (a as any).hp / (a as any).maxHp);
        overlayCtx.fillStyle = '#002000';
        overlayCtx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W, BAR_H);
        overlayCtx.fillStyle = ratio > 0.5 ? '#7bd332' : ratio > 0.25 ? '#f2b705' : '#d7263d';
        overlayCtx.fillRect(x - BAR_W / 2, y - BAR_H - 4 * dpr, BAR_W * ratio, BAR_H);
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
        overlayCtx.save();
        overlayCtx.translate(px2, py2);
        overlayCtx.rotate(a2);
        overlayCtx.scale(pulse, pulse);
        overlayCtx.fillStyle = '#d7263d';
        overlayCtx.beginPath();
        overlayCtx.moveTo(14 * dpr, 0);
        overlayCtx.lineTo(-8 * dpr, -7 * dpr);
        overlayCtx.lineTo(-8 * dpr, 7 * dpr);
        overlayCtx.closePath();
        overlayCtx.fill();
        overlayCtx.restore();
      }
    }

    // Titolo scenario (NUOVO SCENARIO + nome)
    if (sceneTitle) {
      sceneTitle.timer -= dt;
      if (sceneTitle.timer > 0) {
        const alpha2 = Math.min(1, sceneTitle.timer * 2.5);
        overlayCtx.globalAlpha = alpha2;
        overlayCtx.textAlign = 'center';
        overlayCtx.font = `${Math.round(9 * dpr)}px "Press Start 2P", monospace`;
        overlayCtx.fillStyle = '#e8e2d0';
        overlayCtx.fillText('NUOVO SCENARIO', OW / 2, OH * 0.72);
        overlayCtx.font = `${Math.round(22 * dpr)}px "Permanent Marker", cursive`;
        overlayCtx.fillStyle = '#000';
        overlayCtx.fillText(sceneTitle.name, OW / 2 + 2 * dpr, OH * 0.72 + 26 * dpr);
        overlayCtx.fillStyle = '#f2b705';
        overlayCtx.fillText(sceneTitle.name, OW / 2, OH * 0.72 + 24 * dpr);
        overlayCtx.globalAlpha = 1;
      } else {
        sceneTitle = null;
      }
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
