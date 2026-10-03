// Personaggi giocabili: stanno sul tetto del palazzo, ognuno con la sua arma (data/weapons.js)
// e le sue statistiche: punti forti e deboli, in più o in meno rispetto alla base.
//   dmg, rate, hp, regen, range, manaRegen  frazioni (0.15 = +15%)
//   crit, armor                             punti in più (0.1 = +10%)
//   gold                                    oro in più dai nemici; manaMax = mana massimo in più
// All'inizio ci sono Peppe e Dem; gli altri si sbloccano uno alla volta, nell'ordine,
// ogni volta che completi tutti i livelli (UNLOCK_WAVE: i 6 reparti, fino all'ondata 60).
export const HEROES = [
  { id: 'peppe',   name: 'Peppe',      weapon: 'laser', stats: { rate: 0.15, manaRegen: 0.25, hp: -0.15 }, desc: 'Esperto AI sciupato dal running' },
  { id: 'dem',     name: 'Dem',        weapon: 'daggers', stats: { gold: 0.25, hp: 0.1, dmg: -0.1 }, desc: 'Al servizio dei poveri e italiano vero' },
  { id: 'nando',   name: 'Nando',      weapon: 'crossbow', stats: { crit: 0.1, range: 0.1, rate: -0.1 }, desc: 'Campione di RDA' },
  { id: 'tony',    name: 'Tony',       weapon: 'pistol', stats: { dmg: 0.05, crit: 0.1, regen: -0.5, hp: -0.1 }, desc: 'È come una macchina' },
  { id: 'vanessa', name: 'Vanessa',    weapon: 'hearts', stats: { regen: 0.6, hp: 0.15, dmg: -0.1 }, desc: 'Bionda, decisa, inarrestabile' },
  { id: 'clara',   name: 'Clara',      weapon: 'energy', stats: { manaRegen: 0.4, manaMax: 25, hp: -0.1 }, desc: 'Epiche su Jira' },
  { id: 'pesce',   name: 'Uomo Pesce', weapon: 'sonic', stats: { hp: 0.3, armor: 0.1, rate: -0.15 }, desc: 'Nessuno sa come sia stato assunto' },
];
export const START_HEROES = ['peppe', 'dem'];
export const UNLOCK_WAVE = 60;

export function heroDef(id) {
  return HEROES.find(h => h.id === id) || HEROES[0];
}

export function unlockedHeroes(meta) {
  return meta.heroes || START_HEROES;
}

// Sblocca il prossimo personaggio (se ce n'è ancora uno). Restituisce quello nuovo o null.
export function unlockNextHero(meta) {
  const have = unlockedHeroes(meta);
  const next = HEROES.find(h => !have.includes(h.id));
  if (!next) return null;
  meta.heroes = [...have, next.id];
  return next;
}

const STAT_LABELS = {
  dmg: 'danno', rate: 'velocità di fuoco', hp: 'vita', regen: 'rigenerazione', range: 'gittata',
  manaRegen: 'ricarica del mana', crit: 'critici', armor: 'armatura', gold: 'oro', manaMax: 'mana massimo',
};

// Testo delle statistiche per il menu, es. "+15% velocità di fuoco, -15% vita".
export function heroStatsText(hero) {
  return Object.entries(hero.stats || {}).map(([k, v]) => {
    const n = k === 'manaMax' ? `${v > 0 ? '+' : ''}${v}` : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
    return `${n} ${STAT_LABELS[k]}`;
  }).join(', ');
}
