// Flusso delle schermate: menu (con scelta del personaggio), negozio, partita,
// pausa, carte, rinforzi e fine partita.
import { createRun } from '../state.js';
import { saveMeta } from '../save.js';
import { runReward } from '../systems/game.js';
import { pickCard, reroll } from '../systems/cards.js';
import { pickAlly } from '../systems/allies.js';
import { META_UPGRADES, levelCost } from '../data/upgrades.js';
import * as screens from '../ui/screens.js';
import { getTop } from '../leaderboard.js';
import { play } from '../audio.js';

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

  function showMenu() {
    screens.showMenu(meta, heroPortrait, id => {
      meta.hero = id;
      saveMeta(meta);
      play('pick');
      showMenu();
    });
  }

  function newRun() {
    app.run = createRun(meta);
    app.paused = false;
    app.overHandled = false;
    screens.hideAll();
    document.body.classList.add('playing');
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
    if (p) screens.show('scr-pause');
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
    const { run } = app;
    screens.showCards(run,
      i => { if (pickCard(run, meta, i)) screens.hideAll(); },
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

  $('btn-play').addEventListener('click', newRun);
  $('btn-shop').addEventListener('click', openShop);
  $('btn-shop-back').addEventListener('click', showMenu);
  $('btn-board').addEventListener('click', async () => screens.showBoard(await getTop(10)));
  $('btn-board-back').addEventListener('click', showMenu);
  $('btn-resume').addEventListener('click', () => setPaused(false));
  $('btn-quit').addEventListener('click', toMenu);
  $('btn-retry').addEventListener('click', newRun);
  $('btn-over-menu').addEventListener('click', toMenu);

  return { toMenu, setPaused, onCardsPhase, onAllyPhase, onGameOver };
}
