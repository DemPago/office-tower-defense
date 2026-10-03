// Armi della torre: si scelgono nel menu (meta.weapon). Cambiano COME spara il palazzo;
// danno e velocità di base vengono dalle statistiche, qui ci sono solo i moltiplicatori.
//   dmg, rate, range  moltiplicatori di danno, colpi al secondo e gittata
//   kind              aspetto e comportamento del colpo (vedi systems/shooting.js)
//   pierce            (balestra) quanti nemici in più attraversa il dardo
// ATTENZIONE: la gittata deve restare sopra quella dei cecchini (165), o ti colpiscono da fuori tiro.
export const WEAPONS = [
  { id: 'pistol',   icon: '🔫', name: 'Pistola',         kind: 'tower', dmg: 1,    rate: 1,    range: 1,
    desc: 'Equilibrata: colpi rapidi a un bersaglio alla volta.' },
  { id: 'crossbow', icon: '🏹', name: 'Balestra',        kind: 'xbow',  dmg: 1.7,  rate: 0.42, range: 1.1,  pierce: 2,
    desc: 'Lenta ma potente: il dardo trapassa fino a 3 nemici in fila.' },
  { id: 'laser',    icon: '🔴', name: 'Laser',           kind: 'laser', dmg: 0.36, rate: 3.6,  range: 1.05,
    desc: 'Raggio istantaneo e velocissimo: non sbaglia mai, ma ogni colpo è debole.' },
  { id: 'wave',     icon: '🌀', name: 'Onda energetica', kind: 'wave',  dmg: 1.15, rate: 0.45, range: 1.05,
    desc: 'Un\'onda colpisce TUTTI i nemici nella gittata, ma lentamente e con poco danno.' },
];

export function weaponDef(id) {
  return WEAPONS.find(w => w.id === id) || WEAPONS[0];
}
