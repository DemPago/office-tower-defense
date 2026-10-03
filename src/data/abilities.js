// Poteri attivi: si usano con un clic (o coi tasti 1-4) e costano MANA,
// che si ricarica da solo nel tempo. L'effetto vero è in systems/abilities.js.
//   mana   costo in mana; cd = piccola pausa dopo l'uso (anti-doppio clic)
//   short  nome breve sotto l'icona; help = spiegazione nel suggerimento
// Mana: massimo e ricarica al secondo.
export const MANA = { max: 120, regen: 5, start: 50 };

export const ABILITIES = [
  { id: 'bomb',    key: '1', icon: '💣', short: 'Bomba',    name: 'Bomba di carta',   desc: 'Danno enorme a tutti i nemici', mana: 60, cd: 2,
    help: 'Colpisce TUTTI i nemici in campo con 12 volte il danno della torre. Ottima quando arriva un gruppo.' },
  { id: 'coffee',  key: '2', icon: '☕', short: 'Caffè',    name: 'Caffè bollente',   desc: 'Rallenta tutti del 60% per 5 s', mana: 35, cd: 2,
    help: 'Tutti i nemici rallentano del 60% per 5 secondi: utile contro i kamikaze in carica.' },
  { id: 'meeting', key: '3', icon: '📅', short: 'Riunione', name: 'Riunione urgente', desc: 'Blocca tutti per 3 s', mana: 45, cd: 2,
    help: 'Tutti i nemici si fermano per 3 secondi (i boss solo 1,2). Salva il cortile quando entrano gli intrusi.' },
  { id: 'audit',   key: '4', icon: '🔍', short: 'Audit',    name: 'Audit fiscale',    desc: 'Dimezza la vita dei nemici', mana: 80, cd: 2,
    help: "Toglie metà della vita a tutti i nemici (ai boss il 15%), ignorando l'armatura. Perfetto contro i tank." },
  // Potere speciale: compare solo quando un boss diventa bestia, è gratis e si usa una volta per bestia.
  { id: 'mitra',   key: '5', icon: '💥', short: 'MITRA',    name: 'Mitragliatrice',   desc: 'La torre spara a raffica per 12 s', mana: 0, cd: 0, special: true,
    help: 'Compare solo contro la FORMA BESTIALE del boss: per 12 secondi la torre spara a raffica, 4 volte più veloce. Gratis, una volta per bestia.' },
];
