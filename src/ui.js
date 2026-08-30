'use strict';
// UI.JS
// ─── PANNELLO TORRE ─────────────────────────────────────────────
function selectTower(t){
  G.selTower=t;
  const tp=document.getElementById('tp'),def=t.def,un=UPG_NAMES[t.level-1];
  let html=`<div class="tph"><span class="tpi">${def.ico}</span><div><div class="tpn">${def.n}</div><div class="tpl">${un} Lv.${t.level}</div></div></div>`;
  if(def.magic){
    html+=`<div class="tps">🔮 <b>+${Math.round(def.bv*100)}%</b> ${def.bt}</div>`;
    html+=`<div class="tps">💧 <b>${def.mps}MP/s</b></div>`;
    html+=`<div class="tpac"><button class="${t.active?'bton':'btof'}" onclick="toggleMage()">${t.active?'🟢 ATTIVO':'🔴 SPENTO'}</button>`;
  } else {
    html+=`<div class="tps">⚔️<b>${t.eDmg}</b> 📡<b>${t.eRng}px</b> ⚡<b>${(1000/t.eRate).toFixed(1)}/s</b></div>`;
    html+=`<div class="tpac">`;
    if(t.level<5) html+=`<button class="bu" onclick="doUpg()">⬆️ ${UPG_NAMES[t.level]} 💰${UPG_COST[t.level]}</button>`;
    else html+=`<div class="tpk">👑 KING OF THE OFFICE</div>`;
  }
  html+=`<button class="bsell" onclick="doSell()">🗑 Vendi +${def.sell||20}💰</button></div>`;
  tp.innerHTML=html;tp.style.display='flex';
}
function doUpg(){
  const t=G.selTower;if(!t||t.level>=5) return;
  const c=UPG_COST[t.level];if(G.gold<c){floatText('Oro insuff.!',t.x,t.y-55,'#fbbf24');return;}
  G.gold-=c;t.level++;t.maxHp=Math.round(80*UPG_M[t.level-1].r);t.hp=Math.min(t.hp+25,t.maxHp);
  floatText(UPG_NAMES[t.level-1]+'!',t.x,t.y-55,'#fbbf24',13);updHUD();selectTower(t);
}
function doSell(){
  const t=G.selTower;if(!t) return;
  G.gold+=t.def.sell||20;
  if(t.gfx){L.tower.removeChild(t.gfx);t.gfx.destroy({children:true});}
  G.towers=G.towers.filter(x=>x!==t);G.selTower=null;
  document.getElementById('tp').style.display='none';
  buildSlotIndicators();updateAllWalls();updHUD();
}
function toggleMage(){const t=G.selTower;if(!t||!t.def.magic) return;t.active=!t.active;selectTower(t);}

// ─── UI ─────────────────────────────────────────────────────────
function updHUD(){
  document.getElementById('hg').textContent=Math.floor(G.gold);
  document.getElementById('hk').textContent=G.kills;
  document.getElementById('hw').textContent=`${G.wave}/100`;
  document.getElementById('hi').textContent=G.towers.length*WALL_INCOME;
  const hp=G.towerHp/G.maxTowerHp*100;
  document.getElementById('hpn').textContent=Math.ceil(G.towerHp);
  document.getElementById('hpf').style.height=Math.max(0,hp)+'%';
  const mp=Math.max(0,G.mana)/G.maxMana*100;
  document.getElementById('mpn').textContent=Math.max(0,Math.floor(G.mana));
  document.getElementById('mpf').style.height=Math.max(0,mp)+'%';
  document.querySelectorAll('.sc').forEach(c=>{
    const def=TD[c.dataset.id];if(!def) return;
    const ok=def.magic?G.mana>=(def.mc||0):G.gold>=def.cost;
    c.classList.toggle('dim',!ok);
  });
  // Aggiorna SOLO bottoni upgrade (enabled/disabled) senza ricreare l'HTML
  updUpgButtons();
}

function updUpgButtons(){
  GL_UPGS.forEach(u=>{
    const btn=document.getElementById('ugbtn-'+u.id);
    if(!btn) return;
    const lv=G.gUpg[u.id]||0;
    const maxed=lv>=MAX_GL;
    const cost=glCost(lv);
    const can=!maxed&&G.gold>=cost;
    btn.disabled=maxed||!can;
    if(!maxed) btn.textContent=cost+'💰';
    // Aggiorna barra progresso
    const bar=document.getElementById('ugbar-'+u.id);
    if(bar) bar.style.width=(lv/MAX_GL*100)+'%';
    const lbl=document.getElementById('uglv-'+u.id);
    if(lbl) lbl.textContent=`Lv.${lv}/${MAX_GL}`;
  });
}
function updAbUI(id){
  const el=document.getElementById('ab-'+id),cd=document.getElementById('cd-'+id);
  const rem=G['cd'+id[0].toUpperCase()+id.slice(1)]||0;
  el.classList.toggle('cd',rem>0);
  if(rem>0) cd.textContent=(rem/1000).toFixed(1)+'s';
}

// ─── GAME OVER / WIN ────────────────────────────────────────────
function gameOver(){
  if(G.over) return;G.over=true;
  document.getElementById('ow').textContent=G.wave;
  document.getElementById('ok').textContent=G.kills;
  document.getElementById('oq').textContent=QUOTES[Math.floor(Math.random()*QUOTES.length)];
  setTimeout(()=>showS('s-over'),900);
}
function triggerWin(){G.won=true;document.getElementById('wk').textContent=G.kills;setTimeout(()=>showS('s-win'),900);}
