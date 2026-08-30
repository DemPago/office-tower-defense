// ============================================================
// WAVE.JS — Gestione ondate, spawn nemici, boss, minion
// ============================================================

class WaveManager {
  constructor(path, onEnemySpawned, onWaveComplete, onBossEntry) {
    this.path           = path;
    this.onEnemySpawned = onEnemySpawned;   // callback(enemy)
    this.onWaveComplete = onWaveComplete;   // callback(waveNum)
    this.onBossEntry    = onBossEntry;      // callback(bossDef)

    this.currentWave    = 0;
    this.running        = false;
    this.spawnQueue     = [];   // { def, delay } da spawnare
    this.spawnTimer     = 0;
    this.activeEnemies  = [];   // riferimento esterno (set da game.js)
    this.waveComplete   = false;
    this.totalWaves     = 100;

    // Auto-upgrade ogni 15 wave
    this.nextAutoUpgrade = 15;
  }

  // ---- AVVIA ONDATA ----
  startWave(waveNum, towers) {
    if (this.running) return;
    this.currentWave  = waveNum;
    this.running      = true;
    this.waveComplete = false;
    this.spawnQueue   = [];
    this.spawnTimer   = 0;

    const waveData = WAVE_DATA[waveNum - 1];
    if (!waveData) return;

    if (waveData.isBoss) {
      // Notifica banner boss
      this.onBossEntry(waveData.boss);
      // Prima spawna minion, poi boss
      this._enqueueGroup(waveData.minions || [], 0);
      // Boss dopo 3 secondi
      const minionDelay = this._totalGroupDelay(waveData.minions || []);
      const bossDelay = Math.max(3000, minionDelay);

      if (waveData.boss.isGroup) {
        // Boss di gruppo (Leadership Team, 10 Consiglieri)
        for (let i = 0; i < (waveData.boss.groupSize || 1); i++) {
          this.spawnQueue.push({
            def: waveData.boss,
            delay: bossDelay + i * 600,
            waveNum,
          });
        }
      } else {
        this.spawnQueue.push({ def: waveData.boss, delay: bossDelay, waveNum });
      }
    } else {
      this._enqueueGroup(waveData.enemies, 0);
    }

    // Auto-upgrade torri se raggiunta la soglia
    if (waveNum >= this.nextAutoUpgrade && towers) {
      towers.forEach(t => !t.isMagic && t.autoUpgrade());
      this.nextAutoUpgrade += 15;
    }
  }

  _enqueueGroup(groups, startDelay) {
    let t = startDelay;
    (groups || []).forEach(group => {
      const def = this._findDef(group.enemyId);
      if (!def) return;
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({ def, delay: t, waveNum: this.currentWave });
        t += group.interval;
      }
    });
  }

  _totalGroupDelay(groups) {
    return (groups || []).reduce((sum, g) => sum + g.count * g.interval, 0);
  }

  _findDef(id) {
    return ENEMY_BASE.find(e => e.id === id) ||
           BOSS_DEFS.find(b => b.id === id) || null;
  }

  // ---- SPAWN MINION DA BOSS (richiesto da enemy.js) ----
  spawnMinion(type, sourceEnemy) {
    const boss = BOSS_DEFS.find(b => b.minionTypes && b.id === sourceEnemy.def.id);
    if (!boss) return;
    const minionId = boss.minionTypes[Math.floor(Math.random() * boss.minionTypes.length)];
    const def = this._findDef(minionId);
    if (!def) return;
    // Spawn con leggero offset rispetto al boss
    const enemy = new Enemy(def, this.path, this.currentWave);
    enemy.x = sourceEnemy.x + (Math.random() - 0.5) * 40;
    enemy.y = sourceEnemy.y + (Math.random() - 0.5) * 40;
    this.onEnemySpawned(enemy);
  }

  // ---- UPDATE ----
  update(dt, activeEnemies) {
    if (!this.running) return;

    // Processa coda spawn
    if (this.spawnQueue.length > 0) {
      this.spawnTimer += dt;
      while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
        const item = this.spawnQueue.shift();
        const enemy = new Enemy(item.def, this.path, item.waveNum);
        this.onEnemySpawned(enemy);
        // Ricalibra delay rimanenti (relativi al precedente)
        this.spawnTimer = 0;
      }
    } else {
      // Tutti spawnati — attendi che non ci siano più nemici vivi
      const alive = activeEnemies.filter(e => !e.dead && !e.reachedEnd);
      if (alive.length === 0) {
        this.running      = false;
        this.waveComplete = true;
        this.onWaveComplete(this.currentWave);
      }
    }
  }

  get isLastWave() { return this.currentWave >= this.totalWaves; }
}
