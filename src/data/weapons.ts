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
  { id: 'pistol',   icon: '🔫', name: 'Pistol',        kind: 'tower',  dmg: 0.88, rate: 1,    range: 1.05,
    desc: 'Balanced. Rapid single-target fire — reliable at any range.' },
  { id: 'crossbow', icon: '🏹', name: 'Crossbow',      kind: 'xbow',   dmg: 1.95,  rate: 0.42, range: 1.1, pierce: 2, pierceDmg: 0.2,
    desc: 'Slow and brutal. The bolt pierces through a line of enemies, losing power with each.' },
  { id: 'laser',    icon: '🔴', name: 'Laser',         kind: 'laser',  dmg: 0.28, rate: 3.6,  range: 1.05,
    desc: 'Instant. Never misses. Each shot is weak — the volume is the point.' },
  { id: 'sonic',    icon: '🔊', name: 'Sonic Wave',    kind: 'wave',   dmg: 2.2,  rate: 0.45, range: 1.05,
    desc: 'A wave that hits EVERY enemy in range at once. Damage splits between them.' },
  { id: 'energy',   icon: '⚡', name: 'Energy Orb',   kind: 'energy', dmg: 1.35, rate: 0.55, range: 1.05, splash: 0.35, splashR: 34,
    desc: 'A slow orb that detonates on impact, dealing splash damage to nearby enemies.' },
  { id: 'daggers',  icon: '🗡️', name: 'Daggers',       kind: 'dagger', dmg: 1.05, rate: 1,    range: 1.05, fan: 3,
    desc: 'Throws 3 daggers in a spread, each hitting a different target. Damage splits.' },
  { id: 'hearts',   icon: '💖', name: 'Heart Toss',   kind: 'heart',  dmg: 0.68,  rate: 1.1,  range: 1.05, charm: 1.2,
    desc: 'Targets fall in love and freeze briefly. Bosses resist. Damage is low — the crowd control is the weapon.' },
];

export function weaponDef(id: string): WeaponDef {
  return WEAPONS.find(w => w.id === id) ?? WEAPONS[0];
}
