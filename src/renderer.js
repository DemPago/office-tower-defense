// ============================================================
// RENDERER.JS — Disegno canvas: mappa, torri, nemici, proiettili
// Stile cartoon 2D ispirato a Evil Tower
// ============================================================

const Renderer = {
  ctx: null,
  canvas: null,
  TILE: 48,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  // ---- MAPPA ----
  drawMap(map) {
    const { ctx, TILE } = this;
    for (let row = 0; row < map.grid.length; row++) {
      for (let col = 0; col < map.grid[row].length; col++) {
        const tile = map.grid[row][col];
        const x = col * TILE;
        const y = row * TILE;
        if (tile === 1) {
          // Percorso
          ctx.fillStyle = '#4a3728';
          ctx.fillRect(x, y, TILE, TILE);
          // Texture strada
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
          // Linea centrale
          ctx.strokeStyle = 'rgba(255,255,255,0.07)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + TILE / 2, y);
          ctx.lineTo(x + TILE / 2, y + TILE);
          ctx.stroke();
        } else {
          // Erba/pavimento ufficio
          const shade = (row + col) % 2 === 0 ? '#2d4a2d' : '#274224';
          ctx.fillStyle = shade;
          ctx.fillRect(x, y, TILE, TILE);
          // Dettaglio prato
          if ((row * 7 + col * 3) % 11 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(x + 8, y + 8, 8, 8);
          }
        }
      }
    }
    // Highlight piazzamento torre
    if (map.hoverCell && map.grid[map.hoverCell.row]?.[map.hoverCell.col] === 0) {
      const { row, col } = map.hoverCell;
      ctx.fillStyle = map.hoverValid ? 'rgba(76,175,80,0.3)' : 'rgba(233,69,96,0.3)';
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      ctx.strokeStyle = map.hoverValid ? '#4caf50' : '#e94560';
      ctx.lineWidth = 2;
      ctx.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);
    }
    // Base (obiettivo)
    this.drawBase(map.base);
    // Spawn
    this.drawSpawn(map.spawn);
  },

  drawBase(base) {
    const { ctx, TILE } = this;
    const x = base.col * TILE;
    const y = base.row * TILE;
    // Scrivania
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + 4, y + 12, TILE - 8, TILE - 16);
    ctx.fillStyle = '#a0801a';
    ctx.fillRect(x + 4, y + 12, TILE - 8, 6);
    // Monitor
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 14, y + 4, 20, 14);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x + 16, y + 6, 16, 10);
    // Emoji impiegato
    ctx.font = `${TILE * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('😰', x + TILE / 2, y + TILE - 2);
  },

  drawSpawn(spawn) {
    const { ctx, TILE } = this;
    const x = spawn.col * TILE;
    const y = spawn.row * TILE;
    ctx.fillStyle = 'rgba(233,69,96,0.2)';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.font = `${TILE * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🚪', x + TILE / 2, y + TILE * 0.75);
  },

  // ---- RANGE RING ----
  drawRange(tower) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(tower.cx, tower.cy, tower.def.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  // ---- TORRI ----
  drawTower(tower) {
    const { ctx, TILE } = this;
    const x = tower.col * TILE;
    const y = tower.row * TILE;
    const cx = x + TILE / 2;
    const cy = y + TILE / 2;
    const def = tower.def;

    // Base piattaforma
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, TILE - 8, TILE - 8, 6);
    ctx.fill();

    // Corpo torre
    ctx.fillStyle = def.bodyColor;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, TILE - 16, TILE - 16, 4);
    ctx.fill();

    // Icona emoji
    ctx.font = `${TILE * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, cx, cy);
    ctx.textBaseline = 'alphabetic';

    // Canna rotante (punta verso il target)
    if (tower.angle !== undefined) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tower.angle);
      ctx.fillStyle = '#ccc';
      ctx.fillRect(4, -2, 14, 4);
      ctx.restore();
    }

    // Barra cooldown
    if (tower.cooldownRatio > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 6, y + TILE - 10, TILE - 12, 4);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(x + 6, y + TILE - 10, (TILE - 12) * (1 - tower.cooldownRatio), 4);
    }

    // Indicatore selezione
    if (tower.selected) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, TILE - 4, TILE - 4, 6);
      ctx.stroke();
    }
  },

  // ---- NEMICI ----
  drawEnemy(enemy) {
    const { ctx } = this;
    const { x, y, def } = enemy;

    ctx.save();
    ctx.translate(x, y);

    // Ombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, def.size * 0.9, def.size * 0.7, def.size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    if (def.isDragon) {
      this._drawDragon(enemy);
    } else if (def.isEngineer) {
      this._drawEngineer(enemy);
    } else if (def.isBoss && def.hasDeLorean) {
      this._drawDocBrown(enemy);
    } else if (def.isBoss && def.isDragon) {
      this._drawGrandeDrago(enemy);
    } else {
      this._drawHuman(enemy);
    }

    ctx.restore();

    // HP bar
    this._drawHPBar(enemy);

    // Effetti status
    if (enemy.stunned) this._drawStatusIcon(enemy, '💫', -def.size * 1.2);
    if (enemy.slowed) this._drawStatusIcon(enemy, '🧊', -def.size * 1.0);
    if (enemy.elementShield) this._drawElementShield(enemy);
  },

  _drawHuman(enemy) {
    const { ctx } = this;
    const { def } = enemy;
    const s = def.size;

    // Corpo
    ctx.fillStyle = def.colorBody;
    ctx.beginPath();
    ctx.roundRect(-s * 0.55, -s * 0.5, s * 1.1, s * 0.9, s * 0.2);
    ctx.fill();

    // Testa
    ctx.fillStyle = def.colorHead;
    ctx.beginPath();
    ctx.arc(0, -s * 0.7, s * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Occhi (bianchi + pupilla)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.75, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.15, -s * 0.75, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.73, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.15, -s * 0.73, s * 0.06, 0, Math.PI * 2); ctx.fill();

    // Bocca (arrabbiata per i boss)
    ctx.strokeStyle = def.isBoss ? '#e74c3c' : '#333';
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    if (def.isBoss) {
      ctx.moveTo(-s * 0.2, -s * 0.58); ctx.lineTo(s * 0.2, -s * 0.62);
    } else {
      ctx.arc(0, -s * 0.6, s * 0.15, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // Capelli bianchi folli per Doc Brown (fallback human)
    if (def.hairColor) {
      ctx.fillStyle = def.hairColor;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.15, -s * 1.12);
        ctx.lineTo(i * s * 0.15 - s * 0.08, -s * 1.4);
        ctx.lineTo(i * s * 0.15 + s * 0.08, -s * 1.4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Etichetta boss
    if (def.isBoss) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = `bold ${s * 0.45}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('👔', 0, s * 0.15);
    }
  },

  _drawDragon(enemy) {
    const { ctx } = this;
    const { def } = enemy;
    const s = def.size;
    const ec = def.elementColor || def.colorBody;

    // Corpo draghetto
    ctx.fillStyle = def.colorBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.8, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ali
    ctx.fillStyle = ec + 'aa';
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.3);
    ctx.bezierCurveTo(-s * 1.2, -s * 0.9, -s * 1.0, s * 0.1, -s * 0.5, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s * 0.3);
    ctx.bezierCurveTo(s * 1.2, -s * 0.9, s * 1.0, s * 0.1, s * 0.5, 0);
    ctx.closePath(); ctx.fill();

    // Testa
    ctx.fillStyle = def.colorHead;
    ctx.beginPath();
    ctx.ellipse(s * 0.7, -s * 0.1, s * 0.45, s * 0.35, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Occhio
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.85, -s * 0.2, s * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ec;
    ctx.beginPath(); ctx.arc(s * 0.87, -s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();

    // Corno
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(s * 0.75, -s * 0.44);
    ctx.lineTo(s * 0.65, -s * 0.75);
    ctx.lineTo(s * 0.85, -s * 0.44);
    ctx.closePath(); ctx.fill();

    // Fuoco/elemento dalla bocca
    ctx.fillStyle = ec;
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 100) * 0.3;
    ctx.beginPath();
    ctx.ellipse(s * 1.1, -s * 0.08, s * 0.2, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Coda
    ctx.strokeStyle = def.colorBody;
    ctx.lineWidth = s * 0.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, 0);
    ctx.bezierCurveTo(-s * 1.1, s * 0.3, -s * 1.0, -s * 0.5, -s * 1.3, -s * 0.3);
    ctx.stroke();

    // Simbolo elemento
    const symbols = { fire: '🔥', lightning: '⚡', water: '💧', rock: '🪨' };
    ctx.font = `${s * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(symbols[def.element] || '✨', 0, -s * 0.9);
  },

  _drawGrandeDrago(enemy) {
    const { ctx } = this;
    const { def } = enemy;
    const s = def.size;
    // Fase corrente del drago
    const phase = enemy.currentPhase || 0;
    const phases = def.dragonPhases || [];
    const phaseData = phases[phase] || { elementColor: '#1d6a2e' };
    const ec = phaseData.elementColor;

    // Corpo enorme
    ctx.fillStyle = def.colorBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.9, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pancia
    ctx.fillStyle = '#c8e6c9';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 0.55, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ali grandi
    ctx.fillStyle = ec + '99';
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.3, -s * 0.5);
      ctx.bezierCurveTo(side * s * 1.8, -s * 1.4, side * s * 1.6, s * 0.3, side * s * 0.7, s * 0.1);
      ctx.closePath(); ctx.fill();
    });

    // Testa
    ctx.fillStyle = def.colorHead;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.85, s * 0.55, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corna
    ctx.fillStyle = '#d4af37';
    [[-s * 0.25, -1.3], [s * 0.25, -1.3]].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.moveTo(hx - s * 0.1, hy * s + s * 0.2);
      ctx.lineTo(hx, hy * s);
      ctx.lineTo(hx + s * 0.1, hy * s + s * 0.2);
      ctx.closePath(); ctx.fill();
    });

    // Occhi luminosi
    ctx.fillStyle = '#fff';
    [[-0.2], [0.2]].forEach(([ox]) => {
      ctx.beginPath(); ctx.arc(ox * s, -s * 0.9, s * 0.17, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = ec;
    [[-0.2], [0.2]].forEach(([ox]) => {
      ctx.beginPath(); ctx.arc(ox * s, -s * 0.9, s * 0.1, 0, Math.PI * 2); ctx.fill();
    });

    // Fuoco elemento (pulsante)
    ctx.fillStyle = ec;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 150) * 0.4;
    ctx.beginPath();
    ctx.ellipse(0, -s * 1.35, s * 0.3, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Testo fase
    ctx.font = `bold ${s * 0.3}px sans-serif`;
    ctx.fillStyle = ec;
    ctx.textAlign = 'center';
    ctx.fillText(phaseData.desc || '', 0, s * 1.1);
  },

  _drawEngineer(enemy) {
    const { ctx } = this;
    const { def } = enemy;
    const s = def.size;

    // Base umano
    this._drawHuman(enemy);

    // Elmetto giallo
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(0, -s * 1.05, s * 0.5, s * 0.28, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-s * 0.5, -s * 1.07, s, s * 0.12);

    // Laptop / gadget
    ctx.font = `${s * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('💻', s * 0.5, s * 0.1);
  },

  _drawDocBrown(enemy) {
    const { ctx } = this;
    const { def } = enemy;
    const s = def.size;

    // Camice bianco
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.roundRect(-s * 0.6, -s * 0.5, s * 1.2, s * 0.95, s * 0.15);
    ctx.fill();

    // Testa
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(0, -s * 0.72, s * 0.47, 0, Math.PI * 2);
    ctx.fill();

    // Capelli bianchi folli (ciuffi irregolari)
    ctx.fillStyle = '#ffffff';
    const hairPoints = [
      [-s*0.35, -s*1.05, -s*0.5, -s*1.45],
      [-s*0.15, -s*1.1,  -s*0.2, -s*1.5],
      [ s*0.05,  -s*1.12,  s*0.0, -s*1.55],
      [ s*0.25,  -s*1.08,  s*0.3, -s*1.42],
      [ s*0.42,  -s*1.0,   s*0.55,-s*1.35],
    ];
    hairPoints.forEach(([bx, by, tx, ty]) => {
      ctx.beginPath();
      ctx.moveTo(bx - s*0.07, by);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx + s*0.07, by);
      ctx.closePath(); ctx.fill();
    });

    // Occhi spalancati
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-s*0.17, -s*0.78, s*0.14, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( s*0.17, -s*0.78, s*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath(); ctx.arc(-s*0.17, -s*0.77, s*0.07, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( s*0.17, -s*0.77, s*0.07, 0, Math.PI*2); ctx.fill();

    // Bocca aperta (sorpreso)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(0, -s*0.6, s*0.13, 0, Math.PI);
    ctx.fill();

    // DeLorean sotto (se in fase dash)
    if (enemy.deLoreanDash) {
      ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.roundRect(-s*0.8, s*0.5, s*1.6, s*0.55, s*0.15);
      ctx.fill();
      ctx.fillStyle = '#c0a040';
      ctx.fillRect(-s*0.5, s*0.45, s, s*0.12);
      // Ruote
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(-s*0.55, s*1.05, s*0.18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( s*0.55, s*1.05, s*0.18, 0, Math.PI*2); ctx.fill();
      // Fiamme DeLorean
      ctx.font = `${s*0.45}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🔥', -s*0.85, s*0.9);
      ctx.fillText('🔥', -s*1.1, s*0.7);
    }

    // Distintivo GRANDE SCOTT
    ctx.font = `bold ${s*0.28}px sans-serif`;
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.fillText('GRANDE SCOTT!', 0, s*0.6);
  },

  // ---- HP BAR ----
  _drawHPBar(enemy) {
    const { ctx } = this;
    const { x, y, hp, maxHp, def } = enemy;
    const barW = def.size * (def.isBoss ? 3 : 2);
    const barH = def.isBoss ? 8 : 4;
    const bx = x - barW / 2;
    const by = y - def.size * 1.6;
    const ratio = Math.max(0, hp / maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);

    // Colore barra HP
    const hpColor = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(bx, by, barW * ratio, barH);

    // Testo hp boss
    if (def.isBoss) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, x, by - 2);
    }
  },

  _drawStatusIcon(enemy, icon, dy) {
    const { ctx } = this;
    ctx.font = `${enemy.def.size * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(icon, enemy.x, enemy.y + dy);
  },

  _drawElementShield(enemy) {
    const { ctx } = this;
    const { x, y, def } = enemy;
    const ec = def.elementColor || '#3498db';
    ctx.beginPath();
    ctx.arc(x, y, def.size * 1.3, 0, Math.PI * 2);
    ctx.strokeStyle = ec;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  },

  // ---- PROIETTILI ----
  drawProjectile(proj) {
    const { ctx } = this;
    const { x, y, def } = proj;

    ctx.save();
    ctx.translate(x, y);

    if (proj.type === 'aoe_ring') {
      // Onda d'urto
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.strokeStyle = def.projectileColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - proj.radius / def.aoe;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Proiettile standard
      ctx.rotate(proj.angle || 0);
      ctx.fillStyle = def.projectileColor;
      ctx.shadowColor = def.projectileColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, def.projectileSize || 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  // ---- PARTICELLE / EFFETTI ----
  drawParticles(particles) {
    const { ctx } = this;
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  },

  // ---- FLOATING TEXT ----
  drawFloatingTexts(texts) {
    const { ctx } = this;
    texts.forEach(t => {
      ctx.globalAlpha = t.alpha;
      ctx.font = `bold ${t.size}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
  },

  // ---- BOSS ENTRY BANNER (canvas overlay) ----
  drawBossBanner(boss, alpha) {
    if (alpha <= 0) return;
    const { ctx, canvas } = this;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,0,0,0.85)';
    ctx.fillRect(0, ch / 2 - 70, cw, 140);

    // Bordo rosso lampeggiante
    ctx.strokeStyle = `rgba(233,69,96,${0.5 + Math.sin(Date.now()/100)*0.5})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, ch / 2 - 68, cw - 4, 136);

    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.min(cw / 15, 36)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ BOSS — ONDATA ${boss.wave} ⚠`, cw / 2, ch / 2 - 20);

    ctx.fillStyle = '#f1c40f';
    ctx.font = `bold ${Math.min(cw / 12, 42)}px sans-serif`;
    ctx.fillText(boss.name, cw / 2, ch / 2 + 18);

    ctx.fillStyle = '#aaa';
    ctx.font = `italic ${Math.min(cw / 30, 18)}px sans-serif`;
    ctx.fillText(boss.subtitle, cw / 2, ch / 2 + 46);

    ctx.globalAlpha = 1;
  },
};
