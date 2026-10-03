// Poteri attivi: si usano con un clic (o coi tasti 1-4) e poi si ricaricano.
// L'effetto vero è in systems/abilities.js.
//   cd     ricarica in secondi
//   short  nome breve sotto l'icona; help = spiegazione nel suggerimento
export const ABILITIES = [
  { id: 'bomb',    key: '1', icon: '💣', short: 'Bomba',    name: 'Bomba di carta',   desc: 'Danno enorme a tutti i nemici', cd: 25,
    help: 'Colpisce TUTTI i nemici in campo con 12 volte il danno della torre. Ottima quando arriva un gruppo.' },
  { id: 'coffee',  key: '2', icon: '☕', short: 'Caffè',    name: 'Caffè bollente',   desc: 'Rallenta tutti del 60% per 5 s', cd: 30,
    help: 'Tutti i nemici rallentano del 60% per 5 secondi: utile contro i kamikaze in carica.' },
  { id: 'meeting', key: '3', icon: '📅', short: 'Riunione', name: 'Riunione urgente', desc: 'Blocca tutti per 3 s', cd: 40,
    help: 'Tutti i nemici si fermano per 3 secondi (i boss solo 1,2). Salva il cortile quando entrano gli intrusi.' },
  { id: 'audit',   key: '4', icon: '🔍', short: 'Audit',    name: 'Audit fiscale',    desc: 'Dimezza la vita dei nemici', cd: 60,
    help: "Toglie metà della vita a tutti i nemici (ai boss il 15%), ignorando l'armatura. Perfetto contro i tank." },
];
