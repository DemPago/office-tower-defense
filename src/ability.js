'use strict';
// ABILITY.JS
// ─── ABILITÀ ────────────────────────────────────────────────────
function useAb(id){
  const ab=ABILITIES[id];if(!ab) return;
  const ck='cd'+id[0].toUpperCase()+id.slice(1);
  if(G.mana<ab.mana||G[ck]>0) return;
  G.mana-=ab.mana;G[ck]=ab.cd;updAbUI(id);
  const live=G.enemies.filter(e=>!e.dead&&!e.reached);
  switch(id){
    case 'bomb':   live.forEach(e=>{hitEnemy(e,160+G.wave*3,{});burstParticles(e.x,e.y,0xf97316,10);});floatText('💣 BOMBA CARTA!',CW/2,CH*.28,'#f97316',18);break;
    case 'coffee': live.forEach(e=>{e.slowFactor=.38;e.slowT=3200;});floatText('☕ CAFFÈ BOLLENTE!',CW/2,CH*.28,'#92400e',16);break;
    case 'meeting':live.forEach(e=>{e.stunT=2200;});floatText('📅 RIUNIONE!',CW/2,CH*.28,'#60a5fa',16);break;
    case 'audit':  live.forEach(e=>{e.hp=Math.max(1,Math.floor(e.hp/2));});floatText('🔍 AUDIT FISCALE!',CW/2,CH*.28,'#ef4444',16);break;
  }
}

// ─── TORRI PIAZZAMENTO ──────────────────────────────────────────
function placeTower(defId){
  const def=TD[defId];if(!def) return;
  const cost=def.magic?def.mc:def.cost;
  if(def.magic&&G.mana<cost){floatText('Mana insuff.!',CW/2,CH/2-80,'#a78bfa');return;}
  if(!def.magic&&G.gold<cost){floatText('Oro insuff.!',CW/2,CH/2-80,'#fbbf24');return;}
  const slotIdx=getFreeSlot();
  if(slotIdx<0){floatText('Slot pieni! (max 12)',CW/2,CH/2-80,'#ef4444');return;}
  if(def.magic) G.mana-=cost; else G.gold-=cost;
  const pos=getSlotPos(slotIdx);
  const t={
    id:Math.random().toString(36).slice(2),
    def,slotIdx,x:pos.x,y:pos.y,
    hp:80,maxHp:80,level:1,cd:0,
    eDmg:def.dmg||0,eRng:def.rng||120,eRate:def.rate||1500,ePspd:280,noCD:false,
    active:def.adef!==false,gfx:null,_targetAngle:Math.PI,
  };
  buildTowerGfx(t);
  G.towers.push(t);
  buildSlotIndicators();
  updateAllWalls(); // ricalcola muri dopo ogni piazzamento
  onTowerPlaced();  // controlla se il muro è completo
  updHUD();
}

// ─── UPGRADE GLOBALI ────────────────────────────────────────────
function buyGlobalUpg(id){
  const upg=GL_UPGS.find(u=>u.id===id);if(!upg) return;
  const lv=G.gUpg[id]||0;if(lv>=MAX_GL) return;
  const cost=glCost(lv);if(G.gold<cost){floatText('Oro insuff.!',CW/2,CH/2-80,'#fbbf24');return;}
  G.gold-=cost;G.gUpg[id]=lv+1;
  floatText(`${upg.n} Lv.${lv+1}!`,CW/2,CH*.33,'#fbbf24',14);
  renderUpgPanel();updHUD();
}
function renderUpgPanel(){
  const p=document.getElementById('ugp');
  // Costruisce HTML una sola volta con ID stabili — poi updUpgButtons aggiorna i valori
  p.innerHTML=GL_UPGS.map(u=>{
    const lv=G.gUpg[u.id]||0,maxed=lv>=MAX_GL,cost=glCost(lv),pct=lv/MAX_GL*100;
    const can=!maxed&&G.gold>=cost;
    return`<div class="ugi">
      <div class="ugr">
        <span class="ugn">${u.n}</span>
        <span class="ugl" id="uglv-${u.id}">Lv.${lv}/${MAX_GL}</span>
      </div>
      <div class="ugbar"><div class="ugbf" id="ugbar-${u.id}" style="width:${pct}%;background:${u.col}"></div></div>
      <button id="ugbtn-${u.id}" class="ugbtn" onclick="buyGlobalUpg('${u.id}')" ${maxed||!can?'disabled':''}>${maxed?'✅ MAX':cost+'💰'}</button>
    </div>`;
  }).join('');
}
