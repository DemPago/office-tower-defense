'use strict';
// MAIN.JS
// ─── INPUT ──────────────────────────────────────────────────────
document.querySelectorAll('.sc').forEach(card=>{
  const id=card.dataset.id,def=TD[id];
  card.addEventListener('click',()=>{
    if(G.over||G.won) return;
    document.querySelectorAll('.sc').forEach(c=>c.classList.remove('sel'));
    placeTower(id);
  });
  if(def){
    card.addEventListener('mouseenter',ev=>{
      document.getElementById('tt-n').textContent=`${def.ico} ${def.n}`;
      document.getElementById('tt-d').textContent=def.desc||'';
      const tt=document.getElementById('tt');
      tt.style.left=(ev.clientX+10)+'px';tt.style.top=(ev.clientY-44)+'px';tt.style.display='block';
    });
    card.addEventListener('mouseleave',()=>document.getElementById('tt').style.display='none');
  }
});
document.getElementById('btn-sell').addEventListener('click',()=>{G.sellMode=!G.sellMode;document.getElementById('btn-sell').classList.toggle('on',G.sellMode);});
document.getElementById('btn-pause').addEventListener('click',()=>{
  if(G.over||G.won) return;G.paused=!G.paused;
  document.getElementById('btn-pause').textContent=G.paused?'▶':'⏸';
  if(G.paused) showS('s-pause');else document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape') resume();});
// Click sul canvas — gestione unificata
document.getElementById('cw').addEventListener('click',e=>{
  if(!G||G.over||G.won) return;
  const rect=e.currentTarget.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  if(G.sellMode){
    const hit=G.towers&&G.towers.find(t=>Math.hypot(t.x-mx,t.y-my)<26);
    if(hit){
      G.gold+=hit.def.sell||20;
      if(hit.gfx){L.tower.removeChild(hit.gfx);hit.gfx.destroy({children:true});}
      G.towers=G.towers.filter(x=>x!==hit);
      G.selTower=null;
      document.getElementById('tp').style.display='none';
      G.sellMode=false;
      document.getElementById('btn-sell').classList.remove('on');
      buildSlotIndicators();updHUD();
    }
    return;
  }
  const hit=G.towers&&G.towers.find(t=>Math.hypot(t.x-mx,t.y-my)<26);
  if(hit){selectTower(hit);return;}
  G.selTower=null;document.getElementById('tp').style.display='none';
});

// ─── BOOTSTRAP ──────────────────────────────────────────────────
function showS(id){document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));document.getElementById(id).classList.add('on');}

function startGame(){
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));

  // Aspetta che PixiJS sia pronto
  if(!app){ setTimeout(startGame, 100); return; }

  // Aggiorna dimensioni canvas (potrebbero essere cambiate dopo il layout)
  const wrap=document.getElementById('cw');
  CW=wrap.clientWidth; CH=wrap.clientHeight;
  app.renderer.resize(CW,CH);

  resetG();
  G._floatTexts=[];

  // Pulisci layer (tranne bg e roads che vengono ricostruiti)
  ['enemies','tower','walls','projs','fx','hud2'].forEach(k=>{
    if(L[k]) L[k].removeChildren().forEach(c=>{try{c.destroy({children:true});}catch(e){}});
  });

  buildBG();
  buildMainTower();
  buildSlotIndicators();
  updHUD();
  renderUpgPanel();
  document.getElementById('tp').style.display='none';
  document.getElementById('btn-sell').classList.remove('on');
  document.getElementById('wb').classList.remove('on');
  startCountdown(1);
}
function restart(){startGame();}
function resume(){G.paused=false;document.getElementById('btn-pause').textContent='⏸';document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));}
function toMenu(){G.over=true;G.won=true;document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));showS('s-title');}

// ─── AVVIO: PixiJS si inizializza subito, poi mostra titolo ─────
(async()=>{
  await initPixi();
  // PixiJS pronto — ora il click su INIZIA funzionerà
  // La schermata titolo è già visibile (on nel HTML)
})();
