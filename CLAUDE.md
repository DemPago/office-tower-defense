# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Progetto

Office Tower Defense: tower defense "idle + roguelike" (ispirato a Evil Tower su CrazyGames), tema ufficio, stile grafico **grunge urbano in pixel art**. Il proprietario parla italiano ed è alle prime armi con Claude Code: rispondi e commenta il codice **in italiano**, con spiegazioni semplici.

JavaScript puro + Canvas 2D, **nessuna dipendenza, nessun build step, nessun test runner**. Pubblicato con GitHub Pages dal branch `main` (root): ogni push su `main` aggiorna https://dempago.github.io/office-tower-defense/ in circa un minuto.

## Comandi

```bash
python3 -m http.server 8000          # avvia in locale → http://localhost:8000 (i moduli ES non funzionano con file://)
node tools/check.mjs                 # sintassi + verifica che ogni funzione importata/usata da un altro file esista (lanciarlo SEMPRE prima di pubblicare)
node tools/sim.mjs                   # simulazione del bilanciamento senza grafica (bot che gioca molte partite)
node tools/determinism.mjs           # 5 partite con casualità fissa: dopo un refactoring il risultato deve restare identico
```

Aprendo il gioco con `?debug` nell'indirizzo la partita è raggiungibile da console come `window.otd.run` (utile per preparare situazioni nei test). Per verificare la grafica si usa Chrome headless con `--remote-debugging-port` pilotato via DevTools Protocol (WebSocket nativo di Node): screenshot con `Page.captureScreenshot`, click con `Runtime.evaluate`. Dopo modifiche il browser può tenere in cache i moduli: ricaricare con Cmd+Shift+R.

Bilanciamento attuale di riferimento (`tools/sim.mjs`): senza potenziamenti ~ondata 5, bot completo mediana ~30-40, con progressi permanenti ~45-50. I boss (ogni 10 ondate) fanno da muro.

## Architettura

Separazione rigida in quattro strati, tutti moduli ES sotto `src/`:

- **`data/`**: solo numeri e testi (nemici, reparti, boss, carte, potenziamenti, poteri, rinforzi). Per ribilanciare si tocca qui e le curve `hpScale`/`atkScale`/`goldScale` in `systems/waves.js`.
- **`systems/`**: le regole. Modificano solo l'oggetto `run` e **non toccano il DOM**: per questo `tools/sim.mjs` li importa direttamente in Node. `systems/game.js#update(run, dt)` è il regista che fa avanzare tutto e gestisce le fasi.
- **`render/`**: disegno su canvas. Legge `run`, non lo modifica (fumo e polvere decorativi vivono nel renderer).
- **`ui/`**: barra in alto, pannello e schermate HTML sovrapposte (`index.html` contiene il markup statico delle schermate `scr-*`).

`main.js` contiene solo l'oggetto `app` (stato dell'applicazione: `meta`, `run`, `paused`, `speed`…) e il game loop (`requestAnimationFrame`, dt limitato a 0.05 s, a velocità x2/x3 fa più `update` piccoli invece di uno grande). Il resto è in `src/app/`: `flow.js` (schermate e passaggi di fase), `initials.js` (iniziali e invio punteggio), `controls.js` (pulsanti in alto e tastiera); ognuno riceve `app`.

Regola di modularità: un file per responsabilità, idealmente sotto le ~250 righe. I file "indice" (`systems/combat.js`, `render/world.js`, `render/scenery.js`) raccolgono e riesportano i pezzi: chi li importa non deve sapere in quale file sta ogni funzione.

### Stato e fasi

`state.js#createRun(meta)` crea l'unico oggetto di partita `run`. `run.phase` è una macchina a stati: `break` → `wave` → (`ally` ogni 5 ondate) → `cards` → `break` … oppure `over`. `main.js` controlla la fase a ogni frame e apre la schermata corrispondente. Gli effetti visivi (testi, particelle, banner, shake) vengono "ordinati" dai sistemi in `run.fx` tramite `systems/fx.js` e disegnati dal render.

Il mondo logico è un quadrato fisso **640×640** (`WORLD`) con la torre al centro (`TOWER`): i nemici nascono su un cerchio di raggio `SPAWN_RADIUS` in ogni direzione (fisso, così la difficoltà non dipende dallo schermo). La camera in `render/world.js` mostra un raggio `VIEW_R` intorno al palazzo sul lato corto dello schermo; banner e barra del boss sono disegnati in coordinate dello schermo (`view.ui`).

Angoli: si usano gradi "da geometria" (0 = destra, 90 = su) con `util.js#angleOf`/`inArc`. Il recinto elettrico (`combat.js#updateFence`, livello = quarti coperti a partire da 0°) e i rinforzi (`systems/allies.js#allyCovers`, spicchio centrato sulla postazione, +90° per livello) lavorano a settori.

### Statistiche

`systems/stats.js#computeStats` ricalcola le statistiche della torre da zero combinando tre fonti: potenziamenti a oro (`u`), carte (`c`), progressi permanenti (`m`), più le aure dei maghi rinforzo. Ogni carta/potenziamento definisce una funzione `mod(bonus)` nei file `data/`. Dopo ogni acquisto o scelta va chiamato `economy.js#refreshStats` (che sistema anche la vita attuale).

### Colpi

`combat.js#fire` crea colpi a ricerca che portano con sé i propri effetti (`effects`: slow, dot, aoe) e un `kind` (`tower`, `laser`, `bolt`, `pc`) usato dal render per l'aspetto. Torre e rinforzi (`systems/allies.js`) usano lo stesso meccanismo.

### Nemici

`data/enemies.js`: ogni nemico ha un **ruolo** (`ROLES`: `tank` con taunt, `sniper`, `charger` kamikaze, `special` con `heal` o `split`) che ne fissa statistiche e comportamento; `ROLE_WEIGHTS` decide la composizione delle ondate. `DECADES` assegna a ogni reparto (10 ondate) un nemico per ruolo; dopo la 60 si ricomincia in versione élite. La logica dei ruoli è in `systems/combat.js` (`updateEnemies`, `explode`, `pickTargets` che mette i tank per primi). I boss (`data/bosses.js`) partono da `BOSS_BASE` in `systems/waves.js`.

Rinforzi: `run.allies` contiene unità indipendenti (si possono avere due colleghi dello stesso tipo); `offerAllies` propone carte `hire` (postazione libera) o `promote`. I colleghi hanno vita (`allyHp`): per ogni nemico vivo dentro `YARD` (state.js) perdono `YARD_DRAIN` HP al secondo (`updateYard`), a zero si dimettono; a fine ondata si curano (`restAllies`).

Carte: le scelte stanno in `run.cardPicks` con la potenza `cardPower(ondata)` del momento (oggi sempre 1, si può far crescere con le ondate); `run.cards` conta solo le copie, per il massimo.

Pannello in basso (`ui/hud.js`): i pulsanti non sono mai `disabled` (classe `off`) così il suggerimento `withTip` funziona sempre; i testi dei suggerimenti sono `help` in `data/upgrades.js` e `data/abilities.js`.

### Muro di cinta

`systems/wall.js`: `run.wall` = tratti con vita intorno a `YARD`. `blockingSegment` ferma chi va a piedi (attacca il tratto), `segmentToward` dà il tratto sulla linea verso il palazzo (bersaglio dei cecchini), `repairWall` a inizio partita e a fine ondata. Materiali e bonus dalle carte muro (`stats.wallHp/wallThorns/wallReflect/wallRegen`); disegno dinamico in `render/wall.js` (non è nello sfondo statico).

### Boss, animali, mitra e personaggi

I boss (`data/bosses.js`) hanno un `animal` (`data/animals.js`, disegnato in `render/animals.js`, vista di profilo e specchiato verso il palazzo) e una scorta (`escort`) creata in `waves.js#makeBoss`. A vita finita `combat.js#transformBoss` li trasforma nell'animale gigante (seconda vita, `run.fx.flash` per il lampo bianco) e rende disponibile il potere speciale `mitra` (`run.mitraReady`/`run.mitraT`, cadenza ×`MITRA.rateMult`). I poteri normali costano mana (`MANA` in `data/abilities.js`).

Personaggi giocabili: look in `render/people.js`, elenco e sblocco in `data/heroes.js` (`meta.heroes`, `meta.hero`; uno nuovo ogni `UNLOCK_WAVE` ondate completate, gestito in `systems/game.js`).

### Suoni

`src/audio.js` sintetizza tutto con la Web Audio API (nessun file). I sistemi non suonano direttamente: chiamano `fx.js#sfx(run, nome)` che mette il nome in `run.fx.sounds`, e `main.js` li suona a ogni frame. L'audio si attiva al primo input dell'utente. La musica del boss è una composizione originale: non usare melodie protette da copyright (es. la Marcia Imperiale).

### Grafica

**Nessuna immagine**: tutto è disegnato via codice.
- `render/people.js`: personaggi in **pixel art HD**. Ogni `LOOKS[id]` descrive un vestito su una griglia 32×68 (12 righe in alto per cappelli), camminata a 4 fotogrammi. Un pixel della griglia vale `WORLD_PER_PX` = 0.5 pixel del mondo, quindi i personaggi hanno il doppio del dettaglio dello sfondo. `render/assets.js#person(look, frame, scale, white)` restituisce `{ img, w, h, k }` con la misura nel mondo (scale 2 per i boss); un look nuovo va aggiunto in `LOOKS` e referenziato con `look:` nei dati.
- Il palazzo in `render/world.js` è disegnato anch'esso a risoluzione doppia (`ctx.scale(0.5)`), con la facciata statica in cache.
- `render/scenery.js` + `render/scenes/` (un file per scenario, più `common.js` e `yard.js`): 6 scenari (uno per reparto, cambiano ogni 10 ondate con una dissolvenza) disegnati una volta su un canvas a **risoluzione doppia** (`SCENE_RES`) con random a seed fisso, più un'animazione leggera opzionale (`ambient`). Gli oggetti di scena riusabili sono in `render/props.js`: si disegnano in coordinate del mondo ma con dettagli a passi di **mezzo pixel** (`rect` arrotonda a 0.5), per avere la stessa densità di dettaglio dei personaggi.
- `render/world.js`: solo l'ordine di disegno; i pezzi sono in `view.js` (camera, zoom a pixel nitidi con `snap`, `drawPersonAt`), `tower.js`, `allies.js`, `enemies.js`, `effects.js`, `overlay.js` (scritte in coordinate dello schermo).
- `systems/combat.js` è un indice: la logica sta in `enemies.js`, `shooting.js`, `fence.js`, `damage.js`.
- `render/palette.js`: palette `PAL`, la stessa delle variabili CSS in `style.css`, da mantenere allineate. Font: Press Start 2P (testi) e Permanent Marker (titoli/graffiti), caricati prima di generare gli sfondi.

### Salvataggi e classifica

- `save.js`: progressi permanenti (buoni pasto, livelli dell'"Ufficio del personale", record) in `localStorage`, sempre in try/catch.
- `leaderboard.js`: classifica con iniziali di 3 lettere. Se `src/config.js` contiene `SUPABASE.url` e `SUPABASE.key` (chiave pubblica *publishable/anon*, non segreta) usa l'API REST di Supabase sulla tabella `scores` (schema e regole RLS in `supabase/schema.sql`), altrimenti, o se la rete fallisce, una classifica locale. Ogni punteggio viene salvato anche in locale.

## Convenzioni del repo

- Commit e PR **solo a nome dell'utente**: niente trailer `Co-Authored-By` né firme di Claude.
- Committare e pubblicare (push su `main`) solo quando l'utente lo chiede: il push va subito online.
