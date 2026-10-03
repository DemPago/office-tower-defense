// Barra in alto (ondata, vita, oro) e pannello in basso (potenziamenti e poteri).
// Gli elementi si creano una volta sola; ad ogni frame si aggiornano solo testi e stati.
// Passando col mouse su un pulsante (o tenendolo premuto sul telefono) compare
// un suggerimento che spiega cosa fa.
import { UPGRADES } from '../data/upgrades.js';
import { ABILITIES } from '../data/abilities.js';
import { upgradeCost } from '../systems/economy.js';
import { canUse } from '../systems/abilities.js';
import { fmt } from '../util.js';

const $ = id => document.getElementById(id);

// Cambia il testo solo se è diverso (evita lavoro inutile al browser).
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

// ─── Suggerimenti ───────────────────────────────────────────────

const tip = document.createElement('div');
tip.id = 'tip';
tip.hidden = true;
document.body.appendChild(tip);

function showTip(btn, html) {
  tip.innerHTML = html;
  tip.hidden = false;
  const r = btn.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const x = Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2));
  const y = r.top - t.height - 8;
  tip.style.left = `${x}px`;
  tip.style.top = `${y < 8 ? r.bottom + 8 : y}px`;
}

function hideTip() {
  tip.hidden = true;
}

// Collega il suggerimento a un pulsante. content() costruisce il testo al momento.
// Mouse: compare passandoci sopra. Touch: compare tenendo premuto (e quel tocco non compra).
function withTip(btn, content, onActivate) {
  let pressTimer = null, longPress = false;
  btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showTip(btn, content()); });
  btn.addEventListener('pointerleave', hideTip);
  btn.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    longPress = false;
    pressTimer = setTimeout(() => { longPress = true; showTip(btn, content()); }, 450);
  });
  btn.addEventListener('pointerup', () => {
    clearTimeout(pressTimer);
    if (longPress) setTimeout(hideTip, 1800);
  });
  btn.addEventListener('contextmenu', e => e.preventDefault()); // niente menu del telefono
  btn.addEventListener('click', () => {
    if (longPress) { longPress = false; return; } // era solo per leggere
    onActivate();
    if (!tip.hidden) showTip(btn, content()); // aggiorna i valori dopo l'acquisto
  });
}

const tipTitle = (icon, name, extra = '') => `<b><span>${icon} ${name}</span><span class="tip-extra">${extra}</span></b>`;

export function createHud({ onBuy, onAbility }) {
  let lastRun = null;

  const upgradeEls = {};
  for (const def of UPGRADES) {
    const btn = document.createElement('button');
    btn.className = 'upg';
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.name}</span><span class="lv"></span><span class="cost"></span>`;
    withTip(btn, () => {
      if (!lastRun) return '';
      const L = lastRun.upgrades[def.id], cost = upgradeCost(lastRun, def.id);
      const next = cost === null ? 'Livello massimo' : `Prossimo livello: ${fmt(cost)} 💰`;
      return `${tipTitle(def.icon, def.name, `Lv ${L}`)}<p>${def.help(lastRun.stats, L)}</p><p class="tip-cost">${next}</p>`;
    }, () => onBuy(def.id));
    $('upgrades').appendChild(btn);
    upgradeEls[def.id] = { btn, lv: btn.querySelector('.lv'), cost: btn.querySelector('.cost') };
  }

  const abilityEls = {};
  for (const def of ABILITIES) {
    const btn = document.createElement('button');
    btn.className = 'abl';
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.short}</span><span class="key">${def.key}</span><span class="cd"></span><span class="cdt"></span>`;
    withTip(btn, () => {
      const cd = lastRun ? Math.round(def.cd * lastRun.stats.cdMult) : def.cd;
      return `${tipTitle(def.icon, def.name, `tasto ${def.key}`)}<p>${def.help}</p><p class="tip-cost">Ricarica: ${cd} secondi</p>`;
    }, () => onAbility(def.id));
    $('abilities').appendChild(btn);
    abilityEls[def.id] = { btn, cd: btn.querySelector('.cd'), cdt: btn.querySelector('.cdt') };
  }

  function update(run, speed) {
    lastRun = run;
    setText($('wave'), run.wave ? `ONDATA ${run.wave}` : 'PRONTI');
    setText($('gold'), fmt(run.gold));
    const hpPct = Math.max(0, run.tower.hp / run.stats.maxHp * 100);
    $('hp-fill').style.width = hpPct.toFixed(1) + '%';
    setText($('hp-text'), `${fmt(Math.ceil(run.tower.hp))}/${fmt(run.stats.maxHp)}`);
    setText($('btn-speed'), `x${speed}`);

    for (const def of UPGRADES) {
      const el = upgradeEls[def.id];
      const cost = upgradeCost(run, def.id);
      setText(el.lv, `Lv ${run.upgrades[def.id]}`);
      setText(el.cost, cost === null ? 'MAX' : `${fmt(cost)}💰`);
      // non "disabled": così il suggerimento compare anche quando non hai abbastanza oro
      el.btn.classList.toggle('off', cost === null || run.gold < cost || run.phase === 'over');
    }
    for (const def of ABILITIES) {
      const el = abilityEls[def.id];
      const left = run.abilityCd[def.id];
      const total = def.cd * run.stats.cdMult;
      el.cd.style.height = (left > 0 ? left / total * 100 : 0) + '%';
      setText(el.cdt, left > 0 ? String(Math.ceil(left)) : '');
      el.btn.classList.toggle('off', !canUse(run, def.id));
    }
  }

  return { update, hideTip };
}
