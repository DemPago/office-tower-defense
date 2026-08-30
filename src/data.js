// ============================================================
// DATA.JS — Definizione torri, nemici, boss, ondate, citazioni
// ============================================================

// ============================================================
// SISTEMA UPGRADE TORRI
// 5 livelli: Junior(1) > Middle(2) > Professional(3) > Senior(4) > King(5)
// Auto-upgrade ogni 15 ondate OPPURE manuale con costo: 100/200/400/800 oro
// Moltiplicatori per livello: danno x1 / x1.5 / x2.2 / x3.2 / x4.8
//                              range x1 / x1.1 / x1.2 / x1.35 / x1.5
//                              fireRate (diviso)  x1 / x0.9 / x0.8 / x0.7 / x0.6
// ============================================================
const UPGRADE_LEVELS = [
  { level: 1, name: 'Junior',          dmgMult: 1.0,  rangeMult: 1.0,  rateMult: 1.0,  icon: '🟫' },
  { level: 2, name: 'Middle',          dmgMult: 1.5,  rangeMult: 1.1,  rateMult: 0.9,  icon: '🟩' },
  { level: 3, name: 'Professional',    dmgMult: 2.2,  rangeMult: 1.2,  rateMult: 0.8,  icon: '🟦' },
  { level: 4, name: 'Senior',          dmgMult: 3.2,  rangeMult: 1.35, rateMult: 0.7,  icon: '🟨' },
  { level: 5, name: 'King of Office',  dmgMult: 4.8,  rangeMult: 1.5,  rateMult: 0.6,  icon: '👑' },
];
const UPGRADE_COSTS = [null, 100, 200, 400, 800]; // costo per passare al livello successivo (indice = livello attuale)

// ---- TORRI FISICHE (costano ORO) ----
const TOWER_DEFS = [
  // --- PROJECT MANAGER — laser singolo, lunga gittata ---
  {
    id: 'pm',
    name: 'Project Manager',
    icon: '📊',
    cost: 80,
    damage: 25,
    range: 160,
    fireRate: 700,
    projectileSpeed: 9,
    projectileColor: '#e74c3c',
    projectileSize: 4,
    bodyColor: '#c0392b',
    projectileType: 'laser',    // visuale raggio laser
    desc: 'Spara laser di deadline. Cadenza alta, ottima gittata.',
    sellValue: 40,
    isMagic: false,
  },
  // --- SERVICE MANAGER — balestra, danno alto + rallenta ---
  {
    id: 'sm',
    name: 'Service Manager',
    icon: '🎯',
    cost: 120,
    damage: 55,
    range: 140,
    fireRate: 1600,
    projectileSpeed: 7,
    projectileColor: '#27ae60',
    projectileSize: 5,
    bodyColor: '#1e8449',
    projectileType: 'bolt',     // freccia balestra
    slow: 0.6,
    slowDuration: 1800,
    desc: 'Balestra aziendale. Danno alto, rallenta i nemici con burocrazia.',
    sellValue: 60,
    isMagic: false,
  },
  // --- DEV — lancia computer, AOE + pierce ---
  {
    id: 'dev',
    name: 'Dev',
    icon: '💻',
    cost: 150,
    damage: 45,
    range: 130,
    fireRate: 2200,
    projectileSpeed: 5,
    projectileColor: '#8e44ad',
    projectileSize: 9,
    bodyColor: '#6c3483',
    projectileType: 'pc',       // computer volante
    aoe: 55,
    pierce: 2,
    desc: 'Lancia computer portatili. Danno area + attraversa 2 nemici.',
    sellValue: 75,
    isMagic: false,
  },

  // ---- MAGHI FACILITATORI (costano MANA) ----
  // Questi non attaccano ma buffano le torri vicine consumando MP/s
  {
    id: 'mago_agile',
    name: 'Mago Agile',
    icon: '🏃',
    cost: 0,
    manaCost: 60,               // costo in mana per piazzarlo
    mpPerSec: 2,                // MP consumati al secondo quando attivo
    range: 130,
    buffType: 'fireRate',
    buffValue: 0.4,             // +40% velocita' fuoco alle torri nel raggio
    bodyColor: '#27ae60',
    desc: 'Velocita\' fuoco +40% alle torri vicine. Consuma 2 MP/s.',
    sellValue: 30,              // restituisce mana? no, restituisce oro parziale
    isMagic: true,
    activeByDefault: true,
  },
  {
    id: 'mago_scrum',
    name: 'Mago Scrum',
    icon: '📋',
    cost: 0,
    manaCost: 80,
    mpPerSec: 3,
    range: 120,
    buffType: 'damage',
    buffValue: 0.5,             // +50% danno alle torri nel raggio
    bodyColor: '#2980b9',
    desc: 'Danno +50% alle torri vicine. Consuma 3 MP/s.',
    sellValue: 40,
    isMagic: true,
    activeByDefault: true,
  },
  {
    id: 'mago_itil',
    name: 'Mago ITIL',
    icon: '📚',
    cost: 0,
    manaCost: 120,
    mpPerSec: 5,
    range: 110,
    buffType: 'noCooldown',     // torri nel raggio ignorano cooldown (fuoco continuo)
    buffValue: 1,
    bodyColor: '#8e44ad',
    desc: 'Azzera cooldown torri vicine. Consuma 5 MP/s. POTENTISSIMO.',
    sellValue: 60,
    isMagic: true,
    activeByDefault: false,    // off di default, troppo potente
  },
  {
    id: 'mago_vision',
    name: 'Mago Vision',
    icon: '🔭',
    cost: 0,
    manaCost: 40,
    mpPerSec: 1,
    range: 150,
    buffType: 'range',
    buffValue: 0.35,            // +35% raggio alle torri vicine
    bodyColor: '#e67e22',
    desc: 'Raggio +35% alle torri vicine. Consuma 1 MP/s.',
    sellValue: 20,
    isMagic: true,
    activeByDefault: true,
  },
];

// ---- NEMICI BASE ----
// colorBody, colorHead, colorShirt definiscono il look cartoon
const ENEMY_BASE = [
  // --- ORDINARI ---
  {
    id: 'stagista',
    name: 'Stagista',
    hp: 60, speed: 1.2, reward: 5,
    colorBody: '#3498db', colorHead: '#f5cba7', colorShirt: '#3498db',
    size: 14, isBoss: false,
  },
  {
    id: 'impiegato',
    name: 'Impiegato Generico',
    hp: 100, speed: 1.0, reward: 8,
    colorBody: '#2ecc71', colorHead: '#f5cba7', colorShirt: '#2ecc71',
    size: 15, isBoss: false,
  },
  {
    id: 'hr',
    name: 'Responsabile HR',
    hp: 150, speed: 0.9, reward: 10,
    colorBody: '#e67e22', colorHead: '#f5cba7', colorShirt: '#e67e22',
    size: 15, isBoss: false,
  },
  {
    id: 'contabile',
    name: 'Contabile',
    hp: 200, speed: 0.7, reward: 12,
    colorBody: '#9b59b6', colorHead: '#f5cba7', colorShirt: '#9b59b6',
    size: 16, isBoss: false,
  },
  {
    id: 'avvocato',
    name: 'Avvocato Aziendale',
    hp: 280, speed: 0.85, reward: 15,
    colorBody: '#1abc9c', colorHead: '#f5cba7', colorShirt: '#1a1a1a',
    size: 16, isBoss: false,
  },
  {
    id: 'consulente',
    name: 'Consulente Esterno',
    hp: 350, speed: 1.1, reward: 18,
    colorBody: '#e74c3c', colorHead: '#f5cba7', colorShirt: '#fff',
    size: 16, isBoss: false,
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    hp: 450, speed: 1.0, reward: 22,
    colorBody: '#f39c12', colorHead: '#f5cba7', colorShirt: '#f39c12',
    size: 17, isBoss: false,
  },
  {
    id: 'vice_direttore',
    name: 'Vice-Direttore',
    hp: 600, speed: 0.9, reward: 28,
    colorBody: '#2c3e50', colorHead: '#f5cba7', colorShirt: '#2c3e50',
    size: 18, isBoss: false,
  },
  {
    id: 'consulente_senior',
    name: 'Senior Consultant',
    hp: 800, speed: 1.0, reward: 35,
    colorBody: '#16a085', colorHead: '#f5cba7', colorShirt: '#16a085',
    size: 18, isBoss: false,
  },
  {
    id: 'super_stagista',
    name: 'Super Stagista',
    hp: 500, speed: 1.8, reward: 30,
    colorBody: '#3498db', colorHead: '#f5cba7', colorShirt: '#ff0',
    size: 14, isBoss: false,
  },

  // --- SOCI DRAGHETTI (ondate 71-79 e minion boss 80) ---
  {
    id: 'draghetto_fulmine',
    name: 'Socio Draghetto ⚡',
    hp: 1200, speed: 1.1, reward: 50,
    colorBody: '#f1c40f', colorHead: '#f39c12', colorShirt: '#f1c40f',
    size: 20, isBoss: false,
    isDragon: true,
    element: 'lightning',
    elementColor: '#f1c40f',
    projectileEffect: 'chain',   // rimbalza su 2 torri vicine, le rallenta
    desc: 'Spara fulmini che rimbalzano e rallentano le torri',
  },
  {
    id: 'draghetto_fuoco',
    name: 'Socio Draghetto 🔥',
    hp: 1400, speed: 0.95, reward: 55,
    colorBody: '#e74c3c', colorHead: '#c0392b', colorShirt: '#e74c3c',
    size: 21, isBoss: false,
    isDragon: true,
    element: 'fire',
    elementColor: '#e74c3c',
    projectileEffect: 'burn',    // lascia zona fuoco sul percorso
    desc: 'Spara lingue di fuoco che bruciano il terreno',
  },
  {
    id: 'draghetto_acqua',
    name: 'Socio Draghetto 💧',
    hp: 1300, speed: 1.0, reward: 52,
    colorBody: '#3498db', colorHead: '#2980b9', colorShirt: '#3498db',
    size: 20, isBoss: false,
    isDragon: true,
    element: 'water',
    elementColor: '#3498db',
    projectileEffect: 'shield',  // scudo acqua che assorbe 1 colpo
    desc: 'Ha uno scudo acqua che assorbe un colpo',
  },
  {
    id: 'draghetto_roccia',
    name: 'Socio Draghetto 🪨',
    hp: 2000, speed: 0.7, reward: 60,
    colorBody: '#7f8c8d', colorHead: '#6c7a7d', colorShirt: '#95a5a6',
    size: 23, isBoss: false,
    isDragon: true,
    element: 'rock',
    elementColor: '#7f8c8d',
    projectileEffect: 'armor',   // armatura: riduce danno del 30%
    desc: 'Armatura di roccia, riduce tutti i danni del 30%',
  },

  // --- INGEGNERI (ondate 81-89 e minion boss 90) ---
  {
    id: 'ingegnere_junior',
    name: 'Ingegnere Junior',
    hp: 900, speed: 1.3, reward: 45,
    colorBody: '#27ae60', colorHead: '#f5cba7', colorShirt: '#27ae60',
    size: 17, isBoss: false,
    isEngineer: true,
    gadget: 'Porta un laptop che blocca una torre per 1s',
  },
  {
    id: 'ingegnere_senior',
    name: 'Ingegnere Senior',
    hp: 1800, speed: 1.0, reward: 65,
    colorBody: '#16a085', colorHead: '#f5cba7', colorShirt: '#fff',
    size: 19, isBoss: false,
    isEngineer: true,
    gadget: 'Indossa elmetto protettivo: +50% resistenza',
  },
  {
    id: 'tech_lead',
    name: 'Tech Lead',
    hp: 2800, speed: 0.9, reward: 90,
    colorBody: '#8e44ad', colorHead: '#f5cba7', colorShirt: '#8e44ad',
    size: 20, isBoss: false,
    isEngineer: true,
    gadget: 'Refattorizza il percorso: cammina piu\' veloce del previsto',
  },
  {
    id: 'devops',
    name: 'DevOps',
    hp: 2200, speed: 1.2, reward: 80,
    colorBody: '#e67e22', colorHead: '#f5cba7', colorShirt: '#e67e22',
    size: 18, isBoss: false,
    isEngineer: true,
    gadget: 'Deploy continuo: respawna una volta con 50% HP',
  },
];

// ---- BOSS ----
const BOSS_DEFS = [
  {
    id: 'team_leader',
    name: 'TEAM LEADER',
    subtitle: 'Il piccolo tiranno delle riunioni',
    wave: 10,
    hp: 800, speed: 0.8, reward: 100,
    colorBody: '#e74c3c', colorHead: '#c0392b', colorShirt: '#e74c3c',
    size: 30, isBoss: true,
    quote: '"Ho bisogno di un aggiornamento ENTRO FINE GIORNATA!"',
    ability: 'Convoca stagisti ogni 5 secondi',
  },
  {
    id: 'capo_area',
    name: 'CAPO AREA',
    subtitle: 'Beve solo acqua minerale importata',
    wave: 20,
    hp: 1800, speed: 0.75, reward: 200,
    colorBody: '#8e44ad', colorHead: '#6c3483', colorShirt: '#8e44ad',
    size: 34, isBoss: true,
    quote: '"Questo non e\' in linea con la strategia aziendale."',
    ability: 'Scudo a meta HP',
  },
  {
    id: 'direttore_dip',
    name: 'DIRETTORE DI DIPARTIMENTO',
    subtitle: 'Ha una poltrona girevole da 4000 euro',
    wave: 30,
    hp: 3500, speed: 0.7, reward: 350,
    colorBody: '#2c3e50', colorHead: '#1a252f', colorShirt: '#2c3e50',
    size: 38, isBoss: true,
    quote: '"Lo stato avanzamento lavori? Dammi i KPI entro lunedi\'."',
    ability: 'Aumenta la velocita\' degli alleati vicini',
  },
  {
    id: 'leadership_team',
    name: 'LEADERSHIP TEAM',
    subtitle: 'Arrivano tutti in Tesla',
    wave: 40,
    hp: 2500, speed: 0.9, reward: 500,
    colorBody: '#c0392b', colorHead: '#922b21', colorShirt: '#c0392b',
    size: 32, isBoss: true,
    isGroup: true,   // spawna 4 boss simultanei
    groupSize: 4,
    quote: '"Abbiamo deciso all\'unanimita\' di non decidere."',
    ability: 'Arriva in gruppo di 4 con poteri diversi',
  },
  {
    id: 'dg',
    name: 'DIRETTORE GENERALE',
    subtitle: 'Il suo bonus vale piu\' del tuo stipendio annuale',
    wave: 50,
    hp: 7000, speed: 0.65, reward: 700,
    colorBody: '#1a1a2e', colorHead: '#0a0a1a', colorShirt: '#d4af37',
    size: 44, isBoss: true,
    quote: '"Vi chiedo solo il massimo... ogni giorno... sempre."',
    ability: 'Regenera HP + chiama guardie del corpo',
  },
  {
    id: 'consiglio',
    name: '10 MEMBRI DEL CONSIGLIO',
    subtitle: 'Capiscono solo grafici a torta',
    wave: 60,
    hp: 3000, speed: 0.8, reward: 900,
    colorBody: '#0d47a1', colorHead: '#1565c0', colorShirt: '#0d47a1',
    size: 28, isBoss: true,
    isGroup: true,
    groupSize: 10,
    quote: '"Abbiamo riaggiornato le slide per la riunione del 2035."',
    ability: 'Arrivano in 10 con armatura da board meeting',
  },
  {
    id: 'ceo',
    name: 'CEO',
    subtitle: 'Parla solo di "disruption" e "synergy"',
    wave: 70,
    hp: 15000, speed: 0.6, reward: 1200,
    colorBody: '#b7950b', colorHead: '#9a7d0a', colorShirt: '#fff',
    size: 50, isBoss: true,
    quote: '"Dobbiamo muoverci veloce e rompere le cose. Tipo il tuo morale."',
    ability: 'Tre fasi di vita + dash + scudo laser',
  },
  {
    id: 'grande_drago_socio',
    name: 'IL GRANDE DRAGO SOCIO',
    subtitle: 'Detiene il 51% delle quote e il 100% del terrore',
    wave: 80,
    hp: 40000, speed: 0.5, reward: 2000,
    // Corpo verde scuro drago, pancia chiara, corna dorate
    colorBody: '#1d6a2e', colorHead: '#145220', colorShirt: '#d4af37',
    size: 70, isBoss: true,
    isDragon: true,
    dragonPhases: [
      { hpThreshold: 0.75, element: 'fire',      elementColor: '#e74c3c', desc: 'Fase Fuoco' },
      { hpThreshold: 0.50, element: 'lightning',  elementColor: '#f1c40f', desc: 'Fase Fulmine' },
      { hpThreshold: 0.25, element: 'water',      elementColor: '#3498db', desc: 'Fase Acqua' },
      { hpThreshold: 0.0,  element: 'rock',       elementColor: '#7f8c8d', desc: 'Fase Roccia' },
    ],
    quote: '"Convoco i soci. Tutti e quattro gli elementi sono dalla mia parte."',
    ability: 'Cambia elemento ogni 25% HP — chiama draghetti minion ad ogni fase',
    isGroup: false,
    // Spawna draghetti di tutti e 4 i tipi all\'entrata
    minionTypes: ['draghetto_fulmine','draghetto_fuoco','draghetto_acqua','draghetto_roccia'],
    minionCount: 2,  // 2 per tipo
  },
  {
    id: 'doc_brown',
    name: 'DOC BROWN',
    subtitle: 'Ingegnere Capo — "GRANDE SCOTT! Il budget e\' esaurito!"',
    wave: 90,
    hp: 60000, speed: 0.65, reward: 3000,
    // Camice bianco da laboratorio, capelli bianchi folli
    colorBody: '#ecf0f1', colorHead: '#f5cba7', colorShirt: '#ecf0f1',
    hairColor: '#ffffff',
    size: 58, isBoss: true,
    isEngineer: true,
    hasDeLorean: true,
    deLoreanSpeed: 3.5,  // la DeLorean fa dash attraverso il percorso
    quote: '"Dove stiamo andando, non abbiamo bisogno di strade... ne\' di permessi."',
    ability: 'Guida la DeLorean in dash — torna indietro nel tempo per recuperare HP — spara raggi del futuro',
    phases: [
      { hpThreshold: 0.66, name: 'Presente',   desc: 'Attacchi normali + zap elettrico' },
      { hpThreshold: 0.33, name: 'Passato',     desc: 'Torna al 50% HP, ingegneri extra in campo' },
      { hpThreshold: 0.0,  name: 'Futuro',      desc: 'DeLorean dash continuo + raggi ionici' },
    ],
    // Minion: team di ingegneri
    minionTypes: ['ingegnere_junior','ingegnere_senior','tech_lead','devops'],
    minionCount: 3,
  },
  {
    id: 'direttore_galattico',
    name: 'DIRETTORE GALATTICO',
    subtitle: 'La sua sfera di influenza supera i confini del sistema solare',
    wave: 100,
    hp: 100000, speed: 0.45, reward: 5000,
    colorBody: '#0d0d2b', colorHead: '#050520', colorShirt: '#7fff00',
    size: 64, isBoss: true,
    quote: '"Il tuo ufficio e\' stato ristrutturato. Ora e\' lo spazio cosmico."',
    ability: 'TUTTO: scudi, rigenerazione, cloni, rallentamento torri',
  },
];

// ---- CITAZIONI LICENZIAMENTO ----
const FIRED_QUOTES = [
  '"La tua posizione e\' stata eliminata per motivi strutturali."',
  '"Grazie per il contributo. Buona fortuna per il futuro."',
  '"Hai lavorato sodo. Troppo sodo. Ora riposati... permanentemente."',
  '"Il tuo contratto non e\' stato rinnovato. Equipe HR ti contatterra\'."',
  '"Purtroppo siamo costretti a procedere con una riorganizzazione."',
  '"Sei un talento straordinario. Prova altrove."',
];

// ---- WAVE DEFINITIONS ----
// Ogni wave: array di { enemyId, count, interval (ms) }
function buildWaveData() {
  const waves = [];
  for (let w = 1; w <= 100; w++) {
    const bossWave = w % 10 === 0;
    const bossIndex = Math.floor(w / 10) - 1;

    if (bossWave) {
      const boss = BOSS_DEFS[bossIndex];
      waves.push({
        wave: w,
        isBoss: true,
        boss: boss,
        minions: getMinionComposition(w, true),
      });
    } else {
      waves.push({
        wave: w,
        isBoss: false,
        enemies: getNormalComposition(w),
      });
    }
  }
  return waves;
}

function getNormalComposition(wave) {
  // Ondate 71-79: soci draghetti misti
  if (wave >= 71 && wave <= 79) {
    const dragonTypes = ['draghetto_fulmine','draghetto_fuoco','draghetto_acqua','draghetto_roccia'];
    const count = 4 + Math.floor((wave - 70) * 1.5);
    return dragonTypes.map(id => ({
      enemyId: id, count: Math.max(1, Math.floor(count / 2)), interval: 1500,
    }));
  }
  // Ondate 81-89: ingegneri misti
  if (wave >= 81 && wave <= 89) {
    const engTypes = ['ingegnere_junior','ingegnere_senior','tech_lead','devops'];
    const count = 4 + Math.floor((wave - 80) * 2);
    return engTypes.map(id => ({
      enemyId: id, count: Math.max(1, Math.floor(count / 2)), interval: 1400,
    }));
  }
  // Normali
  const tier = Math.floor((wave - 1) / 10);
  const available = ENEMY_BASE.slice(0, Math.min(tier + 2, ENEMY_BASE.length));
  const base = available[Math.min(tier, available.length - 1)];
  const count = 5 + wave * 1.5;
  return [
    { enemyId: base.id, count: Math.floor(count), interval: Math.max(400, 1200 - wave * 3) },
  ];
}

function getMinionComposition(wave, isBoss) {
  if (!isBoss) return [];
  const boss = BOSS_DEFS[Math.floor(wave / 10) - 1];
  // Boss con minionTypes custom (Drago Socio, Doc Brown)
  if (boss && boss.minionTypes) {
    return boss.minionTypes.map(id => ({
      enemyId: id, count: boss.minionCount || 2, interval: 2200,
    }));
  }
  const tier = Math.floor(wave / 10) - 1;
  if (tier <= 0) return [];
  const minion = ENEMY_BASE[Math.min(tier, ENEMY_BASE.length - 1)];
  return [{ enemyId: minion.id, count: tier * 3, interval: 2000 }];
}

const WAVE_DATA = buildWaveData();
