// Potenziamenti comprati con l'ORO durante la partita.
// Il costo del livello L è: base × grow^L (arrotondato).
//   mod(u, L) applica L livelli ai bonus dei potenziamenti (vedi systems/stats.js)
//   help(s, L) spiegazione per il suggerimento (s = statistiche attuali, L = livello)
export const UPGRADES = [
  { id: 'dmg',   icon: '⚔️', name: 'Danno',     base: 8,  grow: 1.32, mod: (u, L) => { u.dmg += 0.30 * L; },
    help: s => `Danno di ogni colpo della torre (e, in proporzione, dei colleghi). +30% per livello. Ora: ${Math.round(s.dmg)} a colpo.` },
  { id: 'rate',  icon: '⚡', name: 'Velocità',  base: 10, grow: 1.40, mod: (u, L) => { u.rate += 0.10 * L; },
    help: s => `Quanti colpi al secondo spara la torre. +10% per livello. Ora: ${s.rate.toFixed(1)} colpi/s.` },
  { id: 'range', icon: '📡', name: 'Gittata',   base: 12, grow: 1.60, max: 8, mod: (u, L) => { u.range += 0.06 * L; },
    help: s => `Quanto lontano spara la torre (il cerchio tratteggiato). +6% per livello, massimo 8 livelli. Ora: ${Math.round(s.range)} m.` },
  { id: 'hp',    icon: '❤️', name: 'Vita',      base: 8,  grow: 1.30, mod: (u, L) => { u.hpFlat += 25 * L; },
    help: s => `Vita massima del palazzo. +25 per livello. Ora: ${Math.round(s.maxHp)}.` },
  { id: 'regen', icon: '💚', name: 'Rigenera',  base: 10, grow: 1.38, mod: (u, L) => { u.regen += 0.8 * L; },
    help: s => `Vita che il palazzo recupera da solo ogni secondo. +0,8 per livello. Ora: ${s.regen.toFixed(1)}/s.` },
];

// Potenziamenti PERMANENTI comprati con i BUONI PASTO (valgono per sempre).
export const META_UPGRADES = [
  { id: 'dmg',    icon: '⚔️', name: 'Esperienza',       desc: '+10% danno',             base: 5,  grow: 1.5, max: 20, mod: (m, L) => { m.dmg += 0.10 * L; } },
  { id: 'hp',     icon: '❤️', name: 'Assicurazione',    desc: '+10% vita',              base: 5,  grow: 1.5, max: 20, mod: (m, L) => { m.hp += 0.10 * L; } },
  { id: 'rate',   icon: '⚡', name: 'Macchinetta caffè', desc: '+5% velocità di fuoco', base: 8,  grow: 1.6, max: 10, mod: (m, L) => { m.rate += 0.05 * L; } },
  { id: 'gold',   icon: '💰', name: 'Contratto migliore', desc: '+10% oro',             base: 6,  grow: 1.5, max: 15, mod: (m, L) => { m.gold += 0.10 * L; } },
  { id: 'start',  icon: '🏦', name: 'TFR anticipato',   desc: '+20 oro iniziale',       base: 4,  grow: 1.4, max: 15, mod: (m, L) => { m.startGold += 20 * L; } },
  { id: 'reroll', icon: '🎲', name: 'Raccomandazione',  desc: '+1 rilancio carte a partita', base: 15, grow: 2.0, max: 5, mod: (m, L) => { m.rerolls += L; } },
];

export function levelCost(def, level) {
  return Math.round(def.base * Math.pow(def.grow, level));
}
