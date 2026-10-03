// Fine partita stile cabinato: scelta delle 3 iniziali (frecce, tastiera) e invio del punteggio.
import * as screens from '../ui/screens.js';
import { getTop, submitScore, lastInitials } from '../leaderboard.js';

const $ = id => document.getElementById(id);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function createInitials(app) {
  let initials = ['A', 'A', 'A'];
  let cursor = 0;
  let saving = false;

  const render = () => screens.renderInitials(initials, cursor);

  function stepLetter(i, delta) {
    const n = (LETTERS.indexOf(initials[i]) + delta + LETTERS.length) % LETTERS.length;
    initials[i] = LETTERS[n];
    cursor = i;
    render();
  }

  async function save() {
    if (saving || !app.run) return;
    saving = true;
    $('btn-save-score').disabled = true;
    $('btn-save-score').textContent = 'INVIO...';
    const { run } = app;
    const result = await submitScore({ initials: initials.join(''), wave: run.wave, kills: run.kills, bosses: run.bossesKilled });
    screens.showOverAfter(result, await getTop(10));
    saving = false;
  }

  document.querySelectorAll('#initials .slot').forEach((slot, i) => {
    slot.querySelector('.up').addEventListener('click', () => stepLetter(i, -1));
    slot.querySelector('.down').addEventListener('click', () => stepLetter(i, 1));
    slot.querySelector('.ch').addEventListener('click', () => { cursor = i; render(); });
  });
  $('btn-save-score').addEventListener('click', save);
  $('btn-skip-score').addEventListener('click', async () => screens.showOverAfter(null, await getTop(10)));

  return {
    // Riparte dalle ultime iniziali usate.
    reset() {
      initials = lastInitials().split('');
      cursor = 0;
    },
    render,
    // Tastiera sulla schermata delle iniziali: lettere, frecce, Backspace, Invio.
    // Restituisce true se il tasto è stato usato qui.
    onKey(e) {
      if ($('scr-over').hidden || $('initials-box').hidden) return false;
      const k = e.key;
      if (/^[a-zA-Z]$/.test(k)) {
        initials[cursor] = k.toUpperCase();
        cursor = Math.min(2, cursor + 1);
      } else if (k === 'Backspace' || k === 'ArrowLeft') cursor = Math.max(0, cursor - 1);
      else if (k === 'ArrowRight') cursor = Math.min(2, cursor + 1);
      else if (k === 'ArrowUp') stepLetter(cursor, -1);
      else if (k === 'ArrowDown') stepLetter(cursor, 1);
      else if (k === 'Enter') save();
      else return false;
      e.preventDefault();
      render();
      return true;
    },
  };
}
