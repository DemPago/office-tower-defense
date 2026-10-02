# 🏢 Office Tower Defense

Un tower defense comico a tema lavorativo, in stile "idle + roguelike".
Difendi il tuo ufficio dalla gerarchia aziendale, dallo Stagista fino al leggendario **Direttore Galattico**.

## 🎮 Gioca ora
👉 **[Apri il gioco](https://dempago.github.io/office-tower-defense/)**

---

## 🗺️ Come si gioca

1. **La torre spara da sola** al nemico più vicino dentro la gittata (il cerchio tratteggiato).
2. Ogni nemico eliminato dà **oro 💰**: spendilo nel pannello in basso per Danno, Velocità, Gittata, Vita e Rigenerazione.
3. **Dopo ogni ondata scegli 1 carta su 3**: sono potenziamenti che si sommano (colpi multipli, rimbalzi, esplosioni, veleno, critici…).
4. **Ogni 5 ondate arrivano i rinforzi**: scegli un collega fra 3 e si piazza in una postazione intorno al palazzo. Se ripeschi un collega che hai già, viene promosso (Junior → Middle → Professional → Senior → 👑 King).
5. Usa i **poteri** quando sei in difficoltà: si ricaricano col tempo.
6. Quando la torre crolla vieni **licenziato**, ma guadagni **buoni pasto 🎫** da spendere nell'**Ufficio del personale** in bonus permanenti.

### Comandi
| Tasto | Azione |
|---|---|
| `1` `2` `3` `4` | 💣 Bomba di carta · ☕ Caffè bollente · 📅 Riunione urgente · 🔍 Audit fiscale |
| `Spazio` / `Esc` | Pausa |
| `x1` in alto | Velocità di gioco x1 / x2 / x3 |

## 🦺 Rinforzi (ogni 5 ondate)
| Collega | Cosa fa |
|---|---|
| 📊 **Project Manager** | Laser rapido a lunga gittata |
| 🎯 **Service Manager** | Balestra: colpi forti che rallentano |
| 💻 **Dev** | Lancia PC che esplodono ad area |
| 🏃 **Mago Agile** | +velocità di fuoco a palazzo e colleghi |
| 📋 **Mago Scrum** | +danno a palazzo e colleghi |

## 👾 Boss (ogni 10 ondate)
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
Personaggi: asset di [Kenney](https://kenney.nl), licenza [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (pubblico dominio; il credito è dato per correttezza).
Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) e [Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker) (licenze OFL / Apache).
Tutto il resto (strade, palazzo, oggetti) è disegnato via codice in `src/render/world.js`.

---
*"La tua posizione è stata eliminata per motivi strutturali."*
