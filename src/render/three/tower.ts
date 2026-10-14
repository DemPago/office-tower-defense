// Costruisce la torre 3D (palazzo protagonista).
import * as THREE from 'three';
import { TOWER } from '../../state.js';
import { S, wx, wz, TOWER_H } from './utils.js';

export interface TowerResult {
  group: THREE.Group;
  litWins: THREE.Mesh[];
  antLight: THREE.Mesh;
  signMat: THREE.MeshStandardMaterial;
  drawSign: (broken: boolean) => void;
}

export function buildTower(): TowerResult {
  const g = new THREE.Group();
  const W = TOWER.radius * 2 * S * 0.85;
  const H = TOWER_H;
  const FLOORS = 4;
  const floorH = H / FLOORS;
  const halfW = W / 2;

  // Corpo principale
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x9e8c7a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), bodyMat);
  body.position.y = H / 2; body.name = 'body'; g.add(body);

  // Cornici orizzontali tra i piani
  const bandMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5e });
  for (let f = 1; f < FLOORS; f++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.055, W + 0.06), bandMat);
    band.position.y = f * floorH;
    g.add(band);
  }

  // Finestre — pattern LDL/XLL/LBD/DLX su tutte le 4 facce
  const WIN_PATTERN = 'LDL' + 'XLL' + 'LBD' + 'DLX';
  const litWins: THREE.Mesh[] = [];
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xb0a090 });
  const darkMat  = new THREE.MeshLambertMaterial({ color: 0x1a2530 });
  const FACE_ROTS = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
  const colOffsets = [-W * 0.27, 0, W * 0.27];

  for (let fi = 0; fi < 4; fi++) {
    const fy = FACE_ROTS[fi];
    for (let row = 0; row < FLOORS; row++) {
      for (let ci = 0; ci < 3; ci++) {
        const kind = WIN_PATTERN[row * 3 + ci];
        const yPos  = floorH * 0.32 + row * floorH;
        const colOff = colOffsets[ci];
        const frame = new THREE.Mesh(new THREE.BoxGeometry(W * 0.22, floorH * 0.55, 0.015), frameMat);
        frame.rotation.y = fy;
        if (fi < 2) { frame.position.set(colOff, yPos, fi === 0 ? halfW + 0.005 : -(halfW + 0.005)); }
        else        { frame.position.set(fi === 2 ? halfW + 0.005 : -(halfW + 0.005), yPos, colOff); }
        g.add(frame);
        let winMesh: THREE.Mesh;
        if (kind === 'L') {
          const litMat = new THREE.MeshStandardMaterial({ color: 0x9aaa60, emissive: 0xaacc44, emissiveIntensity: 0.65, roughness: 0.9 });
          winMesh = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, floorH * 0.44, 0.018), litMat);
          winMesh.name = `win_L_${fi}_${row}_${ci}`;
          litWins.push(winMesh);
        } else {
          winMesh = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, floorH * 0.44, 0.018), darkMat);
        }
        winMesh.rotation.y = fy;
        winMesh.position.copy(frame.position);
        const nudge = 0.009;
        if (fi === 0) winMesh.position.z += nudge;
        else if (fi === 1) winMesh.position.z -= nudge;
        else if (fi === 2) winMesh.position.x += nudge;
        else winMesh.position.x -= nudge;
        g.add(winMesh);
      }
    }
  }

  // Insegna "UFFICIO" al neon (fronte) — canvas ridisegnata dopo caricamento font
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512; signCanvas.height = 96;
  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: new THREE.Color(0xff2a8a), emissiveIntensity: 0.8, roughness: 1 });
  function drawSign(broken: boolean) {
    const sc = signCanvas.getContext('2d')!;
    sc.fillStyle = '#06060a';
    sc.fillRect(0, 0, 512, 96);
    sc.font = 'bold 48px monospace';
    sc.textAlign = 'center';
    sc.textBaseline = 'middle';
    const letters = 'UFFICIO'.split('');
    letters.forEach((ch, i) => {
      sc.fillStyle = (broken && i === 4) ? '#4a1830' : '#ff2a8a';
      sc.shadowColor = '#ff2a8a';
      sc.shadowBlur = (broken && i === 4) ? 0 : 12;
      sc.fillText(ch, 36 + i * 64, 52);
    });
    sc.shadowBlur = 0;
    signTex.needsUpdate = true;
  }
  drawSign(false);
  document.fonts.ready.then(() => drawSign(false));
  const sign = new THREE.Mesh(new THREE.BoxGeometry(W * 0.80, floorH * 0.38, 0.03), signMat);
  sign.position.set(0, H - floorH * 0.28, halfW + 0.018);
  g.add(sign);

  // Ingresso: saracinesca + strisce pericolo
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x50545e });
  const door = new THREE.Mesh(new THREE.BoxGeometry(W * 0.32, floorH * 0.65, 0.02), doorMat);
  door.position.set(0, floorH * 0.32, halfW + 0.012);
  g.add(door);
  const hazMat = new THREE.MeshLambertMaterial({ color: 0xf2b705 });
  const haz = new THREE.Mesh(new THREE.BoxGeometry(W * 0.38, 0.055, 0.025), hazMat);
  haz.position.set(0, floorH * 0.65, halfW + 0.014);
  g.add(haz);

  // Tetto con aggetto
  const roofMesh = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.22, 0.14, W + 0.22),
    new THREE.MeshLambertMaterial({ color: 0x4a3e38 }),
  );
  roofMesh.position.set(0, H + 0.07, 0);
  g.add(roofMesh);

  // Parapetto tetto
  const parMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5e });
  const parH = 0.20, parT = 0.07, half = (W + 0.22) / 2;
  const parDefs: [number, number, number, number][] = [
    [0, half, W + 0.22, parT],
    [0, -half, W + 0.22, parT],
    [half, 0, parT, W + 0.22],
    [-half, 0, parT, W + 0.22],
  ];
  for (const [px, pz, pw, pd] of parDefs) {
    const par = new THREE.Mesh(new THREE.BoxGeometry(pw, parH, pd), parMat);
    par.position.set(px, H + 0.14 + parH / 2, pz);
    g.add(par);
  }

  // Antenna + luce rossa lampeggiante
  const antMat = new THREE.MeshLambertMaterial({ color: 0x555560 });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6), antMat);
  ant.position.set(W * 0.28, H + 0.14 + parH + 0.28, W * 0.28);
  g.add(ant);
  const antLightMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 1.0 });
  const antLight = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), antLightMat);
  antLight.position.set(W * 0.28, H + 0.14 + parH + 0.58, W * 0.28);
  antLight.name = 'antLight';
  g.add(antLight);

  g.position.set(wx(TOWER.x), 0, wz(TOWER.y));
  return { group: g, litWins, antLight, signMat, drawSign };
}
