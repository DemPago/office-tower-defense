// Rinforzi: scelta del collega e i loro spari.
import { ALLIES, ALLY_LEVELS, ALLY_LEVEL_MULT, ALLY_SLOTS, ALLY_RING, allyArc, allyHp, YARD_DRAIN } from '../data/allies.js';
import { TOWER, YARD } from '../state.js';
import { dist } from '../util.js';
import { fire, pickTargets } from './combat.js';
import { offerCards } from './cards.js';
import { refreshStats } from './economy.js';
import { banner, ring, sfx, floatText, burst } from './fx.js';
import { angleOf, inArc } from '../util.js';

// Velocità dei colpi: abbastanza lente da vederli partire dalla postazione.
const SHOT_SPEED = { laser: 650, bolt: 360, pc: 230 };
const AURA_COLOR = { rate: '#2de2e6', dmg: '#ff3e8a' };

export function allyDef(id) {
  return ALLIES.find(a => a.id === id);
}

export function allyPos(ally) {
  const a = ALLY_SLOTS[ally.slot] * Math.PI / 180;
  return { x: TOWER.x + Math.cos(a) * ALLY_RING, y: TOWER.y - Math.sin(a) * ALLY_RING };
}

// Il collega spara solo ai nemici dentro il suo spicchio (visto dal centro della torre).
export function allyCovers(ally, enemy) {
  return inArc(angleOf(TOWER, enemy), ALLY_SLOTS[ally.slot], allyArc(ally.level));
}

const MAX_LEVEL = ALLY_LEVELS.length;
const SLOT_NAMES = { 0: 'Est', 45: 'Nord-Est', 90: 'Nord', 135: 'Nord-Ovest', 180: 'Ovest', 225: 'Sud-Ovest', 270: 'Sud', 315: 'Sud-Est' };

export function slotName(slot) {
  return SLOT_NAMES[ALLY_SLOTS[slot]] || '';
}

function freeSlot(run) {
  for (let s = 0; s < ALLY_SLOTS.length; s++) if (!run.allies.some(a => a.slot === s)) return s;
  return -1;
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Propone 3 carte: "assumi" un collega nuovo (finché ci sono postazioni libere,
// almeno 2 carte su 3 sono assunzioni) oppure "promuovi" un collega già in campo.
export function offerAllies(run) {
  const slot = freeSlot(run);
  const promos = shuffle(run.allies.filter(a => a.level < MAX_LEVEL))
    .map(a => ({ kind: 'promote', def: allyDef(a.id), ally: a }));
  const hires = slot < 0 ? [] : shuffle([...ALLIES]).map(def => ({ kind: 'hire', def, slot }));
  const choices = [...hires.slice(0, promos.length ? 2 : 3), ...promos.slice(0, 1)];
  // se mancano carte (es. postazioni piene) si riempie con altre promozioni
  for (const p of promos.slice(1)) if (choices.length < 3) choices.push(p);
  if (!choices.length) { offerCards(run); return; } // tutti al massimo
  run.allyChoices = shuffle(choices);
  run.phase = 'ally';
}

export function pickAlly(run, meta, index) {
  const choice = run.allyChoices?.[index];
  if (run.phase !== 'ally' || !choice) return false;
  let ally;
  if (choice.kind === 'hire') {
    ally = { uid: Math.random(), id: choice.def.id, level: 1, slot: choice.slot, cooldown: 0, recoil: 0, spawn: 0, hp: allyHp(1), maxHp: allyHp(1) };
    run.allies.push(ally);
  } else {
    ally = choice.ally;
    ally.level++;
    ally.promoFlash = 1.5;
    ally.maxHp = allyHp(ally.level);
    ally.hp = ally.maxHp; // la promozione rimette in forma
  }
  const { def } = choice;
  const pos = allyPos(ally);
  const hired = choice.kind === 'hire';
  banner(run, `${def.icon} ${def.name.toUpperCase()}`,
    hired ? `Assunto! Difende il lato ${slotName(ally.slot)}` : `Promosso a ${ALLY_LEVELS[ally.level - 1]}!`, '#f2b705');
  floatText(run, pos.x, pos.y - 44, hired ? 'ASSUNTO!' : 'PROMOSSO!', '#f2b705', 9);
  ring(run, pos.x, pos.y - 10, 26, '#f2b705');
  run.allyChoices = null;
  sfx(run, 'pick');
  refreshStats(run, meta);
  offerCards(run);
  return true;
}

// Animazioni dei colleghi (arrivo dall'alto, lampo di promozione): girano anche fra un'ondata e l'altra.
export function animateAllies(run, dt) {
  for (const ally of run.allies) {
    ally.spawn = Math.min(1, ally.spawn + dt * 2);
    ally.promoFlash = Math.max(0, (ally.promoFlash || 0) - dt);
    ally.hurt = Math.max(0, (ally.hurt || 0) - dt);
  }
}

function inYard(e) {
  return e.x > YARD.x && e.x < YARD.x + YARD.w && e.y > YARD.y && e.y < YARD.y + YARD.h;
}

// Intrusi nel cortile: finché un nemico è vivo là dentro, tutti i colleghi perdono vita
// (YARD_DRAIN al secondo per ogni intruso). A zero il collega si dimette e libera la postazione.
export function updateYard(run, dt) {
  run.intruders = run.enemies.filter(e => !e.dead && inYard(e)).length;
  if (!run.intruders || !run.allies.length) return;
  let lost = false;
  for (const ally of run.allies) {
    ally.hp -= YARD_DRAIN * run.intruders * dt;
    ally.hurt = 0.12;
    if (ally.hp <= 0) {
      const pos = allyPos(ally);
      const def = allyDef(ally.id);
      burst(run, pos.x, pos.y - 12, '#e8e2d0', 14, 90);
      floatText(run, pos.x, pos.y - 40, 'SI È DIMESSO!', '#d7263d', 8);
      banner(run, `${def.icon} ${def.name.toUpperCase()}`, 'Troppi intrusi nel cortile: se ne va!', '#d7263d');
      sfx(run, 'hurt');
      lost = true;
    }
  }
  if (lost) {
    run.allies = run.allies.filter(a => a.hp > 0);
    refreshStats(run, run.meta); // i maghi persi non danno più il loro bonus
  }
}

// A fine ondata i colleghi sopravvissuti tornano in piena forma.
export function restAllies(run) {
  for (const ally of run.allies) ally.hp = ally.maxHp;
}

export function updateAllies(run, dt) {
  for (const ally of run.allies) {
    ally.recoil = Math.max(0, ally.recoil - dt);
    const def = allyDef(ally.id);
    if (def.aura) {
      // I maghi "lanciano" il loro bonus sul palazzo ogni tanto, così si vede che lavorano.
      ally.pulse = (ally.pulse || 0) - dt;
      if (ally.pulse <= 0) {
        ally.pulse = 3;
        const pos = allyPos(ally);
        ring(run, pos.x, pos.y - 12, 22, AURA_COLOR[def.aura]);
        ring(run, TOWER.x, TOWER.y - 40, 46, AURA_COLOR[def.aura]);
      }
      continue;
    }
    ally.cooldown -= dt;
    if (ally.cooldown > 0) continue;

    const pos = allyPos(ally);
    // come la torre: prima i tank, poi i più vicini, ma solo nel suo spicchio
    const [target] = pickTargets(run.enemies, pos, def.range, 1, e => allyCovers(ally, e));
    if (!target) continue;

    ally.cooldown = 1 / (def.rate * run.stats.allyRateMult);
    ally.recoil = 0.1;
    sfx(run, 'ally');
    fire(run, pos.x, pos.y - 20, target, {
      dmg: run.stats.dmg * def.dmg * ALLY_LEVEL_MULT[ally.level - 1],
      bounces: 0,
      hitIds: new Set(),
      speed: SHOT_SPEED[def.kind],
      effects: { slow: def.slow || 0, dot: 0, aoeRadius: def.aoe || 0, aoeDmg: def.aoe ? 0.7 : 0 },
      kind: def.kind,
    });
  }
}
