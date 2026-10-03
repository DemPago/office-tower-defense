# 🏢 Office Tower Defense

Un tower defense comico a tema lavorativo, in stile "idle + roguelike".
Difendi il tuo ufficio dalla gerarchia aziendale, dallo Stagista fino al leggendario **Direttore Galattico**.

## 🎮 Gioca ora
👉 **[Apri il gioco](https://dempago.github.io/office-tower-defense/)**

---

## 🗺️ Come si gioca

1. **La torre sta al centro e spara da sola** al nemico più vicino dentro la gittata (il cerchio tratteggiato). I nemici arrivano da tutte le direzioni.
2. Ogni nemico eliminato dà **oro 💰**: spendilo nel pannello in basso per Danno, Velocità, Gittata, Vita, Rigenerazione e **🔌 Recinto elettrico** (a settori: livello 1 copre 0-90°, livello 2 fino a 180°, livello 3 fino a 270°, livello 4 tutto il giro).
3. **Dopo ogni ondata scegli 1 carta su 3**: sono potenziamenti che si sommano (colpi multipli, rimbalzi, esplosioni, veleno, critici…).
4. **Ogni 5 ondate arrivano i rinforzi**: puoi **assumere** un collega nuovo (6 postazioni intorno al palazzo) o **promuoverne** uno che hai già. ⚠ **Attenzione al cortile**: per ogni nemico che ci entra, tutti i colleghi perdono 100 vita al secondo; a zero si dimettono. Ogni collega difende uno **spicchio** (l'arco colorato a terra): 90° al livello 1, e ogni promozione lo allarga di altri 90° (Junior → Middle → Professional → Senior → 👑 King).
5. Usa i **poteri** quando sei in difficoltà: si ricaricano col tempo.
6. Quando la torre crolla vieni **licenziato**, ma guadagni **buoni pasto 🎫** da spendere nell'**Ufficio del personale** in bonus permanenti.

### Comandi
| Tasto | Azione |
|---|---|
| `1` `2` `3` `4` | 💣 Bomba di carta · ☕ Caffè bollente · 📅 Riunione urgente · 🔍 Audit fiscale |
| `Spazio` / `Esc` | Pausa |
| `x1` in alto | Velocità di gioco x1 / x2 / x3 |
| `F` / ⛶ | Schermo intero |
| `M` / 🔊 | Suoni on/off |
| Mouse sopra un pulsante (o tieni premuto sul telefono) | Spiega cosa fa quel potenziamento o potere |

## 🦺 Rinforzi (ogni 5 ondate)
| Collega | Cosa fa |
|---|---|
| 📊 **Project Manager** | Laser rapido a lunga gittata |
| 🎯 **Service Manager** | Balestra: colpi forti che rallentano |
| 💻 **Dev** | Lancia PC che esplodono ad area |
| 🏃 **Mago Agile** | +velocità di fuoco a palazzo e colleghi |
| 📋 **Mago Scrum** | +danno a palazzo e colleghi |

## 🏢 Nemici: 4 ruoli, un reparto nuovo ogni 10 ondate
| Ruolo | Comportamento |
|---|---|
| 🛡️ **Tank** | Tanta vita, lento e corazzato. Attira i colpi di torre e colleghi: fa da scudo agli altri. Sono i più numerosi. |
| 🎯 **Cecchino** | Spara da lontano colpi forti (il mirino rosso avvisa prima del colpo), ma muore in fretta. |
| 💥 **Kamikaze** | Vicino alla torre carica a doppia velocità; se arriva esplode con un danno enorme. |
| ✨ **Speciale** | Cura i compagni vicini oppure, quando muore, si divide in due. |

| Ondate | Reparto | Tank | Cecchino | Kamikaze | Speciale |
|---|---|---|---|---|---|
| 1-10 | Open Space | Impiegato | Stagista | Fattorino | Resp. HR (cura) |
| 11-20 | Amministrazione | Contabile | Avvocato | Consulente | Funzionario (si divide) |
| 21-30 | Reparto IT | Ingegnere | Sistemista | Tecnico | DevOps (cura) |
| 31-40 | Commerciale | Magazziniere | Marketing | Venditore | Capo Vendite (si divide) |
| 41-50 | Sicurezza | Buttafuori | Vigilante | Guardia | Caposquadra (si divide) |
| 51-60 | Piani Alti | Vicedirettore | Segretaria | Assistente | Portavoce (cura) |

Dopo l'ondata 60 si ricomincia con le versioni ÉLITE (occhi rossi).

## 🌆 Scenari
Dopo ogni boss cambia lo scenario: parcheggio aziendale → archivio → data center → centro commerciale → zona industriale → tetto del grattacielo, poi si ricomincia.

## 🔊 Suoni
Tutti i suoni sono generati dal browser (Web Audio API), senza file. All'arrivo di un boss parte una breve marcia originale con ottoni, timpani e rullante.

## 🏆 Classifica
Quando perdi lasci le tue **3 iniziali** come nei cabinati. La classifica è online (Supabase) se `src/config.js` è compilato, altrimenti resta nel browser. Per crearla: incolla `supabase/schema.sql` nel SQL Editor di Supabase e metti URL e chiave pubblica in `src/config.js`.

## 👾 Boss (ogni 10 ondate)
I boss sono enormi (fino a 3,5 volte un nemico normale), con aura colorata, occhi rossi, passi che fanno tremare il terreno e scie di fumo, scintille o stelle. Entrano dal bordo come gli altri: una freccia **⚠ BOSS** indica da dove arrivano. A metà vita diventano rossi e più veloci (**INFURIATO!**).
| Ondata | Boss |
|---|---|
| 10 | Team Leader |
| 20 | Capo Area |
| 30 | Direttore di Dipartimento |
| 40 | Leadership Team (x4) |
| 50 | Direttore Generale |
| 60 | Consiglio di Amministrazione (x10) |
| 70 | CEO |
| 80 | Il Grande Socio |
| 90 | Doc Brown |
| **100** | **🌌 Direttore Galattico** |

---

## 🛠️ Provarlo in locale

Il gioco usa i moduli JavaScript, quindi va aperto tramite un piccolo server (non con doppio clic sul file):

```bash
cd office-tower-defense
python3 -m http.server 8000
```

Poi apri **http://localhost:8000**. Se dopo una modifica vedi ancora la versione vecchia, ricarica con `Cmd+Shift+R`.

## 🧩 Com'è fatto il codice

JavaScript puro + Canvas 2D, nessuna libreria e nessun build step.

```
src/
  main.js        avvio, pulsanti, game loop
  state.js       stato di una partita
  save.js        salvataggio dei progressi permanenti (localStorage)
  data/          SOLO numeri e testi: nemici, boss, carte, potenziamenti, poteri
  systems/       le regole del gioco (ondate, combattimento, carte, economia…)
  render/        disegno sul canvas
  ui/            barra in alto, pannello e schermate HTML
```

Per **bilanciare il gioco** basta toccare i file in `src/data/` e le curve `hpScale` / `atkScale` in `src/systems/waves.js`.

## 🚀 Deploy su GitHub Pages
Su GitHub: **Settings → Pages → Source: main / (root)** → Save.

## 🎨 Asset grafici
Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) e [Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker) (licenze OFL / Apache).
Tutta la grafica è disegnata via codice, senza immagini: personaggi in `src/render/people.js`, strade, palazzo e oggetti in `src/render/world.js`.

---
*"La tua posizione è stata eliminata per motivi strutturali."*
