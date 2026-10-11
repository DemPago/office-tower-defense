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
import { findCard } from '../data/cards.js';
import { hasMines } from '../systems/bombs.js';
import type { Run } from '../types.js';

const $ = (id: string): HTMLElement | null => document.getElementById(id);

// Cambia il testo solo se è diverso (evita lavoro inutile al browser).
function setText(el: HTMLElement | null, text: string): void {
  if (!el) return;
  if (el.textContent !== text) el.textContent = text;
}

// ─── Suggerimenti ───────────────────────────────────────────────

const tip = document.createElement('div');
tip.id = 'tip';
tip.hidden = true;
document.body.appendChild(tip);

function showTip(btn: HTMLElement, html: string): void {
  tip.innerHTML = html;
  tip.hidden = false;
  const r = btn.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const x = Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2));
  const y = r.top - t.height - 8;
  tip.style.left = `${x}px`;
  tip.style.top = `${y < 8 ? r.bottom + 8 : y}px`;
}

function hideTip(): void {
  tip.hidden = true;
}

// Collega il suggerimento a un pulsante. content() costruisce il testo al momento.
// Mouse: compare passandoci sopra. Touch: compare tenendo premuto (e quel tocco non compra).
function withTip(btn: HTMLElement, content: () => string, onActivate: () => void): void {
  let pressTimer: ReturnType<typeof setTimeout> | null = null, longPress = false;
  btn.addEventListener('pointerenter', (e: PointerEvent) => { if (e.pointerType === 'mouse') showTip(btn, content()); });
  btn.addEventListener('pointerleave', hideTip);
  btn.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    longPress = false;
    pressTimer = setTimeout(() => { longPress = true; showTip(btn, content()); }, 450);
  });
  btn.addEventListener('pointerup', () => {
    clearTimeout(pressTimer!);
    if (longPress) setTimeout(hideTip, 1800);
  });
  btn.addEventListener('contextmenu', (e: Event) => e.preventDefault()); // niente menu del telefono
  btn.addEventListener('click', () => {
    if (longPress) { longPress = false; return; } // era solo per leggere
    onActivate();
    if (!tip.hidden) showTip(btn, content()); // aggiorna i valori dopo l'acquisto
  });
}

const tipTitle = (icon: string, name: string, extra = ''): string => `<b><span>${icon} ${name}</span><span class="tip-extra">${extra}</span></b>`;

export function createHud({ onBuy, onAbility, onSell, onDetonate, onUse }: { onBuy: (id: string) => void; onAbility: (id: string) => void; onSell?: (i: number) => void; onDetonate?: () => void; onUse?: (i: number) => void }) {
  let lastRun: Run | null = null;

  const upgradeEls: Record<string, { btn: HTMLButtonElement; lv: HTMLElement | null; cost: HTMLElement | null }> = {};
  for (const def of UPGRADES) {
    const btn = document.createElement('button');
    btn.className = 'upg';
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.name}</span><span class="lv"></span><span class="cost"></span>`;
    withTip(btn, () => {
      if (!lastRun) return '';
      const L = lastRun.upgrades[def.id], cost = upgradeCost(lastRun, def.id);
      const next = cost === null ? 'Max level' : `Next level: ${fmt(cost)} 💰`;
      return `${tipTitle(def.icon, def.name, `Lv ${L}`)}<p>${def.help(lastRun.stats)}</p><p class="tip-cost">${next}</p>`;
    }, () => onBuy(def.id));
    $('upgrades')!.appendChild(btn);
    upgradeEls[def.id] = { btn, lv: btn.querySelector<HTMLElement>('.lv'), cost: btn.querySelector<HTMLElement>('.cost') };
  }

  const abilityEls: Record<string, { btn: HTMLButtonElement; cd: HTMLElement | null; mana: HTMLElement | null; cdnum: HTMLElement | null }> = {};
  for (const def of ABILITIES) {
    const btn = document.createElement('button');
    btn.className = 'abl';
    btn.innerHTML = `<span class="ico">${def.icon}</span><span class="nm">${def.short}</span><span class="key">${def.key}</span><span class="mana"></span><span class="cd"></span><span class="cdnum" hidden></span>`;
    withTip(btn, () => {
      const cost = lastRun ? manaCost(lastRun, def.id) : def.mana;
      const have = lastRun ? Math.floor(lastRun.mana) : 0;
      const price = (def as any).special ? 'Free' : `Cost: ${cost} mana (you have ${have})`;
      return `${tipTitle(def.icon, def.name, `key ${def.key}`)}<p>${def.help}</p><p class="tip-cost">${price}</p>`;
    }, () => onAbility(def.id));
    $('abilities')!.appendChild(btn);
    if ((def as any).special) { btn.classList.add('special'); btn.hidden = true; }
    abilityEls[def.id] = { btn, cd: btn.querySelector<HTMLElement>('.cd'), mana: btn.querySelector<HTMLElement>('.mana'), cdnum: btn.querySelector<HTMLElement>('.cdnum') };
  }

  const detonateBtn = $('btn-detonate') as HTMLButtonElement | null;
  if (detonateBtn && onDetonate) {
    detonateBtn.addEventListener('click', () => onDetonate());
  }

  function update(run: Run, speed: number): void {
    lastRun = run;
    const narrow = innerWidth <= 520;
    if (detonateBtn) detonateBtn.hidden = (run.phase !== 'wave' && run.phase !== 'bonus-wave') || !hasMines(run);
    setText($('wave'), run.wave ? `WAVE ${run.wave}` : 'READY');
    setText($('gold'), fmt(run.gold));
    const hpPct = Math.max(0, run.tower.hp / run.stats.maxHp * 100);
    $('hp-fill')!.style.width = hpPct.toFixed(1) + '%';
    setText($('hp-text'), `${fmt(Math.max(0, Math.floor(run.tower.hp)))}/${fmt(Math.ceil(run.stats.maxHp))}`);
    // Counter nemici rimasti (visibile solo durante l'ondata)
    const ec = $('enemy-count');
    if (ec) {
      const alive = run.enemies.filter(e => !e.dead).length + run.spawnQueue.length;
      const inWave = run.phase === 'wave' || run.phase === 'bonus-wave';
      ec.textContent = inWave ? `👾 ${alive}` : '';
      ec.hidden = !inWave;
    }
    setText($('btn-speed'), `x${speed}`);
    const mm = maxMana(run);
    $('mp-fill')!.style.width = Math.min(100, run.mana / mm * 100).toFixed(1) + '%';
    setText($('mp-text'), `${Math.floor(run.mana)}/${mm} 💧`);
    // riga con le statistiche della torre
    const s = run.stats;
    setText($('stats-line'), `${weaponDef(run.weapon!).icon} ⚔️ ${fmt(s.dmg)} dmg/shot · ⚡ ${s.rate.toFixed(1)} shots/s · 📡 ${Math.round(s.range)} range · 💧 +${s.manaRegen.toFixed(1)} mana/s`);

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
      const cost = manaCost(run, def.id);
      const cdLeft = run.abilityCd[def.id] || 0;
      if (cdLeft > 0) {
        // Countdown ricarica: copre tutto il pulsante, mostra i secondi rimasti
        el.cd!.style.height = '100%';
        el.cdnum!.hidden = false;
        setText(el.cdnum, Math.ceil(cdLeft) + 's');
      } else {
        // Ricarica mana: la parte scura si abbassa man mano che il mana sale
        el.cd!.style.height = Math.max(0, 1 - run.mana / cost) * 100 + '%';
        el.cdnum!.hidden = true;
      }
      setText(el.mana, `${cost}💧`);
      el.btn.classList.toggle('off', !canUse(run, def.id));
    }
  }

  // ── Pannello mano ───────────────────────────────────────────────
  const btnHand = $('btn-hand')!;
  const handCount = $('hand-count')!;
  const handPanel = $('hand-panel')!;
  const handPanelList = $('hand-panel-list')!;
  let handOpen = false;
  let currentRun: Run | null = null;

  function renderHandPanel(): void {
    const run = currentRun;
    handPanelList.innerHTML = '';
    if (!run || !run.cardPicks.length) { closeHandPanel(); return; }
    run.cardPicks.forEach((pick, i) => {
      const def = findCard(pick.id);
      if (!def) return;
      const el = document.createElement('div');
      el.className = 'hc-card' + (def.heavy ? ' heavy' : def.malus ? ' malus' : def.type === 'use' ? ' use' : '');
      el.innerHTML = `<span class="hc-ico">${def.icon}</span><span class="hc-nm">${def.name}</span><span class="hc-desc">${def.desc(pick.m)}</span>`;
      if (def.type === 'use') {
        const useBtn = document.createElement('button');
        useBtn.className = 'hc-use-btn';
        useBtn.textContent = '▶ Use';
        useBtn.title = 'Use this card now';
        useBtn.addEventListener('click', e => { e.stopPropagation(); onUse?.(i); closeHandPanel(); });
        el.appendChild(useBtn);
      }
      const sellBtn = document.createElement('button');
      sellBtn.className = 'hc-sell-btn';
      sellBtn.textContent = '💸 Sell';
      sellBtn.title = '+15% HP, +25 mana';
      sellBtn.addEventListener('click', e => { e.stopPropagation(); onSell?.(i); renderHandPanel(); });
      el.appendChild(sellBtn);
      handPanelList.appendChild(el);
    });
  }

  function openHandPanel(): void {
    handOpen = true;
    handPanel.hidden = false;
    renderHandPanel();
  }

  function closeHandPanel(): void {
    handOpen = false;
    handPanel.hidden = true;
  }

  btnHand.addEventListener('click', () => {
    if (handOpen) closeHandPanel(); else openHandPanel();
  });
  $('btn-hand-close')!.addEventListener('click', closeHandPanel);

  // chiude il pannello cliccando fuori
  document.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!handOpen) return;
    const t = e.target as Node;
    if (!handPanel.contains(t) && t !== btnHand && !btnHand.contains(t)) closeHandPanel();
  }, true);

  function updateHand(run: Run | null): void {
    currentRun = run;
    if (!run || run.phase === 'over') { btnHand.hidden = true; closeHandPanel(); return; }
    const n = run.cardPicks.length;
    btnHand.hidden = n === 0;
    handCount.textContent = String(n);
    if (n === 0) closeHandPanel();
  }

  const _origUpdate = update;
  function updateWithHand(run: Run, speed: number): void {
    _origUpdate(run, speed);
    updateHand(run);
  }

  return { update: updateWithHand, hideTip };
}
