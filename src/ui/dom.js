// DOM — il Mago del Document Object Model.
// Consiglia la carta migliore dopo ogni ondata e l'upgrade da comprare durante il gioco.
import { UPGRADES } from '../data/upgrades.js';
import { upgradeCost } from '../systems/economy.js';

// ─── Carte ───────────────────────────────────────────────────────

function scoreCard(run, card) {
  if (card.malus) return -80; // quasi mai consigliata, salvo le altre siano peggio
  const owned = run.cards[card.id] || 0;
  if (owned >= card.max) return -Infinity;

  const { stats: s, tower, wall, wave } = run;
  const hpPct = tower.hp / s.maxHp;
  const wallBroken = wall.some(seg => seg.hp <= 0);

  let score = card.rarity === 'epic' ? 25 : card.rarity === 'rare' ? 12 : 0;
  if (owned > 0 && card.linear) score += 15;

  switch (card.id) {
    case 'straord':    score += 70; break;
    case 'caffe':      score += 60; break;
    case 'scrum':      score += 85; break;
    case 'pm':         score += wave > 5 ? 80 : 40; break;
    case 'dev':        score += wave > 8 ? 90 : 50; break;
    case 'stagista':   score += wave > 6 ? 70 : 35; break;
    case 'excel':      score += 55; break;
    case 'sm':         score += 65; break;
    case 'cc':         score += 40; break;
    case 'replyall':   score += (run.cards.cc || 0) > 0 ? 75 : 25; break;
    case 'vision':     score += 30; break;
    case 'smart':      score += hpPct < 0.5 ? 90 : 45; break;
    case 'ferie':      score += hpPct < 0.7 ? 70 : 40; break;
    case 'sindacato':  score += 55; break;
    case 'pausa':      score += wave > 5 ? 65 : 45; break;
    case 'bonus':      score += 45; break;
    case 'rimborso':   score += Math.min(85, wave * 4); break;
    case 'concrete':   score += wallBroken ? 80 : 35; break;
    case 'barbed':     score += wallBroken ? 70 : 40; break;
    case 'steel':      score += wallBroken ? 85 : 45; break;
    case 'selfrepair': score += 50; break;
    case 'energy':     score += s.manaRegen < 2 ? 55 : 35; break;
    case 'reserve':    score += 40; break;
    case 'inbox':      score += wave > 5 ? 55 : 30; break;
    case 'itil':       score += !(run.cards.itil) && wave > 4 ? 70 : 40; break;
    default:           score += 30;
  }
  return score;
}

function cardReason(run, card) {
  if (card.malus) return `Carta malus: ${card.desc()} — l'oro non vale il malus permanente.`;
  const hpPct = run.tower.hp / run.stats.maxHp;
  const wallBroken = run.wall.some(seg => seg.hp <= 0);

  if (wallBroken && ['concrete', 'barbed', 'steel', 'selfrepair'].includes(card.id))
    return 'Il muro ha brecce — priorità al rinforzo del perimetro.';
  if (hpPct < 0.5 && card.id === 'smart')
    return 'Vita critica: il restore è urgente prima della prossima ondata.';
  if (hpPct < 0.7 && card.id === 'ferie')
    return 'La rigenerazione passiva compensa il danno continuo subito.';
  if (card.id === 'dev')
    return 'document.querySelectorAll(\'.nemici\').forEach(el => el.remove())';
  if (card.id === 'pm')
    return 'Più target per colpo: O(n) → O(1) colpi per nemico.';
  if (card.id === 'scrum')
    return 'Danno e velocità in un\'unica carta: coefficiente ottimale.';
  if (card.id === 'rimborso')
    return `Converte tempo in oro immediato: +${10 * run.wave}💰 ora valgono più dopo.`;
  if (card.id === 'replyall' && (run.cards.cc || 0) > 0)
    return 'Hai già i critici: moltiplicare ora è prioritario.';
  if (card.id === 'sm')
    return 'I nemici rallentati danno alla torre più frame di fuoco.';
  if (card.id === 'stagista')
    return 'Ogni colpo rimbalza: efficienza massima su gruppi fitti.';
  if (card.rarity === 'epic')
    return 'Carta epica: la probabilità di rivederla è molto bassa.';
  if (card.rarity === 'rare')
    return 'Carta rara: raramente si offre di nuovo — da non perdere.';
  return 'Il DOM ha calcolato: questa ha il coefficiente di utilità più alto.';
}

// Ritorna { index, card, reason } con la carta consigliata fra le 3 offerte.
export function domAdvice(run) {
  const choices = run.cardChoices;
  if (!choices || !choices.length) return null;
  let best = 0, bestScore = -Infinity;
  choices.forEach((card, i) => {
    const s = scoreCard(run, card);
    if (s > bestScore) { bestScore = s; best = i; }
  });
  if (bestScore === -Infinity) return null;
  return { index: best, card: choices[best], reason: cardReason(run, choices[best]) };
}

// ─── Upgrade ─────────────────────────────────────────────────────

// Ritorna l'id dell'upgrade che conviene comprare adesso (o null se nessuno è accessibile).
export function domUpgradeAdvice(run) {
  const { stats: s, tower, upgrades } = run;
  const hpPct = tower.hp / s.maxHp;

  const base = {
    dmg:   70,
    rate:  65,
    range: upgrades.range < 4 ? 50 : 15,
    hp:    hpPct < 0.6 ? 85 : 40,
    regen: hpPct < 0.8 ? 60 : 30,
    fence: 45,
  };

  let best = null, bestScore = -Infinity;
  for (const def of UPGRADES) {
    const cost = upgradeCost(run, def.id);
    if (cost === null || run.gold < cost) continue;
    const score = base[def.id] ?? 30;
    if (score > bestScore) { bestScore = score; best = def.id; }
  }
  return best;
}
