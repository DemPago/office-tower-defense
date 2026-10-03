// Personaggi giocabili: stanno sul tetto del palazzo (solo aspetto, non cambiano le regole).
// All'inizio ci sono Peppe e Dem; gli altri si sbloccano uno alla volta, nell'ordine,
// ogni volta che completi tutti i livelli (UNLOCK_WAVE: i 6 reparti, fino all'ondata 60).
export const HEROES = [
  { id: 'peppe',   name: 'Peppe',      desc: 'Esperto AI sciupato dal running' },
  { id: 'dem',     name: 'Dem',        desc: 'Al servizio dei poveri e italiano vero' },
  { id: 'nando',   name: 'Nando',      desc: 'Capelli ricci e occhiali' },
  { id: 'tony',    name: 'Tony',       desc: 'Completo bianco, sigaro e cicatrice: il boss di Miami' },
  { id: 'vanessa', name: 'Vanessa',    desc: 'Bionda, decisa, inarrestabile' },
  { id: 'clara',   name: 'Clara',      desc: 'Caschetto moro e occhialoni' },
  { id: 'pesce',   name: 'Uomo Pesce', desc: 'Nessuno sa come sia stato assunto' },
];
export const START_HEROES = ['peppe', 'dem'];
export const UNLOCK_WAVE = 60;

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
