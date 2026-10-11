// Tutorial a passi: mette in pausa, scurisce lo schermo e illumina una cosa alla volta
// con una spiegazione. Parte da solo alla prima partita (meta.tutorialDone) e si può
// rivedere dal menu ("Come si gioca").
const STEPS = [
  { target: '#cv', box: 'tower', title: 'Welcome to the office!',
    text: 'This is your building. Your character on the roof shoots AUTOMATICALLY at enemies inside the dashed circle.' },
  { target: '#cv', box: 'yard', title: 'The wall and the yard',
    text: 'Enemies come from every direction. The sandbag wall stops them until it is broken through; snipers can shoot through it from a distance. If enemies enter the yard, your colleagues lose HP.' },
  { target: '#hp', title: 'Building HP',
    text: 'If it reaches zero, you are fired! It slowly regenerates on its own.' },
  { target: '#upgrades', title: 'Upgrades with gold 💰',
    text: 'Every enemy killed drops gold — spend it here to boost damage, fire rate, range, HP… Hover (or long-press) a button to see what it does.' },
  { target: '#mp', title: 'Mana 💧',
    text: 'The purple bar is mana: it slowly recharges on its own. You need it to use abilities.' },
  { target: '#abilities', title: 'Abilities',
    text: 'Bomb, coffee, meeting, audit — they cost mana and can be used with a click or keys 1–4. Save them for when things get rough!' },
  { target: '#top', title: 'Speed and pause',
    text: 'At the top you can speed up the game (x2, x3), pause (Space), mute sounds, or go fullscreen.' },
  { title: 'How to advance',
    text: 'After every wave choose 1 card out of 3. Every 5 waves you get a free colleague, every 10 a boss (who returns as a giant animal!). Good luck!' },
];

export function createTutorial({ onPause, onResume, onDone }: { onPause: () => void; onResume: () => void; onDone: () => void }) {
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
        <button class="btn small tut-skip">Skip</button>
        <button class="btn tut-next">Next ▶</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const hole = root.querySelector<HTMLElement>('.tut-hole')!;
  const box = root.querySelector<HTMLElement>('.tut-box')!;
  let i = 0;
  let getRects: ((name: string) => DOMRect | null) | null = null;

  function rectFor(step: { target?: string; box?: string; also?: string }) {
    const special = step.box && getRects && getRects(step.box);
    if (special) return special;
    if (!step.target) return null;
    const r = document.querySelector(step.target!)!.getBoundingClientRect();
    if (!step.also) return r;
    const o = document.querySelector(step.also!)!.getBoundingClientRect();
    const left = Math.min(r.left, o.left), top = Math.min(r.top, o.top);
    return { left, top, width: Math.max(r.right, o.right) - left, height: Math.max(r.bottom, o.bottom) - top };
  }

  function render() {
    const step = STEPS[i];
    root.querySelector('.tut-step')!.textContent = `${i + 1} / ${STEPS.length}`;
    root.querySelector('.tut-title')!.textContent = step.title;
    root.querySelector('.tut-text')!.textContent = step.text;
    root.querySelector('.tut-next')!.textContent = i === STEPS.length - 1 ? "Let's go! ▶" : 'Next ▶';
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

  root.querySelector('.tut-next')!.addEventListener('click', () => {
    if (++i >= STEPS.length) close();
    else render();
  });
  root.querySelector('.tut-skip')!.addEventListener('click', close);
  addEventListener('resize', () => { if (!root.hidden) render(); });

  return {
    // rects(name) restituisce il riquadro sullo schermo di "tower" o "yard" (dal renderer)
    start(rects: (name: string) => DOMRect | null) {
      getRects = rects;
      i = 0;
      root.hidden = false;
      onPause();
      render();
    },
    isActive: () => !root.hidden,
  };
}
