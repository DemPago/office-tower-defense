// Sfondo animato del menu: pixel art di fogli volanti e impiegati che scappano.
export function startMenuAnimation(canvas) {
  if (!canvas) return { stop: () => {} };
  const ctx = canvas.getContext('2d');
  let running = true;
  let last = performance.now();

  // Fogli di carta e icone che cadono
  const items = Array.from({ length: 28 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vy: 0.015 + Math.random() * 0.025,
    vx: (Math.random() - 0.5) * 0.008,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.6,
    type: i % 5, // 0=sheet, 1=cup, 2=chart, 3=phone, 4=pixel person
    scale: 0.6 + Math.random() * 0.8,
    alpha: 0.18 + Math.random() * 0.22,
  }));

  // Griglia di sfondo (effetto foglio excel)
  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(45,226,230,0.04)';
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function drawItem(item, W, H) {
    const x = item.x * W, y = item.y * H;
    const s = item.scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(item.rot);
    ctx.globalAlpha = item.alpha;
    const p = (px, py, pw, ph, c) => { ctx.fillStyle = c; ctx.fillRect(px, py, pw, ph); };

    if (item.type === 0) { // foglio
      p(-7 * s, -9 * s, 14 * s, 18 * s, '#e8e2d0');
      p(-6 * s, -7 * s, 12 * s, 2 * s, '#c8c0b0');
      p(-6 * s, -3 * s, 8 * s, 2 * s, '#c8c0b0');
      p(-6 * s, 1 * s, 10 * s, 2 * s, '#c8c0b0');
      p(-6 * s, 5 * s, 6 * s, 2 * s, '#c8c0b0');
    } else if (item.type === 1) { // tazza caffè
      p(-4 * s, -6 * s, 8 * s, 10 * s, '#7a4020');
      p(-3 * s, -5 * s, 6 * s, 8 * s, '#3a2010');
      p(4 * s, -3 * s, 3 * s, 4 * s, '#5a3016');
      // vapore
      p(-2 * s, -9 * s, 1 * s, 3 * s, 'rgba(200,200,220,0.5)');
      p(1 * s, -10 * s, 1 * s, 4 * s, 'rgba(200,200,220,0.5)');
    } else if (item.type === 2) { // grafico
      p(-8 * s, -8 * s, 16 * s, 14 * s, '#1a2a3a');
      p(-7 * s, -3 * s, 3 * s, 8 * s, '#2de2e6');
      p(-3 * s, -6 * s, 3 * s, 11 * s, '#ff3e8a');
      p(1 * s, -1 * s, 3 * s, 6 * s, '#f2b705');
      p(5 * s, -5 * s, 3 * s, 10 * s, '#7bd332');
    } else if (item.type === 3) { // telefono
      p(-4 * s, -8 * s, 8 * s, 14 * s, '#2a2a30');
      p(-3 * s, -7 * s, 6 * s, 9 * s, '#1a2a3a');
      p(-2 * s, 4 * s, 4 * s, 2 * s, '#3a3a40');
    } else { // pixel person (tiny)
      p(-4 * s, -12 * s, 8 * s, 8 * s, '#e8c87a'); // testa
      p(-4 * s, -14 * s, 8 * s, 3 * s, '#3a2408'); // capelli
      p(-4 * s, -4 * s, 8 * s, 10 * s, '#2d5a8e'); // corpo
      p(-5 * s, 2 * s, 4 * s, 8 * s, '#2d5a8e'); // gamba sx
      p(1 * s, 2 * s, 4 * s, 8 * s, '#2d5a8e'); // gamba dx
    }
    ctx.restore();
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const W = canvas.width || canvas.clientWidth;
    const H = canvas.height || canvas.clientHeight;

    // Ridimensiona il canvas al contenitore
    if (canvas.width !== Math.round(W) || canvas.height !== Math.round(H)) {
      canvas.width = Math.round(W);
      canvas.height = Math.round(H);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, W, H);
    drawGrid(W, H);

    for (const item of items) {
      item.x += item.vx * dt * 60 / W;
      item.y += item.vy * dt * 60 / H;
      item.rot += item.vr * dt;
      if (item.y > 1.15) { item.y = -0.1; item.x = Math.random(); }
      if (item.x < -0.1) item.x = 1.1;
      if (item.x > 1.1) item.x = -0.1;
      drawItem(item, W, H);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { stop: () => { running = false; } };
}
