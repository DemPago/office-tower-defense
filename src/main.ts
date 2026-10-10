// Punto di partenza: carica tutto, collega i pezzi e fa girare il game loop.
//   app/flow.js      schermate (menu, negozio, partita, carte, rinforzi, fine partita)
//   app/initials.js  iniziali stile cabinato e invio del punteggio
//   app/controls.js  pulsanti in alto e tastiera
// Tutti condividono l'oggetto `app` qui sotto, che contiene lo stato dell'applicazione.
import { loadMeta, saveMeta } from './save.js';
import { update } from './systems/game.js';
import { buyUpgrade } from './systems/economy.js';
import { useAbility } from './systems/abilities.js';
import { sellCard } from './systems/cards.js';
import { loadAssets } from './render/assets.js';
import { createRenderer } from './render/world.js';
import { createHud } from './ui/hud.js';
import { play } from './audio.js';
import { createFlow } from './app/flow.js';
import { createInitials } from './app/initials.js';
import { setupControls } from './app/controls.js';
import { createTutorial } from './ui/tutorial.js';
import { playIntro } from './render/intro.js';

const $ = id => document.getElementById(id);

const app = {
  meta: loadMeta(),   // progressi permanenti (salvati nel browser)
  run: null,          // la partita in corso (null = siamo nel menu)
  paused: false,
  speed: 1,           // x1 / x2 / x3
  overHandled: false, // la schermata di fine partita è già stata preparata
  assets: await loadAssets(),
};

// I font servono già pronti per disegnare i graffiti sullo sfondo.
try {
  await Promise.all([document.fonts.load('16px "Permanent Marker"'), document.fonts.load('8px "Press Start 2P"')]);
} catch {
  // senza font si usa quello di riserva
}

// Modalità grafica: legge da localStorage, poi da URL param (legacy).
const stored = localStorage.getItem('otd_mode');
const use3d = stored ? stored === '3d' : location.search.includes('3d');

// Toggle 2D/3D nel menu
const rt2d = $('rt-2d') as HTMLButtonElement;
const rt3d = $('rt-3d') as HTMLButtonElement;
function updateRendererToggle() {
  rt2d.classList.toggle('active', !use3d);
  rt3d.classList.toggle('active', use3d);
}
updateRendererToggle();
rt2d.addEventListener('click', () => { localStorage.setItem('otd_mode', '2d'); location.replace(location.pathname); });
rt3d.addEventListener('click', () => { localStorage.setItem('otd_mode', '3d'); location.replace(location.pathname); });

const badge = document.createElement('div');
badge.style.cssText = 'position:fixed;top:4px;right:4px;font-size:10px;padding:2px 6px;z-index:9999;border-radius:3px;pointer-events:none';
document.body.appendChild(badge);

let renderer;
if (use3d) {
  badge.style.background = '#f2b705'; badge.style.color = '#000'; badge.textContent = '3D';
  try {
    const mod = await import('./render/three/renderer.js');
    renderer = mod.createThreeRenderer($('cv') as HTMLCanvasElement, app.assets);
    badge.style.background = '#2de2e6';
  } catch (err) {
    badge.style.background = '#d7263d'; badge.style.color = '#fff';
    badge.textContent = 'ERR: ' + (err as Error).message;
    throw err;
  }
} else {
  badge.remove();
  renderer = createRenderer($('cv'), app.assets);
}
const hud = createHud({
  onBuy: id => { if (app.run && buyUpgrade(app.run, app.meta, id)) play('buy'); },
  onAbility: id => app.run && !app.paused && useAbility(app.run, id),
  onSell: i => {
    if (!app.run) return;
    const result = sellCard(app.run, app.meta, i);
    if (result) play('buy');
  },
});
app.tutorial = createTutorial({
  onPause: () => { app.paused = true; },
  onResume: () => { app.paused = false; },
  onDone: () => { app.meta.tutorialDone = true; saveMeta(app.meta); },
});
app.showTutorial = () => setTimeout(() => app.tutorial.start(renderer.screenRect), 150);
app.initials = createInitials(app);
app.flow = createFlow(app);
setupControls(app, $('cv'), renderer);

// ─── Game loop ──────────────────────────────────────────────────

let last = performance.now();
function frame(now) {
  // dt = secondi passati dall'ultimo frame, limitato per evitare salti enormi.
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const { run } = app;
  if (run && !app.paused) {
    // A velocità x2/x3 si fanno più passi piccoli invece di uno grande.
    for (let i = 0; i < app.speed; i++) update(run, dt);
    // nuovo personaggio sbloccato: si salva subito
    if (run.newHero) { run.newHero = null; saveMeta(app.meta); }
    // suoni ordinati dai sistemi in questo frame
    for (const s of run.fx.sounds) play(s);
    run.fx.sounds.length = 0;
    if (run.phase === 'ally' && $('scr-cards').hidden) app.flow.onAllyPhase();
    if (run.phase === 'cards' && $('scr-cards').hidden) app.flow.onCardsPhase();
    if (run.phase === 'bomb-placement' && $('scr-bombs').hidden) app.flow.onBombPhase();
    if (run.phase === 'over' && !app.overHandled) app.flow.onGameOver();
  }
  renderer.draw(run);
  if (run) hud.update(run, app.speed);
  requestAnimationFrame(frame);
}

// Solo per i test: con ?debug nell'indirizzo la partita è raggiungibile da console (window.otd.run).
if (location.search.includes('debug')) window.otd = { get run() { return app.run; }, meta: app.meta };

window.addEventListener('resize', renderer.resize);
renderer.resize();
if (use3d) {
  // L'intro usa canvas 2D: lo eseguiamo su un canvas overlay temporaneo
  // sovrapposto al canvas WebGL, poi lo rimuoviamo.
  requestAnimationFrame(frame); // avvia subito il loop 3D in background
  const introOverlay = document.createElement('canvas');
  introOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;pointer-events:all;';
  introOverlay.width = window.innerWidth;
  introOverlay.height = window.innerHeight;
  document.body.appendChild(introOverlay);
  playIntro(introOverlay, () => {
    introOverlay.remove();
    app.flow.toMenu();
  });
} else {
  playIntro($('cv'), () => {
    renderer.resize();
    app.flow.toMenu();
    requestAnimationFrame(frame);
  });
}
