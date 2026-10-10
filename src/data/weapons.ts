// Armi della torre: ogni personaggio ha la sua (data/heroes.js). Cambiano COME spara
// il palazzo, non QUANTO: ogni arma toglie in media lo stesso danno al secondo.
// Le armi che colpiscono più nemici dividono il danno tra loro.
//   dmg, rate, range  moltiplicatori di danno, colpi al secondo e gittata
//   kind              comportamento del colpo (vedi systems/shooting.js)
//   pierce            (balestra) quanti nemici in più attraversa; i successivi prendono pierceDmg
//   splash, splashR   (onda energetica) danno ad area (frazione) e raggio dell'esplosione
//   fan               (pugnali) quanti pugnali per lancio, il danno si divide tra loro
//   charm             (cuori) secondi in cui il nemico colpito resta fermo, innamorato
// ATTENZIONE: la gittata deve restare sopra quella dei cecchini (165), o ti colpiscono da fuori tiro.
// I numeri sono tarati con `node tools/sim.mjs armi`: tutte devono arrivare circa alla stessa ondata.

export interface WeaponDef {
  id: string;
  icon: string;
  name: string;
  kind: string;
  dmg: number;
  rate: number;
  range: number;
  desc: string;
  pierce?: number;
  pierceDmg?: number;
  splash?: number;
  splashR?: number;
  fan?: number;
  charm?: number;
}

export const WEAPONS: WeaponDef[] = [
  { id: 'pistol',   icon: '🔫', name: 'Pistola',         kind: 'tower',  dmg: 0.88, rate: 1,    range: 1.05,
    desc: 'Equilibrata: colpi rapidi a un bersaglio alla volta.' },
  { id: 'crossbow', icon: '🏹', name: 'Balestra',        kind: 'xbow',   dmg: 1.95,  rate: 0.42, range: 1.1, pierce: 2, pierceDmg: 0.2,
    desc: 'Lenta e potente: il dardo trapassa i nemici in fila (perdendo forza).' },
  { id: 'laser',    icon: '🔴', name: 'Laser',           kind: 'laser',  dmg: 0.28, rate: 3.6,  range: 1.05,
    desc: 'Raggio istantaneo e velocissimo: non sbaglia mai, ogni colpo è debole.' },
  { id: 'sonic',    icon: '🔊', name: 'Onda sonica',     kind: 'wave',   dmg: 2.2,  rate: 0.45, range: 1.05,
    desc: "Un'onda colpisce TUTTI i nemici nella gittata, dividendo il danno tra loro." },
  { id: 'energy',   icon: '⚡', name: 'Onda energetica', kind: 'energy', dmg: 1.35, rate: 0.55, range: 1.05, splash: 0.35, splashR: 34,
    desc: 'Una sfera di energia lenta che esplode sul bersaglio, ferendo anche chi è vicino.' },
  { id: 'daggers',  icon: '🗡️', name: 'Pugnali',         kind: 'dagger', dmg: 1.05, rate: 1,    range: 1.05, fan: 3,
    desc: 'Lancia 3 pugnali a ventaglio su 3 nemici diversi (il danno si divide).' },
  { id: 'hearts',   icon: '💖', name: 'Lancio di cuori', kind: 'heart',  dmg: 0.68,  rate: 1.1,  range: 1.05, charm: 1.2,
    desc: 'I nemici colpiti si innamorano e restano fermi per un attimo (i boss meno), ma il danno è più basso.' },
];

export function weaponDef(id: string): WeaponDef {
  return WEAPONS.find(w => w.id === id) ?? WEAPONS[0];
}
