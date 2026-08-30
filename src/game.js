'use strict';
// GAME.JS
// ─── GAME LOOP ──────────────────────────────────────────────────
function tick(dt){
  try{ _tick(dt); } catch(e){ console.error('tick error:',e.message,e.stack?.split('\n')[1]); }
}
function _tick(dt){
  if(!G||G.paused||G.over||G.won) return;

  // Countdown
  if(G.cdActive){
    G.cdMs-=dt;
    const secs=Math.ceil(G.cdMs/1000);
    const el=document.getElementById('cdn');
    const prev=el.textContent;
    const txt=G.cdMs>0?String(secs):'GO!';
    if(txt!==prev){el.textContent=txt;el.style.animation='none';el.offsetHeight;el.style.animation='cdp .8s ease';}
    document.getElementById('cds').textContent=`ONDATA ${G.cdWave} IN ARRIVO`;
    document.getElementById('cd-hud').textContent=`⏱️ Ondata ${G.cdWave} in ${secs}s`;
    if(G.cdMs<=0){
      G.cdActive=false;
      document.getElementById('cdo').classList.remove('on');
      launchWave(G.cdWave);
    }
    updateFloats(dt);
    return;
  }

  updateMana(dt);
  updateIncome(dt);
  updateAbCDs(dt);
  if(G.running) updateSpawn(dt);
  calcBuffs();
  updateTowerLogic(dt);
  updateEnemies(dt);
  updateProjs(dt);
  updateEProjs(dt);
  updateFloats(dt);

  // Torre principale spara
  G.mainTowerCd=Math.max(0,G.mainTowerCd-dt);

  // Posizione tetto torre (dove sta il personaggio)
  const groundY=CH*0.72, floors=5, fH=52;
  const towerTopY=groundY-floors*fH-28; // cima torre
  const playerY=towerTopY;

  // Animazione idle: bob
  if(window.playerContainer){
    const bob=Math.sin(Date.now()/800)*.8;
    window.playerContainer.y=playerY+bob;
  }
  if(gunGfx) gunGfx.y=playerY+(14*.38);

  if(G.mainTowerCd<=0){
    const tgt=nearestEnemy(CW/2, groundY, 320);
    if(tgt){
      gunAngle=Math.atan2(tgt.y-playerY, tgt.x-CW/2);
      if(gunGfx) gunGfx.rotation=gunAngle;

      const gunX=CW/2, gunY=playerY+(14*.38);
      fireProj(gunX,gunY,tgt,{pc:0xfbbf24,ps:5,pspd:340,id:'main'},null,22+(G.gUpg.dmg||0)*2.6);
      G.mainTowerCd=580;

      if(window.playerContainer){
        window.playerContainer.x=(CW/2)-Math.cos(gunAngle)*4;
        setTimeout(()=>{ if(window.playerContainer) window.playerContainer.x=CW/2; },80);
      }
      burstParticles(CW/2+Math.cos(gunAngle)*34, (playerY+(14*.38))+Math.sin(gunAngle)*34, 0xfbbf24, 5);
    }
  }

  // Aggiorna grafica
  G.enemies.filter(e=>!e.dead).forEach(updateEnemyGfx);
  G.towers.forEach(updateTowerGfx);
  G.projs.forEach(p=>{ if(p.gfx) p.gfx.position.set(p.x,p.y); });
  G.eprojs.forEach(p=>{ if(p.gfx){p.gfx.position.set(p.x,p.y);p.gfx.rotation=p.ang+.8;} });

  updateMainHpBar();
  buildSlotIndicators();
  updHUD();
}

function updateMana(dt){
  G.manaAcc+=dt;
  while(G.manaAcc>=1000){G.mana=Math.min(G.maxMana,G.mana+1);G.manaAcc-=1000;}
  G.towers.filter(t=>t.def.magic&&t.active).forEach(t=>{G.mana=Math.max(0,G.mana-t.def.mps*(dt/1000));});
}
function updateIncome(dt){
  G.incomeAcc+=dt;
  while(G.incomeAcc>=1000){
    // Reddito muri
    G.gold+=G.towers.filter(t=>!t.collapsed).length*WALL_INCOME;
    G.incomeAcc-=1000;
  }
  // Rigenerazione torre principale: +1 HP ogni 2 secondi
  if(!G.regenAcc) G.regenAcc=0;
  G.regenAcc+=dt;
  while(G.regenAcc>=2000){
    // Torre principale +1 HP ogni 2s
    if(G.towerHp<G.maxTowerHp && G.towerHp>0){
      G.towerHp=Math.min(G.maxTowerHp, G.towerHp+1);
    }
    // Torri laterali +1 HP ogni 2s (solo quelle non distrutte)
    G.towers.forEach(t=>{
      if(!t.collapsed && t.hp>0 && t.hp<t.maxHp){
        t.hp=Math.min(t.maxHp, t.hp+1);
      }
    });
    G.regenAcc-=2000;
  }
}
function updateAbCDs(dt){
  ['bomb','coffee','meeting','audit'].forEach(k=>{
    const ck='cd'+k[0].toUpperCase()+k.slice(1);
    if(G[ck]>0){G[ck]=Math.max(0,G[ck]-dt);updAbUI(k);}
  });
}
function updateSpawn(dt){
  if(G.queue.length>0){
    G.spawnAcc+=dt;
    while(G.queue.length>0&&G.spawnAcc>=G.queue[0].delay){
      doSpawn(G.queue.shift());G.spawnAcc=0;
    }
  } else if(G.enemies.every(e=>e.dead||e.reached)){
    waveComplete();
  }
}

function calcBuffs(){
  const mages=G.towers.filter(t=>t.def.magic&&t.active);
  const gu=G.gUpg;
  const gD=1+gu.dmg*GL_UPGS.find(u=>u.id==='dmg').per;
  const gR=1+gu.rng*GL_UPGS.find(u=>u.id==='rng').per;
  const gF=1+gu.rate*GL_UPGS.find(u=>u.id==='rate').per;
  const gP=1+gu.pspd*GL_UPGS.find(u=>u.id==='pspd').per;
  G.towers.filter(t=>!t.def.magic).forEach(t=>{
    const um=UPG_M[t.level-1];
    let d=um.d*gD,r=um.r*gR,f=um.f/gF,nocd=false;
    mages.forEach(m=>{
      const dist=Math.hypot(t.x-m.x,t.y-m.y);
      if(dist<=(m.eRng||m.def.rng)){
        if(m.def.bt==='dmg')   d*=1+m.def.bv;
        if(m.def.bt==='range') r*=1+m.def.bv;
        if(m.def.bt==='rate')  f*=1-m.def.bv;
        if(m.def.bt==='nocd')  nocd=true;
      }
    });
    t.eDmg=Math.round(t.def.dmg*d);
    t.eRng=Math.round(t.def.rng*r);
    t.eRate=Math.max(80,Math.round(t.def.rate*f));
    t.ePspd=Math.round((t.def.pspd||280)*gP);
    t.noCD=nocd;
  });
  G.towers.filter(t=>t.def.magic).forEach(t=>t.eRng=t.def.rng);
}

function nearestEnemy(x,y,range){
  let best=null,bd=Infinity;
  G.enemies.forEach(e=>{
    if(e.dead||e.reached) return;
    const d=Math.hypot(e.x-x,e.y-y);
    if(d<range&&d<bd){best=e;bd=d;}
  });
  return best;
}

function updateTowerLogic(dt){
  G.towers.filter(t=>!t.def.magic).forEach(t=>{
    if(!t.noCD) t.cd=Math.max(0,t.cd-dt); else t.cd=0;
    if(t.cd>0) return;
    const tgt=nearestEnemy(t.x,t.y,t.eRng);
    if(!tgt) return;
    t._targetAngle=Math.atan2(tgt.y-t.y,tgt.x-t.x);
    // Sparo dalla posizione canna (leggermente spostato verso il bersaglio)
    const gunX=t.x+Math.cos(t._targetAngle)*22;
    const gunY=t.y-26+Math.sin(t._targetAngle)*22;
    fireProj(gunX,gunY,tgt,t.def,t,t.eDmg);
    t.cd=t.eRate;
    // Muzzle flash + rinculo operatore
    burstParticles(gunX,gunY,t.def.pc||0xfbbf24,4);
    if(t.gfx&&t.gfx._operator){
      const rx=-Math.cos(t._targetAngle)*3;
      const ry=-Math.sin(t._targetAngle)*3;
      t.gfx._operator.x=rx;
      t.gfx._operator.y=-18+ry;
      setTimeout(()=>{ if(t.gfx&&t.gfx._operator){t.gfx._operator.x=0;} },70);
    }
  });
}

function updateEnemies(dt){
  G.enemies.forEach(e=>{
    if(e.dead||e.reached) return;
    if(e.stunT>0){e.stunT-=dt;return;}
    if(e.slowT>0) e.slowT-=dt; else e.slowFactor=1;

    const mc=mainTowerCenter();
    const cx=mc.x, cy=mc.y;

    // Trova il bersaglio più vicino: torri laterali attive o torre centrale
    const target=findEnemyTarget(e);
    const tdx=target.x-e.x, tdy=target.y-e.y;
    const tdist=Math.sqrt(tdx*tdx+tdy*tdy);
    const attackRange=target.isTower ? 55 :
                      e.tmpl.type==='ranged'&&e.tmpl.wr>0 ? e.tmpl.wr : 56;

    if(tdist<=attackRange){
      // Attacca il bersaglio
      e.atkCd=(e.atkCd||0)-dt;
      if(e.atkCd<=0){
        e.atkCd=(e.tmpl.type==='ranged'?650:540)+Math.random()*300;
        const dmg=e.tmpl.wd*(1+G.wave*.04);
        if(target.isTower){
          // Danno alla torre laterale
          damageSideTower(target.tower, dmg, e.x, e.y);
        } else {
          // Danno alla torre centrale
          damageTower(dmg);
          floatText(`-${dmg.toFixed(1)}❤️`, cx+(Math.random()-.5)*40, cy-65, '#ef4444');
        }
        // Proiettile visivo
        if(e.tmpl.type==='ranged'){
          const ang=Math.atan2(target.y-e.y,target.x-e.x);
          const p={x:e.x,y:e.y,dead:false,ang,spd:195,ico:e.tmpl.wpn,sz:17,
            dmg:0, // danno già applicato sopra
            tx:target.x,ty:target.y,gfx:null};
          buildEProjGfx(p);G.eprojs.push(p);
        }
      }
    } else {
      // Avanza verso il bersaglio
      const spd=e.tmpl.spd*(1+(G.wave-1)*.008)*e.slowFactor*(dt/1000);
      e.x+=tdx/tdist*spd; e.y+=tdy/tdist*spd;
    }

    // Fasi boss drago
    if(e.tmpl.phases){
      const ratio=e.hp/e.maxHp;
      for(let i=0;i<e.tmpl.phases.length;i++){
        if(ratio<=e.tmpl.phases[i].t+.26||i===e.tmpl.phases.length-1){
          if(e.phase!==i){
            e.phase=i;
            if(e.gfx&&e.gfx._sprite) e.gfx._sprite.tint=e.tmpl.phases[i].c;
          }
          break;
        }
      }
    }
  });
}

// Trova il bersaglio più vicino per un nemico
function findEnemyTarget(e){
  const mc=mainTowerCenter();
  const cx=mc.x, cy=mc.y;
  let best=null, bestDist=Infinity;

  G.towers.filter(t=>!t.collapsed).forEach(t=>{
    const d=Math.hypot(t.x-e.x, t.y-e.y);
    const toCenterDist=Math.hypot(cx-e.x, cy-e.y);
    if(d<toCenterDist*1.1 && d<bestDist){
      best=t; bestDist=d;
    }
  });

  if(best && bestDist<Math.hypot(cx-e.x,cy-e.y)+20){
    return {x:best.x, y:best.y-20, isTower:true, tower:best};
  }
  return {x:cx, y:cy, isTower:false};
}

// Danneggia una torre laterale
function damageSideTower(tower, dmg, ex, ey){
  if(tower.collapsed) return;
  tower.hp=Math.max(0, tower.hp-dmg);
  floatText(`-${Math.round(dmg)}`,tower.x,tower.y-40,'#ef4444');

  // Flash rosso sulla torre
  if(tower.gfx&&tower.gfx._body){
    tower.gfx._body.tint=0xff4444;
    setTimeout(()=>{if(tower.gfx&&tower.gfx._body)tower.gfx._body.tint=0xffffff;},120);
  }

  if(tower.hp<=0) destroySideTower(tower);
}

// Distrugge una torre laterale con animazione
function destroySideTower(tower){
  if(tower.collapsed) return;
  tower.collapsed=true;
  tower.hp=0;
  onTowerDestroyed(); // aggiorna stato muro completo

  floatText('💥 TORRE DISTRUTTA!', tower.x, tower.y-60, '#ef4444', 15);

  // Burst di particelle esplosione
  for(let i=0;i<20;i++) burstParticles(
    tower.x+(Math.random()-.5)*30,
    tower.y+(Math.random()-.5)*30,
    [0xef4444,0xf97316,0xfbbf24][Math.floor(Math.random()*3)], 3
  );

  // Animazione crollo: fade out + shake
  if(tower.gfx){
    let t=0;
    const shake=setInterval(()=>{
      t+=60;
      if(!tower.gfx){clearInterval(shake);return;}
      tower.gfx.x=tower.x+(Math.random()-.5)*8*(1-t/400);
      tower.gfx.y=tower.y+(Math.random()-.5)*8*(1-t/400);
      tower.gfx.alpha=Math.max(0,1-t/400);
      if(t>=400){
        clearInterval(shake);
        // Rimpiazza con macerie
        if(tower.gfx){
          tower.gfx.alpha=1;
          tower.gfx.x=tower.x;
          tower.gfx.y=tower.y;
          // Pulisci grafica e mostra macerie
          tower.gfx.removeChildren().forEach(c=>{try{c.destroy({children:true});}catch(e2){}});
          const rubble=new PIXI.Graphics();
          rubble.beginFill(0x334155,.9); rubble.drawCircle(-10,2,8);
          rubble.beginFill(0x475569,.8); rubble.drawCircle(6,-3,6);
          rubble.beginFill(0x1e293b,.7); rubble.drawCircle(-2,8,5);
          rubble.endFill();
          tower.gfx.addChild(rubble);
          // Testo macerie
          const txt=new PIXI.Text('🪨',{fontSize:20,resolution:2});
          txt.anchor.set(.5);rubble.addChild(txt);
        }
        updateAllWalls();
      }
    },60);
  }

  // Aggiorna muri — connessioni perse
  updateAllWalls();
}

function fireProj(x,y,tgt,def,tower,dmg){
  const p={x,y,target:tgt,dead:false,spd:tower?.ePspd||def.pspd||280,col:def.pc||0xfbbf24,sz:def.ps||5,dmg:dmg||20,ang:0,def,gfx:null};
  buildProjGfx(p);G.projs.push(p);
}
function fireEProj(e){
  const cx=CW/2,cy=CH/2;
  const ang=Math.atan2(cy-e.y,cx-e.x);
  const p={x:e.x,y:e.y,dead:false,ang,spd:195,ico:e.tmpl.wpn,sz:17,dmg:e.tmpl.wd*(1+G.wave*.04),tx:cx,ty:cy,gfx:null};
  buildEProjGfx(p);G.eprojs.push(p);
}

function updateProjs(dt){
  G.projs.forEach(p=>{
    if(p.dead) return;
    if(p.target.dead||p.target.reached){
      const live=G.enemies.filter(e=>!e.dead&&!e.reached);
      if(!live.length){killProj(p);return;}
      p.target=live.reduce((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y)?b:a);
    }
    const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.sqrt(dx*dx+dy*dy);
    const step=p.spd*(dt/1000);
    if(d<=step+p.target.tmpl.r*.6){impactProj(p);return;}
    p.x+=dx/d*step;p.y+=dy/d*step;
  });
  G.projs=G.projs.filter(p=>!p.dead);
}
function impactProj(p){
  killProj(p);
  if(p.def&&p.def.aoe){
    G.enemies.forEach(e=>{
      if(e.dead||e.reached) return;
      const d=Math.hypot(e.x-p.x,e.y-p.y);
      if(d<=p.def.aoe) hitEnemy(e,p.dmg*(1-d/p.def.aoe/2),p.def);
    });
    burstParticles(p.x,p.y,p.col,12);
  } else {hitEnemy(p.target,p.dmg,p.def);burstParticles(p.target.x,p.target.y,p.col,6);}
}
function killProj(p){p.dead=true;if(p.gfx){L.projs.removeChild(p.gfx);p.gfx.destroy();}}

function updateEProjs(dt){
  G.eprojs.forEach(p=>{
    if(p.dead) return;
    const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.sqrt(dx*dx+dy*dy);
    p.ang=Math.atan2(dy,dx);
    const step=p.spd*(dt/1000);
    if(d<=step+22){
      p.dead=true;if(p.gfx){L.projs.removeChild(p.gfx);p.gfx.destroy();}
      damageTower(p.dmg);burstParticles(p.tx,p.ty,0xef4444,5);
    } else {p.x+=dx/d*step;p.y+=dy/d*step;}
  });
  G.eprojs=G.eprojs.filter(p=>!p.dead);
}

function hitEnemy(e,dmg,def){
  if(e.dead||e.reached) return;
  if(e.shield){e.shield=false;if(e.gfx&&e.gfx._shield)e.gfx._shield.visible=false;floatText('🛡️',e.x,e.y-40,'#60a5fa');return;}
  dmg=Math.round(dmg*(1-(e.armor||0)));e.hp-=dmg;
  floatText(`-${dmg}`,e.x,e.y-e.tmpl.r*1.3,'#ffffff');
  if(def&&def.slow){e.slowFactor=def.slow;e.slowT=def.slowD;}
  if(e.hp<=0){
    if(e.canRespawn&&!e.hasRespawned){e.hp=Math.round(e.maxHp*.5);e.hasRespawned=true;floatText('RESPAWN!',e.x,e.y-50,'#f97316');return;}
    killEnemy(e);
  }
}
function killEnemy(e){
  e.dead=true;G.kills++;G.gold+=e.reward;
  floatText(`+${e.reward}💰`,e.x,e.y-e.tmpl.r*2,'#fbbf24');
  burstParticles(e.x,e.y,e.tmpl.col,10);
  if(e.gfx){setTimeout(()=>{L.enemies.removeChild(e.gfx);e.gfx.destroy({children:true});},120);}
}
function damageTower(dmg){
  const armorR=(G.gUpg.armor||0)*GL_UPGS.find(u=>u.id==='armor').per;
  // Danno minimo garantito: almeno 1 HP anche con armatura massima
  const actual=Math.max(1, dmg*(1-armorR));
  G.towerHp=Math.max(0,G.towerHp-actual);
  // Flash rosso sull'edificio
  if(mainGfx){ mainGfx.tint=0xff4444; setTimeout(()=>{ if(mainGfx) mainGfx.tint=0xffffff; },120); }
  if(G.towerHp<=0) gameOver();
}

function updateFloats(dt){
  G._floatTexts=G._floatTexts||[];
  G._floatTexts=G._floatTexts.filter(f=>{
    if(f._customUpdate) return !f._customUpdate(dt);
    if(f._isParticle){
      f._life-=f._decay*(dt/16);f.gfx.alpha=Math.max(0,f._life);
      f.gfx.x+=f.gfx._vx*(dt/1000);f.gfx.y+=f.gfx._vy*(dt/1000);f.gfx._vy+=180*(dt/1000);
      if(f._life<=0){L.fx.removeChild(f.gfx);f.gfx.destroy();return false;}
      return true;
    }
    f.y+=f._vy*(dt/16);f._life-=f._decay*(dt/16);f.alpha=Math.max(0,f._life);
    if(f._life<=0){L.hud2.removeChild(f);f.destroy();return false;}
    return true;
  });
}

// ─── SPAWN ──────────────────────────────────────────────────────
function doSpawn(item){
  const tmpl={...item.tmpl};
  const sc=1+(item.wave-1)*.07;
  const hp=Math.round(tmpl.hp*sc);
  const spawnAngle=(Math.floor(Math.random()*8))*Math.PI/4;
  const spawnR=getSpawnR();
  const e={
    tmpl,id:Math.random().toString(36).slice(2),
    x:CW/2+Math.cos(spawnAngle)*spawnR,
    y:CH/2+Math.sin(spawnAngle)*spawnR,
    hp,maxHp:hp,reward:tmpl.rw,
    dead:false,reached:false,
    stunT:0,slowT:0,slowFactor:1,
    shield:!!tmpl.shield,armor:tmpl.armor||0,
    canRespawn:!!tmpl.respawn,hasRespawned:false,
    atkCd:0,phase:0,gfx:null,
  };
  buildEnemyGfx(e);
  G.enemies.push(e);
}

function buildQueue(wave){
  const q=[];
  const isBoss=wave%10===0,bi=Math.floor(wave/10)-1;
  if(isBoss){
    const boss=BOSSES[bi];
    getMinionTmpls(wave).forEach(({tmpl,count,interval})=>{
      for(let i=0;i<count;i++) q.push({tmpl,wave,delay:interval});
    });
    const bDelay=Math.max(3500,q.length*320);
    if(boss.grp) for(let i=0;i<boss.grp;i++) q.push({tmpl:{...boss,boss:true},wave,delay:bDelay+i*680});
    else q.push({tmpl:{...boss,boss:true},wave,delay:bDelay});
  } else {
    getNormalTmpls(wave).forEach(({tmpl,count,interval})=>{
      for(let i=0;i<count;i++) q.push({tmpl,wave,delay:interval});
    });
  }
  return q;
}
function getNormalTmpls(w){
  // Ondate speciali
  if(w>=71&&w<=79){
    const n=4+Math.floor((w-70)*1.3);
    return['d_fire','d_elec','d_water','d_rock'].map(id=>({
      tmpl:{...ET.find(e=>e.id===id)},count:Math.max(1,Math.ceil(n/2)),interval:1400
    }));
  }
  if(w>=81&&w<=89){
    const n=4+Math.floor((w-80)*1.7);
    return['eng_j','eng_s','tech_l','devops'].map(id=>({
      tmpl:{...ET.find(e=>e.id===id)},count:Math.max(1,Math.ceil(n/2)),interval:1300
    }));
  }

  const tier=Math.min(Math.floor((w-1)/10),ET.length-1);
  const base={...ET[tier]};
  const count=5+(w-1)*10;
  const interval=Math.max(300,1100-w*3);

  // Modificatori visivi e comportamentali per ogni gruppo di 10
  const decade=Math.floor((w-1)/10); // 0-9
  switch(decade){
    case 0: // W1-10: normali, lenti
      return[{tmpl:{...base},count,interval}];
    case 1: // W11-20: più veloci (+20%), arancio brillante
      return[{tmpl:{...base,spd:base.spd*1.2,col:0xfb923c,n:base.n+' Veloce'},count,interval:interval*.85}];
    case 2: // W21-30: corazzati (armor 20%), blu scuro
      return[{tmpl:{...base,armor:.2,col:0x1e40af,n:base.n+' Corazzato',r:base.r+3},count,interval}];
    case 3: // W31-40: doppio tipo (melee + ranged insieme)
      return[
        {tmpl:{...base,type:'melee', col:0xdc2626,n:base.n+' Assalto'},count:Math.floor(count/2),interval},
        {tmpl:{...base,type:'ranged',col:0x7c3aed,n:base.n+' Cecchino',wr:170},count:Math.floor(count/2),interval:interval*1.2},
      ];
    case 4: // W41-50: giganti (+50% HP, +4 r), viola
      return[{tmpl:{...base,hp:base.hp*1.5,col:0x6b21a8,n:base.n+' Gigante',r:base.r+4,spd:base.spd*.85},count,interval:interval*1.1}];
    case 5: // W51-60: veloci e minuti, sciame fitto
      return[{tmpl:{...base,hp:base.hp*.7,spd:base.spd*1.4,col:0x059669,n:base.n+' Sciame',r:base.r-3},count:count*2,interval:interval*.5}];
    case 6: // W61-70: boss-tier normali, scuri e pesanti
      return[{tmpl:{...base,hp:base.hp*2,wd:base.wd*1.5,col:0x0f172a,n:base.n+' Élite',r:base.r+5},count,interval:interval*1.2}];
    default:
      return[{tmpl:{...base},count,interval}];
  }
}
function getMinionTmpls(wave){
  if(wave===80) return['d_fire','d_elec','d_water','d_rock'].map(id=>({tmpl:{...ET.find(e=>e.id===id)},count:2,interval:1800}));
  if(wave===90) return['eng_j','eng_s','tech_l','devops'].map(id=>({tmpl:{...ET.find(e=>e.id===id)},count:3,interval:1500}));
  const tier=Math.floor(wave/10)-1;if(tier<=0) return[];
  return[{tmpl:{...ET[Math.min(tier,ET.length-1)]},count:tier*3,interval:1900}];
}

// ─── WAVE ───────────────────────────────────────────────────────
function startCountdown(wave){
  G.cdActive=true;G.cdMs=5000;G.cdWave=wave;
  document.getElementById('cdo').classList.add('on');
  document.getElementById('cdn').textContent='5';
  document.getElementById('cd-hud').textContent=`⏱️ Ondata ${wave} in 5s`;
}

function launchWave(wn){
  G.wave=wn;G.running=true;
  G.queue=buildQueue(wn);G.spawnAcc=0;

  // Aggiungi troll se il muro era completo alla fine dell'ondata precedente
  spawnWaveTrolls(wn);

  const isBoss=wn%10===0;
  const wb=document.getElementById('wb');
  wb.textContent=isBoss?`⚠ BOSS — ONDATA ${wn}!`:`🌊 ONDATA ${wn}`;
  wb.className=(isBoss?'boss ':'')+' on';
  setTimeout(()=>wb.classList.remove('on'),3000);
  if(isBoss){
    const boss=BOSSES[Math.floor(wn/10)-1];
    document.getElementById('cd-hud').textContent=`⚠️ BOSS: ${boss.n}`;
    document.getElementById('cd-hud').className='boss';
  } else {
    document.getElementById('cd-hud').textContent=`🌊 Ondata ${wn}/100`;
    document.getElementById('cd-hud').className='';
  }
  // Stagione
  const si=Math.min(Math.floor((wn-1)/10),9);
  if(si!==G.lastSeasonIdx){
    G.lastSeasonIdx=si;buildBG();
    floatText(`✨ ${SEASONS[si].n}`,CW/2,CH*.28,`#${SEASONS[si].accent.toString(16).padStart(6,'0')}`,17);
  }
  // Auto upgrade
  if(wn>=G.nextAutoUpg){
    G.towers.filter(t=>!t.def.magic&&t.level<5).forEach(t=>{
      t.level++;floatText(UPG_NAMES[t.level-1]+'!',t.x,t.y-55,'#fbbf24',13);
    });
    G.nextAutoUpg+=15;
  }
}

function waveComplete(){
  G.running=false;
  if(G.wave>=100){triggerWin();return;}
  const bonus=30+G.wave*5;G.gold+=bonus;
  floatText(`Ondata ${G.wave} OK! +${bonus}💰`,CW/2,CH*.33,'#34d399',14);
  setTimeout(()=>{if(!G.over&&!G.won) startCountdown(G.wave+1);},1800);
}

// ── MURO COMPLETO & TROLL ────────────────────────────────────────

// Chiamata da ability.js ogni volta che si piazza una torre
function onTowerPlaced(){
  const active=G.towers.filter(t=>!t.collapsed).length;
  if(active>=MAX_SLOTS && !G.wallComplete){
    G.wallComplete=true;
    triggerWallComplete();
  }
}

// Chiamata quando una torre crolla
function onTowerDestroyed(){
  if(G.wallComplete && G.towers.filter(t=>!t.collapsed).length<MAX_SLOTS){
    G.wallComplete=false;
  }
}

function triggerWallComplete(){
  // Banner visivo
  const wb=document.getElementById('wb');
  wb.textContent='🧱 MURO DIFENSIVO COMPLETO! I troll arrivano alla prossima ondata!';
  wb.className='boss on';
  setTimeout(()=>wb.classList.remove('on'),5000);

  // Numero troll = numero torri attive
  G.nextWaveTrolls=G.towers.filter(t=>!t.collapsed).length;

  // Animazione: flash oro su tutti i muri
  floatText(
    `🧱 MURO COMPLETO! +${G.nextWaveTrolls} TROLL alla prossima ondata!`,
    CW/2, CH*0.25, '#fbbf24', 18
  );

  // Colore muri → dorato per 3 secondi
  G.towers.forEach(t=>{
    if(!t.gfx||!t.gfx._wall) return;
    const wall=t.gfx._wall;
    // Salva alpha originale e imposta dorato
    wall.tint=0xfbbf24;
    setTimeout(()=>{ if(wall) wall.tint=0xffffff; }, 3000);
  });
}

// Spawna N troll all'inizio dell'ondata (chiamata da launchWave)
function spawnWaveTrolls(wn){
  const n=G.nextWaveTrolls||0;
  if(n<=0) return;
  G.nextWaveTrolls=0;

  // Aggiunge i troll alla coda con delay scaglionati
  for(let i=0;i<n;i++){
    const tmpl={
      ...TROLL_TMPL,
      hp:Math.round(TROLL_TMPL.hp*(1+(wn-1)*0.07)),  // scala con l'ondata
      n:`🧌 TROLL ${i+1}/${n}`,
    };
    G.queue.push({tmpl, wave:wn, delay:4000+i*1500}); // arrivano dopo i normali
  }

  floatText(
    `⚠️ ${n} TROLL DI MORDOR in arrivo!`,
    CW/2, CH*0.3, '#ef4444', 16
  );
}

// Spawn singolo troll (usato da spawnWaveTrolls via queue)
function spawnTroll(){
  // Non più usato direttamente — i troll entrano via queue
}
