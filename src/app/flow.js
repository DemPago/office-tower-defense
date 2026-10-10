// Flusso delle schermate: menu (con scelta del personaggio), negozio, partita,
// pausa, carte, rinforzi e fine partita.
import { createRun } from '../state.js';
import { saveMeta } from '../save.js';
import { runReward } from '../systems/game.js';
import { pickCard, reroll } from '../systems/cards.js';
import { pickAlly } from '../systems/allies.js';
import { META_UPGRADES, levelCost } from '../data/upgrades.js';
import { removeBomb, resetBombsLeft } from '../systems/bombs.js';
import * as screens from '../ui/screens.js';
import { getTop } from '../leaderboard.js';
import { play } from '../audio.js';
import { renderShare } from '../ui/share.js';
import { startMenuAnimation } from '../ui/menu-anim.js';

const $ = id => document.getElementById(id);

export function createFlow(app) {
  const { meta, assets } = app;

  // Ritratto del personaggio (testa e busto) per il menu; i bloccati sono solo una sagoma.
  function heroPortrait(id, locked) {
    const sp = assets.person(id, 1, 1, locked ? '#141416' : false);
    const c = document.createElement('canvas');
    c.width = 84;
    c.height = 84;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sp.img, 0, 8, sp.img.width, 42, 0, 0, sp.img.width * 2, 84);
    return c;
  }

  let menuAnim = null;

  function showMenu() {
    screens.showMenu(meta, heroPortrait, id => {
      meta.hero = id;
      saveMeta(meta);
      play('pick');
      showMenu();
    });
    if (!menuAnim) menuAnim = startMenuAnimation($('menu-bg'));
  }

  function onBombPhase() {
    const { run } = app;
    if (!run || run.phase !== 'bomb-placement') return;
    resetBombsLeft(run);
    screens.showBombs(run);
  }

  function newRun() {
    if (menuAnim) { menuAnim.stop(); menuAnim = null; }
    app.run = createRun(meta);
    app.paused = false;
    app.overHandled = false;
    screens.hideAll();
    document.body.classList.add('playing');
    // prima partita (o richiesto dal menu): parte il tutorial
    if (!meta.tutorialDone || app.wantTutorial) {
      app.wantTutorial = false;
      app.showTutorial();
    } else {
      onBombPhase(); // piazza bombe prima della prima ondata
    }
  }

  function toMenu() {
    app.run = null;
    document.body.classList.remove('playing');
    showMenu();
  }

  function setPaused(p) {
    const { run } = app;
    if (!run || run.phase === 'over' || run.phase === 'cards' || run.phase === 'ally') return;
    app.paused = p;
    if (p) {
      // mostra "Arrenditi" solo tra un'ondata e l'altra (break o bonus-break)
      const inBreak = run.phase === 'break' || run.phase === 'bonus-break';
      $('btn-surrender').hidden = !inBreak;
      screens.show('scr-pause');
    } else screens.hideAll();
  }

  function surrender() {
    const { run } = app;
    if (!run || run.phase === 'over') return;
    screens.hideAll();
    run.phase = 'over';
    run.tower.hp = 0;
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
    const { run } = app;
    screens.showCards(run,
      i => {
        const result = pickCard(run, meta, i);
        if (result === true) {
          screens.hideAll();
          if (run.phase === 'bomb-placement') onBombPhase();
        } else if (result === 'discard') onCardsPhase(); // ri-mostra in modalità scarto
      },
      () => { if (reroll(run)) onCardsPhase(); });
  }

  function onAllyPhase() {
    const { run } = app;
    screens.showAllies(run, i => {
      // dopo il rinforzo si passa subito alla scelta della carta
      if (pickAlly(run, meta, i)) onCardsPhase();
    });
  }

  function onGameOver() {
    const { run } = app;
    app.overHandled = true;
    const reward = runReward(run);
    const isRecord = run.wave > meta.best;
    meta.buoni += reward;
    meta.best = Math.max(meta.best, run.wave);
    meta.runs++;
    saveMeta(meta);
    app.initials.reset();
    // Un attimo di pausa per vedere la torre crollare, poi il riepilogo.
    setTimeout(() => {
      screens.showOver(run, reward, isRecord);
      app.initials.render();
    }, 1200);
  }

  // Condivisione: dal menu un invito generico, a fine partita il proprio risultato.
  renderShare($('share-menu'), () => 'Difendi la tua scrivania dalla gerarchia aziendale! 🏢 Prova Office Tower Defense');
  renderShare($('share-over'), () => app.run
    ? `Sono stato licenziato all'ondata ${app.run.wave} di Office Tower Defense 🏢💥 Riesci a fare meglio?`
    : 'Prova Office Tower Defense 🏢');

  $('btn-bombs-ok').addEventListener('click', () => {
    const { run } = app;
    if (!run || run.phase !== 'bomb-placement') return;
    run.phase = 'break';
    run.breakTimer = 1.5;
    screens.hideAll();
  });
  $('btn-bombs-remove').addEventListener('click', () => {
    const { run } = app;
    if (!run || run.phase !== 'bomb-placement' || !run.bombs.length) return;
    removeBomb(run, run.bombs.length - 1);
    screens.updateBombUI(run);
  });

  $('btn-play').addEventListener('click', newRun);
  $('btn-howto').addEventListener('click', () => { app.wantTutorial = true; newRun(); });
  $('btn-shop').addEventListener('click', openShop);
  $('btn-shop-back').addEventListener('click', showMenu);
  $('btn-board').addEventListener('click', async () => screens.showBoard(await getTop(10)));
  $('btn-board-back').addEventListener('click', showMenu);
  $('btn-resume').addEventListener('click', () => setPaused(false));
  $('btn-surrender').addEventListener('click', surrender);
  $('btn-quit').addEventListener('click', toMenu);
  $('btn-retry').addEventListener('click', newRun);
  $('btn-over-menu').addEventListener('click', toMenu);

  return { toMenu, setPaused, onCardsPhase, onAllyPhase, onGameOver, onBombPhase };
}
