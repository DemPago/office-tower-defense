// Poteri attivi: si usano con un clic (o coi tasti 1-4) e poi si ricaricano.
// L'effetto vero è in systems/abilities.js.
//   cd  ricarica in secondi
export const ABILITIES = [
  { id: 'bomb',    key: '1', icon: '💣', name: 'Bomba di carta',  desc: 'Danno enorme a tutti i nemici',   cd: 25 },
  { id: 'coffee',  key: '2', icon: '☕', name: 'Caffè bollente',  desc: 'Rallenta tutti del 60% per 5 s',  cd: 30 },
  { id: 'meeting', key: '3', icon: '📅', name: 'Riunione urgente', desc: 'Blocca tutti per 3 s',           cd: 40 },
  { id: 'audit',   key: '4', icon: '🔍', name: 'Audit fiscale',   desc: 'Dimezza la vita dei nemici',      cd: 60 },
];
