// Schermate sopra al gioco: menu, ufficio del personale (negozio permanente),
// scelta delle carte, pausa e fine partita.
import { RARITY, cardPower, findCard } from '../data/cards.js';
import { META_UPGRADES, levelCost } from '../data/upgrades.js';
import { ALLY_LEVELS, allyArc } from '../data/allies.js';
import { HEROES, UNLOCK_WAVE, unlockedHeroes, heroStatsText } from '../data/heroes.js';
import { bombMult, nextQuadro, canPlaceBomb, BOMB_MAX } from '../systems/bombs.js';
import { weaponDef } from '../data/weapons.js';
import { slotName } from '../systems/allies.js';
import { fmt } from '../util.js';
import { domAdvice } from './dom.js';

const $ = id => document.getElementById(id);
const SCREENS = ['scr-menu', 'scr-shop', 'scr-cards', 'scr-pause', 'scr-over', 'scr-board', 'scr-bombs'];

export function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
}

export function hideAll() {
  show(null);
}

// Popola #hero-preview con ritratto + info strutturate.
function updateHeroPreview(h, portrait, locked) {
  const box = $('hero-preview');
  if (!box) return;
  if (locked) {
    box.innerHTML = `<p class="preview-locked">🔒 Si sblocca completando tutti i livelli (ondata ${UNLOCK_WAVE})</p>`;
    return;
  }
  const w = weaponDef(h.weapon);
  const pills = Object.entries(h.stats || {}).map(([k, v]) => {
    const n = k === 'manaMax' ? `${v > 0 ? '+' : ''}${v}` : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const label = { dmg:'danno', rate:'fuoco', hp:'vita', regen:'regen',
                    range:'gittata', manaRegen:'mana', crit:'crit',
                    armor:'armor', gold:'oro', manaMax:'mana+' }[k] || k;
    return `<span class="stat-pill ${v > 0 ? 'pos' : 'neg'}">${n} ${label}</span>`;
  }).join('');

  box.innerHTML = '';
  const cv = portrait(h.id, false);
  cv.className = 'preview-canvas';
  box.appendChild(cv);

  const info = document.createElement('div');
  info.className = 'preview-info';
  info.innerHTML = `
    <p class="preview-name">${h.name}</p>
    <p class="preview-desc">${h.desc}</p>
    <p class="preview-weapon">${w.icon} <b>${w.name}</b><br><span>${w.desc}</span></p>
    <div class="preview-pills">${pills}</div>`;
  box.appendChild(info);
}

// portrait(id, locked) restituisce un canvas col ritratto; onHero(id) quando ne scegli uno.
export function showMenu(meta, portrait, onHero) {
  $('menu-best').textContent = meta.best ? `Record: ondata ${meta.best}` : 'Nessuna partita ancora';
  $('menu-buoni').textContent = `🎫 ${fmt(meta.buoni)} buoni pasto`;
  const have = unlockedHeroes(meta);
  const current = have.includes(meta.hero) ? meta.hero : 'peppe';
  const list = $('hero-list');
  list.innerHTML = '';
  for (const h of HEROES) {
    const locked = !have.includes(h.id);
    const btn = document.createElement('button');
    btn.className = 'hero' + (h.id === current ? ' sel' : '') + (locked ? ' locked' : '');
    btn.appendChild(portrait(h.id, locked));
    const name = document.createElement('span');
    name.textContent = locked ? '🔒' : `${weaponDef(h.weapon).icon} ${h.name}`;
    btn.appendChild(name);
    btn.addEventListener('pointerenter', () => updateHeroPreview(h, portrait, locked));
    btn.addEventListener('click', () => { if (!locked) onHero(h.id); else updateHeroPreview(h, portrait, locked); });
    list.appendChild(btn);
  }
  const sel = HEROES.find(h => h.id === current);
  updateHeroPreview(sel, portrait, false);
  show('scr-menu');
}


export function updateBombUI(run) {
  const q = nextQuadro(run);
  const mult = bombMult(run);
  const pct = run.bombPenalty * 5;
  $('bomb-quadro-label').textContent = `QUADRO ${q}`;
  $('bomb-mult-label').textContent = `💣 ×${mult}`;
  $('bomb-penalty-val').textContent = `−${pct}%`;
  $('bomb-count-val').textContent = run.bombPenalty;
  const can = canPlaceBomb(run);
  document.querySelector('.bombs-hint').textContent = can
    ? 'Clicca sulla mappa per piazzare le bombe'
    : `Limite raggiunto (${BOMB_MAX} bombe = stat al minimo)`;
}

export function showBombs(run) {
  updateBombUI(run);
  show('scr-bombs');
}

export function showShop(meta, onBuy) {
  $('shop-buoni').textContent = `🎫 ${fmt(meta.buoni)} buoni pasto`;
  const list = $('shop-list');
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

export function showCards(run, onPick, onReroll) {
  const box = $('cards-list');
  box.innerHTML = '';
  const rr = $('btn-reroll');
  const domWizard = $('dom-wizard');
  if (domWizard) domWizard.hidden = true;

  // ── Modalità scarto: mano piena, scegli quale carta rimuovere ──
  if (run.discarding) {
    $('cards-title').textContent = '🗂️ MANO PIENA!';
    const { card: pending } = run.pendingPick;
    $('cards-sub').textContent = `Vuoi aggiungere ${pending.icon} ${pending.name} — rimuovi una carta`;
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
        <span class="own">RIMUOVI</span>`;
      el.addEventListener('click', () => onPick(i));
      box.appendChild(el);
    });
    show('scr-cards');
    return;
  }

  // ── Modalità malus pesanti (dopo ondata zombie) ──
  if (run.isHeavyMalus) {
    $('cards-title').textContent = '☣️ ONDATA ZOMBIE SUPERATA!';
    $('cards-sub').textContent = 'Tutto il team è a pezzi. Scegli il danno minore.';
    rr.hidden = true;
    run.cardChoices.forEach((card, i) => {
      const el = document.createElement('button');
      el.className = 'card malus heavy-malus';
      el.style.setProperty('--rar', 'var(--red)');
      el.innerHTML = `
        <span class="rar">MALUS PESANTE</span>
        <span class="ico">${card.icon}</span>
        <b>${card.name}</b>
        <small>${card.desc(1)}</small>
        <span class="own">Devi scegliere</span>`;
      el.addEventListener('click', () => onPick(i));
      box.appendChild(el);
    });
    show('scr-cards');
    return;
  }

  // ── Modalità normale ──
  const advice = domAdvice(run);
  run.cardChoices.forEach((card, i) => {
    const isMalus = !!card.malus;
    const r = isMalus ? { label: 'MALUS', color: 'var(--red)' } : RARITY[card.rarity];
    const owned = run.cards[card.id] || 0;
    const m = cardPower(run.wave);
    const total = owned && card.linear ? `<br>Totale: ${card.desc(m * (owned + 1))}` : '';
    const el = document.createElement('button');
    el.className = `card ${isMalus ? 'malus' : card.rarity}` + (owned ? ' upgrade' : '') + (advice && advice.index === i ? ' recommended' : '');
    el.style.setProperty('--rar', r.color);
    const ownLabel = isMalus ? (card.reward ? card.reward(run.wave) : 'oro in compenso') : (owned ? "Ce l'hai già: l'effetto si somma" : 'Nuova!');
    el.innerHTML = `
      <span class="rar">${isMalus ? 'MALUS' : (owned ? `POTENZIA · Livello ${owned} → ${owned + 1}` : r.label)}</span>
      <span class="ico">${card.icon}</span>
      <b>${card.name}</b>
      <small>${card.desc(m)}${total}</small>
      <span class="own">${ownLabel}</span>`;
    el.addEventListener('click', () => onPick(i));
    box.appendChild(el);
  });
  rr.textContent = `🎲 Rilancia (${run.rerolls})`;
  rr.disabled = run.rerolls <= 0;
  rr.onclick = onReroll;
  rr.hidden = false;
  $('cards-title').textContent = `Ondata ${run.wave} superata!`;
  $('cards-sub').textContent = 'Scegli un potenziamento';
  if (domWizard) {
    if (advice) {
      $('dom-text').textContent = advice.reason;
      $('dom-card-name').textContent = advice.card.icon + ' ' + advice.card.name;
      domWizard.hidden = false;
    }
  }
  show('scr-cards');
}

// Scelta del rinforzo: usa la stessa schermata delle carte.
// Ogni carta è "ASSUMI" (collega nuovo in una postazione libera) o "PROMUOVI" (uno già in campo).
export function showAllies(run, onPick) {
  const domWizard2 = $('dom-wizard');
  if (domWizard2) domWizard2.hidden = true;
  const box = $('cards-list');
  box.innerHTML = '';
  run.allyChoices.forEach((choice, i) => {
    const { def } = choice;
    const hire = choice.kind === 'hire';
    const lv = hire ? 0 : choice.ally.level;
    const where = slotName(hire ? choice.slot : choice.ally.slot);
    const arc = def.aura ? 'bonus a tutti' : `difende ${allyArc(lv + 1)}°`;
    const el = document.createElement('button');
    el.className = `card ally ${hire ? 'hire' : 'promo'}`;
    el.innerHTML = `
      <span class="rar">${hire ? 'ASSUMI' : 'PROMUOVI'}</span>
      <span class="ico">${def.icon}</span>
      <b>${def.name}</b>
      <small>${def.desc}</small>
      <span class="own">${hire ? `Lato ${where}` : `${ALLY_LEVELS[lv - 1]} → ${ALLY_LEVELS[lv]}`}<br>${arc}</span>`;
    el.addEventListener('click', () => onPick(i));
    box.appendChild(el);
  });
  $('btn-reroll').hidden = true;
  $('cards-title').textContent = '🚨 RINFORZI IN ARRIVO!';
  $('cards-sub').textContent = 'Assumi un collega nuovo o promuovi uno che hai già';
  show('scr-cards');
}

export function showOver(run, reward, isRecord) {
  $('over-wave').textContent = `Sei arrivato all'ondata ${run.wave}`;
  $('over-stats').textContent = `${run.kills} nemici eliminati · ${run.bossesKilled} boss sconfitti`;
  $('over-reward').textContent = `+${fmt(reward)} 🎫 buoni pasto`;
  $('over-record').hidden = !isRecord;
  $('initials-box').hidden = false;
  $('over-after').hidden = true;
  $('btn-save-score').disabled = false;
  $('btn-save-score').textContent = 'SALVA';
  show('scr-over');
}

// Mostra le 3 lettere; quella selezionata lampeggia.
export function renderInitials(chars, cursor) {
  document.querySelectorAll('#initials .slot').forEach((slot, i) => {
    slot.querySelector('.ch').textContent = chars[i];
    slot.classList.toggle('cur', i === cursor);
  });
}

function renderBoard(list, top, mine) {
  list.innerHTML = '';
  if (!top.rows.length) {
    list.innerHTML = '<li class="empty">Ancora nessun punteggio. Sii il primo!</li>';
    return;
  }
  top.rows.forEach((r, i) => {
    const li = document.createElement('li');
    const isMine = mine && (mine.id ? r.id === mine.id : r.ts === mine.ts);
    li.className = isMine ? 'me' : '';
    li.innerHTML = `<span class="pos">${i + 1}</span><span class="ini">${r.initials}</span><span class="w">ONDATA ${r.wave}</span><span class="k">${fmt(r.kills)}💀</span>`;
    list.appendChild(li);
  });
}

// Dopo aver salvato (o saltato): posizione raggiunta e classifica.
export function showOverAfter(result, top) {
  $('initials-box').hidden = true;
  $('over-after').hidden = false;
  $('over-rank').textContent = result?.rank ? `Sei ${result.rank}° in classifica!` : '';
  renderBoard($('over-board'), top, result);
}

export function showBoard(top) {
  $('board-source').textContent = top.source === 'online' ? 'Classifica mondiale' : 'Classifica di questo dispositivo';
  renderBoard($('board-list'), top, null);
  show('scr-board');
}
