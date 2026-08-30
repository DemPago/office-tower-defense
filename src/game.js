// ============================================================
// GAME.JS — Core game loop, mappa, stato, interazioni
// ============================================================

const TILE = 48;

// ---- MAPPA: 0=erba/piazzabile, 1=percorso, 2=base, 3=spawn ----
// 18 colonne x 13 righe  (~864x624 — ridimensionato al canvas)
const MAP_GRID = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [3,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Ricava coordinate pixel centro cella
function cellCenter(row, col) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

// Estrai percorso come array di {x,y} dai tile=1 seguendo l'ordine
function buildPath(grid) {
  // Hardcoded waypoint order che segue la serpentina della mappa
  const waypoints = [
    [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],
    [2,5],[3,5],[4,5],
    [4,6],[4,7],[4,8],[4,9],[4,10],[4,11],
    [5,11],[6,11],
    [7,11],[7,12],[7,13],[7,14],[7,15],
    [8,15],[9,15],
    [10,15],[10,14],[10,13],[10,12],[10,11],[10,10],
    [10,9],[10,8],[10,7],[10,6],[10,5],[10,4],[10,3],
    [11,3],[12,3],
  ];
  return waypoints.map(([r, c]) => cellCenter(r, c));
}

// ============================================================
const Game = {
  canvas: null,
  ctx: null,
  running: false,
  paused: false,
  lastTime: 0,

  // Stato
  gold: 150,
  lives: 20,
  maxLives: 20,
  waveNum: 0,
  totalKills: 0,
  gameOver: false,
  victory: false,

  // Oggetti
  towers: [],
  enemies: [],
  projectiles: [],
  floatingTexts: [],

  // Mappa
  map: {
    grid: MAP_GRID,
    base:  { row: 12, col: 3 },
    spawn: { row: 1,  col: 0 },
    hoverCell: null,
    hoverValid: false,
  },
  path: [],

  // Selezione shop
  selectedTowerDef: null,
  selectedTower: null,   // torre cliccata sulla mappa
  sellMode: false,

  // Boss banner
  bossBanner: { def: null, alpha: 0, timer: 0 },

  // Wave manager
  waveManager: null,

  // ---- INIT ----
  init(canvas) {
    this.canvas = canvas;
    Renderer.init(canvas);
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.path = buildPath(MAP_GRID);

    this.waveManager = new WaveManager(
      this.path,
      (e) => this.enemies.push(e),
      (w) => this._onWaveComplete(w),
      (boss) => this._showBossBanner(boss),
    );

    ManaManager.reset();
    this._bindInput();
  },

  _resize() {
    const hud  = document.getElementById('hud');
    const shop = document.getElementById('shop');
    const hudH  = hud  ? hud.offsetHeight  : 60;
    const shopH = shop ? shop.offsetHeight : 90;
    const W = window.innerWidth;
    const H = window.innerHeight - hudH - shopH;
    this.canvas.width  = W;
    this.canvas.height = H;
    // Scala tile se necessario
    this._scaleFactor = Math.min(W / (MAP_GRID[0].length * TILE), H / (MAP_GRID.length * TILE));
  },

  // ---- GAME LOOP ----
  start() {
    this.running  = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  },

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(now - this.lastTime, 50); // cap 50ms per pausa tab
    this.lastTime = now;

    if (!this.paused && !this.gameOver && !this.victory) {
      this._update(dt);
    }
    this._draw();
    requestAnimationFrame((t) => this._loop(t));
  },

  // ---- UPDATE ----
  _update(dt) {
    // Mana
    const activeMages = this.towers.filter(t => t.isMagic && t.active);
    ManaManager.update(dt, activeMages);
    UI.updateMana(ManaManager.mana, ManaManager.maxMana);

    // Buff da maghi
    if (activeMages.length > 0) BuffManager.apply(this.towers);

    // Wave manager
    this.waveManager.update(dt, this.enemies);

    // Torri
    this.towers.forEach(t => t.update(dt, this.enemies, this.projectiles));

    // Nemici
    this.enemies.forEach(e => {
      e.update(dt, (type, src) => this.waveManager.spawnMinion(type, src));
      if (e.reachedEnd && !e._counted) {
        e._counted = true;
        this._loseLife();
      }
    });
    this.enemies = this.enemies.filter(e => !e.dead || e._deathAnim > 0);

    // Proiettili
    this.projectiles.forEach(p => p.update(dt, this.enemies, (enemy, dmg) => this._onHit(enemy, dmg)));
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // Particelle e floating text
    Particles.update(dt);
    this._updateFloatingTexts(dt);

    // Boss banner fade
    if (this.bossBanner.alpha > 0) {
      this.bossBanner.timer += dt;
      if (this.bossBanner.timer > 2800) {
        this.bossBanner.alpha = Math.max(0, this.bossBanner.alpha - dt * 0.003);
      }
    }
  },

  // ---- DRAW ----
  _draw() {
    Renderer.clear();

    // Scala per adattare la mappa
    const ctx = Renderer.ctx;
    ctx.save();
    ctx.scale(this._scaleFactor || 1, this._scaleFactor || 1);

    Renderer.drawMap(this.map);

    // Range torre selezionata
    if (this.selectedTower) Renderer.drawRange(this.selectedTower);

    // Range mago hover/selezionato
    this.towers.filter(t => t.isMagic && t.selected).forEach(t => Renderer.drawRange(t));

    // Torri
    this.towers.forEach(t => Renderer.drawTower(t));

    // Nemici
    [...this.enemies]
      .sort((a, b) => a.y - b.y)
      .forEach(e => Renderer.drawEnemy(e));

    // Proiettili
    this.projectiles.forEach(p => Renderer.drawProjectile(p));

    // Particelle
    Particles.draw(ctx);

    // Floating text
    Renderer.drawFloatingTexts(this.floatingTexts);

    ctx.restore();

    // Boss banner (non scalato, overlay)
    if (this.bossBanner.alpha > 0) {
      Renderer.drawBossBanner(this.bossBanner.def, this.bossBanner.alpha);
    }
  },

  // ---- INPUT ----
  _bindInput() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('click',     (e) => this._onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this._deselect(); });
  },

  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sf = this._scaleFactor || 1;
    return {
      x: (e.clientX - rect.left) / sf,
      y: (e.clientY - rect.top)  / sf,
    };
  },

  _onMouseMove(e) {
    const { x, y } = this._canvasPos(e);
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    const inBounds = row >= 0 && row < MAP_GRID.length && col >= 0 && col < MAP_GRID[0].length;
    if (inBounds && this.selectedTowerDef) {
      this.map.hoverCell = { row, col };
      this.map.hoverValid = MAP_GRID[row][col] === 0 && !this._towerAt(col, row);
    } else {
      this.map.hoverCell = null;
    }
  },

  _onClick(e) {
    const { x, y } = this._canvasPos(e);
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);

    // Sell mode
    if (this.sellMode) {
      const t = this._towerAt(col, row);
      if (t) {
        this.gold += t.def.sellValue || 20;
        this.towers = this.towers.filter(tt => tt !== t);
        BuffManager.apply(this.towers);
        UI.updateGold(this.gold);
        this.sellMode = false;
        UI.setSellActive(false);
      }
      return;
    }

    // Clicca su torre esistente → seleziona
    const existing = this._towerAt(col, row);
    if (existing) {
      this.selectedTower = existing;
      this.towers.forEach(t => t.selected = false);
      existing.selected = true;
      this.selectedTowerDef = null;
      UI.showTowerPanel(existing);
      return;
    }

    // Piazza nuova torre
    if (this.selectedTowerDef && MAP_GRID[row]?.[col] === 0 && !this._towerAt(col, row)) {
      const def = this.selectedTowerDef;
      const isMagic = def.isMagic;
      const cost = isMagic ? def.manaCost : def.cost;

      if (isMagic && !ManaManager.canAfford(cost)) {
        this._floatText('Mana insufficiente!', x * (this._scaleFactor||1), y * (this._scaleFactor||1), '#9b59b6');
        return;
      }
      if (!isMagic && this.gold < cost) {
        this._floatText('Oro insufficiente!', x * (this._scaleFactor||1), y * (this._scaleFactor||1), '#f1c40f');
        return;
      }

      if (isMagic) ManaManager.spend(cost);
      else { this.gold -= cost; UI.updateGold(this.gold); }

      const tower = new Tower(def, col, row, TILE);
      this.towers.push(tower);
      BuffManager.apply(this.towers);
    } else {
      this._deselect();
    }
  },

  _towerAt(col, row) {
    return this.towers.find(t => t.col === col && t.row === row) || null;
  },

  _deselect() {
    this.selectedTowerDef = null;
    this.map.hoverCell = null;
    this.towers.forEach(t => t.selected = false);
    this.selectedTower = null;
    UI.hideTowerPanel();
  },

  // ---- EVENTI GIOCO ----
  _onHit(enemy, dmg) {
    if (dmg > 0) {
      Particles.spark(enemy.x, enemy.y, enemy.def.colorBody || '#fff', 4);
      this._floatText(`-${Math.round(dmg)}`, enemy.x, enemy.y - enemy.size, '#fff');
    }
    if (enemy.dead) {
      this.gold += enemy.reward;
      this.totalKills++;
      UI.updateGold(this.gold);
      this._floatText(`+${enemy.reward}💰`, enemy.x, enemy.y - enemy.def.size * 2, '#f1c40f');
      Particles.spark(enemy.x, enemy.y, '#f1c40f', 8);
    }
  },

  _loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    UI.updateLives(this.lives, this.maxLives);
    if (this.lives <= 0) this._triggerGameOver();
  },

  _onWaveComplete(waveNum) {
    if (waveNum >= 100) {
      this._triggerVictory();
      return;
    }
    UI.setNextWaveEnabled(true);
    // Bonus oro fine ondata
    const bonus = 20 + waveNum * 5;
    this.gold += bonus;
    UI.updateGold(this.gold);
    this._floatText(`Ondata ${waveNum} completata! +${bonus}💰`,
      this.canvas.width / 2, this.canvas.height / 2, '#4caf50');
  },

  _showBossBanner(boss) {
    this.bossBanner = { def: boss, alpha: 1, timer: 0 };
  },

  _triggerGameOver() {
    this.gameOver = true;
    UI.showGameOver(this.waveNum, this.totalKills);
  },

  _triggerVictory() {
    this.victory = true;
    UI.showVictory(this.totalKills);
  },

  // ---- FLOATING TEXT ----
  _floatText(text, x, y, color) {
    this.floatingTexts.push({ text, x, y, color, alpha: 1, vy: -0.8, size: 13 });
  },

  _updateFloatingTexts(dt) {
    this.floatingTexts.forEach(t => {
      t.y  += t.vy * (dt / 16);
      t.alpha -= dt * 0.001;
    });
    this.floatingTexts = this.floatingTexts.filter(t => t.alpha > 0);
  },

  // ---- AZIONI UI ----
  selectTowerDef(def) {
    this.selectedTowerDef = def;
    this.towers.forEach(t => t.selected = false);
    this.selectedTower = null;
    this.sellMode = false;
    UI.setSellActive(false);
    UI.hideTowerPanel();
  },

  toggleSellMode() {
    this.sellMode = !this.sellMode;
    if (this.sellMode) this.selectedTowerDef = null;
    UI.setSellActive(this.sellMode);
  },

  startNextWave() {
    if (this.waveManager.running) return;
    this.waveNum++;
    if (this.waveNum > 100) return;
    this.waveManager.startWave(this.waveNum, this.towers);
    UI.updateWave(this.waveNum);
    UI.setNextWaveEnabled(false);
  },

  upgradeSelectedTower() {
    const t = this.selectedTower;
    if (!t || !t.canUpgrade()) return;
    const cost = t.upgradeCost();
    if (this.gold < cost) {
      this._floatText('Oro insufficiente!', t.cx, t.cy - 30, '#f1c40f');
      return;
    }
    this.gold -= cost;
    t.upgrade();
    UI.updateGold(this.gold);
    UI.showTowerPanel(t);
    BuffManager.apply(this.towers);
    this._floatText(`${t.upgradeData.icon} ${t.upgradeData.name}!`, t.cx, t.cy - 30, '#f1c40f');
  },

  toggleMage(tower) {
    tower.active = !tower.active;
    BuffManager.apply(this.towers);
    UI.showTowerPanel(tower);
  },

  pause() {
    this.paused = true;
    UI.showPause();
  },

  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    UI.hidePause();
  },

  reset() {
    this.gold = 150; this.lives = 20; this.maxLives = 20;
    this.waveNum = 0; this.totalKills = 0;
    this.gameOver = false; this.victory = false; this.paused = false;
    this.towers = []; this.enemies = []; this.projectiles = [];
    this.floatingTexts = []; this.selectedTowerDef = null;
    this.selectedTower = null; this.sellMode = false;
    this.bossBanner = { def: null, alpha: 0, timer: 0 };
    ManaManager.reset();
    this.waveManager = new WaveManager(
      this.path,
      (e) => this.enemies.push(e),
      (w) => this._onWaveComplete(w),
      (boss) => this._showBossBanner(boss),
    );
    UI.resetHUD(this.gold, this.lives, this.maxLives);
  },
};
