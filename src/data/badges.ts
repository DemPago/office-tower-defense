// I Re e i Cesari di Roma — badge progressivi sbloccati completando le wave milestone.
// Ogni badge è condivisibile sui social come immagine generata via canvas.

export interface BadgeDef {
  id: string;
  wave: number;        // wave da completare per sbloccare
  name: string;        // nome del personaggio storico
  role: string;        // ruolo/titolo (riga sotto il nome)
  years: string;       // date storiche
  color: string;       // colore accent del badge
}

export const BADGES: BadgeDef[] = [
  { id: 'romolo',       wave:  10, name: 'Romolo',              role: 'Fondatore di Roma',             years: '753–716 a.C.', color: '#d4a017' },
  { id: 'numa',         wave:  20, name: 'Numa Pompilio',       role: 'Il Re Diplomatico',             years: '716–673 a.C.', color: '#a0c4d4' },
  { id: 'tullo',        wave:  30, name: 'Tullo Ostilio',       role: 'Il Re Guerriero',               years: '673–641 a.C.', color: '#c44030' },
  { id: 'anco',         wave:  40, name: 'Anco Marzio',         role: 'Il Re Costruttore',             years: '641–616 a.C.', color: '#7ab87a' },
  { id: 'tarqprisco',   wave:  50, name: 'Tarquinio Prisco',    role: "L'Ambizioso",                   years: '616–578 a.C.', color: '#b080c8' },
  { id: 'servio',       wave:  60, name: 'Servio Tullio',       role: 'Il Re Riformatore',             years: '578–534 a.C.', color: '#4090c0' },
  { id: 'tarqsuperbo',  wave:  70, name: 'Tarquinio il Superbo',role: 'Il Tiranno — Fine dei Re',      years: '534–509 a.C.', color: '#883030' },
  { id: 'cesare',       wave:  80, name: 'Giulio Cesare',       role: 'Il Condottiero',                years: '100–44 a.C.', color: '#c8a030' },
  { id: 'augusto',      wave:  90, name: 'Augusto',             role: 'Primo Imperatore di Roma',      years: '63 a.C.–14 d.C.', color: '#e8c060' },
  { id: 'elagabalo',    wave: 100, name: 'Elio Gabalo',         role: 'Il Più Strano di Tutti',        years: '203–222 d.C.', color: '#c060a8' },
  { id: 'costantino',   wave: 120, name: 'Costantino',          role: "L'Ultimo Grande Imperatore",    years: '272–337 d.C.', color: '#5090e0' },
  { id: 'romaugustolo', wave: 150, name: 'Romolo Augustolo',    role: "L'Ultimo Imperatore d'Occidente", years: '476 d.C.', color: '#888888' },
];

export function badgeForWave(wave: number): BadgeDef | null {
  return BADGES.find(b => b.wave === wave) ?? null;
}

export function badgesUpToWave(wave: number): BadgeDef[] {
  return BADGES.filter(b => b.wave <= wave);
}
