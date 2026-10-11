// Definizioni dei look (aspetto visivo) di tutti i personaggi.
// Separato da people.ts per tenere i dati lontani dal codice di disegno.

const SKIN = { light: '#e0b08a', mid: '#c8946b', tan: '#a8704a', dark: '#7a4a2e' };

// ─── Look ───────────────────────────────────────────────────────
//   hair/hairStyle  colore e taglio: short | messy | slick | bun | long | bald | wild
//   top             giacca o maglia; shirt = colletto/camicia; tie = cravatta (o null)
//   sleeves         'short' = maniche corte (braccia nude)
//   pants, skirt    pantaloni o gonna; shoes = scarpe
//   build           normal | fat | thin
//   glasses         glasses | shades | goggles
//   facial          beard | mustache | longbeard
//   hat             hardhat | wizard | tophat | cap  (+ hatColor)
//   vest            giubbotto catarifrangente; coat = camice lungo
//   item            oggetto in mano
//   angry           faccia cattiva (i nemici); altrimenti sorride
export const LOOKS = {
  // Nemici
  stagista:   { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'messy', top: '#b9b4a6', shirt: '#b9b4a6', sleeves: 'short', pants: '#3a4a6a', shoes: '#d9d4c7', item: 'mug', lanyard: true, angry: true },
  impiegato:  { skin: SKIN.mid, hair: '#2a2a2e', hairStyle: 'short', glasses: 'glasses', top: '#55585f', shirt: '#d9d4c7', tie: '#2f4f8f', pants: '#44474e', item: 'briefcase', angry: true },
  hr:         { skin: SKIN.light, hair: '#1e1e22', hairStyle: 'bun', top: '#7a1f2b', shirt: '#e8e2d0', skirt: '#2a2a2e', shoes: '#7a1f2b', item: 'clipboard', angry: true },
  consulente: { skin: SKIN.tan, hair: '#141416', hairStyle: 'slick', glasses: 'shades', top: '#1f2a44', shirt: '#e8e2d0', tie: '#b8592a', pants: '#1f2a44', build: 'thin', item: 'phone', angry: true },
  contabile:  { skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'bald', facial: 'beard', glasses: 'glasses', top: '#5a4632', shirt: '#d9d4c7', tie: '#3e6b2a', pants: '#3a3226', build: 'fat', item: 'calculator', angry: true },
  avvocato:   { skin: SKIN.light, hair: '#8a8d93', hairStyle: 'slick', top: '#141416', shirt: '#e8e2d0', tie: '#d7263d', pants: '#141416', item: 'briefcase', itemColor: '#141416', angry: true },
  ingegnere:  { skin: SKIN.dark, hair: '#141416', hairStyle: 'short', facial: 'mustache', hat: 'hardhat', hatColor: '#e8e2d0', top: '#2f4f6f', shirt: '#2f4f6f', vest: '#e8641b', pants: '#3a4a6a', item: 'wrench', angry: true },

  tecnico:    { skin: SKIN.mid, hair: '#5a3a22', hairStyle: 'short', glasses: 'glasses', top: '#2f4f8f', shirt: '#2f4f8f', sleeves: 'short', pants: '#3a3226', item: 'cable', lanyard: true, angry: true },
  sistemista: { skin: SKIN.light, hair: '#141416', hairStyle: 'messy', facial: 'beard', top: '#3a3c42', shirt: '#3a3c42', pants: '#2a2a2e', headphones: true, item: 'keyboard', angry: true },
  venditore:  { skin: SKIN.tan, hair: '#141416', hairStyle: 'slick', top: '#4a5a6a', shirt: '#e8e2d0', tie: '#f2b705', pants: '#4a5a6a', shoes: '#5a3a22', build: 'thin', item: 'phone', angry: true },
  marketing:  { skin: SKIN.light, hair: '#d9b45a', hairStyle: 'long', glasses: 'glasses', top: '#e8641b', shirt: '#e8641b', pants: '#2a2a2e', shoes: '#d9d4c7', item: 'flyers', angry: true },
  capovendite:{ skin: SKIN.mid, hair: '#2a2a2e', hairStyle: 'slick', facial: 'mustache', top: '#5a4632', shirt: '#e8e2d0', tie: '#f2b705', pants: '#3a3226', build: 'fat', item: 'briefcase', itemColor: '#a67c00', angry: true },
  guardia:    { skin: SKIN.tan, hair: '#141416', hairStyle: 'short', hat: 'cap', hatColor: '#1f2a44', top: '#2f3f5f', shirt: '#2f3f5f', tie: '#141416', pants: '#1f2a44', item: 'baton', badge: true, angry: true },
  vigilante:  { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'short', facial: 'mustache', hat: 'cap', hatColor: '#141416', top: '#3a3c42', shirt: '#3a3c42', vest: '#c9d12e', pants: '#2a2a2e', item: 'flashlight', angry: true },
  buttafuori: { skin: SKIN.dark, hair: '#141416', hairStyle: 'bald', glasses: 'shades', top: '#141416', shirt: '#141416', sleeves: 'short', pants: '#2a2a2e', build: 'fat', angry: true },
  assistente: { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'long', top: '#d9d4c7', shirt: '#d9d4c7', pants: '#2a2a2e', build: 'thin', item: 'mug', lanyard: true, angry: true },
  segretaria: { skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'bun', glasses: 'glasses', top: '#5d275d', shirt: '#e8e2d0', skirt: '#3a3c42', shoes: '#141416', item: 'phone', angry: true },
  vicedirettore:{ skin: SKIN.light, hair: '#8a8d93', hairStyle: 'slick', top: '#141416', shirt: '#e8e2d0', tie: '#2f4f8f', pants: '#141416', build: 'fat', item: 'briefcase', itemColor: '#141416', angry: true },

  rider:      { skin: SKIN.tan, hair: '#141416', hairStyle: 'short', hat: 'cap', hatColor: '#3e6b2a', top: '#7bd332', shirt: '#7bd332', sleeves: 'short', pants: '#2a2a2e', shoes: '#d9d4c7', build: 'thin', item: 'box', angry: true },
  funzionario:{ skin: SKIN.light, hair: '#5a3a22', hairStyle: 'bald', facial: 'mustache', glasses: 'glasses', top: '#4a4743', shirt: '#d9d4c7', tie: '#7a1f2b', pants: '#4a4743', item: 'stamp', angry: true },
  devops:     { skin: SKIN.mid, hair: '#2a2a2e', hairStyle: 'long', facial: 'beard', top: '#5d275d', shirt: '#5d275d', pants: '#3a4a6a', shoes: '#d9d4c7', item: 'laptop', angry: true },
  magazziniere:{ skin: SKIN.tan, hair: '#5a3a22', hairStyle: 'short', facial: 'beard', hat: 'cap', hatColor: '#8a3b1e', top: '#3a3c42', shirt: '#3a3c42', vest: '#e8641b', pants: '#3a3226', build: 'fat', item: 'box', angry: true },
  caposquadra:{ skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'short', facial: 'mustache', hat: 'cap', hatColor: '#7a1f2b', top: '#2f3f5f', shirt: '#2f3f5f', tie: '#7a1f2b', pants: '#1f2a44', item: 'megaphone', badge: true, angry: true },
  portavoce:  { skin: SKIN.light, hair: '#d9b45a', hairStyle: 'bun', top: '#2f4f8f', shirt: '#e8e2d0', skirt: '#2f4f8f', shoes: '#141416', item: 'phone', angry: true },

  // Boss
  teamleader: { skin: SKIN.mid, hair: '#8a3b1e', hairStyle: 'short', build: 'huge', top: '#7a1f2b', shirt: '#e8e2d0', tie: '#141416', pants: '#2a2a2e', headphones: true, item: 'megaphone', weapon: 'mazza',         scar: true, angry: true },
  capoarea:   { skin: SKIN.tan, hair: '#2a2a2e', hairStyle: 'bald', facial: 'mustache', build: 'huge', top: '#3a3c42', shirt: '#d9d4c7', tie: '#a67c00', pants: '#2a2a2e', chain: '#f2b705', item: 'phone', weapon: 'palla_ferrata', angry: true },
  direttore:  { skin: SKIN.light, hair: '#8a8d93', hairStyle: 'slick', build: 'huge', top: '#1b1b1e', shirt: '#e8e2d0', tie: '#7a0f1c', pants: '#1b1b1e', cape: '#5a0f18', capeTrim: '#a67c00', item: 'cigar', weapon: 'spada',         scar: true, angry: true },
  leadership: { skin: SKIN.mid, hair: '#141416', hairStyle: 'slick', glasses: 'shades', build: 'fat', top: '#2a2a2e', shirt: '#e8e2d0', tie: '#f2b705', pants: '#2a2a2e', chain: '#f2b705', item: 'phone', weapon: 'pistola',        angry: true },
  dg:         { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'slick', glasses: 'shades', build: 'huge', top: '#0d0d0f', shirt: '#e8e2d0', tie: '#f2b705', pants: '#0d0d0f', cape: '#141416', capeTrim: '#f2b705', chain: '#f2b705', item: 'cigar', weapon: 'fucile',         angry: true },
  consiglio:  { skin: SKIN.light, hair: '#8a8d93', hairStyle: 'bald', glasses: 'glasses', top: '#3a3c42', shirt: '#e8e2d0', tie: '#2f4f8f', pants: '#3a3c42', chain: '#c0c4cc', item: 'briefcase', weapon: 'arco',           angry: true },
  ceo:        { skin: SKIN.mid, hair: '#8a8d93', hairStyle: 'short', glasses: 'glasses', build: 'huge', top: '#141416', shirt: '#141416', pants: '#3a4a6a', shoes: '#d9d4c7', headphones: true, item: 'laptop', weapon: 'laser',          angry: true },
  socio:      { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'bald', facial: 'mustache', monocle: true, hat: 'tophat', hatColor: '#0d0d0f', build: 'huge', top: '#2a2a2e', shirt: '#e8e2d0', tie: '#f2b705', pants: '#2a2a2e', cape: '#3a1a3a', capeTrim: '#f2b705', chain: '#f2b705', item: 'cane', weapon: 'fiocina', angry: true },
  docbrown:   { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'wild', glasses: 'goggles', top: '#3a3226', shirt: '#d9d4c7', coat: '#e8e2d0', pants: '#3a3226', item: 'device', weapon: 'balestra', angry: true },
  galattico:  { skin: SKIN.mid, hair: '#c0c4cc', hairStyle: 'slick', glasses: 'shades', build: 'huge', top: '#5d275d', shirt: '#2de2e6', tie: '#2de2e6', pants: '#3a1a3a', shoes: '#2de2e6', cape: '#1a1240', capeTrim: '#2de2e6', capeStars: true, chain: '#2de2e6', weapon: 'laser', angry: true },

  // Focal Point: mini-boss prima di ogni Frontier Manager
  focal_m: { skin: SKIN.dark,  hair: '#141416', hairStyle: 'short', glasses: 'shades', build: 'fat', top: '#1b1b1e', shirt: '#e8e2d0', tie: '#d7263d', pants: '#1b1b1e', chain: '#f2b705', badge: true, scar: true, item: 'megaphone', angry: true },
  focal_f: { skin: SKIN.light, hair: '#2a2a2e', hairStyle: 'bun',   glasses: 'glasses', build: 'fat', top: '#3a1a3a', shirt: '#e8e2d0', skirt: '#3a1a3a', shoes: '#141416', chain: '#f2b705', badge: true, item: 'phone', angry: true },

  // Personaggi giocabili (sul tetto del palazzo)
  peppe:      { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'bald', glasses: 'glasses', top: '#4a5a70', shirt: '#e8e2d0', tie: '#2f4f8f', vest: '#2a3f55', pants: '#3a3226', headphones: true },
  dem:        { skin: SKIN.tan, hair: '#141416', hairStyle: 'slick', facial: 'stubble', top: '#e8e2d0', shirt: '#e8e2d0', sleeves: 'short', chain: '#f2b705', pants: '#2a3a5a', shoes: '#5a3a22', item: 'mug' },
  nando:      { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'curly', glasses: 'shades', top: '#3e6b2a', shirt: '#3e6b2a', pants: '#3a4a6a', shoes: '#d9d4c7', item: 'crossbow' },
  tony:       { skin: SKIN.tan, hair: '#0d0d0f', hairStyle: 'slick', scar: true, top: '#e8e2d0', shirt: '#b02030', chain: '#f2b705', pants: '#e8e2d0', shoes: '#e8e2d0', item: 'cigar' },
  vanessa:    { skin: SKIN.light, hair: '#f0d068', hairStyle: 'long', glasses: 'shades', top: '#c03060', shirt: '#e8e2d0', skirt: '#141416', shoes: '#c03060', chain: '#f2b705', item: 'phone' },
  clara:      { skin: SKIN.light, hair: '#1e1e22', hairStyle: 'bob', glasses: 'big', top: '#257179', shirt: '#e8e2d0', pants: '#2a2a2e', item: 'laptop' },
  pesce:      { skin: '#4a8a9a', hair: '#2f6070', hairStyle: 'fin', glasses: 'fish', gills: true, top: '#ff7b1c', shirt: '#ff7b1c', sleeves: 'short', pants: '#f2b705', shoes: '#d9b45a' },
  frank:      { skin: SKIN.light, hair: '#1e1e22', hairStyle: 'short', top: '#3a3c42', shirt: '#e8e2d0', tie: '#2de2e6', pants: '#2a2a2e', shoes: '#141416', item: 'laptop' },
  cirios:     { skin: SKIN.mid, hair: '#a0a4a8', hairStyle: 'slick', facial: 'mustache', glasses: 'glasses', top: '#2a2a2e', shirt: '#c8c0b0', pants: '#3a3226', shoes: '#141416', item: 'invoice' },
  rob:        { skin: SKIN.dark, hair: '#141416', hairStyle: 'short', build: 'fat', top: '#1f2a44', shirt: '#1f2a44', sleeves: 'short', pants: '#141416', shoes: '#141416', scar: true, weapon: 'spada' },

  // Protagonista (vecchio look) e colleghi (rinforzi)
  player:     { skin: SKIN.mid, hair: '#141416', hairStyle: 'short', hat: 'hardhat', hatColor: '#f2b705', top: '#2f4f6f', shirt: '#2f4f6f', vest: '#f2b705', pants: '#3a4a6a' },
  pm:         { skin: SKIN.light, hair: '#5a3a22', hairStyle: 'short', glasses: 'glasses', top: '#3a6ea5', shirt: '#e8e2d0', tie: '#141416', pants: '#2a2a2e', item: 'laptop' },
  sm:         { skin: SKIN.tan, hair: '#141416', hairStyle: 'short', hat: 'cap', hatColor: '#141416', top: '#3e6b2a', shirt: '#3e6b2a', pants: '#3a3226', item: 'crossbow' },
  dev:        { skin: SKIN.light, hair: '#8a3b1e', hairStyle: 'messy', facial: 'beard', top: '#2a2a2e', shirt: '#2a2a2e', pants: '#3a4a6a', shoes: '#d9d4c7', headphones: true, item: 'pc' },
  agile:      { skin: SKIN.mid, hair: '#e8e2d0', hairStyle: 'short', facial: 'longbeard', hat: 'wizard', hatColor: '#2f4f8f', top: '#2f4f8f', shirt: '#2f4f8f', pants: '#2f4f8f', shoes: '#d7263d', item: 'sticky' },
  scrum:      { skin: SKIN.light, hair: '#e8e2d0', hairStyle: 'short', facial: 'longbeard', hat: 'wizard', hatColor: '#7a1f2b', top: '#7a1f2b', shirt: '#7a1f2b', pants: '#7a1f2b', item: 'clipboard' },
};

export interface Look {
  skin: string;
  hair: string;
  hairStyle: string;
  top: string;
  shirt: string;
  tie?: string | null;
  sleeves?: string;
  pants?: string;
  skirt?: string;
  shoes?: string;
  build?: string;
  glasses?: string;
  facial?: string;
  hat?: string;
  hatColor?: string;
  vest?: string;
  coat?: string;
  item?: string;
  itemColor?: string;
  angry?: boolean;
  lanyard?: boolean;
  badge?: boolean;
  chain?: string;
  cape?: string;
  capeTrim?: string;
  capeStars?: boolean;
  headphones?: boolean;
  scar?: boolean;
  monocle?: boolean;
  weapon?: string;
  zombie?: boolean;
  stage?: number;
  gills?: boolean;
}
