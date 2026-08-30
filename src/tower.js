// ============================================================
// TOWER.JS — Torri fisiche e Maghi Facilitatori
// Sistema upgrade 5 livelli + buff mago + mana
// ============================================================

class Tower {
  constructor(def, col, row, tileSize) {
    this.def        = def;
    this.col        = col;
    this.row        = row;
    this.cx         = col * tileSize + tileSize / 2;
    this.cy         = row * tileSize + tileSize / 2;

    // Livello upgrade (1=Junior ... 5=King)
    this.level      = 1;
    this.upgradeData = UPGRADE_LEVELS[0];

    // Stat effettive (ricalcolate a ogni upgrade + buff mago)
    this._baseDamage   = def.damage   || 0;
    this._baseRange    = def.range    || 120;
    this._baseFireRate = def.fireRate || 1500;
    this.recalcStats();

    this.cooldown   = 0;        // ms rimasti al prossimo sparo
    this.angle      = 0;        // rotazione visuale canna
    this.target     = null;
    this.selected   = false;

    // Buff da maghi attivi (oggetti { type, value })
    this.activeBuffs = [];

    // Maghi Facilitatori
    this.isMagic    = !!def.isMagic;
    this.active     = def.activeByDefault !== false; // toggle on/off
    this.mpPerSec   = def.mpPerSec || 0;

    // Per visualizzazione cooldown
    this.cooldownMax = this.fireRate;
  }

  // ---- CALCOLO STAT CON BUFF ----
  recalcStats(buffs) {
    buffs = buffs || this.activeBuffs;
    const upg = UPGRADE_LEVELS[this.level - 1];

    let dmgMult    = upg.dmgMult;
    let rangeMult  = upg.rangeMult;
    let rateMult   = upg.rateMult;   // moltiplicatore fireRate (<1 = più veloce)
    let noCooldown = false;

    buffs.forEach(b => {
      if      (b.type === 'damage')    dmgMult   *= (1 + b.value);
      else if (b.type === 'range')     rangeMult *= (1 + b.value);
      else if (b.type === 'fireRate')  rateMult  *= (1 - b.value); // b.value=0.4 → più veloce
      else if (b.type === 'noCooldown') noCooldown = true;
    });

    this.damage    = Math.round(this._baseDamage   * dmgMult);
    this.range     = Math.round(this._baseRange    * rangeMult);
    this.fireRate  = Math.max(80, Math.round(this._baseFireRate * rateMult));
    this.noCooldown = noCooldown;
    this.activeBuffs = buffs;
  }

  get cooldownRatio() {
    return this.cooldown / Math.max(1, this.fireRate);
  }

  // ---- UPGRADE ----
  canUpgrade()  { return this.level < 5; }
  upgradeCost() { return UPGRADE_COSTS[this.level] || null; }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.level++;
    this.upgradeData = UPGRADE_LEVELS[this.level - 1];
    this._baseDamage   = this.def.damage   || 0;   // base def invariata
    this._baseRange    = this.def.range    || 120;
    this._baseFireRate = this.def.fireRate || 1500;
    this.recalcStats();
    this.cooldownMax = this.fireRate;
    return true;
  }

  // Auto-upgrade ogni 15 wave (chiamato da game.js)
  autoUpgrade() {
    return this.upgrade();
  }

  // ---- AGGIORNAMENTO ----
  update(dt, enemies, projectiles) {
    if (this.isMagic) return; // i maghi non sparano

    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }
    if (this.noCooldown) this.cooldown = 0;

    // Trovare target (nemico più avanzato nel range)
    this.target = this._findTarget(enemies);
    if (!this.target) return;

    // Ruota verso il target
    this.angle = Math.atan2(this.target.y - this.cy, this.target.x - this.cx);

    // Spara
    if (this.cooldown <= 0) {
      const proj = new Projectile(this, this.target);
      // Sovrascrivi danno con stat effettive
      proj._effectiveDamage = this.damage;
      projectiles.push(proj);
      this.cooldown = this.fireRate;
      this.cooldownMax = this.fireRate;
    }
  }

  _findTarget(enemies) {
    let best = null;
    let bestProgress = -1;
    for (const e of enemies) {
      if (e.dead || e.reachedEnd) continue;
      const d = Math.hypot(e.x - this.cx, e.y - this.cy);
      if (d <= this.range && e.progress > bestProgress) {
        best = e;
        bestProgress = e.progress;
      }
    }
    return best;
  }

  // Restituisce descrizione con stat attuali
  getStatLines() {
    const upg = this.upgradeData;
    const lines = [
      `⚔️  Danno: ${this.damage}`,
      `🎯  Raggio: ${this.range}px`,
      `⚡  Cadenza: ${(1000 / this.fireRate).toFixed(1)}/s`,
    ];
    if (this.isMagic) {
      lines.length = 0;
      lines.push(`🔮  Buff: ${this.def.buffType} +${Math.round((this.def.buffValue||0)*100)}%`);
      lines.push(`💧  MP/s: ${this.mpPerSec}`);
      lines.push(`📡  Raggio: ${this.range}px`);
    }
    lines.push(`${upg.icon}  ${upg.name} (Lv.${this.level})`);
    if (this.canUpgrade()) {
      lines.push(`💰  Upgrade: ${this.upgradeCost()} oro`);
    } else {
      lines.push(`👑  LIVELLO MASSIMO`);
    }
    return lines;
  }
}

// ============================================================
// MANA MANAGER
// Gestisce mana globale (+1/s), consumo maghi, cap 999
// ============================================================
const ManaManager = {
  mana: 0,
  maxMana: 999,
  accum: 0,   // accumulatore frazioni di secondo

  reset() {
    this.mana  = 30;   // partenza con un po' di mana
    this.accum = 0;
  },

  update(dt, activeMages) {
    // +1 mana al secondo
    this.accum += dt;
    while (this.accum >= 1000) {
      this.mana = Math.min(this.maxMana, this.mana + 1);
      this.accum -= 1000;
    }

    // Consuma MP per magi attivi
    const mpCost = activeMages.reduce((sum, m) => sum + m.mpPerSec * (dt / 1000), 0);
    this.mana = Math.max(0, this.mana - mpCost);
  },

  canAfford(cost) { return this.mana >= cost; },
  spend(cost)     { this.mana = Math.max(0, this.mana - cost); return true; },

  get ratio() { return this.mana / this.maxMana; },
};

// ============================================================
// BUFF MANAGER
// Applica/rimuove buff dei Maghi Facilitatori alle torri fisiche
// ============================================================
const BuffManager = {
  // Ricalcola tutti i buff su tutte le torri in base ai maghi attivi
  apply(towers) {
    const mages  = towers.filter(t => t.isMagic && t.active);
    const physic = towers.filter(t => !t.isMagic);

    physic.forEach(tower => {
      const buffs = [];
      mages.forEach(mage => {
        const d = Math.hypot(tower.cx - mage.cx, tower.cy - mage.cy);
        if (d <= mage.range) {
          buffs.push({ type: mage.def.buffType, value: mage.def.buffValue });
        }
      });
      tower.recalcStats(buffs);
    });
  },
};
