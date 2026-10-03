// Scelta delle carte fra un'ondata e l'altra.
import { CARDS, RARITY, cardPower } from '../data/cards.js';
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
  const available = CARDS.filter(c => (run.cards[c.id] || 0) < c.max);
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

export function offerCards(run) {
  run.phase = 'cards';
  run.cardChoices = rollChoices(run);
}

export function reroll(run) {
  if (run.phase !== 'cards' || run.rerolls <= 0) return false;
  run.rerolls--;
  run.cardChoices = rollChoices(run);
  return true;
}

export function pickCard(run, meta, index) {
  const card = run.cardChoices?.[index];
  if (run.phase !== 'cards' || !card) return false;
  run.cards[card.id] = (run.cards[card.id] || 0) + 1;
  run.cardPicks.push({ id: card.id, m: cardPower(run.wave) });
  if (card.onPick) card.onPick(run);
  refreshStats(run, meta);
  run.fx.sounds.push('pick');
  run.cardChoices = null;
  run.phase = 'break';
  run.breakTimer = 1.5;
  return true;
}
