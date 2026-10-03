// Punto di partenza: carica tutto, collega i pulsanti e fa girare il game loop.
import { createRun } from './state.js';
import { loadMeta, saveMeta } from './save.js';
import { update, runReward } from './systems/game.js';
import { buyUpgrade } from './systems/economy.js';
import { useAbility } from './systems/abilities.js';
import { pickCard, reroll } from './systems/cards.js';
import { pickAlly } from './systems/allies.js';
import { META_UPGRADES, levelCost } from './data/upgrades.js';
import { ABILITIES } from './data/abilities.js';
import { loadAssets } from './render/assets.js';
import { createRenderer } from './render/world.js';
import { createHud } from './ui/hud.js';
import * as screens from './ui/screens.js';
import { getTop, submitScore, lastInitials } from './leaderboard.js';
import { initAudio, play, toggleMute, isMuted } from './audio.js';

const $ = id => document.getElementById(id);

const meta = loadMeta();
let run = null;
let paused = false;
let speed = 1;
let overHandled = false;

const assets = await loadAssets();
// I font servono già pronti per disegnare i graffiti sullo sfondo.
try {
  await Promise.all([document.fonts.load('16px "Permanent Marker"'), document.fonts.load('8px "Press Start 2P"')]);
} catch {
  // senza font si usa quello di riserva
}
const renderer = createRenderer($('cv'), assets);
const hud = createHud({
  onBuy: id => { if (run && buyUpgrade(run, meta, id)) play('buy'); },
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
  if (!run || run.phase === 'over' || run.phase === 'cards' || run.phase === 'ally') return;
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

function onAllyPhase() {
  screens.showAllies(run, i => {
    // dopo il rinforzo si passa subito alla scelta della carta
    if (pickAlly(run, meta, i)) onCardsPhase();
  });
}

function onGameOver() {
  overHandled = true;
  const reward = runReward(run);
  const isRecord = run.wave > meta.best;
  meta.buoni += reward;
  meta.best = Math.max(meta.best, run.wave);
  meta.runs++;
  saveMeta(meta);
  initials = lastInitials().split('');
  cursor = 0;
  // Un attimo di pausa per vedere la torre crollare, poi il riepilogo.
  setTimeout(() => {
    screens.showOver(run, reward, isRecord);
    screens.renderInitials(initials, cursor);
  }, 1200);
}

// ─── Iniziali e classifica ──────────────────────────────────────

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let initials = ['A', 'A', 'A'];
let cursor = 0;
let saving = false;

function stepLetter(i, delta) {
  const n = (LETTERS.indexOf(initials[i]) + delta + LETTERS.length) % LETTERS.length;
  initials[i] = LETTERS[n];
  cursor = i;
  screens.renderInitials(initials, cursor);
}

async function saveScore() {
  if (saving || !run) return;
  saving = true;
  $('btn-save-score').disabled = true;
  $('btn-save-score').textContent = 'INVIO...';
  const result = await submitScore({ initials: initials.join(''), wave: run.wave, kills: run.kills, bosses: run.bossesKilled });
  screens.showOverAfter(result, await getTop(10));
  saving = false;
}

document.querySelectorAll('#initials .slot').forEach((slot, i) => {
  slot.querySelector('.up').addEventListener('click', () => stepLetter(i, -1));
  slot.querySelector('.down').addEventListener('click', () => stepLetter(i, 1));
  slot.querySelector('.ch').addEventListener('click', () => { cursor = i; screens.renderInitials(initials, cursor); });
});
$('btn-save-score').addEventListener('click', saveScore);
$('btn-skip-score').addEventListener('click', async () => screens.showOverAfter(null, await getTop(10)));
$('btn-board').addEventListener('click', async () => screens.showBoard(await getTop(10)));
$('btn-board-back').addEventListener('click', () => screens.showMenu(meta));

// Tastiera sulla schermata delle iniziali: lettere, frecce, Backspace, Invio.
function initialsKey(e) {
  if ($('scr-over').hidden || $('initials-box').hidden) return false;
  const k = e.key;
  if (/^[a-zA-Z]$/.test(k)) {
    initials[cursor] = k.toUpperCase();
    cursor = Math.min(2, cursor + 1);
  } else if (k === 'Backspace' || k === 'ArrowLeft') cursor = Math.max(0, cursor - 1);
  else if (k === 'ArrowRight') cursor = Math.min(2, cursor + 1);
  else if (k === 'ArrowUp') stepLetter(cursor, -1);
  else if (k === 'ArrowDown') stepLetter(cursor, 1);
  else if (k === 'Enter') saveScore();
  else return false;
  e.preventDefault();
  screens.renderInitials(initials, cursor);
  return true;
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

// ─── Suoni ──────────────────────────────────────────────────────
// L'audio parte al primo clic o tasto (regola dei browser).
addEventListener('pointerdown', initAudio);
addEventListener('keydown', initAudio);
function refreshSoundButton() {
  $('btn-sound').textContent = isMuted() ? '🔇' : '🔊';
}
$('btn-sound').addEventListener('click', () => { toggleMute(); refreshSoundButton(); });
refreshSoundButton();

// ─── Schermo intero ─────────────────────────────────────────────
const canFullscreen = !!document.documentElement.requestFullscreen;
function toggleFullscreen() {
  if (!canFullscreen) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}
$('btn-full').hidden = !canFullscreen; // es. iPhone: non supportato dal browser
$('btn-full').addEventListener('click', toggleFullscreen);
// Sui telefoni si passa a schermo intero appena si preme GIOCA.
$('btn-play').addEventListener('click', () => {
  if (canFullscreen && !document.fullscreenElement && matchMedia('(pointer: coarse)').matches) toggleFullscreen();
});

document.addEventListener('keydown', e => {
  if (initialsKey(e)) return;
  if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
  if (e.key === 'm' || e.key === 'M') { toggleMute(); refreshSoundButton(); return; }
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
    // suoni ordinati dai sistemi in questo frame
    for (const s of run.fx.sounds) play(s);
    run.fx.sounds.length = 0;
    if (run.phase === 'ally' && $('scr-cards').hidden) onAllyPhase();
    if (run.phase === 'cards' && $('scr-cards').hidden) onCardsPhase();
    if (run.phase === 'over' && !overHandled) onGameOver();
  }
  renderer.draw(run);
  if (run) hud.update(run, speed);
  requestAnimationFrame(frame);
}

// Solo per i test: con ?debug nell'indirizzo la partita è raggiungibile da console (window.otd.run).
if (location.search.includes('debug')) window.otd = { get run() { return run; }, meta };

window.addEventListener('resize', renderer.resize);
renderer.resize();
toMenu();
requestAnimationFrame(frame);
