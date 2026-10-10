// Scenari: uno per reparto, cambia ogni 10 ondate (dopo il boss).
// Ogni scenario sta nel suo file in render/scenes/ ed esporta:
//   build(g, rnd, data)    disegna lo sfondo (una volta sola) con random a seed fisso
//   ambient(ctx, t, data)  facoltativo: animazione leggera a ogni frame (led, neon, fari)
// Per aggiungere uno scenario: crea il file, importalo qui e aggiungilo a SCENES.
import { AREA, MARGIN, SCENE_RES, seeded } from './scenes/common.js';
import { drawYard } from './scenes/yard.js';
import { placeItalian, animateItalian } from './scenes/italian.js';
import * as parking from './scenes/parking.js';
import * as archive from './scenes/archive.js';
import * as datacenter from './scenes/datacenter.js';
import * as mall from './scenes/mall.js';
import * as industrial from './scenes/industrial.js';
import * as rooftop from './scenes/rooftop.js';

export { MARGIN, AREA, SCENE_RES };

export const SCENES = [
  // italian = quanti nasoni romani e kebabbari aggiungere (scenes/italian.js)
  { name: 'Parcheggio aziendale', ...parking, italian: { nasoni: 5, kebab: 1 } },
  { name: "Archivio dell'Amministrazione", ...archive, italian: { nasoni: 3 } },
  { name: 'Data center', ...datacenter },
  { name: 'Centro commerciale', ...mall, italian: { nasoni: 3, kebab: 2 } },
  { name: 'Zona industriale', ...industrial, italian: { nasoni: 2, kebab: 1 } },
  { name: 'Tetto del grattacielo', ...rooftop },
];

export function sceneIndexForWave(wave) {
  return Math.floor((Math.max(1, wave) - 1) / 10) % SCENES.length;
}

// Costruisce lo sfondo di uno scenario: { canvas, ambient(ctx, time) }.
export function buildScene(index, opts?: { skipCars?: boolean }) {
  const scene = SCENES[index];
  const c = document.createElement('canvas');
  c.width = AREA.w * SCENE_RES;
  c.height = AREA.h * SCENE_RES;
  const g = c.getContext('2d');
  g.scale(SCENE_RES, SCENE_RES);
  g.translate(MARGIN, MARGIN); // si disegna in coordinate del mondo, con dettagli a mezzo pixel
  const rnd = seeded(101 + index * 7);
  const data = { leds: [], neons: [], lights: [] };
  const yardStyle = scene.build(g, rnd, data, opts) || {};
  if (scene.italian) placeItalian(g, rnd, data, scene.italian);
  drawYard(g, rnd, yardStyle);
  const ambient = (ctx, t) => {
    if (scene.ambient) scene.ambient(ctx, t, data);
    animateItalian(ctx, t, data);
  };
  return { canvas: c, name: scene.name, ambient, data };
}
