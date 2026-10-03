// Schermate sopra al gioco: menu, ufficio del personale (negozio permanente),
// scelta delle carte, pausa e fine partita.
import { RARITY } from '../data/cards.js';
import { META_UPGRADES, levelCost } from '../data/upgrades.js';
import { ALLY_LEVELS } from '../data/allies.js';
import { fmt } from '../util.js';

const $ = id => document.getElementById(id);
const SCREENS = ['scr-menu', 'scr-shop', 'scr-cards', 'scr-pause', 'scr-over', 'scr-board'];

export function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
}

export function hideAll() {
  show(null);
}

export function showMenu(meta) {
  $('menu-best').textContent = meta.best ? `Record: ondata ${meta.best}` : 'Nessuna partita ancora';
  $('menu-buoni').textContent = `🎫 ${fmt(meta.buoni)} buoni pasto`;
  show('scr-menu');
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
  run.cardChoices.forEach((card, i) => {
    const r = RARITY[card.rarity];
    const owned = run.cards[card.id] || 0;
    const el = document.createElement('button');
    el.className = `card ${card.rarity}`;
    el.style.setProperty('--rar', r.color);
    el.innerHTML = `
      <span class="rar">${r.label}</span>
      <span class="ico">${card.icon}</span>
      <b>${card.name}</b>
      <small>${card.desc}</small>
      <span class="own">${owned ? `Hai già: ${owned}` : 'Nuova!'}</span>`;
    el.addEventListener('click', () => onPick(i));
    box.appendChild(el);
  });
  const rr = $('btn-reroll');
  rr.textContent = `🎲 Rilancia (${run.rerolls})`;
  rr.disabled = run.rerolls <= 0;
  rr.onclick = onReroll;
  rr.hidden = false;
  $('cards-title').textContent = `Ondata ${run.wave} superata!`;
  $('cards-sub').textContent = 'Scegli un potenziamento';
  show('scr-cards');
}

// Scelta del rinforzo: usa la stessa schermata delle carte.
export function showAllies(run, onPick) {
  const box = $('cards-list');
  box.innerHTML = '';
  run.allyChoices.forEach((def, i) => {
    const have = run.allies.find(a => a.id === def.id);
    const el = document.createElement('button');
    el.className = 'card ally';
    el.innerHTML = `
      <span class="rar">${have ? 'PROMOZIONE' : 'NUOVO'}</span>
      <span class="ico">${def.icon}</span>
      <b>${def.name}</b>
      <small>${def.desc}</small>
      <span class="own">${have ? `${ALLY_LEVELS[have.level - 1]} → ${ALLY_LEVELS[have.level]}` : ALLY_LEVELS[0]}</span>`;
    el.addEventListener('click', () => onPick(i));
    box.appendChild(el);
  });
  $('btn-reroll').hidden = true;
  $('cards-title').textContent = '🚨 RINFORZI IN ARRIVO!';
  $('cards-sub').textContent = 'Un collega viene ad aiutarti. Chi scegli?';
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
