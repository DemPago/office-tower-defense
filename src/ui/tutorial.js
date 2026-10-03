// Tutorial a passi: mette in pausa, scurisce lo schermo e illumina una cosa alla volta
// con una spiegazione. Parte da solo alla prima partita (meta.tutorialDone) e si può
// rivedere dal menu ("Come si gioca").
const STEPS = [
  { target: '#cv', box: 'tower', title: 'Benvenuto in ufficio!',
    text: 'Questo è il tuo palazzo. Il tuo personaggio sul tetto spara DA SOLO ai nemici dentro il cerchio tratteggiato.' },
  { target: '#cv', box: 'yard', title: 'Il muro e il cortile',
    text: 'I nemici arrivano da tutte le direzioni. Il muro di sacchi li ferma finché non lo sfondano; i cecchini lo bucano da lontano. Se entrano nel cortile, i tuoi colleghi perdono vita.' },
  { target: '#hp', title: 'La vita del palazzo',
    text: 'Se arriva a zero, sei licenziato! Si ricarica piano da sola.' },
  { target: '#upgrades', title: 'Potenziamenti con l’oro 💰',
    text: 'Ogni nemico eliminato dà oro: spendilo qui per danno, velocità, gittata, vita… Passa col mouse (o tieni premuto) su un pulsante per sapere cosa fa.' },
  { target: '#mp', title: 'Il mana 💧',
    text: 'La barra viola è il mana: si ricarica da solo, piano. Serve per i poteri.' },
  { target: '#abilities', title: 'I poteri',
    text: 'Bomba, caffè, riunione, audit: costano mana e si usano con un clic o coi tasti 1-4. Tienili per quando sei in difficoltà!' },
  { target: '#top', title: 'Velocità e pausa',
    text: 'In alto puoi accelerare il gioco (x2, x3), mettere in pausa (Spazio), togliere i suoni e andare a schermo intero.' },
  { title: 'Come si va avanti',
    text: 'Dopo ogni ondata scegli 1 carta su 3. Ogni 5 ondate arrivano i colleghi di rinforzo, ogni 10 un boss (che torna come animale gigante!). Buon lavoro!' },
];

export function createTutorial({ onPause, onResume, onDone }) {
  const root = document.createElement('div');
  root.id = 'tutorial';
  root.hidden = true;
  root.innerHTML = `
    <div class="tut-hole"></div>
    <div class="tut-box">
      <span class="tut-step"></span>
      <b class="tut-title"></b>
      <p class="tut-text"></p>
      <div class="tut-buttons">
        <button class="btn small tut-skip">Salta</button>
        <button class="btn tut-next">Avanti ▶</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const hole = root.querySelector('.tut-hole'), box = root.querySelector('.tut-box');
  let i = 0, getRects = null;

  function rectFor(step) {
    const special = step.box && getRects && getRects(step.box);
    if (special) return special;
    if (!step.target) return null;
    const r = document.querySelector(step.target).getBoundingClientRect();
    if (!step.also) return r;
    const o = document.querySelector(step.also).getBoundingClientRect();
    const left = Math.min(r.left, o.left), top = Math.min(r.top, o.top);
    return { left, top, width: Math.max(r.right, o.right) - left, height: Math.max(r.bottom, o.bottom) - top };
  }

  function render() {
    const step = STEPS[i];
    root.querySelector('.tut-step').textContent = `${i + 1} / ${STEPS.length}`;
    root.querySelector('.tut-title').textContent = step.title;
    root.querySelector('.tut-text').textContent = step.text;
    root.querySelector('.tut-next').textContent = i === STEPS.length - 1 ? 'Si comincia! ▶' : 'Avanti ▶';
    const r = rectFor(step);
    if (r) {
      const pad = 6;
      Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
      hole.classList.remove('none');
      // la spiegazione va dove c'è più spazio: sopra o sotto la parte illuminata
      const below = r.top + r.height / 2 < innerHeight / 2;
      box.style.top = below ? `${Math.min(innerHeight - 200, r.top + r.height + 16)}px` : '';
      box.style.bottom = below ? '' : `${Math.min(innerHeight - 200, innerHeight - r.top + 16)}px`;
    } else {
      hole.classList.add('none');
      box.style.top = '35%';
      box.style.bottom = '';
    }
  }

  function close() {
    root.hidden = true;
    onResume();
    onDone();
  }

  root.querySelector('.tut-next').addEventListener('click', () => {
    if (++i >= STEPS.length) close();
    else render();
  });
  root.querySelector('.tut-skip').addEventListener('click', close);
  addEventListener('resize', () => { if (!root.hidden) render(); });

  return {
    // rects(name) restituisce il riquadro sullo schermo di "tower" o "yard" (dal renderer)
    start(rects) {
      getRects = rects;
      i = 0;
      root.hidden = false;
      onPause();
      render();
    },
    isActive: () => !root.hidden,
  };
}
