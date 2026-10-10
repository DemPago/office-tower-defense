// Scelta delle carte fra un'ondata e l'altra.
import { CARDS, MALUS_CARDS, HEAVY_MALUS_CARDS, RARITY, cardPower, MAX_HAND } from '../data/cards.js';
import { refreshStats } from './economy.js';

// Estrae una carta dal mazzo, pesata per rarità.
function draw(pool) {
  const total = pool.reduce((sum, c) => sum + RARITY[c.rarity].weight, 0);
  let r = Math.random() * total;
  return pool.find(c => (r -= RARITY[c.rarity].weight) <= 0) || pool[pool.length - 1];
}

// Estrae 3 carte sempre diverse:
//  1) prima quelle che non hai ancora preso;
//  2) solo se non bastano, quelle già prese (diventano "POTENZIA", l'effetto si somma);
//  3) se possibile, mai le stesse dell'offerta precedente.
export function rollChoices(run, n = 3) {
  const last = new Set(run.lastOffer || []);
  const available = CARDS.filter(c => !c.malus && (run.cards[c.id] || 0) < c.max);
  const fresh = available.filter(c => !run.cards[c.id]);
  const owned = available.filter(c => run.cards[c.id]);
  const picked = [];
  for (let group of [fresh, owned]) {
    // evita le carte appena viste, a meno che non ci sia altra scelta
    const notLast = group.filter(c => !last.has(c.id));
    if (notLast.length >= n - picked.length) group = notLast;
    while (picked.length < n && group.length) {
      const card = draw(group);
      picked.push(card);
      group = group.filter(c => c !== card);
    }
  }
  run.lastOffer = picked.map(c => c.id);
  return picked;
}

export function offerCards(run, { noMalus = false } = {}) {
  run.phase = 'cards';
  const choices = rollChoices(run);
  // Se hai vinto troppo facilmente (vita > 80%), una delle 3 carte è un malus.
  // Il bonus stage è già abbastanza brutale: niente malus dopo.
  const hpPct = run.tower.hp / run.stats.maxHp;
  if (!noMalus && run.wave > 2 && hpPct > 0.80) {
    const pool = MALUS_CARDS.filter(c => (run.cards[c.id] || 0) < c.max);
    if (pool.length) {
      const malus = pool[Math.floor(Math.random() * pool.length)];
      choices[Math.floor(Math.random() * choices.length)] = malus;
    }
  }
  run.cardChoices = choices;
}

// Dopo ogni ondata zombie: tutte e 3 le scelte sono malus pesanti, nessun reroll.
export function offerHeavyMalus(run) {
  run.phase = 'cards';
  run.isHeavyMalus = true;
  const pool = [...HEAVY_MALUS_CARDS];
  const choices = [];
  while (choices.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(i, 1)[0]);
  }
  run.cardChoices = choices;
}

export function reroll(run) {
  if (run.phase !== 'cards' || run.rerolls <= 0 || run.isHeavyMalus) return false;
  run.rerolls--;
  run.cardChoices = rollChoices(run);
  return true;
}

function applyCard(run, meta, card) {
  run.cards[card.id] = (run.cards[card.id] || 0) + 1;
  run.cardPicks.push({ id: card.id, m: card.malus ? 1 : cardPower(run.wave) });
  if (card.onPick) card.onPick(run);
  refreshStats(run, meta);
  run.fx.sounds.push('pick');
  run.cardChoices = null;
  run.isHeavyMalus = false;
  if (run.bombPending) {
    delete run.bombPending;
    run.phase = 'bomb-placement'; // piazza bombe prima del prossimo quadro
  } else {
    run.phase = 'break';
    run.breakTimer = 1.5;
  }
}

export function pickCard(run, meta, index) {
  // Modalità scarto: il giocatore ha scelto quale carta rimuovere.
  if (run.discarding) {
    if (index < 0 || index >= run.cardPicks.length) return false;
    const victim = run.cardPicks[index];
    run.cardPicks.splice(index, 1);
    if (run.cards[victim.id] > 0) run.cards[victim.id]--;
    run.discarding = false;
    const { card } = run.pendingPick;
    run.pendingPick = null;
    applyCard(run, meta, card);
    return true;
  }

  const card = run.cardChoices?.[index];
  if (run.phase !== 'cards' || !card) return false;

  // Mano piena: entra in modalità scarto prima di aggiungere la nuova carta.
  if (run.cardPicks.length >= MAX_HAND) {
    run.pendingPick = { card };
    run.discarding = true;
    run.cardChoices = null;
    run.isHeavyMalus = false;
    return 'discard';
  }

  applyCard(run, meta, card);
  return true;
}
