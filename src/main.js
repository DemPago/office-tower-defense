// Punto di partenza: carica tutto, collega i pulsanti e fa girare il game loop.
import { createRun } from './state.js';
import { loadMeta, saveMeta } from './save.js';
import { update, runReward } from './systems/game.js';
import { buyUpgrade } from './systems/economy.js';
import { useAbility } from './systems/abilities.js';
import { pickCard, reroll } from './systems/cards.js';
import { META_UPGRADES, levelCost } from './data/upgrades.js';
import { ABILITIES } from './data/abilities.js';
import { loadAssets } from './render/assets.js';
import { createRenderer } from './render/world.js';
import { createHud } from './ui/hud.js';
import * as screens from './ui/screens.js';

const $ = id => document.getElementById(id);

const meta = loadMeta();
let run = null;
let paused = false;
let speed = 1;
let overHandled = false;

const assets = await loadAssets();
const renderer = createRenderer($('cv'), assets);
const hud = createHud({
  onBuy: id => run && buyUpgrade(run, meta, id),
  onAbility: id => run && !paused && useAbility(run, id),
});

// ─── Flusso delle schermate ─────────────────────────────────────

function newRun() {
  run = createRun(meta);
  paused = false;
  overHandled = false;
  screens.hideAll();
  document.body.classList.add('playing');
}

function toMenu() {
  run = null;
  document.body.classList.remove('playing');
  screens.showMenu(meta);
}

function setPaused(p) {
  if (!run || run.phase === 'over' || run.phase === 'cards') return;
  paused = p;
  if (paused) screens.show('scr-pause');
  else screens.hideAll();
}

function openShop() {
  screens.showShop(meta, id => {
    const def = META_UPGRADES.find(d => d.id === id);
    const L = meta.levels[id] || 0;
    const cost = levelCost(def, L);
    if (L >= def.max || meta.buoni < cost) return;
    meta.buoni -= cost;
    meta.levels[id] = L + 1;
    saveMeta(meta);
    openShop();
  });
}

function onCardsPhase() {
  screens.showCards(run,
    i => { if (pickCard(run, meta, i)) screens.hideAll(); },
    () => { if (reroll(run)) onCardsPhase(); });
}

function onGameOver() {
  overHandled = true;
  const reward = runReward(run);
  const isRecord = run.wave > meta.best;
  meta.buoni += reward;
  meta.best = Math.max(meta.best, run.wave);
  meta.runs++;
  saveMeta(meta);
  // Un attimo di pausa per vedere la torre crollare, poi il riepilogo.
  setTimeout(() => screens.showOver(run, reward, isRecord), 1200);
}

$('btn-play').addEventListener('click', newRun);
$('btn-shop').addEventListener('click', openShop);
$('btn-shop-back').addEventListener('click', () => screens.showMenu(meta));
$('btn-resume').addEventListener('click', () => setPaused(false));
$('btn-quit').addEventListener('click', toMenu);
$('btn-retry').addEventListener('click', newRun);
$('btn-over-menu').addEventListener('click', toMenu);
$('btn-pause').addEventListener('click', () => setPaused(!paused));
$('btn-speed').addEventListener('click', () => { speed = speed === 3 ? 1 : speed + 1; });

document.addEventListener('keydown', e => {
  if (!run) return;
  if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); setPaused(!paused); return; }
  const ab = ABILITIES.find(a => a.key === e.key);
  if (ab && !paused) useAbility(run, ab.id);
});
// Se cambi scheda del browser, il gioco si mette in pausa da solo.
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

// ─── Game loop ──────────────────────────────────────────────────

let last = performance.now();
function frame(now) {
  // dt = secondi passati dall'ultimo frame, limitato per evitare salti enormi.
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (run && !paused) {
    // A velocità x2/x3 si fanno più passi piccoli invece di uno grande.
    for (let i = 0; i < speed; i++) update(run, dt);
    if (run.phase === 'cards' && $('scr-cards').hidden) onCardsPhase();
    if (run.phase === 'over' && !overHandled) onGameOver();
  }
  renderer.draw(run);
  if (run) hud.update(run, speed);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', renderer.resize);
renderer.resize();
toMenu();
requestAnimationFrame(frame);
