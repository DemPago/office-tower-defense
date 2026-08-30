// ============================================================
// ENEMY.JS — Logica nemici, pathfinding, abilita' speciali
// ============================================================

class Enemy {
  constructor(def, path, waveNum) {
    this.def = def;
    this.id = Math.random().toString(36).slice(2);
    this.path = path;               // array di {x,y} waypoint
    this.pathIndex = 0;
    this.x = path[0].x;
    this.y = path[0].y;

    // HP scaling per ondata
    const scale = 1 + (waveNum - 1) * 0.08;
    this.maxHp = Math.round(def.hp * scale);
    this.hp = this.maxHp;

    this.speed = def.speed * (1 + (waveNum - 1) * 0.01);
    this.baseSpeed = this.speed;
    this.reward = def.reward;
    this.size = def.size;

    // Status effects
    this.stunned = false;
    this.stunTimer = 0;
    this.slowed = false;
    this.slowTimer = 0;

    // Scudo acqua
    this.elementShield = def.element === 'water' && def.isDragon;

    // DevOps respawn
    this.canRespawn = def.id === 'devops';
    this.hasRespawned = false;

    // Armatura roccia
    this.armorReduction = def.element === 'rock' ? 0.3 : 0;

    // Fasi drago
    this.currentPhase = 0;
    this.deLoreanDash = false;

    // Animazione
    this.walkCycle = 0;
    this.dead = false;
    this.reachedEnd = false;
  }

  update(dt, spawnMinion) {
    if (this.dead || this.reachedEnd) return;

    this.walkCycle += dt * 0.005;

    // Stordimento
    if (this.stunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.stunned = false;
      return; // fermo
    }

    // Rallentamento
    if (this.slowed) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowed = false;
        this.speed = this.baseSpeed;
      }
    }

    // Movimento verso waypoint
    if (this.pathIndex >= this.path.length) {
      this.reachedEnd = true;
      return;
    }

    const target = this.path[this.pathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * (dt / 16);

    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.reachedEnd = true;
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    // Aggiorna fase drago
    if (this.def.isDragon && this.def.dragonPhases) {
      const ratio = this.hp / this.maxHp;
      const phases = this.def.dragonPhases;
      for (let i = 0; i < phases.length; i++) {
        if (ratio <= phases[i].hpThreshold + 0.25 || i === phases.length - 1) {
          if (this.currentPhase !== i) {
            this.currentPhase = i;
            if (spawnMinion) spawnMinion('dragonPhase', this);
          }
          break;
        }
      }
    }
  }

  takeDamage(amount, towerDef) {
    if (this.dead) return 0;

    // Scudo acqua assorbe 1 colpo
    if (this.elementShield) {
      this.elementShield = false;
      return 0;
    }

    // Armatura roccia
    let dmg = amount * (1 - this.armorReduction);

    this.hp -= dmg;

    // DevOps respawn
    if (this.hp <= 0 && this.canRespawn && !this.hasRespawned) {
      this.hp = this.maxHp * 0.5;
      this.hasRespawned = true;
      return dmg;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return dmg;
  }

  applyStun(duration) {
    this.stunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  applySlow(factor, duration) {
    this.slowed = true;
    this.speed = this.baseSpeed * factor;
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  get progress() {
    // Percentuale percorso completato (0-1)
    if (this.path.length <= 1) return 0;
    return this.pathIndex / (this.path.length - 1);
  }
}
