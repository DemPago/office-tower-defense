// ============================================================
// MAIN.JS — Bootstrap, routing schermate, binding pulsanti
// ============================================================

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame() {
  showScreen('screen-game');

  const canvas = document.getElementById('gameCanvas');
  Game.init(canvas);
  UI.buildShop();
  UI.resetHUD(Game.gold, Game.lives, Game.maxLives);
  UI.setNextWaveEnabled(true);
  Game.start();
}

// ---- TITLE ----
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-howto').addEventListener('click', () => showScreen('screen-howto'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('screen-title'));

// ---- HUD ----
document.getElementById('btn-pause').addEventListener('click', () => {
  if (Game.paused) Game.resume(); else Game.pause();
});
document.getElementById('btn-next-wave').addEventListener('click', () => {
  Game.startNextWave();
});
document.getElementById('btn-sell').addEventListener('click', () => {
  Game.toggleSellMode();
  // Deseleziona shop item
  document.querySelectorAll('.shop-item').forEach(i => i.classList.remove('selected'));
  Game.selectedTowerDef = null;
});

// ---- PAUSA ----
document.getElementById('btn-resume').addEventListener('click', () => Game.resume());
document.getElementById('btn-quit-pause').addEventListener('click', () => {
  Game.resume();
  Game.running = false;
  showScreen('screen-title');
});

// ---- GAME OVER ----
document.getElementById('btn-restart').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.remove('active');
  Game.reset();
  UI.buildShop();
});
document.getElementById('btn-quit-go').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.remove('active');
  Game.running = false;
  showScreen('screen-title');
});

// ---- VICTORY ----
document.getElementById('btn-restart-v').addEventListener('click', () => {
  document.getElementById('screen-victory').classList.remove('active');
  Game.reset();
  UI.buildShop();
});
document.getElementById('btn-quit-v').addEventListener('click', () => {
  document.getElementById('screen-victory').classList.remove('active');
  Game.running = false;
  showScreen('screen-title');
});

// ---- KEYBOARD ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (Game.paused) Game.resume();
    else if (Game.running && !Game.gameOver) Game.pause();
  }
  if (e.key === 'Enter' || e.key === ' ') {
    const btn = document.getElementById('btn-next-wave');
    if (btn && !btn.disabled && !Game.waveManager?.running) Game.startNextWave();
    e.preventDefault();
  }
});
