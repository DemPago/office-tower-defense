// Scena 3D base + ambienti per dipartimento.
import * as THREE from 'three';
import { TOWER, YARD, WORLD } from '../../state.js';
import { S, wx, wz, modelCache } from './utils.js';

export function buildScene() {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x18140c);
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

  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x28200c });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  sc.add(ground);

  const grid = new THREE.GridHelper(WORLD.w * S, 20, 0x4a3c28, 0x302418);
  grid.position.y = 0.003; sc.add(grid);

  const yardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(YARD.w * S + 0.2, YARD.h * S + 0.2),
    new THREE.MeshLambertMaterial({ color: 0x1e1c2e }),
  );
  yardMesh.rotation.x = -Math.PI / 2;
  yardMesh.position.set(wx(YARD.x + YARD.w / 2), 0.002, wz(YARD.y + YARD.h / 2));
  sc.add(yardMesh);

  return sc;
}

// ─── Helpers interni ──────────────────────────────────────────────────────────

function colorCarModel(model: THREE.Group, bodyHex: number): void {
  model.traverse(child => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const result: THREE.Material[] = [];
    for (const mat of mats) {
      const m = mat as THREE.MeshStandardMaterial;
      if (m.color && (m.color.r + m.color.g + m.color.b) > 1.6) {
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

// ─── Ambienti per dipartimento ────────────────────────────────────────────────

export function buildParkingEnv(g: THREE.Group) {
  const CAR_MODELS = ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury', 'van', 'taxi'];
  const CAR_COLORS = [0xb02030, 0x2f4f6f, 0xc0c4cc, 0x3e6b2a, 0x141416, 0xd9c040, 0x8a3b1e, 0x4a8a9a, 0xe8641b];
  const winMat = new THREE.MeshLambertMaterial({ color: 0x1c2430 });
  const useModels = modelCache.has('sedan');
  let ci = 0;
  for (let ry = 8; ry < WORLD.h - 30; ry += 76) {
    for (let sx = 12; sx < WORLD.w - 20; sx += 44) {
      const cx = sx + 11, cy = ry + 14;
      if (nearTower(cx, cy, 40)) continue;
      if (useModels) {
        const name = CAR_MODELS[ci % CAR_MODELS.length];
        const tmpl = modelCache.get(name)!;
        const car = tmpl.clone();
        car.scale.setScalar(0.25);
        car.position.set(wx(cx), 0, wz(cy));
        car.rotation.y = (ry / 76 % 2 === 0) ? 0 : Math.PI;
        colorCarModel(car, CAR_COLORS[ci % CAR_COLORS.length]);
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
  const SIGNAL_CORNERS = [
    [TOWER.x - 155, TOWER.y - 155], [TOWER.x + 155, TOWER.y - 155],
    [TOWER.x - 155, TOWER.y + 155], [TOWER.x + 155, TOWER.y + 155],
  ] as [number, number][];
  const tlTemplate = modelCache.get('traffic-light');
  for (const [cx, cy] of SIGNAL_CORNERS) {
    if (tlTemplate) {
      const tl = tlTemplate.clone();
      tl.scale.setScalar(0.35);
      tl.position.set(wx(cx), 0, wz(cy));
      tl.rotation.y = Math.atan2(TOWER.x - cx, TOWER.y - cy);
      g.add(tl);
    } else {
      const matPole = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.9, 6), matPole);
      pole.position.set(wx(cx), 0.45, wz(cy));
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.06), new THREE.MeshLambertMaterial({ color: 0x222228 }));
      box.position.y = 0.11;
      pole.add(box);
      for (const [i, col] of [[0, 0xff3030], [1, 0xffaa00], [2, 0x30d060]] as [number, number][]) {
        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 4), new THREE.MeshBasicMaterial({ color: col }));
        lens.position.set(0, 0.09 - i * 0.07, 0.04);
        box.add(lens);
      }
      g.add(pole);
    }
  }
  const barrTemplate = modelCache.get('construction-barrier');
  if (barrTemplate) {
    for (let i = 0; i < 12; i++) {
      const bx = 80 + (i * 173) % (WORLD.w - 160);
      const by = 80 + (i * 113 + 40) % (WORLD.h - 160);
      if (nearTower(bx, by, 55)) continue;
      const barr = barrTemplate.clone();
      barr.scale.setScalar(0.30);
      barr.position.set(wx(bx), 0, wz(by));
      barr.rotation.y = (i * 0.7) % (Math.PI * 2);
      g.add(barr);
    }
  }

  // Veicoli pesanti parcheggiati ai bordi
  const HEAVY_MODELS = ['truck', 'delivery', 'firetruck', 'garbage-truck'] as const;
  const HEAVY_COLORS = [0xe8e2d0, 0xd9c040, 0xb02030, 0x2f4f6f, 0x3a3c42, 0xcc6430];
  const HEAVY_POSITIONS: [number, number, number][] = [
    [TOWER.x - 200, TOWER.y - 180, 0],
    [TOWER.x + 160, TOWER.y - 200, Math.PI],
    [TOWER.x - 210, TOWER.y + 150, Math.PI * 0.5],
    [TOWER.x + 190, TOWER.y + 170, Math.PI * 1.5],
    [TOWER.x - 180, TOWER.y + 50,  0],
    [TOWER.x + 210, TOWER.y - 60,  Math.PI],
  ];
  HEAVY_POSITIONS.forEach(([hx, hy, ry], i) => {
    if (nearTower(hx, hy, 70)) return;
    const name = HEAVY_MODELS[i % HEAVY_MODELS.length];
    const tmpl = modelCache.get(name);
    if (tmpl) {
      const m = tmpl.clone();
      m.scale.setScalar(0.28);
      m.position.set(wx(hx), 0, wz(hy));
      m.rotation.y = ry;
      colorCarModel(m, HEAVY_COLORS[i % HEAVY_COLORS.length]);
      g.add(m);
    } else {
      const mat = new THREE.MeshLambertMaterial({ color: HEAVY_COLORS[i % HEAVY_COLORS.length] });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.30, 1.20), mat);
      body.position.set(wx(hx), 0.15, wz(hy));
      body.rotation.y = ry;
      g.add(body);
    }
  });
}

export function buildArchiveEnv(g: THREE.Group) {
  const mat      = new THREE.MeshLambertMaterial({ color: 0x606858 });
  const matTop   = new THREE.MeshLambertMaterial({ color: 0x3a4038 });
  const matPaper = new THREE.MeshLambertMaterial({ color: 0xd8d2be });
  const matBox   = new THREE.MeshLambertMaterial({ color: 0xb09060 });
  const matBoxLid= new THREE.MeshLambertMaterial({ color: 0x8a6e42 });

  // Schedari — file ordinate con altezze variabili e pile di carta sopra
  let ci = 0;
  for (let ry = 30; ry < WORLD.h - 30; ry += 80) {
    for (let sx = 10; sx < WORLD.w - 20; sx += 60) {
      const cx = sx + 16, cy = ry + 26;
      if (nearTower(cx, cy)) continue;
      // Colonna di 1-3 schedari sovrapposti
      const stack = 1 + (ci % 3 === 0 ? 1 : 0);
      let yBase = 0;
      for (let s = 0; s < stack; s++) {
        const h = (ci % 5 === 0) ? 0.95 : 0.70;
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.50, h, 0.38), mat);
        cab.position.set(wx(cx), yBase + h / 2, wz(cy));
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.40), matTop);
        lid.position.y = h / 2 + 0.02;
        cab.add(lid);
        g.add(cab);
        yBase += h + 0.04;
      }
      // Pile di carta/scatole sopra ogni schedaio
      if (ci % 4 !== 0) {
        const paperH = 0.06 + (ci % 3) * 0.04;
        const paper = new THREE.Mesh(new THREE.BoxGeometry(0.44, paperH, 0.30), matPaper);
        paper.position.set(wx(cx), yBase + paperH / 2, wz(cy));
        g.add(paper);
      }
      ci++;
    }
  }

  // Scatoloni sparsi — pratiche archiviate
  for (let i = 0; i < 30; i++) {
    const bx = 40 + (i * 137) % (WORLD.w - 80);
    const by = 40 + (i * 97 + 30) % (WORLD.h - 80);
    if (nearTower(bx, by, 50)) continue;
    const bw = 0.30 + (i % 3) * 0.08, bh = 0.28, bd = 0.22 + (i % 2) * 0.06;
    const box = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), matBox);
    box.position.set(wx(bx), bh / 2, wz(by));
    box.rotation.y = (i * 0.9) % (Math.PI * 2);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.02, 0.04, bd + 0.02), matBoxLid);
    lid.position.y = bh / 2 + 0.02;
    box.add(lid);
    g.add(box);
    // A volte impilati
    if (i % 4 === 0 && !nearTower(bx, by, 55)) {
      const box2 = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.9, bh * 0.9, bd * 0.9), matBox);
      box2.position.set(wx(bx), bh + bh * 0.45, wz(by));
      box2.rotation.y = (i * 0.5);
      g.add(box2);
    }
  }

  // Carrelli portadocumenti
  const matCart = new THREE.MeshLambertMaterial({ color: 0x9a9070 });
  const matCartBar = new THREE.MeshLambertMaterial({ color: 0x666a60 });
  for (let i = 0; i < 14; i++) {
    const cx = 50 + (i * 113) % (WORLD.w - 100);
    const cy = 50 + (i * 89 + 40) % (WORLD.h - 100);
    if (nearTower(cx, cy, 50)) continue;
    const cart = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.50, 0.25), matCart);
    cart.position.set(wx(cx), 0.25, wz(cy));
    cart.rotation.y = (i * 1.1) % (Math.PI * 2);
    // Ripiani
    for (let sh = 0; sh < 2; sh++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.25), matCartBar);
      shelf.position.y = -0.12 + sh * 0.24;
      cart.add(shelf);
    }
    g.add(cart);
  }

  // Barriere di sicurezza archivio (construction-barrier)
  const barrTemplate = modelCache.get('construction-barrier');
  if (barrTemplate) {
    const BARR_POS: [number, number][] = [
      [TOWER.x - 160, TOWER.y - 160], [TOWER.x + 160, TOWER.y - 160],
      [TOWER.x - 160, TOWER.y + 160], [TOWER.x + 160, TOWER.y + 160],
      [TOWER.x - 200, TOWER.y], [TOWER.x + 200, TOWER.y],
    ];
    BARR_POS.forEach(([bx, by], i) => {
      if (nearTower(bx, by, 60)) return;
      const barr = barrTemplate.clone();
      barr.scale.setScalar(0.28);
      barr.position.set(wx(bx), 0, wz(by));
      barr.rotation.y = (i * Math.PI / 3);
      g.add(barr);
    });
  }

  // Lampade da soffitto (su palo basso, archivio sotterraneo)
  const matLamp = new THREE.MeshLambertMaterial({ color: 0x888880 });
  const matDiff = new THREE.MeshBasicMaterial({ color: 0xfff8d8 });
  for (let cx = 100; cx < WORLD.w - 60; cx += 120) {
    for (let cy = 100; cy < WORLD.h - 60; cy += 120) {
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
}

export function buildDatacenterEnv(g: THREE.Group) {
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
  for (let cx = 90; cx < WORLD.w; cx += 130) {
    for (let cy = 90; cy < WORLD.h; cy += 130) {
      if (nearTower(cx, cy, 52)) continue;
      placeLampione(g, cx, cy, 1.55, 0x2a2a34, 0xb0e0ff);
    }
  }
  const matCable = new THREE.MeshLambertMaterial({ color: 0x1a1c22 });
  for (let i = 0; i < 8; i++) {
    const isH = i % 2 === 0;
    const pos = 80 + i * 70;
    const cable = new THREE.Mesh(
      isH ? new THREE.BoxGeometry(WORLD.w * S * 0.6, 0.05, 0.08)
          : new THREE.BoxGeometry(0.08, 0.05, WORLD.h * S * 0.6),
      matCable,
    );
    cable.position.set(isH ? 0 : wx(pos), 0.025, isH ? wz(pos) : 0);
    if (!nearTower(isH ? TOWER.x : pos, isH ? pos : TOWER.y, 35)) g.add(cable);
  }
}

export function buildMallEnv(g: THREE.Group) {
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
  for (let cx = 100; cx < WORLD.w; cx += 130) {
    for (let cy = 100; cy < WORLD.h; cy += 130) {
      if (nearTower(cx, cy, 52)) continue;
      placeLampione(g, cx, cy, 1.10, 0xc8a030, 0xfff4c0);
    }
  }
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

export function buildIndustrialEnv(g: THREE.Group) {
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
  for (let cx = 95; cx < WORLD.w; cx += 140) {
    for (let cy = 95; cy < WORLD.h; cy += 140) {
      if (nearTower(cx, cy, 52)) continue;
      placeLampione(g, cx, cy, 1.70, 0x3a3a40, 0xffcc44);
    }
  }
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

export function buildRooftopEnv(g: THREE.Group) {
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
  for (let cx = 110; cx < WORLD.w; cx += 150) {
    for (let cy = 110; cy < WORLD.h; cy += 150) {
      if (nearTower(cx, cy, 55)) continue;
      placeLampione(g, cx, cy, 0.90, 0x8f8a80, 0xffeebb);
    }
  }
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
