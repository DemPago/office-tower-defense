// Comandi: pulsanti della barra in alto (velocità, pausa, suoni, schermo intero) e tastiera.
import { useAbility } from '../systems/abilities.js';
import { ABILITIES } from '../data/abilities.js';
import { initAudio, toggleMute, isMuted } from '../audio.js';

const $ = id => document.getElementById(id);

export function setupControls(app) {
  const { flow } = app;

  $('btn-pause').addEventListener('click', () => flow.setPaused(!app.paused));
  $('btn-speed').addEventListener('click', () => { app.speed = app.speed === 3 ? 1 : app.speed + 1; });

  // Suoni: l'audio parte al primo clic o tasto (regola dei browser).
  addEventListener('pointerdown', initAudio);
  addEventListener('keydown', initAudio);
  const refreshSoundButton = () => { $('btn-sound').textContent = isMuted() ? '🔇' : '🔊'; };
  $('btn-sound').addEventListener('click', () => { toggleMute(); refreshSoundButton(); });
  refreshSoundButton();

  // Schermo intero (non tutti i browser lo permettono, es. iPhone).
  const canFullscreen = !!document.documentElement.requestFullscreen;
  const toggleFullscreen = () => {
    if (!canFullscreen) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  $('btn-full').hidden = !canFullscreen;
  $('btn-full').addEventListener('click', toggleFullscreen);
  // Sui telefoni si passa a schermo intero appena si preme GIOCA.
  $('btn-play').addEventListener('click', () => {
    if (canFullscreen && !document.fullscreenElement && matchMedia('(pointer: coarse)').matches) toggleFullscreen();
  });

  document.addEventListener('keydown', e => {
    if (app.initials.onKey(e)) return;
    if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
    if (e.key === 'm' || e.key === 'M') { toggleMute(); refreshSoundButton(); return; }
    if (!app.run) return;
    if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); flow.setPaused(!app.paused); return; }
    const ab = ABILITIES.find(a => a.key === e.key);
    if (ab && !app.paused) useAbility(app.run, ab.id);
  });
  // Se cambi scheda del browser, il gioco si mette in pausa da solo.
  document.addEventListener('visibilitychange', () => { if (document.hidden) flow.setPaused(true); });
}
