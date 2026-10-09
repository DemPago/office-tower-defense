// Animazione intro: impiegato stressato prima del menu. Clicca/tasto per saltare.
export function playIntro(canvas, onDone) {
  const ctx = canvas.getContext('2d');
  let t = 0, done = false;

  function finish() {
    if (done) return;
    done = true;
    canvas.removeEventListener('click', finish);
    document.removeEventListener('keydown', finish);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    onDone();
  }
  canvas.addEventListener('click', finish);
  document.addEventListener('keydown', finish);

  let last = performance.now();

  function frame(now) {
    if (done) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    if (t >= 5) { finish(); return; }

    const W = canvas.width, H = canvas.height;
    const scale = Math.max(2, Math.floor(Math.min(W, H) / 210) * 2);
    const cx = Math.floor(W / 2), cy = Math.floor(H / 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, W, H);

    const fadeIn  = Math.min(1, t / 0.6);
    const fadeOut = t > 4.3 ? Math.max(0, 1 - (t - 4.3) / 0.7) : 1;
    ctx.globalAlpha = fadeIn * fadeOut;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    drawScene(ctx, t);

    ctx.restore();
    ctx.globalAlpha = 1;

    // "CLICCA PER SALTARE"
    if (t > 0.6 && t < 4.3) {
      const a = 0.4 + 0.3 * Math.sin(t * 3.5);
      ctx.fillStyle = `rgba(138,141,147,${a * fadeIn})`;
      ctx.font = `${Math.max(6, scale * 3)}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('CLICCA PER SALTARE', cx, H - scale * 8);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Scene: 110×80 virtual px, origin at centre.
function drawScene(ctx, t) {
  const p = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  const stress = Math.max(0, Math.min(1, (t - 0.8) / 2.2));
  const scream = t > 3.1;
  const phase4 = t > 3.8;

  // Wall / floor
  p(-55, -40, 110, 80, '#141416');
  p(-55, -40, 110, 50, '#1a1a24'); // wall
  p(-55, 10, 110, 30, '#111114'); // floor

  // Window on wall
  p(-30, -36, 28, 20, '#1a2030');
  p(-29, -35, 26, 18, stress > 0.6 ? '#1a0808' : '#1e2a3e'); // darkens with stress
  for (let i = 0; i < 3; i++) p(-29 + i * 9, -35, 1, 18, '#283848');
  p(-30, -26, 28, 1, '#283848');

  // Desk
  p(-42, 6, 84, 6, '#6b4c2a');
  p(-42, 6, 84, 2, '#8a6840');
  p(-40, 12, 8, 20, '#5a3e20');
  p(32, 12, 8, 20, '#5a3e20');

  // Monitor
  p(-18, -22, 46, 30, '#0d0d0f');
  p(-16, -20, 42, 26, '#141416');
  const scrCol = phase4 ? '#3d0000' : scream ? '#2a0010' : stress > 0.5 ? '#12141e' : '#0d1a2e';
  p(-14, -18, 38, 22, scrCol);
  if (!scream && !phase4) {
    p(-12, -16, 34, 2, '#2de2e6');
    for (let i = 0; i < 4; i++) p(-12, -12 + i * 4, 14 + i % 2 * 10, 2, '#4a6a50');
  } else if (scream && !phase4) {
    p(-12, -16, 34, 2, '#d7263d');
    p(-12, -12, 26, 2, '#d7263d');
    for (let i = 0; i < 3; i++) p(-12, -8 + i * 3, 20 + i * 5, 2, '#8a1a1a');
  } else {
    // ERRORE: testo "GERARCHIA ATTACCA"
    p(-12, -16, 34, 14, '#3d0000');
    p(-10, -15, 4, 4, '#d7263d'); p(-4, -15, 4, 4, '#d7263d'); p(2, -15, 4, 4, '#d7263d');
  }
  p(-4, 8, 8, 4, '#2a2a30'); // monitor stand

  // Coffee cup
  p(18, 1, 8, 7, '#7a4020');
  p(19, 2, 6, 5, '#3a2010');
  p(26, 3, 3, 3, '#5a3016'); // handle

  // Papers on desk (more scattered = more stress)
  if (stress > 0.6) {
    p(-36, -1, 12, 9, '#e8e2d0'); p(-34, -4, 10, 8, '#d4cfc0'); p(-28, -2, 10, 7, '#e0dac8');
  } else {
    p(-36, 1, 12, 8, '#e8e2d0');
  }

  // Person: body
  const bx = 10, by = 6; // feet at desk level
  p(bx - 4, by - 20, 8, 12, stress > 0.5 ? '#2050a0' : '#2d5a8e'); // shirt
  p(bx - 3, by - 8, 6, 2, '#4a3020'); // belt
  // Tie loosened with stress
  if (stress < 0.6) p(bx - 1, by - 18, 2, 10, '#c41c1c');
  else { p(bx - 1, by - 18, 2, 7, '#c41c1c'); p(bx - 1, by - 11, 3, 6, '#c41c1c'); } // undone

  // Collar
  p(bx - 3, by - 22, 6, 3, '#e8e2d0');

  // Head
  const skinR = stress > 0.7 ? Math.floor(220 + stress * 35) : 210;
  const skinG = stress > 0.7 ? Math.floor(175 - stress * 30) : 190;
  p(bx - 5, by - 34, 10, 12, `rgb(${skinR},${skinG},110)`);

  // Hair (messy with stress)
  if (stress < 0.5) {
    p(bx - 5, by - 36, 10, 4, '#3a2408');
  } else {
    p(bx - 5, by - 36, 10, 4, '#3a2408');
    p(bx + 5, by - 36, 2, 3, '#3a2408'); // hair sticking up
    if (stress > 0.8) { p(bx - 7, by - 35, 2, 3, '#3a2408'); p(bx + 6, by - 37, 2, 4, '#3a2408'); }
  }

  // Sweat drops
  if (stress > 0.4) {
    const sw = 0.4 + 0.6 * Math.sin(t * 5);
    p(bx + 6, by - 32 + Math.floor(sw * 4), 2, 3, `rgba(100,150,220,${stress})`);
    if (stress > 0.7) p(bx - 7, by - 30 + Math.floor(sw * 3), 2, 3, `rgba(100,150,220,${stress})`);
  }

  // Eyes
  if (scream) {
    p(bx - 4, by - 30, 3, 4, '#100800');
    p(bx + 1, by - 30, 3, 4, '#100800');
  } else {
    const eyeY = by - 30 + (stress > 0.5 ? 1 : 0);
    p(bx - 4, eyeY, 3, 2, '#100800');
    p(bx + 1, eyeY, 3, 2, '#100800');
    if (stress > 0.4) { // furrowed brow
      p(bx - 5, by - 32, 4, 1, '#3a2408');
      p(bx + 1, by - 33, 4, 1, '#3a2408');
    }
  }

  // Mouth
  if (scream) {
    p(bx - 3, by - 25, 6, 6, '#100800'); // wide open
    p(bx - 2, by - 24, 4, 4, '#6a1010'); // inside
    p(bx - 2, by - 25, 4, 1, '#e8c87a'); // upper lip
    // Exclamation lines
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t;
      const r = 10 + (t - 3.1) * 18;
      const lx = Math.round(bx + Math.cos(a) * r), ly = Math.round(by - 28 + Math.sin(a) * r);
      p(lx, ly, 2, 2, `rgba(255,80,20,${Math.max(0, 0.9 - (t - 3.1) * 0.6)})`);
    }
  } else if (stress > 0.5) {
    p(bx - 2, by - 24, 4, 2, '#7a4030'); // frown
  } else {
    p(bx - 1, by - 24, 2, 1, '#6b4020');
  }

  // Arms: typing at keyboard
  const arm = Math.round(Math.sin(t * 8) * (scream ? 0 : 2));
  p(bx - 12, by - 18, 8, 4, stress > 0.5 ? '#2050a0' : '#2d5a8e');
  p(bx + 4, by - 18 + arm, 8, 4, stress > 0.5 ? '#2050a0' : '#2d5a8e');
  // Hands
  p(bx - 14, by - 15, 6, 5, `rgb(${skinR},${skinG},110)`);
  p(bx + 4, by - 15 + arm, 6, 5, `rgb(${skinR},${skinG},110)`);
  // Keyboard
  p(-20, 5, 30, 4, '#2a2a30');
  p(-19, 5, 28, 2, '#3a3a40');

  // Phase 4: screen flashes red, "ALLARME!" text
  if (phase4) {
    const flash = 0.4 + 0.4 * Math.sin(t * 18);
    ctx.fillStyle = `rgba(215,38,61,${flash * 0.15})`;
    ctx.fillRect(-55, -40, 110, 80);
  }
}
