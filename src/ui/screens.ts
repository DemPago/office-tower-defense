// Schermate sopra al gioco: menu, ufficio del personale (negozio permanente),
// scelta delle carte, pausa e fine partita.
import { RARITY, cardPower, findCard } from '../data/cards.js';
import { META_UPGRADES, levelCost } from '../data/upgrades.js';
import { ALLY_LEVELS, allyArc } from '../data/allies.js';
import { HEROES, UNLOCK_WAVE, unlockedHeroes, heroStatsText, heroDef } from '../data/heroes.js';
import { BADGES } from '../data/badges.js';
import { drawBadgeCanvas } from './badge-share.js';
import type { HeroDef } from '../data/heroes.js';
import { bombMult, nextQuadro, canPlaceBomb, bombsForQuadro, bombCost } from '../systems/bombs.js';
import { weaponDef } from '../data/weapons.js';
import { slotName } from '../systems/allies.js';
import { fmt } from '../util.js';
import { domAdvice } from './dom.js';
import type { Run, Meta } from '../types.js';

interface BoardRow {
  id?: string;
  ts?: number;
  initials: string;
  wave: number;
  kills: number;
  difficulty?: import('../data/difficulty.js').DifficultyId;
}

interface BoardData {
  rows: BoardRow[];
  source?: string;
}

interface ScoreResult {
  rank?: number;
  id?: string;
  ts?: number;
}

const $ = (id: string) => document.getElementById(id);
const SCREENS = ['scr-menu', 'scr-shop', 'scr-cards', 'scr-pause', 'scr-over', 'scr-board', 'scr-bombs'];

export function show(id: string | null) {
  for (const s of SCREENS) $(s)!.hidden = s !== id;
}

export function hideAll() {
  show(null);
}

// Popola #hero-info con nome, arma e statistiche del personaggio selezionato.
function updateHeroPreview(h: HeroDef, _portrait: (id: string, locked: boolean, forPreview?: boolean) => HTMLElement, robSprite: () => HTMLCanvasElement, locked: boolean) {
  const box = $('hero-info');
  if (!box) return;
  if (locked) {
    box.innerHTML = `<p class="preview-locked">🔒 Unlocked by completing all levels (wave ${UNLOCK_WAVE})</p>`;
    return;
  }
  const w = weaponDef(h.weapon);
  const stats = (h.stats || {}) as Record<string, number>;
  const pills = Object.entries(stats).map(([k, v]) => {
    const n = k === 'manaMax' ? `${v > 0 ? '+' : ''}${v}` : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const label = { dmg:'dmg', rate:'fire rate', hp:'HP', regen:'regen',
                    range:'range', manaRegen:'mana', crit:'crit',
                    armor:'armor', gold:'gold', manaMax:'mana+' }[k] || k;
    return `<span class="stat-pill ${v > 0 ? 'pos' : 'neg'}">${n} ${label}</span>`;
  }).join('');

  box.innerHTML = `
    <p class="preview-name">${h.name}</p>
    <p class="preview-weapon">${w.icon} <b>${w.name}</b> <span>— ${h.desc}</span></p>
    <div class="preview-pills">${pills}</div>`;
  // Clara: aggiunge badge Rob inline
  if (h.id === 'clara') {
    const robWrap = document.createElement('div');
    robWrap.className = 'rob-wrap';
    const robCv = robSprite();
    robWrap.appendChild(robCv);
    const robLabel = document.createElement('span');
    robLabel.className = 'rob-label';
    robLabel.textContent = 'with Rob';
    robWrap.appendChild(robLabel);
    box.appendChild(robWrap);
  }
}

// portrait(id, locked) restituisce un canvas col ritratto; onHero(id) quando ne scegli uno.
export function showMenu(meta: Meta, portrait: (id: string, locked: boolean, forPreview?: boolean) => HTMLElement, robSprite: () => HTMLCanvasElement, onHero: (id: string) => void) {
  $('menu-best')!.textContent = meta.best ? `Best: wave ${meta.best}` : 'No games yet';
  $('menu-buoni')!.textContent = `🎫 ${fmt(meta.buoni)} buoni pasto`;
  const have = unlockedHeroes(meta);
  const current = meta.hero && have.includes(meta.hero) ? meta.hero : 'peppe';
  const list = $('hero-list');
  if (!list) return;
  list.innerHTML = '';
  for (const h of HEROES) {
    const locked = !have.includes(h.id);
    const btn = document.createElement('button');
    btn.className = 'hero' + (h.id === current ? ' sel' : '') + (locked ? ' locked' : '');
    btn.appendChild(portrait(h.id, locked));
    const name = document.createElement('span');
    name.textContent = locked ? '🔒' : `${weaponDef(h.weapon).icon} ${h.name}`;
    btn.appendChild(name);
    btn.addEventListener('pointerenter', () => updateHeroPreview(h, portrait, robSprite, locked));
    btn.addEventListener('click', () => { if (!locked) onHero(h.id); else updateHeroPreview(h, portrait, robSprite, locked); });
    list.appendChild(btn);
  }
  const sel = HEROES.find((h: HeroDef) => h.id === current)!;
  updateHeroPreview(sel, portrait, robSprite, false);
  show('scr-menu');
}


export function updateBombUI(run: Run) {
  const q = nextQuadro(run);
  const mult = bombMult(run);
  const cost = bombCost(run);
  const left = run.bombsLeft ?? bombsForQuadro(run);
  const total = bombsForQuadro(run);
  $('bomb-quadro-label')!.textContent = `ROUND ${q}`;
  $('bomb-mult-label')!.textContent = `💣 ×${mult}`;
  $('bomb-penalty-val')!.textContent = `💰 ${cost} oro a bomba`;
  $('bomb-count-val')!.textContent = `${total - left} / ${total}`;
  const can = canPlaceBomb(run);
  const minesNote = (run.minesNext ?? 0) > 0 ? ` · next ${run.minesNext} → 💥 MINE` : '';
  document.querySelector('.bombs-hint')!.textContent = (can
    ? `${left} bomb${left === 1 ? '' : 's'} remaining — click on the map`
    : left === 0 ? 'No bombs left for this round' : `Not enough gold (need ${cost} 💰)`) + minesNote;
}

// Sezione "carte giocabili" nella schermata carte: carte usabili dalla mano.
export function updateHandPlayable(run: Run, onPlay: (i: number) => void, onSell: (i: number) => void) {
  const box = $('hand-playable');
  if (!box) return;
  const list = $('hand-play-list');
  if (!list || run.discarding || run.isHeavyMalus) { box.hidden = true; return; }
  const playable = run.cardPicks
    .map((pick, i) => ({ pick, i, def: findCard(pick.id) }))
    .filter(({ def }) => def && def.type === 'use');
  if (!playable.length) { box.hidden = true; return; }
  box.hidden = false;
  list.innerHTML = '';
  for (const { pick, i, def } of playable) {
    if (!def) continue;
    const row = document.createElement('div');
    row.className = 'hc-playable';
    row.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.name}<br><small>${def.desc(pick.m)}</small></span>`;
    const playBtn = document.createElement('button');
    playBtn.className = 'hc-play-btn';
    playBtn.textContent = '▶ Play';
    playBtn.addEventListener('click', () => onPlay(i));
    const sellBtn = document.createElement('button');
    sellBtn.className = 'hc-sell-btn';
    sellBtn.textContent = '💸';
    sellBtn.title = 'Sell: +15% HP, +25 mana';
    sellBtn.addEventListener('click', () => onSell(i));
    row.appendChild(playBtn);
    row.appendChild(sellBtn);
    list.appendChild(row);
  }
}

export function showBombs(run: Run) {
  updateBombUI(run);
  show('scr-bombs');
}

export function showShop(meta: Meta, onBuy: (id: string) => void) {
  $('shop-buoni')!.textContent = `🎫 ${fmt(meta.buoni)} buoni pasto`;
  const list = $('shop-list');
  if (!list) return;
  list.innerHTML = '';
  for (const def of META_UPGRADES) {
    const L = meta.levels[def.id] || 0;
    const maxed = L >= def.max;
    const cost = levelCost(def, L);
    const row = document.createElement('button');
    row.className = 'shop-row';
    row.disabled = maxed || meta.buoni < cost;
    row.innerHTML = `
      <span class="ico">${def.icon}</span>
      <span class="info"><b>${def.name}</b><small>${def.desc} · Lv ${L}/${def.max}</small></span>
      <span class="cost">${maxed ? 'MAX' : `${fmt(cost)}🎫`}</span>`;
    row.addEventListener('click', () => onBuy(def.id));
    list.appendChild(row);
  }
  show('scr-shop');
}

export function showCards(run: Run, onPick: (i: number) => void, onReroll: () => void) {
  const box = $('cards-list');
  if (!box) return;
  box.innerHTML = '';
  const rr = $('btn-reroll') as HTMLButtonElement | null;
  if (!rr) return;
  const domWizard = $('dom-wizard');
  if (domWizard) domWizard.hidden = true;

  // ── Modalità scarto: mano piena, scegli quale carta rimuovere ──
  if (run.discarding) {
    $('cards-title')!.textContent = '🗂️ HAND FULL!';
    const { card: pending } = run.pendingPick!;
    $('cards-sub')!.textContent = `Add ${pending.icon} ${pending.name} — remove a card first`;
    rr.hidden = true;
    run.cardPicks.forEach((pick, i) => {
      const def = findCard(pick.id);
      if (!def) return;
      const isHeavy = !!def.heavy;
      const isMalus = !!def.malus;
      const el = document.createElement('button');
      el.className = `card ${isMalus ? 'malus' : (def.rarity || 'common')} discard-choice`;
      el.style.setProperty('--rar', isMalus ? 'var(--red)' : RARITY[def.rarity]?.color || 'var(--grey)');
      el.innerHTML = `
        <span class="rar">${isHeavy ? 'MALUS PESANTE' : isMalus ? 'MALUS' : RARITY[def.rarity]?.label || 'Comune'}</span>
        <span class="ico">${def.icon}</span>
        <b>${def.name}</b>
        <small>${def.desc(pick.m)}</small>
        <span class="own">REMOVE</span>`;
      el.addEventListener('click', () => onPick(i));
      box.appendChild(el);
    });
    show('scr-cards');
    return;
  }

  // ── Modalità malus pesanti (dopo ondata zombie) ──
  if (run.isHeavyMalus) {
    $('cards-title')!.textContent = '☣️ ZOMBIE WAVE SURVIVED!';
    $('cards-sub')!.textContent = 'The whole team is wrecked. Choose the lesser evil.';
    rr.hidden = true;
    run.cardChoices!.forEach((card, i) => {
      const el = document.createElement('button');
      el.className = 'card malus heavy-malus';
      el.style.setProperty('--rar', 'var(--red)');
      el.innerHTML = `
        <span class="rar">MALUS PESANTE</span>
        <span class="ico">${card.icon}</span>
        <b>${card.name}</b>
        <small>${card.desc(1)}</small>
        <span class="own">You must choose</span>`;
      el.addEventListener('click', () => onPick(i));
      box.appendChild(el);
    });
    show('scr-cards');
    return;
  }

  // ── Modalità normale ──
  const advice = domAdvice(run);
  run.cardChoices!.forEach((card, i) => {
    const isMalus = !!card.malus;
    const r = isMalus ? { label: 'MALUS', color: 'var(--red)' } : RARITY[card.rarity];
    const owned = run.cards[card.id] || 0;
    const m = cardPower(run.wave);
    const total = owned && card.linear ? `<br>Totale: ${card.desc(m * (owned + 1))}` : '';
    const el = document.createElement('button');
    el.className = `card ${isMalus ? 'malus' : card.rarity}` + (owned ? ' upgrade' : '') + (advice && advice.index === i ? ' recommended' : '');
    el.style.setProperty('--rar', r.color);
    const ownLabel = isMalus ? (card.reward ? card.reward(run.wave) : 'gold as compensation') : (owned ? "Already owned — effect stacks" : 'New!');
    el.innerHTML = `
      <span class="rar">${isMalus ? 'MALUS' : (owned ? `UPGRADE · Level ${owned} → ${owned + 1}` : r.label)}</span>
      <span class="ico">${card.icon}</span>
      <b>${card.name}</b>
      <small>${card.desc(m)}${total}</small>
      <span class="own">${ownLabel}</span>`;
    el.addEventListener('click', () => onPick(i));
    box.appendChild(el);
  });
  rr.textContent = `🎲 Reroll (${run.rerolls})`;
  rr.disabled = run.rerolls <= 0;
  rr.onclick = onReroll;
  rr.hidden = false;
  $('cards-title')!.textContent = `Wave ${run.wave} cleared!`;
  $('cards-sub')!.textContent = 'Choose an upgrade';
  if (domWizard) {
    if (advice) {
      $('dom-text')!.textContent = advice.reason;
      $('dom-card-name')!.textContent = advice.card.icon + ' ' + advice.card.name;
      domWizard.hidden = false;
    }
  }
  show('scr-cards');
}

// Scelta del rinforzo: usa la stessa schermata delle carte.
// Ogni carta è "ASSUMI" (collega nuovo in una postazione libera) o "PROMUOVI" (uno già in campo).
export function showAllies(run: Run, onPick: (i: number) => void) {
  const domWizard2 = $('dom-wizard');
  if (domWizard2) domWizard2.hidden = true;
  const box = $('cards-list');
  if (!box) return;
  box.innerHTML = '';
  run.allyChoices!.forEach((choice, i) => {
    const { def } = choice;
    const hire = choice.kind === 'hire';
    const lv = hire ? 0 : choice.ally.level;
    const where = slotName(hire ? choice.slot : choice.ally.slot);
    const arc = def.aura ? 'bonus for all' : `defends ${allyArc(lv + 1)}°`;
    const el = document.createElement('button');
    el.className = `card ally ${hire ? 'hire' : 'promo'}`;
    el.innerHTML = `
      <span class="rar">${hire ? 'HIRE' : 'PROMOTE'}</span>
      <span class="ico">${def.icon}</span>
      <b>${def.name}</b>
      <small>${def.desc}</small>
      <span class="own">${hire ? `${where} side` : `${ALLY_LEVELS[lv - 1]} → ${ALLY_LEVELS[lv]}`}<br>${arc}</span>`;
    el.addEventListener('click', () => onPick(i));
    box.appendChild(el);
  });
  $('btn-reroll')!.hidden = true;
  $('cards-title')!.textContent = '🚨 REINFORCEMENTS INCOMING!';
  $('cards-sub')!.textContent = 'Hire a new colleague or promote one already in the field';
  show('scr-cards');
}

export function showOver(run: Run, reward: number, isRecord: boolean) {
  $('over-wave')!.textContent = `You reached wave ${run.wave}`;
  $('over-stats')!.textContent = `${run.kills} enemies eliminated · ${run.bossesKilled} bosses defeated`;
  $('over-reward')!.textContent = `+${fmt(reward)} 🎫 meal tickets`;
  $('over-record')!.hidden = !isRecord;
  $('initials-box')!.hidden = false;
  $('over-after')!.hidden = true;
  ($('btn-save-score') as HTMLButtonElement).disabled = false;
  ($('btn-save-score') as HTMLButtonElement).textContent = 'SAVE';

  // Badge romano: mostra se guadagnato in questa run
  const badgeBox = $('over-badge')!;
  const newBadgeId = (run as any).newBadge as string | undefined;
  const badge = newBadgeId ? BADGES.find(b => b.id === newBadgeId) : null;
  if (badge) {
    const hero = heroDef(run.hero ?? 'peppe');
    const bc = drawBadgeCanvas(badge, hero.name, run.wave);
    const dest = $('badge-canvas') as HTMLCanvasElement;
    dest.width = bc.width; dest.height = bc.height;
    dest.getContext('2d')!.drawImage(bc, 0, 0);
    dest.style.width = '200px'; dest.style.height = '200px';
    $('badge-name')!.textContent = badge.name;
    $('badge-role')!.textContent = badge.role;
    badgeBox.hidden = false;
  } else {
    badgeBox.hidden = true;
  }

  show('scr-over');
}

// Mostra le 3 lettere; quella selezionata lampeggia.
export function renderInitials(chars: string[], cursor: number) {
  document.querySelectorAll('#initials .slot').forEach((slot, i) => {
    slot.querySelector('.ch')!.textContent = chars[i];
    slot.classList.toggle('cur', i === cursor);
  });
}

function renderBoard(list: HTMLElement, top: BoardData, mine: ScoreResult | null) {
  list.innerHTML = '';
  if (!top.rows.length) {
    list.innerHTML = '<li class="empty">No scores yet. Be the first!</li>';
    return;
  }
  top.rows.forEach((r, i) => {
    const li = document.createElement('li');
    const isMine = mine && (mine.id ? r.id === mine.id : r.ts === mine.ts);
    li.className = isMine ? 'me' : '';
    const diffLabel = r.difficulty === 'easy' ? '🟢' : r.difficulty === 'normal' ? '🟡' : r.difficulty === 'hard' ? '🔴' : '<span class="diff-legacy">Legacy</span>';
    li.innerHTML = `<span class="pos">${i + 1}</span><span class="ini">${r.initials}</span><span class="w">WAVE ${r.wave}</span><span class="k">${fmt(r.kills)}💀</span><span class="diff">${diffLabel}</span>`;
    list.appendChild(li);
  });
}

// Dopo aver salvato (o saltato): posizione raggiunta e classifica.
export function showOverAfter(result: ScoreResult | null, top: BoardData) {
  $('initials-box')!.hidden = true;
  $('over-after')!.hidden = false;
  $('over-rank')!.textContent = result?.rank ? `You ranked #${result.rank}!` : '';
  renderBoard($('over-board')!, top, result);
}

export function showBoard(top: BoardData) {
  $('board-source')!.textContent = top.source === 'online' ? 'Global Leaderboard' : 'Device Leaderboard';
  renderBoard($('board-list')!, top, null);
  show('scr-board');
}
