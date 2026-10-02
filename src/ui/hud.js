// Barra in alto (ondata, vita, oro) e pannello in basso (potenziamenti e poteri).
// Gli elementi si creano una volta sola; ad ogni frame si aggiornano solo testi e stati.
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

export function createHud({ onBuy, onAbility }) {
  const upgradeEls = {};
  for (const def of UPGRADES) {
    const btn = document.createElement('button');
    btn.className = 'upg';
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.name}</span><span class="lv"></span><span class="cost"></span>`;
    btn.addEventListener('click', () => onBuy(def.id));
    $('upgrades').appendChild(btn);
    upgradeEls[def.id] = { btn, lv: btn.querySelector('.lv'), cost: btn.querySelector('.cost') };
  }

  const abilityEls = {};
  for (const def of ABILITIES) {
    const btn = document.createElement('button');
    btn.className = 'abl';
    btn.title = `${def.name}: ${def.desc} (tasto ${def.key})`;
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="key">${def.key}</span><span class="cd"></span><span class="cdt"></span>`;
    btn.addEventListener('click', () => onAbility(def.id));
    $('abilities').appendChild(btn);
    abilityEls[def.id] = { btn, cd: btn.querySelector('.cd'), cdt: btn.querySelector('.cdt'), max: def.cd };
  }

  function update(run, speed) {
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
      el.btn.disabled = cost === null || run.gold < cost || run.phase === 'over';
    }
    for (const def of ABILITIES) {
      const el = abilityEls[def.id];
      const left = run.abilityCd[def.id];
      const total = def.cd * run.stats.cdMult;
      el.cd.style.height = (left > 0 ? left / total * 100 : 0) + '%';
      setText(el.cdt, left > 0 ? String(Math.ceil(left)) : '');
      el.btn.disabled = !canUse(run, def.id);
    }
  }

  return { update };
}
