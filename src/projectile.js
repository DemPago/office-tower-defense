// ============================================================
// PROJECTILE.JS — Proiettili, AOE, effetti speciali
// ============================================================

class Projectile {
  constructor(tower, target) {
    this.tower = tower;
    this.def = tower.def;
    this.target = target;
    this.x = tower.cx;
    this.y = tower.cy;
    this.speed = this.def.projectileSpeed;
    this.dead = false;
    this.type = 'standard';
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);

    // AOE ring (stampante)
    if (this.def.aoe) {
      this.type = 'seeking';
    }
  }

  update(dt, enemies, onHit) {
    if (this.dead) return;

    // Se il target e' morto, cerca il piu' vicino
    if (this.target.dead || this.target.reachedEnd) {
      const live = enemies.filter(e => !e.dead && !e.reachedEnd);
      if (!live.length) { this.dead = true; return; }
      this.target = live.reduce((a, b) =>
        Math.hypot(b.x - this.x, b.y - this.y) < Math.hypot(a.x - this.x, a.y - this.y) ? b : a
      );
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.angle = Math.atan2(dy, dx);
    const step = this.speed * (dt / 16);

    if (dist <= step + this.target.size) {
      // Impatto
      this._impact(enemies, onHit);
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  _impact(enemies, onHit) {
    this.dead = true;
    const def = this.def;

    if (def.aoe) {
      // Danno area
      enemies.forEach(e => {
        if (e.dead || e.reachedEnd) return;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= def.aoe) {
          const dmg = e.takeDamage(def.damage * (1 - d / def.aoe / 2), def);
          onHit(e, dmg);
          if (def.slow) e.applySlow(def.slow, def.slowDuration || 1500);
        }
      });
      // Ring visuale
      Particles.ring(this.x, this.y, def.aoe, def.projectileColor);
    } else if (def.pierce) {
      // Attraversa N nemici (monitor rotto)
      let pierceLeft = def.pierce;
      const sorted = [...enemies]
        .filter(e => !e.dead && !e.reachedEnd)
        .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y));
      for (const e of sorted) {
        if (pierceLeft <= 0) break;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= e.size * 2 + 16) {
          const dmg = e.takeDamage(def.damage, def);
          onHit(e, dmg);
          pierceLeft--;
        }
      }
    } else if (def.stun) {
      // Centralino — stordisce
      const dmg = this.target.takeDamage(def.damage, def);
      onHit(this.target, dmg);
      this.target.applyStun(def.stun);
    } else {
      // Standard
      const dmg = this.target.takeDamage(def.damage, def);
      onHit(this.target, dmg);
    }
  }
}

// ---- PARTICELLE SEMPLICI ----
const Particles = {
  list: [],

  ring(x, y, maxR, color) {
    this.list.push({ type: 'ring', x, y, radius: 1, maxR, color, alpha: 0.8, speed: maxR / 15 });
  },

  spark(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.list.push({
        type: 'spark', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3, color, alpha: 1,
      });
    }
  },

  update(dt) {
    this.list = this.list.filter(p => p.alpha > 0);
    this.list.forEach(p => {
      p.alpha -= dt * 0.002;
      if (p.type === 'ring') {
        p.radius += p.speed * (dt / 16);
        if (p.radius >= p.maxR) p.alpha = 0;
      } else {
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.size *= 0.97;
      }
    });
  },

  draw(ctx) {
    this.list.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  },
};
