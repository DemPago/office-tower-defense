// Barra in alto (ondata, vita, oro) e pannello in basso (potenziamenti e poteri).
// Gli elementi si creano una volta sola; ad ogni frame si aggiornano solo testi e stati.
// Passando col mouse su un pulsante (o tenendolo premuto sul telefono) compare
// un suggerimento che spiega cosa fa.
import { UPGRADES } from '../data/upgrades.js';
import { ABILITIES } from '../data/abilities.js';
import { upgradeCost } from '../systems/economy.js';
import { canUse, manaCost } from '../systems/abilities.js';
import { maxMana } from '../data/abilities.js';
import { weaponDef } from '../data/weapons.js';
import { fmt } from '../util.js';
import { domUpgradeAdvice } from './dom.js';

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
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.short}</span><span class="key">${def.key}</span><span class="mana"></span><span class="cd"></span>`;
    withTip(btn, () => {
      const cost = lastRun ? manaCost(lastRun, def.id) : def.mana;
      const have = lastRun ? Math.floor(lastRun.mana) : 0;
      const price = def.special ? 'Gratis' : `Costo: ${cost} mana (ne hai ${have})`;
      return `${tipTitle(def.icon, def.name, `tasto ${def.key}`)}<p>${def.help}</p><p class="tip-cost">${price}</p>`;
    }, () => onAbility(def.id));
    $('abilities').appendChild(btn);
    if (def.special) { btn.classList.add('special'); btn.hidden = true; }
    abilityEls[def.id] = { btn, cd: btn.querySelector('.cd'), mana: btn.querySelector('.mana') };
  }

  function update(run, speed) {
    lastRun = run;
    const narrow = innerWidth <= 520;
    setText($('wave'), run.wave ? `${narrow ? 'OND.' : 'ONDATA'} ${run.wave}` : 'PRONTI');
    setText($('gold'), fmt(run.gold));
    const hpPct = Math.max(0, run.tower.hp / run.stats.maxHp * 100);
    $('hp-fill').style.width = hpPct.toFixed(1) + '%';
    setText($('hp-text'), `${fmt(Math.ceil(run.tower.hp))}/${fmt(Math.ceil(run.stats.maxHp))}`);
    setText($('btn-speed'), `x${speed}`);
    const mm = maxMana(run);
    $('mp-fill').style.width = Math.min(100, run.mana / mm * 100).toFixed(1) + '%';
    setText($('mp-text'), `${Math.floor(run.mana)}/${mm} 💧`);
    // riga con le statistiche della torre
    const s = run.stats;
    setText($('stats-line'), `${weaponDef(run.weapon).icon} ⚔️ Danno ${fmt(s.dmg)} a colpo · ⚡ ${s.rate.toFixed(1)} colpi/s · 📡 Gittata ${Math.round(s.range)} · 💧 +${s.manaRegen.toFixed(1)} mana/s`);

    const recUpgrade = run.phase !== 'over' ? domUpgradeAdvice(run) : null;
    for (const def of UPGRADES) {
      const el = upgradeEls[def.id];
      const cost = upgradeCost(run, def.id);
      setText(el.lv, `Lv ${run.upgrades[def.id]}`);
      setText(el.cost, cost === null ? 'MAX' : `${fmt(cost)}💰`);
      // non "disabled": così il suggerimento compare anche quando non hai abbastanza oro
      el.btn.classList.toggle('off', cost === null || run.gold < cost || run.phase === 'over');
      el.btn.classList.toggle('dom-rec', def.id === recUpgrade);
    }
    for (const def of ABILITIES) {
      const el = abilityEls[def.id];
      if (def.special) {
        // mitra: visibile solo quando è pronto o in uso; la parte scura mostra il tempo che resta
        const active = run.mitraT > 0;
        el.btn.hidden = !(run.mitraReady || active);
        el.btn.classList.toggle('active', active);
        el.cd.style.height = active ? (1 - run.mitraT / 12) * 100 + '%' : '0%';
        setText(el.mana, active ? `${Math.ceil(run.mitraT)}s` : 'GRATIS');
        el.btn.classList.toggle('off', !canUse(run, def.id) && !active);
        continue;
      }
      const cost = manaCost(run, def.id);
      // la parte scura si abbassa man mano che il mana si avvicina al costo
      el.cd.style.height = Math.max(0, 1 - run.mana / cost) * 100 + '%';
      setText(el.mana, `${cost}💧`);
      el.btn.classList.toggle('off', !canUse(run, def.id));
    }
  }

  return { update, hideTip };
}
