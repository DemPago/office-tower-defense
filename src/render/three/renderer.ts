// Renderer 3D alternativo al Canvas2D. Stessa firma pubblica di world.ts:
//   createThreeRenderer(canvas, assets) → { resize, draw, screenRect, screenToWorld }
//
// Camera isometrica ortografica: il mondo 2D (640×640 px) diventa XZ, l'altezza è Y.
// Il Canvas2D rimane il renderer di produzione; questo è il piano 3D parallelo.

import * as THREE from 'three';
import { TOWER, YARD, WORLD } from '../../state.js';
import { WALL } from '../../data/wall.js';
import type { Run } from '../../types.js';

// ─── Costanti mondo ──────────────────────────────────────────────────────────

// Converte coordinate 2D (pixel) in coordinate Three.js (metà per tenere la torre a y=0)
const S = 1 / 32; // 1 pixel mondo = 1/32 unità three (world 640px → ~20 unità)
const wx = (x: number) => (x - WORLD.w / 2) * S;
const wz = (y: number) => (y - WORLD.h / 2) * S; // asse Z = asse Y del mondo 2D
const TOWER_H = 1.2;   // altezza torre in unità three
const WALL_H  = 0.25;
const ENEMY_H = 0.6;
const ALLY_H  = 0.55;

// ─── Costruzione scena ───────────────────────────────────────────────────────

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d0f);
  scene.fog = new THREE.Fog(0x0d0d0f, 22, 38);

  // Luce ambientale + direzionale (dall'alto-sinistra, come la 2D)
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff8e7, 1.1);
  sun.position.set(-8, 14, -6);
  sun.castShadow = false; // per ora no shadow (costoso su dispositivi mobili)
  scene.add(sun);

  // Piano: asfalto grigio scuro
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.w * S, WORLD.h * S),
    new THREE.MeshLambertMaterial({ color: 0x1e1e24 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Griglia sottile sul piano, per leggibilità della distanza
  const grid = new THREE.GridHelper(WORLD.w * S, 20, 0x333344, 0x252530);
  grid.position.y = 0.002;
  scene.add(grid);

  // Cortile (YARD): piano leggermente più chiaro
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(YARD.w * S, YARD.h * S),
    new THREE.MeshLambertMaterial({ color: 0x28282e }),
  );
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(wx(YARD.x + YARD.w / 2), 0.001, wz(YARD.y + YARD.h / 2));
  scene.add(yard);

  return scene;
}

// ─── Torre ───────────────────────────────────────────────────────────────────

function makeTower(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(TOWER.radius * 2 * S, TOWER_H, TOWER.radius * 2 * S);
  const mat = new THREE.MeshLambertMaterial({ color: 0x8a7c6e });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(wx(TOWER.x), TOWER_H / 2, wz(TOWER.y));
  return mesh;
}

// ─── Pool generica per oggetti riusabili ─────────────────────────────────────

class MeshPool {
  private pool: THREE.Mesh[] = [];
  private active: THREE.Mesh[] = [];
  private scene: THREE.Scene;
  private factory: () => THREE.Mesh;

  constructor(scene: THREE.Scene, factory: () => THREE.Mesh) {
    this.scene = scene;
    this.factory = factory;
  }

  get(): THREE.Mesh {
    const m = this.pool.pop() ?? (() => { const n = this.factory(); this.scene.add(n); return n; })();
    m.visible = true;
    this.active.push(m);
    return m;
  }

  reset(): void {
    for (const m of this.active) { m.visible = false; this.pool.push(m); }
    this.active.length = 0;
  }
}

function enemyFactory(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.10, ENEMY_H, 6),
    new THREE.MeshLambertMaterial({ color: 0xd7263d }),
  );
}

function allyFactory(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, ALLY_H, 6),
    new THREE.MeshLambertMaterial({ color: 0x2de2e6 }),
  );
}

function shotFactory(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0xffe040 }),
  );
}

function wallSegFactory(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(WALL.segment * S, WALL_H, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xbfa574 }),
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function createThreeRenderer(canvas: HTMLCanvasElement, _assets: unknown) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = buildScene();
  const tower = makeTower();
  scene.add(tower);

  // Camera ortografica isometrica (angolo classico 30° + rotazione 45°)
  const frustum = 12; // unità visibili sul lato corto
  const cam = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0.1, 80);
  // Angolo isometrico: elevazione ~35.26°, rotazione 45°
  cam.position.set(12, 10, 12);
  cam.lookAt(0, 0, 0);

  const enemyPool = new MeshPool(scene, enemyFactory);
  const allyPool  = new MeshPool(scene, allyFactory);
  const shotPool  = new MeshPool(scene, shotFactory);
  const wallPool  = new MeshPool(scene, wallSegFactory);

  // Animazione shake della camera
  let shakeAmt = 0;

  function resize(): void {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    cam.left   = -frustum * aspect;
    cam.right  =  frustum * aspect;
    cam.top    =  frustum;
    cam.bottom = -frustum;
    cam.updateProjectionMatrix();
  }

  function draw(run: Run | null): void {
    // Shake della camera
    const shake = run?.fx?.shake ?? 0;
    shakeAmt += (shake * 0.003 - shakeAmt) * 0.4;
    cam.position.x = 12 + (Math.random() - 0.5) * shakeAmt;
    cam.position.z = 12 + (Math.random() - 0.5) * shakeAmt;
    cam.lookAt(0, 0, 0);

    // Colore torre: rosso quando ferita
    if (run) {
      const ratio = run.tower.hp / run.stats.maxHp;
      (tower.material as THREE.MeshLambertMaterial).color.setHSL(0.07 * ratio, 0.18, 0.4 + 0.2 * ratio);
    }

    // ── Nemici ──────────────────────────────────────────────────────────────
    enemyPool.reset();
    if (run) {
      for (const e of run.enemies) {
        if (e.dead) continue;
        const m = enemyPool.get();
        m.position.set(wx(e.x), ENEMY_H / 2, wz(e.y));
        // Colore per ruolo
        const col = e.boss ? 0xff3e8a : e.zombie ? 0x7bd332 : e.elite ? 0xff8c42 : 0xd7263d;
        (m.material as THREE.MeshLambertMaterial).color.setHex(col);
        // Pulsazione hitFlash
        const scale = 1 + (e.hitFlash ?? 0) * 0.4;
        m.scale.set(scale, 1, scale);
      }
    }

    // ── Alleati ─────────────────────────────────────────────────────────────
    allyPool.reset();
    if (run) {
      for (const a of run.allies) {
        const ax = TOWER.x + Math.cos(a.slot * Math.PI / 180) * 46;
        const ay = TOWER.y - Math.sin(a.slot * Math.PI / 180) * 46;
        const m = allyPool.get();
        m.position.set(wx(ax), ALLY_H / 2, wz(ay));
      }
    }

    // ── Colpi ───────────────────────────────────────────────────────────────
    shotPool.reset();
    if (run) {
      for (const s of run.shots ?? []) {
        const m = shotPool.get();
        m.position.set(wx(s.x), 0.3, wz(s.y));
      }
    }

    // ── Muro ────────────────────────────────────────────────────────────────
    wallPool.reset();
    if (run) {
      for (const seg of run.wall ?? []) {
        if (seg.hp <= 0) continue;
        const m = wallPool.get();
        const ratio = seg.hp / seg.maxHp;
        const horizontal = seg.side === 'top' || seg.side === 'bottom';
        const cx = horizontal ? (seg.a + seg.b) / 2 : seg.x;
        const cy = horizontal ? seg.y : (seg.a + seg.b) / 2;
        m.position.set(wx(cx), WALL_H / 2, wz(cy));
        if (!horizontal) {
          m.rotation.y = Math.PI / 2;
        } else {
          m.rotation.y = 0;
        }
        const segLen = (seg.b - seg.a) * S;
        m.scale.set(segLen / (WALL.segment * S), 1, 1);
        (m.material as THREE.MeshLambertMaterial).color.setHSL(0.1, 0.35, 0.3 + 0.4 * ratio);
      }
    }

    renderer.render(scene, cam);
  }

  // Stessa firma di world.ts per compatibilità
  function screenRect(name: string): { left: number; top: number; width: number; height: number } {
    const area = name === 'tower'
      ? { x: TOWER.x - 40, y: TOWER.y - 110, w: 80, h: 140 }
      : { x: YARD.x - 10, y: YARD.y - 14, w: YARD.w + 20, h: YARD.h + 26 };
    const c = canvas.getBoundingClientRect();
    // Approssimazione: usa la stessa proporzione della camera ortografica
    const k = c.width / (frustum * 2);
    return { left: c.left + wx(area.x) * k, top: c.top + wz(area.y) * k, width: area.w * S * k, height: area.h * S * k };
  }

  function screenToWorld(cx: number, cy: number): { x: number; y: number } {
    // Unproject dal piano Y=0 usando ray casting
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((cx - rect.left) / rect.width)  * 2 - 1;
    const ndcY = -((cy - rect.top)  / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, pt);
    return { x: pt.x / S + WORLD.w / 2, y: pt.z / S + WORLD.h / 2 };
  }

  // Prima chiamata a resize per inizializzare le dimensioni
  resize();

  return { resize, draw, screenRect, screenToWorld };
}
