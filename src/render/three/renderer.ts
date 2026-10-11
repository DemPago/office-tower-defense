// Renderer 3D completo con Three.js.
// Stessa firma pubblica di world.ts: createThreeRenderer(canvas, assets) → { resize, draw, screenRect, screenToWorld }
//
// Attivato con ?3d nell'URL.
// Suddiviso in:
//   utils.ts   — costanti, cache texture, pool, helper
//   tower.ts   — buildTower()
//   envs.ts    — buildScene() + buildXxxEnv() per ogni dipartimento

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TOWER, YARD, WORLD } from '../../state.js';
import { allyPos } from '../../systems/allies.js';
import { ALLY_SLOTS, allyArc } from '../../data/allies.js';
import { isZombieWave } from '../../data/enemies.js';
import { SCENES, sceneIndexForWave, buildScene as build2DScene } from '../scenery.js';
import type { Run } from '../../types.js';
import {
  modelCache, Assets,
  S, wx, wz, TOWER_H, WALL_H, SHOT_R,
  DEPT_PALETTE, ZOMBIE_PALETTE,
  cacheTex, textTex, applySprite,
  SpritePool, MeshPool,
  zStage, hexToRgba,
} from './utils.js';
import { buildTower } from './tower.js';
import {
  buildScene,
  buildParkingEnv, buildArchiveEnv, buildDatacenterEnv,
  buildMallEnv, buildIndustrialEnv, buildRooftopEnv,
} from './envs.js';
import { drawOverlay3d, type SceneTitle } from './overlay3d.js';

export function createThreeRenderer(canvas: HTMLCanvasElement, _assets: unknown) {
  const assets = _assets as Assets;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene   = buildScene();
  const { group: towerG, litWins: towerLitWins, antLight: towerAntLight, signMat: towerSignMat, drawSign: drawTowerSign } = buildTower();
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
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1c, emissive: 0x000000, roughness: 0.6, metalness: 0.3 }),
  ));
  const BOMB_RADIUS_3D = 70 * S;
  const bombRingPool = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.RingGeometry(BOMB_RADIUS_3D - 0.04, BOMB_RADIUS_3D + 0.04, 48),
    new THREE.MeshBasicMaterial({ color: 0xff6400, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  ));
  const wallPool  = new MeshPool(scene, () => new THREE.Mesh(new THREE.BoxGeometry(1, WALL_H, 0.08), new THREE.MeshLambertMaterial({ color: 0xbfa574 })));
  const beamPool = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1, 4),
    new THREE.MeshBasicMaterial({ color: 0xff2a3d, transparent: true }),
  ));
  const wavePool = new MeshPool(scene, () => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 1.0, 48),
      new THREE.MeshBasicMaterial({ color: 0xe8e2d0, side: THREE.DoubleSide, transparent: true }),
    );
    m.rotation.x = -Math.PI / 2; return m;
  });

  // Sfondo scenario (canvas 2D come texture sul terreno)
  const SCENE_W = (WORLD.w + 480) * S;
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
      const built = build2DScene(deptIdx, deptIdx === 0 ? { skipCars: true } : undefined);
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

  // Prop 3D dipartimento (lazy, cached per dept)
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
  }
  applyEnvDept(0);

  // Settori alleati + cerchio gittata (canvas texture sul terreno)
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

  // Overlay HTML: banner + barra boss
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10';
  canvas.parentElement?.appendChild(overlayCanvas);
  const overlayCtx = overlayCanvas.getContext('2d')!;

  interface Smoke3d { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; r: number; }
  const smoke3d: Smoke3d[] = [];

  interface Trail3d { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; size: number; grow: number; }
  const trails3d: Trail3d[] = [];
  const smokePool = new MeshPool(scene, () => new THREE.Mesh(
    new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshLambertMaterial({ color: 0x554433, transparent: true, depthWrite: false }),
  ));

  let lastT = performance.now() / 1000;
  let shakeAmt = 0;
  const forceDept = parseInt(new URLSearchParams(location.search).get('dept') ?? '-1');
  let lastDept = -1;
  let zombieK = 0;
  let sceneTitle: SceneTitle | null = null;

  const dust3d = Array.from({ length: 35 }, () => ({
    x: (Math.random() - 0.5) * 22, y: 0.15 + Math.random() * 3.0,
    z: (Math.random() - 0.5) * 22, vx: 0.04 + Math.random() * 0.06,
    vy: (Math.random() - 0.5) * 0.015, vz: (Math.random() - 0.5) * 0.03,
  }));
  const dustSpritePool = new SpritePool(scene);

  // Caricamento modelli GLTF (asincrono)
  {
    const loader = new GLTFLoader();
    const BASE = (import.meta as any).env?.BASE_URL ?? '/office-tower-defense/';
    const MODELS = ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury',
                    'van', 'taxi', 'light-curved', 'construction-cone',
                    'construction-barrier', 'traffic-light'];
    Promise.all(MODELS.map(name => new Promise<void>(ok => {
      loader.load(`${BASE}models/${name}.glb`,
        gltf => { modelCache.set(name, gltf.scene); ok(); },
        undefined, () => ok(),
      );
    }))).then(() => {
      modelsLoaded = true;
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

  function getSpr(e: any, frame: number) {
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

    // Atmosfera per reparto
    const wave  = run?.wave ?? 1;
    const dept  = forceDept >= 0 ? forceDept % DEPT_PALETTE.length : Math.floor((Math.max(1, wave) - 1) / 10) % DEPT_PALETTE.length;
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
        .lerpColors(new THREE.Color(pal.fog), new THREE.Color(0x28200c), 0.40);
    }

    // Camera: orbita lenta nel menu, shake durante il gioco
    if (!run) {
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

    // Torre: colore dai danni + animazioni neon/finestre
    if (run) {
      const ratio = run.tower.hp / run.stats.maxHp;
      (towerBody.material as THREE.MeshLambertMaterial).color
        .setHSL(ratio * 0.07, 0.22, 0.30 + ratio * 0.28);
    }
    for (const win of towerLitWins) {
      const mat = win.material as THREE.MeshStandardMaterial;
      const flick = Math.sin(now * 9 + win.position.x * 11 + win.position.y * 7) > 0.92;
      mat.emissiveIntensity = flick ? 0.15 : 0.65;
    }
    const signBroken = Math.sin(now * 17) > 0.2 || Math.sin(now * 1.3) > 0.7;
    const signBrokenPrev = Math.sin((now - 0.016) * 17) > 0.2 || Math.sin((now - 0.016) * 1.3) > 0.7;
    if (signBroken !== signBrokenPrev) drawTowerSign(signBroken);
    towerSignMat.emissiveIntensity = run?.phase === 'over' ? 0.05 : signBroken ? 0.15 : 0.8;
    (towerAntLight.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(now * 4) > 0 ? 1.0 : 0.08;

    // Hero sul tetto
    heroSp.visible = !!run;
    if (run) {
      try {
        const hSpr = assets.person((run as any).hero ?? 'peppe', frame);
        applySprite(heroSp, hSpr, TOWER.x, TOWER.y, TOWER_H);
      } catch { heroSp.visible = false; }
    }

    // Ombre a terra
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

    // Cadaveri
    corpsePool.reset();
    if (run) for (const c of (run as any).fx?.corpses ?? []) {
      try {
        const cSpr = c.animal ? assets.animal(c.animal, 0, c.scale ?? 1, false)
          : assets.person(c.look, 0, c.scale ?? 1, false);
        const sp = corpsePool.get();
        const mat = sp.material as THREE.SpriteMaterial;
        const t = cacheTex(cSpr.img);
        if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; }
        const h = wz(cSpr.h) * 0.7, w = wz(cSpr.w) * 0.7;
        sp.scale.set(w, h, 1);
        sp.position.set(wx(c.x), 0.05, wz(c.y));
        mat.opacity = Math.min(1, c.life / (c.max * 0.5));
        mat.color.setHex(0xaaaaaa);
        mat.needsUpdate = true;
      } catch { /* */ }
    }

    // Trails dei boss (gestiti localmente)
    if (run) {
      for (const e of run.enemies as any[]) {
        if (!e.boss || !e.trail || Math.random() > dt * 18) continue;
        const s = e.size;
        if (e.trail === 'smoke') trails3d.push({ x: e.x + s * 0.18, y: e.y - s * 0.7, vx: 4, vy: -14, life: 1.6, max: 1.6, c: '#8a8d93', size: 1.5, grow: 2 });
      }
    }
    for (const p of trails3d) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.size += p.grow * dt; }
    trails3d.splice(0, trails3d.length, ...trails3d.filter(p => p.life > 0));
    trailPool.reset();
    for (const t of trails3d) {
      const m = trailPool.get();
      m.position.set(wx(t.x), 0.15 + t.life * 0.2, wz(t.y));
      try { (m.material as THREE.MeshLambertMaterial).color.set(t.c); } catch { /* */ }
      (m.material as THREE.MeshLambertMaterial).opacity = Math.min(0.5, t.life / t.max * 0.6);
      (m.material as THREE.MeshLambertMaterial).transparent = true;
      m.scale.setScalar((0.05 + t.size * S) * (0.5 + (t.max - t.life) / t.max));
    }

    // Nemici
    actorPool.reset();
    if (run) {
      for (const e of run.enemies) {
        if (e.dead) continue;
        const s = getSpr(e, frame); if (!s) continue;
        const tint = e.boss ? 0xff9999 : (e as any).elite ? 0xffcc77 : 0xffffff;
        applySprite(actorPool.get(), s, e.x, e.y, 0, tint);
      }
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

    // Polvere ambientale
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

    // Colpi torre (testa + trail direzionale)
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
      const dxT = s.x - TOWER.x, dyT = s.y - TOWER.y;
      const distFromTower = Math.sqrt(dxT * dxT + dyT * dyT);
      let shotH = TOWER_H;
      if (s.target && !s.target.dead) {
        const dtx = s.target.x - TOWER.x, dty = s.target.y - TOWER.y;
        const totalDist = Math.sqrt(dtx * dtx + dty * dty);
        const prog = totalDist > 1 ? Math.min(1, distFromTower / totalDist) : 1;
        shotH = TOWER_H * (1 - prog) + 0.38 * prog;
      }
      const head = shotPool.get();
      head.position.set(sx, shotH, sz);
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
        tr.position.set((ox2 + sx) / 2, shotH, (oz2 + sz) / 2);
        tr.scale.set(1, ll, 1);
        tr.rotation.set(Math.PI / 2, Math.atan2(lx, lz), 0);
        (tr.material as THREE.MeshBasicMaterial).color.setHex(0xff2a3d);
        (tr.material as THREE.MeshBasicMaterial).opacity = 0.55;
      } else {
        const tlen = kind === 'bolt' ? 0.30 : kind === 'xbow' ? 0.38 : 0.22;
        tr.position.set(sx - ddx * tlen / 2, shotH, sz - ddz * tlen / 2);
        tr.scale.set(1, tlen, 1);
        tr.rotation.set(Math.PI / 2, Math.atan2(ddx, ddz), 0);
        const trailColor = kind === 'bolt' ? 0x7bd332 : kind === 'energy' ? 0x8040cc
          : kind === 'heart' ? 0xff3e8a : 0xf2b705;
        (tr.material as THREE.MeshBasicMaterial).color.setHex(trailColor);
        (tr.material as THREE.MeshBasicMaterial).opacity = 0.55;
      }
    }

    // Colpi nemici
    eshotPool.reset();
    if (run) for (const s of (run as any).enemyShots ?? []) {
      const m = eshotPool.get();
      m.position.set(wx(s.x), 0.35, wz(s.y));
    }

    // Particelle
    partPool.reset();
    if (run) for (const p of (run as any).fx?.parts ?? []) {
      if (p.life <= 0) continue;
      const m = partPool.get();
      m.position.set(wx(p.x), Math.max(0.05, p.life * 0.6), wz(p.y));
      try { (m.material as THREE.MeshLambertMaterial).color.set(p.color); } catch { /* */ }
      const sc = 0.4 + (p.life / (p.max ?? 0.5)) * 0.9;
      m.scale.setScalar(sc);
    }

    // Rings
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

    // Floating text
    textPool.reset();
    if (run) for (const t of (run as any).fx?.texts ?? []) {
      if (t.life <= 0) continue;
      const sp = textPool.get();
      const mat = sp.material as THREE.SpriteMaterial;
      const tt = textTex(t.text, t.color ?? '#fff', t.size ?? 8);
      if (mat.map !== tt) { mat.map = tt; mat.needsUpdate = true; }
      const ratio = t.life / t.max;
      const worldY3d = 0.5 + (1 - ratio) * 2.0;
      sp.scale.set(1.0, 0.38, 1);
      sp.position.set(wx(t.x), worldY3d, wz(t.y));
      mat.opacity = Math.min(1, ratio * 3);
      mat.color.setHex(0xffffff);
    }

    // Muro
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

    // Bombe
    bombPool.reset();
    bombRingPool.reset();
    if (run) for (const b of (run as any).bombs ?? []) {
      if (b.detonated) continue;
      const m = bombPool.get();
      m.position.set(wx(b.x), 0.18, wz(b.y));
      const pulse = 1 + Math.sin(now * 12 + b.x) * 0.15;
      m.scale.setScalar(pulse);
      (m.material as THREE.MeshStandardMaterial).emissive.setHex(
        Math.sin(now * 12 + b.x) > 0.3 ? 0xffe040 : 0x000000
      );
      if (run.phase === 'bomb-placement') {
        const ring = bombRingPool.get();
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(wx(b.x), 0.02, wz(b.y));
      }
    }

    // Flash boss
    const flash = (run as any)?.fx?.flash ?? 0;
    if (flash > 0) {
      const bg = new THREE.Color(0x0d0d0f).lerp(new THREE.Color(0xffffff), Math.min(1, flash * 1.5));
      scene.background = bg;
    }

    // Fumo dalla torre
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

    // Settori alleati + cerchio gittata
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

    // Beams (raggi laser istantanei)
    beamPool.reset();
    if (run) for (const b of (run as any).fx?.beams ?? []) {
      if (b.life <= 0) continue;
      const m  = beamPool.get();
      const x1 = wx(b.x1), z1 = wz(b.y1), x2 = wx(b.x2), z2 = wz(b.y2);
      const ddx = x2 - x1, ddz = z2 - z1;
      const len = Math.sqrt(ddx * ddx + ddz * ddz);
      if (len < 0.001) { m.visible = false; continue; }
      const beamY = b.kind === 'sniper' ? TOWER_H * 0.84 : 0.3;
      m.position.set((x1 + x2) / 2, beamY, (z1 + z2) / 2);
      m.scale.set(1, len, 1);
      m.rotation.set(Math.PI / 2, Math.atan2(ddx, ddz), 0);
      const bmat = m.material as THREE.MeshBasicMaterial;
      bmat.opacity = Math.min(1, b.life / 0.07 + 0.3);
      bmat.color.setHex(b.kind === 'sniper' ? 0xffffff : b.crit ? 0xff7b1c : 0xff2a3d);
      bmat.needsUpdate = true;
    }

    // Onde d'urto
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

    // Overlay HTML
    const OW = overlayCanvas.width, OH = overlayCanvas.height;
    const dpr = OW / (canvas.clientWidth || 1);
    sceneTitle = drawOverlay3d(overlayCtx, OW, OH, dpr, run, cam, now, dt, zombieK, sceneTitle);

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
