// Flusso delle schermate: menu (con scelta del personaggio), negozio, partita,
// pausa, carte, rinforzi e fine partita.
import { createRun, TOWER } from '../state.js';
import { allyHp } from '../data/allies.js';
import { banner, floatText } from '../systems/fx.js';
import { saveMeta } from '../save.js';
import { runReward } from '../systems/game.js';
import { pickCard, reroll, playCard, sellCard } from '../systems/cards.js';
import { pickAlly } from '../systems/allies.js';
import { META_UPGRADES, levelCost } from '../data/upgrades.js';
import { removeBomb, resetBombsLeft } from '../systems/bombs.js';
import * as screens from '../ui/screens.js';
import { getTop } from '../leaderboard.js';
import { play } from '../audio.js';
import { renderShare } from '../ui/share.js';
import { BADGES } from '../data/badges.js';
import { shareBadge } from '../ui/badge-share.js';
import { startMenuAnimation } from '../ui/menu-anim.js';

const $ = (id: string): HTMLElement | null => document.getElementById(id);

export function createFlow(app: any) {
  const { meta, assets } = app;

  // Personaggi con illustrazione Gemini disponibile
  const ILLUSTRATED = new Set(['peppe','dem','nando','tony','vanessa','clara','pesce','frank','cirios']);

  // Disegna il fallback pixel art con outline e sfondo drammatico
  function drawPixelPortrait(c: HTMLCanvasElement, id: string, locked: boolean, frame = 1) {
    const sp = assets.person(id, frame, 1, locked ? '#141416' : false);
    const sw = sp.img.width, sh = sp.img.height;
    const srcOff = document.createElement('canvas');
    srcOff.width = sw; srcOff.height = sh;
    const srcG = srcOff.getContext('2d')!;
    srcG.drawImage(sp.img, 0, 0);
    const src = srcG.getImageData(0, 0, sw, sh).data;
    const outOff = document.createElement('canvas');
    outOff.width = sw; outOff.height = sh;
    const outG = outOff.getContext('2d')!;
    const outImg = outG.createImageData(sw, sh);
    const out = outImg.data;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        if (src[i + 3] > 10) continue;
        outer: for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= sw || ny < 0 || ny >= sh) continue;
            if (src[(ny * sw + nx) * 4 + 3] > 10) { out[i]=20; out[i+1]=20; out[i+2]=20; out[i+3]=255; break outer; }
          }
        }
      }
    }
    outG.putImageData(outImg, 0, 0);
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    const cx = c.width / 2;
    const bg = g.createRadialGradient(cx, c.height*0.22, 0, cx, c.height*0.5, c.width*0.78);
    if (locked) { bg.addColorStop(0,'#1a1a22'); bg.addColorStop(1,'#090910'); }
    else         { bg.addColorStop(0,'#221428'); bg.addColorStop(0.5,'#110a1a'); bg.addColorStop(1,'#060408'); }
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(outOff, 0, 0, sw, sh, 0, 0, c.width, c.height);
    g.drawImage(sp.img, 0, 0, sw, sh, 0, 0, c.width, c.height);
  }

  // Ritaglia un'immagine landscape in modo da riempire il canvas portrait (crop centro-basso)
  function drawIllustration(g: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    const dstRatio = cw / ch;
    const srcRatio = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (srcRatio > dstRatio) {
      // sorgente più larga: ritaglia i lati, prendi il centro
      sw = img.height * dstRatio;
      sx = (img.width - sw) / 2;
    } else {
      // sorgente più alta: ritaglia dall'alto, tieni il basso (il personaggio)
      sh = img.width / dstRatio;
      sy = img.height - sh;
    }
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  // Ritratto per i card della griglia (portrait 2×) o per il preview (landscape)
  function heroPortrait(id: string, locked: boolean, forPreview = false): HTMLElement {
    if (!locked && ILLUSTRATED.has(id)) {
      // <img> nativo: nessuna perdita di qualità, il browser scala correttamente
      const img = document.createElement('img');
      img.src = `${import.meta.env.BASE_URL}heroes/${id}.jpg`;
      img.alt = id;
      img.classList.add('hero-illustrated');
      if (forPreview) img.classList.add('hero-illustrated-preview');
      return img;
    }

    // Pixel art: canvas con animazione idle walk a ~5fps
    const cw = forPreview ? 320 : 80;
    const ch = forPreview ? 240 : 136;
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    let frame = 0;
    const WALK = [1, 0, 1, 2];
    let lastT = 0;
    drawPixelPortrait(c, id, locked, WALK[0]);
    const tick = (t: number) => {
      if (!c.isConnected) return;
      if (t - lastT > 200) {
        frame = (frame + 1) % WALK.length;
        drawPixelPortrait(c, id, locked, WALK[frame]);
        lastT = t;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return c;
  }

  // Piccolo sprite di Rob da affiancare al preview di Clara
  function robMiniSprite(): HTMLCanvasElement {
    const sp = assets.person('rob', 1, 1, false);
    const sw = sp.img.width, sh = sp.img.height;
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    // Sfondo coordinato
    g.fillStyle = '#0a0810';
    g.fillRect(0, 0, sw, sh);
    g.drawImage(sp.img, 0, 0);
    c.classList.add('rob-mini');
    // Animazione idle per Rob
    let frame = 0;
    const WALK = [1, 0, 1, 2];
    let lastT = 0;
    const tick = (t: number) => {
      if (!c.isConnected) return;
      if (t - lastT > 220) {
        frame = (frame + 1) % WALK.length;
        const sp2 = assets.person('rob', WALK[frame], 1, false);
        g.clearRect(0, 0, sw, sh);
        g.fillStyle = '#0a0810'; g.fillRect(0, 0, sw, sh);
        g.drawImage(sp2.img, 0, 0);
        lastT = t;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return c;
  }

  let menuAnim: { stop: () => void } | null = null;

  function showMenu() {
    screens.showMenu(meta, heroPortrait, robMiniSprite, id => {
      meta.hero = id;
      saveMeta(meta);
      play('pick');
      showMenu();
    });
    if (!menuAnim) menuAnim = startMenuAnimation($('menu-bg') as HTMLCanvasElement);
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
    if (app.run.hero === 'clara') {
      app.run.allies.push({ uid: Math.random(), id: 'rob', level: 1, slot: 0, cooldown: 0, recoil: 0, spawn: 1, hp: allyHp(1), maxHp: allyHp(1), x: 0, y: 0, hitFlash: 0, dead: false });
    }
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

  function setPaused(p: boolean) {
    const { run } = app;
    if (!run || run.phase === 'over' || run.phase === 'cards' || run.phase === 'ally') return;
    app.paused = p;
    if (p) {
      // mostra "Arrenditi" solo tra un'ondata e l'altra (break o bonus-break)
      const inBreak = run.phase === 'break' || run.phase === 'bonus-break';
      $('btn-surrender')!.hidden = !inBreak;
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
    screens.showShop(meta, (id: string) => {
      const def = META_UPGRADES.find(d => d.id === id);
      if (!def) return;
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
    // Effetti per eroe
    if (run.hero === 'tony') {
      banner(run, 'com\'è?', 'dice Tony', '#f2b705');
    }
    if (run.hero === 'cirios') {
      banner(run, '🔵⚪ NAPOLI! ⚪🔵', 'urla Ciro', '#007FBF');
    }
    if (run.hero === 'nando') {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const d = 40 + Math.random() * 90;
        floatText(run, TOWER.x + Math.cos(a) * d, TOWER.y - 30 + Math.sin(a) * d * 0.4, '💰', '#f2b705', 11 + Math.floor(Math.random() * 5));
      }
    }
    screens.showCards(run,
      i => {
        const result = pickCard(run, meta, i);
        if (result === true) screens.hideAll();
        else if (result === 'discard') onCardsPhase();
      },
      () => { if (reroll(run)) onCardsPhase(); });
    screens.updateHandPlayable(run,
      i => { if (playCard(run, meta, i)) onCardsPhase(); },
      i => { if (sellCard(run, meta, i)) onCardsPhase(); });
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
    // Persiste i badge romani guadagnati in questa run
    if (run.newBadge && !(meta.badges ?? []).includes(run.newBadge)) {
      meta.badges = [...(meta.badges ?? []), run.newBadge];
    }
    saveMeta(meta);
    app.initials.reset();
    // Un attimo di pausa per vedere la torre crollare, poi il riepilogo.
    setTimeout(() => {
      screens.showOver(run, reward, isRecord);
      app.initials.render();
    }, 1200);
  }

  // Condivisione: dal menu un invito generico, a fine partita il proprio risultato.
  renderShare($('share-menu')!, () => 'Difendi la tua scrivania dalla gerarchia aziendale! 🏢 Prova Office Tower Defense');
  renderShare($('share-over')!, () => app.run
    ? `Sono stato licenziato all'ondata ${app.run.wave} di Office Tower Defense 🏢💥 Riesci a fare meglio?`
    : 'Prova Office Tower Defense 🏢');

  $('btn-bombs-ok')!.addEventListener('click', () => {
    const { run } = app;
    if (!run || run.phase !== 'bomb-placement') return;
    run.bombsDone = true;
    run.phase = 'break';
    run.breakTimer = 1.5;
    screens.hideAll();
  });
  $('btn-bombs-remove')!.addEventListener('click', () => {
    const { run } = app;
    if (!run || run.phase !== 'bomb-placement' || !run.bombs.length) return;
    removeBomb(run, run.bombs.length - 1);
    screens.updateBombUI(run);
  });

  $('btn-badge-share')!.addEventListener('click', () => {
    const { run } = app;
    if (!run?.newBadge) return;
    const badge = BADGES.find(b => b.id === run.newBadge);
    if (badge) shareBadge(badge, run.hero ?? 'peppe', run.wave);
  });

  $('btn-play')!.addEventListener('click', newRun);
  $('btn-howto')!.addEventListener('click', () => { app.wantTutorial = true; newRun(); });
  $('btn-shop')!.addEventListener('click', openShop);
  $('btn-shop-back')!.addEventListener('click', showMenu);
  $('btn-board')!.addEventListener('click', async () => screens.showBoard(await getTop(10)));
  $('btn-board-back')!.addEventListener('click', showMenu);
  $('btn-resume')!.addEventListener('click', () => setPaused(false));
  $('btn-surrender')!.addEventListener('click', surrender);
  $('btn-quit')!.addEventListener('click', toMenu);
  $('btn-retry')!.addEventListener('click', newRun);
  $('btn-over-menu')!.addEventListener('click', toMenu);

  return { toMenu, setPaused, onCardsPhase, onAllyPhase, onGameOver, onBombPhase };
}
