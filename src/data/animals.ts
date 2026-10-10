// Animali dei boss: ogni boss arriva con una scorta del suo animale e, quando
// gli finisci la vita, torna in campo trasformato nello stesso animale GIGANTE.
//   kind    forma del disegno: quad (quattro zampe) | ape | bird | snake | dragon
//   speed   velocità della scorta (la forma gigante va a metà)
//   colori e dettagli: vedi render/animals.js
export const ANIMALS = {
  pitbull:  { name: 'PITBULL',   kind: 'quad',  speed: 52, fur: '#8a6a4a', belly: '#c8a47a', len: 26, bh: 11, leg: 8,  head: { w: 11, h: 10, snout: 5 }, ear: 'pointy', tail: 'short', collar: true },
  toro:     { name: 'TORO',      kind: 'quad',  speed: 40, fur: '#3a2a1e', belly: '#5a4430', len: 32, bh: 14, leg: 9,  head: { w: 12, h: 11, snout: 4 }, ear: 'side', horns: true, ring: true, tail: 'tuft' },
  // il lupo ringhia: fauci spalancate, pelo ritto sulla schiena, cicatrici, bava
  lupo:     { name: 'LUPO',      kind: 'quad',  speed: 56, fur: '#3a3c42', belly: '#6e6a64', len: 28, bh: 12, leg: 10, head: { w: 11, h: 10, snout: 8 }, ear: 'pointy', tail: 'bushy', snarl: true, hackles: true, scars: true },
  gorilla:  { name: 'GORILLA',   kind: 'ape',   speed: 36, fur: '#2a2a2e', belly: '#5a5a62', face: '#7a6a62', len: 24, bh: 16, leg: 8, head: { w: 12, h: 11, snout: 0 } },
  orso:     { name: 'ORSO',      kind: 'quad',  speed: 38, fur: '#4a3420', belly: '#6b4a2b', len: 32, bh: 15, leg: 9,  head: { w: 13, h: 11, snout: 4 }, ear: 'round', tail: 'short' },
  corvo:    { name: 'CORVO',     kind: 'bird',  speed: 60, fur: '#141416', belly: '#2f3f5f' },
  serpente: { name: 'SERPENTE',  kind: 'snake', speed: 34, fur: '#3e6b2a', belly: '#d9c040' },
  leone:    { name: 'LEONE',     kind: 'quad',  speed: 48, fur: '#c08a3e', belly: '#e0b878', len: 30, bh: 13, leg: 10, head: { w: 12, h: 11, snout: 4 }, ear: 'round', mane: '#7a4a1e', tail: 'tuft' },
  ratto:    { name: 'RATTO',     kind: 'quad',  speed: 58, fur: '#6b5a50', belly: '#a8968a', len: 20, bh: 8,  leg: 5,  head: { w: 8, h: 7, snout: 5 }, ear: 'round', tail: 'long', tailColor: '#d89a9a' },
  drago:    { name: 'DRAGO',     kind: 'dragon', speed: 44, fur: '#2a1a5a', belly: '#2de2e6', len: 30, bh: 12, leg: 9, head: { w: 11, h: 9, snout: 6 }, ear: 'none', horns: true, tail: 'long', tailColor: '#2a1a5a' },
};
