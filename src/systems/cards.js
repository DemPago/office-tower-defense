// Scelta delle carte fra un'ondata e l'altra.
import { CARDS, RARITY } from '../data/cards.js';
import { refreshStats } from './economy.js';

// Estrae 3 carte diverse, pesate per rarità, escludendo quelle già al massimo.
export function rollChoices(run, n = 3) {
  let pool = CARDS.filter(c => (run.cards[c.id] || 0) < c.max);
  const picked = [];
  while (picked.length < n && pool.length) {
    const total = pool.reduce((sum, c) => sum + RARITY[c.rarity].weight, 0);
    let r = Math.random() * total;
    const card = pool.find(c => (r -= RARITY[c.rarity].weight) <= 0) || pool[pool.length - 1];
    picked.push(card);
    pool = pool.filter(c => c !== card);
  }
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
  if (card.onPick) card.onPick(run);
  refreshStats(run, meta);
  run.fx.sounds.push('pick');
  run.cardChoices = null;
  run.phase = 'break';
  run.breakTimer = 1.5;
  return true;
}
