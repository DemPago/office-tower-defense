// ============================================================
// UI.JS — Gestione interfaccia: HUD, shop, pannello torre, mana
// ============================================================

const UI = {
  // ---- HUD ----
  updateGold(val) {
    const el = document.getElementById('budget-display');
    if (el) el.textContent = Math.floor(val);
  },
  updateMana(val, max) {
    const el  = document.getElementById('mana-display');
    const bar = document.getElementById('mana-bar');
    if (el)  el.textContent  = Math.floor(val);
    if (bar) bar.style.width = `${(val / max) * 100}%`;
  },
  updateWave(w) {
    const el = document.getElementById('wave-display');
    if (el) el.textContent = `${w}/100`;
    const banner = document.getElementById('wave-banner');
    if (banner) {
      const isBoss = w % 10 === 0;
      banner.textContent = isBoss ? `⚠️ BOSS — ONDATA ${w}` : `🌊 ONDATA ${w}`;
      banner.className = 'wave-banner' + (isBoss ? ' boss' : '');
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 3000);
    }
  },
  updateLives(lives, max) {
    const el  = document.getElementById('lives-display');
    const bar = document.getElementById('lives-bar');
    if (el)  el.textContent = lives;
    if (bar) {
      const pct = (lives / max) * 100;
      bar.style.width = `${pct}%`;
      bar.style.background = pct > 50 ? 'linear-gradient(90deg,#4caf50,#8bc34a)'
                           : pct > 25 ? 'linear-gradient(90deg,#f39c12,#e67e22)'
                           :            'linear-gradient(90deg,#e74c3c,#c0392b)';
    }
  },
  setNextWaveEnabled(val) {
    const btn = document.getElementById('btn-next-wave');
    if (btn) btn.disabled = !val;
  },
  setSellActive(val) {
    const btn = document.getElementById('btn-sell');
    if (btn) btn.classList.toggle('active', val);
  },
  resetHUD(gold, lives, maxLives) {
    this.updateGold(gold);
    this.updateLives(lives, maxLives);
    this.updateMana(30, 999);
    this.setNextWaveEnabled(true);
    const waveEl = document.getElementById('wave-display');
    if (waveEl) waveEl.textContent = '0/100';
    const banner = document.getElementById('wave-banner');
    if (banner) banner.classList.add('hidden');
  },

  // ---- SHOP ----
  buildShop() {
    const container = document.getElementById('shop-items');
    if (!container) return;
    container.innerHTML = '';

    // Sezione torri fisiche
    const physLabel = document.createElement('div');
    physLabel.className = 'shop-section-label';
    physLabel.textContent = '⚔️ TORRI';
    container.appendChild(physLabel);

    TOWER_DEFS.filter(d => !d.isMagic).forEach(def => {
      container.appendChild(this._makeShopItem(def, false));
    });

    // Separatore
    const sep = document.createElement('div');
    sep.className = 'shop-sep';
    container.appendChild(sep);

    // Sezione maghi
    const magLabel = document.createElement('div');
    magLabel.className = 'shop-section-label magic';
    magLabel.textContent = '🔮 MAGHI';
    container.appendChild(magLabel);

    TOWER_DEFS.filter(d => d.isMagic).forEach(def => {
      container.appendChild(this._makeShopItem(def, true));
    });
  },

  _makeShopItem(def, isMagic) {
    const el = document.createElement('div');
    el.className = 'shop-item' + (isMagic ? ' magic-item' : '');
    el.dataset.id = def.id;

    const costLabel = isMagic
      ? `<span class="shop-item-cost mana-cost">💧${def.manaCost}</span>`
      : `<span class="shop-item-cost">💰${def.cost}</span>`;

    el.innerHTML = `
      <span class="shop-item-icon">${def.icon}</span>
      <span class="shop-item-name">${def.name}</span>
      ${costLabel}
    `;

    el.addEventListener('click', () => {
      document.querySelectorAll('.shop-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      Game.selectTowerDef(def);
      this.hideTowerPanel();
    });

    // Tooltip
    el.addEventListener('mouseenter', (e) => this._showTooltip(def, e));
    el.addEventListener('mouseleave', () => this._hideTooltip());

    return el;
  },

  // ---- PANNELLO TORRE SELEZIONATA ----
  showTowerPanel(tower) {
    let panel = document.getElementById('tower-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'tower-panel';
      document.getElementById('screen-game').appendChild(panel);
    }

    const def  = tower.def;
    const upg  = tower.upgradeData;
    const canUpg = tower.canUpgrade();
    const isMagic = tower.isMagic;

    let html = `
      <div class="tp-header">
        <span>${def.icon}</span>
        <div>
          <strong>${def.name}</strong>
          <div class="tp-level">${upg.icon} ${upg.name} — Lv.${tower.level}</div>
        </div>
        <button class="tp-close" onclick="UI.hideTowerPanel(); Game._deselect()">✕</button>
      </div>
      <div class="tp-stats">
    `;

    tower.getStatLines().forEach(line => {
      html += `<div class="tp-stat">${line}</div>`;
    });

    html += `</div><div class="tp-actions">`;

    if (isMagic) {
      html += `
        <button class="btn-toggle-mage ${tower.active ? 'on' : 'off'}"
          onclick="Game.toggleMage(Game.selectedTower)">
          ${tower.active ? '🟢 ATTIVO' : '🔴 SPENTO'}
        </button>
      `;
    } else if (canUpg) {
      html += `
        <button class="btn-upgrade" onclick="Game.upgradeSelectedTower()">
          ⬆️ Upgrade → ${UPGRADE_LEVELS[tower.level].name}
          <span class="upg-cost">💰${tower.upgradeCost()}</span>
        </button>
      `;
    } else {
      html += `<div class="tp-maxlevel">👑 KING OF THE OFFICE</div>`;
    }

    // Vendi
    const sellGold = tower.def.sellValue || 20;
    html += `
      <button class="btn-sell-tower" onclick="
        Game.gold += ${sellGold};
        Game.towers = Game.towers.filter(t => t !== Game.selectedTower);
        BuffManager.apply(Game.towers);
        UI.updateGold(Game.gold);
        UI.hideTowerPanel();
        Game._deselect();
      ">🗑️ Vendi +${sellGold}💰</button>
    `;

    html += `</div>`;
    panel.innerHTML = html;
    panel.style.display = 'flex';
  },

  hideTowerPanel() {
    const panel = document.getElementById('tower-panel');
    if (panel) panel.style.display = 'none';
  },

  // ---- PAUSE / GAMEOVER / VICTORY ----
  showPause()  { document.getElementById('screen-pause').classList.add('active'); },
  hidePause()  { document.getElementById('screen-pause').classList.remove('active'); },

  showGameOver(wave, kills) {
    const quotes = FIRED_QUOTES;
    document.getElementById('go-wave-text').innerHTML  = `Sei arrivato all\'ondata <strong>${wave}</strong>`;
    document.getElementById('go-kills-text').innerHTML = `Nemici eliminati: <strong>${kills}</strong>`;
    document.getElementById('go-quote').textContent    = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('screen-gameover').classList.add('active');
  },

  showVictory(kills) {
    document.getElementById('v-kills-text').innerHTML = `Nemici eliminati: <strong>${kills}</strong>`;
    document.getElementById('screen-victory').classList.add('active');
  },

  // ---- TOOLTIP ----
  _showTooltip(def, e) {
    const tip = document.getElementById('tooltip');
    if (!tip) return;
    const isMagic = def.isMagic;
    tip.innerHTML = `
      <strong>${def.icon} ${def.name}</strong>
      <span>${def.desc}</span>
      <br><span style="color:${isMagic?'#9b59b6':'#f1c40f'}">${isMagic ? `💧 Costo: ${def.manaCost} mana` : `💰 Costo: ${def.cost} oro`}</span>
    `;
    tip.style.left    = `${e.clientX + 12}px`;
    tip.style.top     = `${e.clientY - 10}px`;
    tip.classList.remove('hidden');
  },
  _hideTooltip() {
    const tip = document.getElementById('tooltip');
    if (tip) tip.classList.add('hidden');
  },
};
