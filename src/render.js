'use strict';
// RENDER.JS
// ─── BACKGROUND ─────────────────────────────────────────────────
function getSeason(){ return SEASONS[Math.min(Math.floor(Math.max(0,(G.wave||0)-1)/10),9)]; }

function buildBG(){
  const s=getSeason();
  if(bgGfx){ try{L.bg.removeChild(bgGfx);bgGfx.destroy();}catch(e){} bgGfx=null; }
  if(roadGfx){ try{L.roads.removeChild(roadGfx);roadGfx.destroy();}catch(e){} roadGfx=null; }
  bgGfx=new PIXI.Graphics();
  roadGfx=new PIXI.Graphics();

  const cx=CW/2, cy=CH*0.52;   // punto di fuga centrale
  const groundY=CH*0.72;        // linea orizzonte terreno
  const yf=ISO.yFactor;

  // ── CIELO (gradiente simulato) ─────────────────────────────
  bgGfx.beginFill(s.sky[0]); bgGfx.drawRect(0,0,CW,groundY); bgGfx.endFill();
  // Fascia orizzonte più chiara
  bgGfx.beginFill(lerpColor(s.sky[0],s.sky[1],.5),.6);
  bgGfx.drawRect(0,groundY-40,CW,60); bgGfx.endFill();

  // Stelle/luna (se previste dalla stagione)
  if(s.stars||s.sky[0]<0x100000){
    bgGfx.fillStyle=0xffffff;
    for(let i=0;i<50;i++){
      const sx=(Math.sin(i*7.3)*.5+.5)*CW;
      const sy=(Math.sin(i*3.1)*.5+.5)*groundY*.75;
      bgGfx.beginFill(0xffffff, .4+Math.sin(i*.7)*.3);
      bgGfx.drawCircle(sx,sy,i%5===0?1.5:.7); bgGfx.endFill();
    }
  }

  // Sole/luna/astro stagionale
  if(s.sun){
    const {x:sx,y:sy,r,col,glow}=s.sun;
    const sg=bgGfx;
    sg.beginFill(parseInt(glow?.replace('#',''),16)||0xffd700,.18);
    sg.drawCircle(CW*sx,groundY*sy,r*3); sg.endFill();
    sg.beginFill(col||0xffd700);
    sg.drawCircle(CW*sx,groundY*sy,r); sg.endFill();
  }

  // Montagne sfondo (isometriche)
  const mCol=lerpColor(s.sky[1],s.ground,.3);
  [[.05,.85],[.15,.7],[.28,.78],[.4,.65],[.55,.75],[.7,.68],[.85,.8]].forEach(([x,y])=>{
    bgGfx.beginFill(mCol,.7);
    bgGfx.beginFill(lerpColor(mCol,0x000000,.2),.5);
    const mx=CW*x, mTop=groundY*y;
    bgGfx.moveTo(mx-50,groundY); bgGfx.lineTo(mx,mTop); bgGfx.lineTo(mx+50,groundY);
    bgGfx.endFill();
    // neve cime
    bgGfx.beginFill(0xffffff,.3);
    bgGfx.moveTo(mx-12,mTop+18); bgGfx.lineTo(mx,mTop); bgGfx.lineTo(mx+12,mTop+18);
    bgGfx.endFill();
  });

  // ── TERRENO ISOMETRICO ────────────────────────────────────
  // Piano inclinato con prospettiva
  const ground=bgGfx;
  // Colore terreno base
  ground.beginFill(s.ground); ground.drawRect(0,groundY,CW,CH-groundY); ground.endFill();
  // Linee di prospettiva (griglia isometrica sul terreno)
  const gridLines=12;
  for(let i=0;i<=gridLines;i++){
    const xpos=CW*(i/gridLines);
    roadGfx.lineStyle(1,s.accent,.05);
    roadGfx.moveTo(xpos,groundY);
    roadGfx.lineTo(cx+(xpos-cx)*.1, groundY+(CH-groundY)*.95);
  }
  // Linee orizzontali terreno
  for(let d=0;d<5;d++){
    const ypos=groundY+d*(CH-groundY)/5;
    roadGfx.lineStyle(1,s.accent,.04);
    roadGfx.moveTo(0,ypos); roadGfx.lineTo(CW,ypos);
  }
  roadGfx.lineStyle(0);

  // ── STRADE (percorsi nemici in prospettiva) ────────────────
  // 8 percorsi che convergono verso il centro dalla prospettiva
  const spawnR=getSpawnR();
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const ex=cx+Math.cos(a)*CW, ey=cy+Math.sin(a)*spawnR*1.05;
    const isMain=[0,2,4,6].includes(i);
    roadGfx.lineStyle(isMain?40:28, s.road, isMain?.9:.55);
    roadGfx.moveTo(cx,cy); roadGfx.lineTo(ex,ey);
    // Bordi strada principale
    if(isMain){
      const perp=a+Math.PI/2;
      roadGfx.lineStyle(2,lerpColor(s.road,0xffffff,.15),.35);
      roadGfx.moveTo(cx+Math.cos(perp)*20,cy+Math.sin(perp)*20);
      roadGfx.lineTo(ex+Math.cos(perp)*20,ey+Math.sin(perp)*20);
    }
  }
  roadGfx.lineStyle(0);

  // ── VEGETAZIONE (alberi in prospettiva) ───────────────────
  const tC1=lerpColor(s.ground,0x166534,.65);
  const tC2=lerpColor(s.ground,0x14532d,.75);
  const rng=(seed,mn,mx)=>mn+(Math.sin(seed*137.508+seed*2.399)*.5+.5)*(mx-mn);
  for(let ti=0;ti<160;ti++){
    const ang=rng(ti,0,Math.PI*2);
    const dist=rng(ti*3,100,spawnR*.9);
    const tx=cx+Math.cos(ang)*dist;
    const ty=cy+Math.sin(ang)*dist*yf;
    const tsize=rng(ti*7,6,15);
    const onMain=[0,2,4,6].some(i=>{
      const a=i*Math.PI/4;
      const dx2=tx-cx,dy2=ty-cy;
      const along=dx2*Math.cos(a)+dy2*Math.sin(a);
      return along>0&&Math.abs(-dx2*Math.sin(a)+dy2*Math.cos(a))<30;
    });
    if(onMain) continue;
    // Tronco
    roadGfx.lineStyle(tsize*.3,lerpColor(tC2,0x000000,.4),1);
    roadGfx.moveTo(tx,ty); roadGfx.lineTo(tx,ty-tsize*1.5);
    roadGfx.lineStyle(0);
    // Chioma
    roadGfx.beginFill(0x000000,.15); roadGfx.drawEllipse(tx+tsize*.25,ty-tsize*.8,tsize*.9,tsize*.3); roadGfx.endFill();
    roadGfx.beginFill(tC2,.85); roadGfx.drawCircle(tx,ty-tsize*1.8,tsize); roadGfx.endFill();
    roadGfx.beginFill(tC1,.9); roadGfx.drawCircle(tx-tsize*.15,ty-tsize*2.0,tsize*.72); roadGfx.endFill();
    roadGfx.beginFill(0xffffff,.05); roadGfx.drawEllipse(tx-tsize*.18,ty-tsize*2.18,tsize*.38,tsize*.18); roadGfx.endFill();
  }

  // ── SPAWN MARKER ──────────────────────────────────────────
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const sx=cx+Math.cos(a)*spawnR, sy=cy+Math.sin(a)*spawnR*yf;
    const isMain=[0,2,4,6].includes(i);
    roadGfx.beginFill(0xe94560,isMain?.2:.06); roadGfx.drawCircle(sx,sy,isMain?18:12); roadGfx.endFill();
    if(isMain){
      roadGfx.lineStyle(2,0xe94560,.55); roadGfx.drawCircle(sx,sy,18); roadGfx.lineStyle(0);
      roadGfx.beginFill(0xe94560,.8); roadGfx.drawCircle(sx,sy,5); roadGfx.endFill();
    }
  }

  L.bg.addChild(bgGfx);
  L.roads.addChild(roadGfx);
  document.getElementById('hse').textContent=s.n;
}

// Helper: interpola due colori hex
function lerpColor(a,b,t){
  const ar=(a>>16)&0xff, ag=(a>>8)&0xff, ab2=a&0xff;
  const br=(b>>16)&0xff, bg2=(b>>8)&0xff, bb=b&0xff;
  const r=Math.round(ar+(br-ar)*t);
  const g=Math.round(ag+(bg2-ag)*t);
  const bl=Math.round(ab2+(bb-ab2)*t);
  return (r<<16)|(g<<8)|bl;
}

function getSpawnR(){ return Math.min(CW,CH)*.46; }
function mainTowerCenter(){ return {x:CW/2, y:CH*0.72}; } // base torre

// ─── TORRE PRINCIPALE ───────────────────────────────────────────

function buildMainTower(){
  ['mainGfx','gunGfx','mainHpGfx','mainHpFillGfx'].forEach(k=>{
    if(window[k]){ try{L.tower.removeChild(window[k]);window[k].destroy();}catch(e){} window[k]=null; }
  });
  if(window.playerContainer){ try{L.tower.removeChild(window.playerContainer);window.playerContainer.destroy({children:true});}catch(e){} window.playerContainer=null; }

  const cx=CW/2, groundY=CH*0.72;
  // Torre al centro X, base a groundY
  const TW=110, floors=5, fH=52;
  const totalH=floors*fH;
  const bx=cx-TW/2, by=groundY-totalH;

  // ── VETTORE PROFONDITÀ ISOMETRICA (luce da alto-sinistra, profondità verso dx) ──
  const D=30;                    // lunghezza profondità
  const dx=D*0.87, dy=-D*0.5;    // 30° verso l'alto-destra (iso classico 2:1)

  mainGfx=new PIXI.Graphics();

  // Ombra base (più ampia per il volume 3D)
  mainGfx.beginFill(0x000000,.4);
  mainGfx.drawEllipse(cx+dx*.5,groundY+6,TW*.62,15);
  mainGfx.endFill();

  const wg=mainGfx;

  // ── FACCIA LATERALE (destra, in ombra — disegnata per prima, sotto) ──
  wg.beginFill(0x0a1730);
  wg.drawPolygon([
    bx+TW,by,  bx+TW+dx,by+dy,
    bx+TW+dx,by+dy+totalH,  bx+TW,by+totalH,
  ]);
  wg.endFill();
  // Bande ombra sulla faccia laterale (profondità percepita)
  for(let f=0;f<floors;f++){
    const fy=by+f*fH;
    wg.beginFill(0x000000,.15+f*.03);
    wg.drawPolygon([
      bx+TW,fy,  bx+TW+dx,fy+dy,
      bx+TW+dx,fy+dy+fH,  bx+TW,fy+fH,
    ]);
    wg.endFill();
  }
  // Finestre laterali (parallelogrammi skewed, spente/riflesso)
  for(let f=0;f<floors;f++){
    const fy=by+f*fH+fH*.32;
    const wH=fH*.36;
    wg.beginFill(0x0a1524,.85);
    wg.drawPolygon([
      bx+TW+dx*.35,fy+dy*.35,        bx+TW+dx*.75,fy+dy*.75,
      bx+TW+dx*.75,fy+dy*.75+wH*.7,  bx+TW+dx*.35,fy+dy*.35+wH*.7,
    ]);
    wg.endFill();
  }

  // ── FACCIA FRONTALE (illuminata, disegnata sopra) ──
  wg.beginFill(0x1a3560);
  wg.drawRect(bx,by,TW,totalH);
  wg.endFill();
  // Variazione per piano
  for(let f=0;f<floors;f++){
    const fy=by+f*fH;
    wg.beginFill(f%2===0?0x21437a:0x1a3560,.35);
    wg.drawRect(bx,fy,TW,fH);
    wg.endFill();
    wg.lineStyle(1,0x0a1830,.8);
    wg.moveTo(bx,fy); wg.lineTo(bx+TW,fy);
    wg.lineStyle(0);
  }
  // Gradiente ambient occlusion: più scuro verso il basso
  for(let i=0;i<6;i++){
    wg.beginFill(0x000000,.05);
    wg.drawRect(bx,by+totalH-(i+1)*(totalH/6),TW,totalH/6);
    wg.endFill();
  }
  // Luce dall'alto sul fronte (rim light)
  wg.beginFill(0x5b8def,.1);
  wg.drawRect(bx,by,TW,totalH*.25);
  wg.endFill();

  // ── FINESTRE FRONTALI (3 per piano) ──
  const winW=20, winH=18, winGap=(TW-3*winW)/4;
  for(let f=0;f<floors;f++){
    const fy=by+f*fH+fH/2-winH/2;
    for(let w=0;w<3;w++){
      const wx=bx+winGap*(w+1)+winW*w;
      const lit=Math.sin(Date.now()/900+f*2.1+w*1.3)>.05;
      const litCol=f===0?0xfbbf24:f===floors-1?0xfef08a:0xfde68a;
      wg.beginFill(0x061020);
      wg.drawRoundedRect(wx-2,fy-2,winW+4,winH+4,3);
      wg.endFill();
      wg.beginFill(lit?litCol:0x0a1222,.9);
      wg.drawRoundedRect(wx,fy,winW,winH,2);
      wg.endFill();
      if(lit){
        wg.beginFill(litCol,.15);
        wg.drawRoundedRect(wx-5,fy-5,winW+10,winH+10,4);
        wg.endFill();
      }
      wg.lineStyle(1,0x2a4a80,.6);
      wg.moveTo(wx+winW/2,fy); wg.lineTo(wx+winW/2,fy+winH);
      wg.moveTo(wx,fy+winH/2); wg.lineTo(wx+winW,fy+winH/2);
      wg.lineStyle(0);
    }
  }

  // ── BORDI EDIFICIO (outline scuro per definizione volume) ──
  wg.lineStyle(2.5,0x040c1a,.9);
  wg.drawRect(bx,by,TW,totalH);                              // fronte
  wg.drawPolygon([bx+TW,by, bx+TW+dx,by+dy, bx+TW+dx,by+dy+totalH, bx+TW,by+totalH]); // lato
  wg.lineStyle(0);
  // Spigolo luminoso (dove fronte e lato si incontrano — riceve più luce)
  wg.lineStyle(2,0x7ba7f0,.55);
  wg.moveTo(bx+TW,by); wg.lineTo(bx+TW,by+totalH);
  wg.lineStyle(0);
  // Spigolo superiore fronte (rim light forte)
  wg.lineStyle(2,0x9cc0ff,.6);
  wg.moveTo(bx,by); wg.lineTo(bx+TW,by);
  wg.lineStyle(0);

  // ── TETTO (superficie superiore in prospettiva — poligono, non rettangolo) ──
  wg.beginFill(0x2d5a9f);
  wg.drawPolygon([
    bx,by,  bx+TW,by,
    bx+TW+dx,by+dy,  bx+dx,by+dy,
  ]);
  wg.endFill();
  // Highlight tetto (più luce, superficie rivolta verso l'alto)
  wg.beginFill(0x6fa3ef,.35);
  wg.drawPolygon([
    bx,by,  bx+TW,by,
    bx+TW+dx*.5,by+dy*.5,  bx+dx*.5,by+dy*.5,
  ]);
  wg.endFill();
  wg.lineStyle(1.5,0x0a1830,.7);
  wg.drawPolygon([bx,by, bx+TW,by, bx+TW+dx,by+dy, bx+dx,by+dy]);
  wg.lineStyle(0);

  // Parapetto sul bordo frontale del tetto
  wg.beginFill(0x1e3a5f);
  wg.drawRect(bx-4,by-14,TW+8,14);
  wg.endFill();
  wg.lineStyle(1.5,0x040c1a,.7);
  wg.drawRect(bx-4,by-14,TW+8,14);
  wg.lineStyle(0);
  // Merli
  for(let m=0;m<7;m++){
    const mx=bx-4+m*(TW+8)/7;
    wg.beginFill(0x2563eb,.85);
    wg.drawRect(mx+2,by-28,12,14);
    wg.endFill();
    wg.lineStyle(1,0x040c1a,.6);
    wg.drawRect(mx+2,by-28,12,14);
    wg.lineStyle(0);
  }
  // Bordo laterale parapetto (profondità)
  wg.beginFill(0x0f2040);
  wg.drawPolygon([
    bx-4+TW+8,by-14,  bx-4+TW+8+dx*.4,by-14+dy*.4,
    bx-4+TW+8+dx*.4,by+dy*.4,        bx-4+TW+8,by,
  ]);
  wg.endFill();

  // ── ANTENNA ──
  wg.lineStyle(2,0x64748b,.9);
  wg.moveTo(cx-10,by-28); wg.lineTo(cx-10,by-65);
  wg.moveTo(cx+10,by-28); wg.lineTo(cx+10,by-58);
  wg.lineStyle(0);
  const blink=Math.sin(Date.now()/500)>0;
  wg.beginFill(blink?0xe74c3c:0x7f1d1d,.9);
  wg.drawCircle(cx-10,by-66,4);
  wg.endFill();

  // ── INSEGNA CORP. ──
  wg.beginFill(0xfbbf24,.95);
  wg.drawRoundedRect(cx-28,by+totalH-28,56,16,4);
  wg.endFill();
  wg.lineStyle(2,0xf59e0b,.8);
  wg.drawRoundedRect(cx-28,by+totalH-28,56,16,4);
  wg.lineStyle(0);

  // ── PORTA INGRESSO ──
  wg.beginFill(0x0a1020);
  wg.drawRoundedRect(cx-16,groundY-42,32,42,4);
  wg.endFill();
  wg.lineStyle(2,0x1e3a5f,.6);
  wg.drawRoundedRect(cx-16,groundY-42,32,42,4);
  wg.lineStyle(0);
  wg.beginFill(0xfbbf24,.8);
  wg.drawCircle(cx+10,groundY-20,2.5);
  wg.endFill();

  L.tower.addChild(mainGfx);
  window.mainGfx=mainGfx;

  // ── DIPENDENTE SUL TETTO ──
  const playerCont=new PIXI.Container();
  playerCont.position.set(cx, by-28);
  const pr=14;

  // Ombra
  const psh=new PIXI.Graphics();
  psh.beginFill(0x000000,.28); psh.drawEllipse(0,pr*.95,pr*.75,pr*.2); psh.endFill();
  playerCont.addChild(psh);

  // ── SPRITE PROFESSIONALE (tintato oro/arancio — il protagonista) ──
  const ptex=texCache[WORKER_SPRITE];
  let pg;
  if(ptex){
    const sprite=new PIXI.Sprite(ptex);
    sprite.anchor.set(0.5, 0.9375);
    sprite.height=pr*2.17;
    sprite.width=sprite.height*(96/128);
    sprite.position.set(0, pr*0.9);
    sprite.tint=0xf59e0b; // arancio/oro — colore distintivo protagonista
    playerCont.addChild(sprite);
    playerCont._gfx=sprite;
  } else {
    pg=new PIXI.Graphics();
    pg.beginFill(0xf59e0b);pg.drawRoundedRect(-pr*.44,-pr*.5,pr*.88,pr*1.3,pr*.15);pg.endFill();
    playerCont.addChild(pg);
    playerCont._gfx=pg;
  }

  // ── DETTAGLI OVERLAY (occhi, cravatta rossa, elmetto — sempre nitidi) ──
  const pov=new PIXI.Graphics();
  // Occhi
  pov.beginFill(0xffffff); pov.drawCircle(-pr*.14,-pr*.68,pr*.12); pov.drawCircle(pr*.14,-pr*.68,pr*.12); pov.endFill();
  pov.beginFill(0x1e293b); pov.drawCircle(-pr*.14,-pr*.67,pr*.07); pov.drawCircle(pr*.14,-pr*.67,pr*.07); pov.endFill();
  pov.beginFill(0x000000); pov.drawCircle(-pr*.12,-pr*.66,pr*.035); pov.drawCircle(pr*.16,-pr*.66,pr*.035); pov.endFill();
  // Bocca
  pov.lineStyle(pr*.055,0x7f1d1d,1);
  pov.moveTo(-pr*.12,-pr*.55); pov.lineTo(pr*.12,-pr*.52); pov.lineStyle(0);
  // Sopracciglia
  pov.lineStyle(pr*.07,0x2a2a2a,1);
  pov.moveTo(-pr*.22,-pr*.8); pov.lineTo(-pr*.06,-pr*.75);
  pov.moveTo(pr*.22,-pr*.8); pov.lineTo(pr*.06,-pr*.75);
  pov.lineStyle(0);
  // Cravatta rossa distintiva (protagonista)
  pov.beginFill(0xe94560);
  pov.drawPolygon([-pr*.05,-pr*.12, pr*.05,-pr*.12, pr*.04,pr*.08, 0,pr*.22, -pr*.04,pr*.08]);
  pov.endFill();
  // Elmetto oro
  pov.lineStyle(1.5,0x92400e,.8);
  pov.beginFill(0xfbbf24,.95); pov.drawEllipse(0,-pr*.88,pr*.42,pr*.21); pov.endFill();
  pov.beginFill(0xf59e0b); pov.drawRect(-pr*.42,-pr*.9,pr*.84,pr*.09); pov.endFill();
  pov.lineStyle(0);

  playerCont.addChild(pov);
  L.tower.addChild(playerCont);
  window.playerContainer=playerCont;

  // Canna
  gunGfx=new PIXI.Graphics();
  gunGfx.beginFill(0x334155); gunGfx.drawRoundedRect(-1,-2,30,5,2); gunGfx.endFill();
  gunGfx.beginFill(0x475569); gunGfx.drawRoundedRect(8,-4,14,4,2); gunGfx.endFill();
  gunGfx.beginFill(0x94a3b8); gunGfx.drawCircle(30,0,4); gunGfx.endFill();
  gunGfx.position.set(cx, by-28+pr*.38);
  gunGfx.rotation=gunAngle;

  // HP bar
  mainHpGfx=new PIXI.Graphics();
  mainHpGfx.beginFill(0x000000,.45);
  mainHpGfx.drawRoundedRect(bx-1,by-42,TW+2,9,4);
  mainHpGfx.endFill();
  mainHpGfx.beginFill(0x1e293b);
  mainHpGfx.drawRoundedRect(bx,by-41,TW,7,3);
  mainHpGfx.endFill();

  mainHpFillGfx=new PIXI.Graphics();

  L.tower.addChild(gunGfx,mainHpGfx,mainHpFillGfx);
  window.gunGfx=gunGfx;
  window.mainHpGfx=mainHpGfx; window.mainHpFillGfx=mainHpFillGfx;
  updateMainHpBar();
}

function updateMainHpBar(){
  if(!mainHpFillGfx) return;
  mainHpFillGfx.clear();
  const cx=CW/2, groundY=CH*0.72;
  const floors=5, fH=52, TW=110;
  const by=groundY-floors*fH;
  const bx=cx-TW/2;
  const r=Math.max(0,G.towerHp/G.maxTowerHp);
  const c=r>.5?0x22c55e:r>.25?0xf59e0b:0xef4444;
  mainHpFillGfx.beginFill(c);
  mainHpFillGfx.drawRoundedRect(bx,by-41,TW*r,7,3);
  mainHpFillGfx.endFill();
}

// ─── SLOT INDICATORI ────────────────────────────────────────────
// Ridisegna i muri tra torri laterali adiacenti
function updateAllWalls(){
  if(!G.towers) return;
  G.towers.forEach(t=>{
    if(!t.gfx||!t.gfx._wall) return;
    const wall=t.gfx._wall;
    wall.clear();
    if(t.collapsed) return; // torre distrutta: nessun muro

    // Trova vicini adiacenti (slot ±1 nell'anello, wrapping 11→0)
    [-1,1].forEach(d=>{
      const idx=((t.slotIdx+d)+MAX_SLOTS)%MAX_SLOTS;
      const n=G.towers.find(n=>n.slotIdx===idx && !n.collapsed);
      if(!n) return;

      const dx=n.x-t.x, dy=n.y-t.y;
      const dl=Math.sqrt(dx*dx+dy*dy);
      if(dl<5) return; // stessa posizione, salta
      const nx2=dx/dl, ny2=dy/dl;
      const perp={x:-ny2,y:nx2};

      // Muro spesso
      wall.lineStyle(8,0x1e3a5f,.9);
      wall.moveTo(0,0); wall.lineTo(dx,dy);
      wall.lineStyle(4,0x2d4a6a,.5);
      wall.moveTo(0,0); wall.lineTo(dx,dy);
      wall.lineStyle(0);
      // Merli ogni 30px
      for(let d2=28;d2<dl-28;d2+=30){
        wall.beginFill(0x2d5a8a,.85);
        wall.drawRect(nx2*d2+perp.x*5-4, ny2*d2+perp.y*5-4, 8,8);
        wall.endFill();
      }
    });
  });
}

function buildSlotIndicators(){
  if(slotGfx){ try{L.tower.removeChild(slotGfx);slotGfx.destroy();}catch(e){} slotGfx=null; }
  slotGfx=new PIXI.Graphics();
  const cx=CW/2,cy=CH/2;
  const sr=Math.min(CW,CH)*SLOT_RING_FRAC;
  for(let i=0;i<MAX_SLOTS;i++){
    const a=i*Math.PI*2/MAX_SLOTS - Math.PI/2;
    const tx=cx+Math.cos(a)*sr, ty=cy+Math.sin(a)*sr;
    const occupied=G.towers.some(t=>t.slotIdx===i);
    if(!occupied){
      slotGfx.lineStyle(1.5,0x3b82f6,.3);
      slotGfx.drawCircle(tx,ty,18);
      slotGfx.lineStyle(0);
      slotGfx.beginFill(0x1e3a5f,.15);
      slotGfx.drawCircle(tx,ty,18);
      slotGfx.endFill();
    }
  }
  L.tower.addChild(slotGfx);
}

// Posizioni slot: cerchio COMPLETO attorno alla torre centrale
// Tutti i 12 slot equidistanti → i muri si chiudono sempre
function getSlotPos(idx){
  const cx=CW/2;
  const groundY=CH*0.72;           // base torre isometrica
  const cy=groundY-5*52/2;         // centro torre (metà altezza edificio)
  const sr=Math.min(CW,CH)*SLOT_RING_FRAC;
  // Cerchio completo: 360°/12 = 30° per slot, NESSUN arco aperto
  const a=idx*(Math.PI*2/MAX_SLOTS) - Math.PI/2;
  return {
    x: cx + Math.cos(a)*sr,
    y: cy + Math.sin(a)*sr*0.65,   // leggero schiacciamento isometrico
    angle: a,
  };
}
function getFreeSlot(){ const used=new Set(G.towers.map(t=>t.slotIdx)); for(let i=0;i<MAX_SLOTS;i++) if(!used.has(i)) return i; return -1; }

// ─── TORRI LATERALI ─────────────────────────────────────────────
function buildTowerGfx(t){
  const {x,y,def}=t;
  const g=new PIXI.Container();
  const pal={pm:0xef4444,sm:0x10b981,dev:0x8b5cf6,m_agile:0x059669,m_scrum:0x2563eb,m_itil:0x7c3aed,m_vision:0xd97706};
  const col=pal[def.id]||0x60a5fa;

  // Vettore profondità isometrico (stesso angolo della torre principale, scala ridotta)
  const D=9, dx=D*0.87, dy=-D*0.5;

  // Ombra (più ampia per il volume 3D)
  const sh=new PIXI.Graphics();
  sh.beginFill(0x000000,.3);sh.drawEllipse(dx*.4,7,17,6);sh.endFill();g.addChild(sh);

  // ── BASE PIATTAFORMA con volume 3D ──
  const base=new PIXI.Graphics();
  // Faccia laterale base (ombra)
  base.beginFill(0x060c18);
  base.drawPolygon([18,-18, 18+dx,-18+dy, 18+dx,18+dy, 18,18]);
  base.endFill();
  // Faccia frontale base
  base.beginFill(0x0f172a);
  base.drawRoundedRect(-18,-18,36,36,7);
  base.endFill();
  // Tetto base (piccolo bordo superiore)
  base.beginFill(lightenC(col,1.3),.4);
  base.drawPolygon([-18,-18, 18,-18, 18+dx,-18+dy, -18+dx,-18+dy]);
  base.endFill();
  base.lineStyle(1.5,0x000000,.6);
  base.drawPolygon([18,-18, 18+dx,-18+dy, 18+dx,18+dy, 18,18]);
  base.lineStyle(0);
  base.lineStyle(2,col,.85);base.drawRoundedRect(-18,-18,36,36,7);base.lineStyle(0);
  g.addChild(base);

  // ── CORPO (edificio) con volume 3D ──
  const body=new PIXI.Graphics();
  // Faccia laterale corpo (più scura)
  body.beginFill(darkenC(col,.55));
  body.drawPolygon([13,-13, 13+dx*.8,-13+dy*.8, 13+dx*.8,13+dy*.8, 13,13]);
  body.endFill();
  // Faccia frontale corpo
  body.beginFill(col,.95);body.drawRoundedRect(-13,-13,26,26,5);body.endFill();
  // Highlight in alto (luce)
  body.beginFill(0xffffff,.18);
  body.drawRoundedRect(-13,-13,26,8,3);
  body.endFill();
  // Tetto corpo (superficie superiore, più chiara)
  body.beginFill(lightenC(col,1.4));
  body.drawPolygon([-13,-13, 13,-13, 13+dx*.8,-13+dy*.8, -13+dx*.8,-13+dy*.8]);
  body.endFill();
  // Outline
  body.lineStyle(1.5,0x000000,.55);
  body.drawPolygon([13,-13, 13+dx*.8,-13+dy*.8, 13+dx*.8,13+dy*.8, 13,13]);
  body.drawPolygon([-13,-13, 13,-13, 13+dx*.8,-13+dy*.8, -13+dx*.8,-13+dy*.8]);
  body.lineStyle(0);
  // Finestrina
  body.beginFill(0x0a1528);body.drawRoundedRect(-5,-9,10,7,2);body.endFill();
  body.beginFill(0xfef08a,.85);body.drawRoundedRect(-4,-8,8,6,2);body.endFill();
  g.addChild(body);
  g._body=body;

  // Badge livello
  const lv=new PIXI.Text('1',{fontSize:8,fontWeight:'bold',fill:0xfbbf24,stroke:0x000000,strokeThickness:2,resolution:2});
  lv.anchor.set(1,0);lv.position.set(17,-16);g._lv=lv;g.addChild(lv);

  // CD bar
  const cdbar=new PIXI.Graphics();cdbar.position.set(-17,12);g._cdbar=cdbar;g.addChild(cdbar);

  // HP bar
  const hpbg=new PIXI.Graphics();
  hpbg.beginFill(0x000000,.4);hpbg.drawRoundedRect(-18,-26,36,5,2);hpbg.endFill();
  hpbg.beginFill(0x1e293b);hpbg.drawRoundedRect(-17,-25,34,3,1);hpbg.endFill();
  g.addChild(hpbg);
  const hpfill=new PIXI.Graphics();g._hpfill=hpfill;g.addChild(hpfill);

  // ── OMINO/OMINA SULLA TORRE ──
  // PM → uomo in giacca rossa | SM → donna capelli lunghi | Dev → uomo con occhiali
  // Maghi → omino con cappello | altri → alternato
  const isFemale=(def.id==='sm'||def.id==='m_agile'||def.id==='m_vision');
  const operatorG=new PIXI.Container();
  operatorG.position.set(0,-18); // sopra la torre
  drawTowerOperator(operatorG, col, isFemale, def.id);
  g._operator=operatorG;
  g.addChild(operatorG);

  // Canna (parte dall'omino)
  if(!def.magic){
    const gun=new PIXI.Graphics();
    gun.beginFill(0x334155);gun.drawRoundedRect(-1,-2,18,4,2);gun.endFill();
    gun.beginFill(0x94a3b8);gun.drawCircle(18,0,3);gun.endFill();
    gun.position.set(5,-26); // altezza mani omino
    g._gun=gun;g.addChild(gun);
  }

  // Muro
  const wallG=new PIXI.Graphics();
  g._wall=wallG;
  g.addChildAt(wallG,0);

  g.position.set(x,y);
  L.tower.addChild(g);
  t.gfx=g;
  updateAllWalls();
}

// Disegna operatore (omino/omina) in miniatura sulla torre
function drawTowerOperator(g, accentCol, female, towerType){
  const r=9; // scala mini-omino
  const pg=new PIXI.Graphics();

  // Ombra
  pg.beginFill(0x000000,.2);
  pg.drawEllipse(0,r*.85,r*.65,r*.18);
  pg.endFill();

  // Gambe
  const legCol=darkenC(accentCol,.65);
  pg.beginFill(female?0x831843:0x1e3a5f); // gonna corta vs pantaloni
  if(female){
    // Gonna
    pg.drawRoundedRect(-r*.5,r*.15,r,r*.55,r*.15);
  } else {
    pg.drawRoundedRect(-r*.28,r*.2,r*.24,r*.6,r*.08);
    pg.drawRoundedRect(r*.04,r*.2,r*.24,r*.6,r*.08);
  }
  pg.endFill();
  // Piedi/scarpe
  pg.beginFill(female?0xf9a8d4:0x1e293b);
  pg.drawEllipse(-r*.15,r*.82,r*.2,r*.1);
  pg.drawEllipse(r*.15,r*.82,r*.2,r*.1);
  pg.endFill();

  // Corpo
  pg.beginFill(accentCol);
  pg.drawRoundedRect(-r*.4,-r*.15,r*.8,r*.36,r*.1);
  pg.endFill();
  // Dettaglio divisa
  pg.beginFill(0xffffff,.4);
  pg.drawRoundedRect(-r*.16,-r*.12,r*.32,r*.28,r*.05);
  pg.endFill();

  // Braccia
  pg.beginFill(accentCol);
  pg.drawRoundedRect(-r*.66,-r*.12,r*.28,r*.44,r*.08);
  pg.drawRoundedRect(r*.38,-r*.12,r*.28,r*.44,r*.08);
  pg.endFill();
  pg.beginFill(0xfde68a); // mani
  pg.drawCircle(-r*.52,r*.34,r*.12);
  pg.drawCircle( r*.52,r*.34,r*.12);
  pg.endFill();

  // Collo
  pg.beginFill(0xfde68a);
  pg.drawRoundedRect(-r*.1,-r*.3,r*.2,r*.18,r*.04);
  pg.endFill();

  // Testa
  pg.beginFill(0xfde68a);
  pg.drawCircle(0,-r*.6,r*.35);
  pg.endFill();

  // Capelli (diversi per tipo)
  const hairStyles={
    pm:   {col:0x1c1917,female:false},  // capelli neri corti
    sm:   {col:0xb45309,female:true},   // capelli castani lunghi
    dev:  {col:0x1c1917,female:false},  // neri con frangetta
    m_agile:{col:0x7c3aed,female:true}, // viola (maga)
    m_scrum:{col:0x0f172a,female:false},
    m_itil: {col:0x4c1d95,female:false},
    m_vision:{col:0x92400e,female:true},
  };
  const hair=hairStyles[towerType]||{col:0x1c1917,female:false};
  pg.beginFill(hair.col,.95);
  if(hair.female){
    // Capelli lunghi
    pg.drawEllipse(0,-r*.88,r*.36,r*.16);
    pg.drawRoundedRect(-r*.35,-r*.82,r*.1,r*.55,r*.05); // ciocche sx
    pg.drawRoundedRect( r*.25,-r*.82,r*.1,r*.55,r*.05); // ciocche dx
  } else {
    // Capelli corti
    pg.drawEllipse(0,-r*.9,r*.36,r*.15);
    if(towerType==='dev'){
      // Frangetta
      pg.drawRoundedRect(-r*.28,-r*.72,r*.56,r*.12,r*.04);
    }
  }
  pg.endFill();

  // Occhi
  pg.beginFill(0xffffff);
  pg.drawCircle(-r*.12,-r*.64,r*.1);
  pg.drawCircle( r*.12,-r*.64,r*.1);
  pg.endFill();
  pg.beginFill(0x1e293b);
  pg.drawCircle(-r*.12,-r*.63,r*.06);
  pg.drawCircle( r*.12,-r*.63,r*.06);
  pg.endFill();

  // Ciglia (solo femminile)
  if(female){
    pg.lineStyle(r*.06,0x1e293b,1);
    pg.moveTo(-r*.2,-r*.7); pg.lineTo(-r*.12,-r*.73);
    pg.moveTo( r*.2,-r*.7); pg.lineTo( r*.12,-r*.73);
    pg.lineStyle(0);
  }

  // Bocca determinata
  pg.lineStyle(r*.05,0x7f1d1d,1);
  pg.moveTo(-r*.1,-r*.5);pg.lineTo(r*.1,-r*.48);
  pg.lineStyle(0);

  // Accessori speciali
  if(towerType==='dev'){
    // Occhiali
    pg.lineStyle(r*.06,0x1e293b,.9);
    pg.drawCircle(-r*.12,-r*.63,r*.11);
    pg.drawCircle( r*.12,-r*.63,r*.11);
    pg.moveTo(-r*.01,-r*.63);pg.lineTo(r*.01,-r*.63);
    pg.lineStyle(0);
  }
  if(towerType==='m_agile'||towerType==='m_scrum'||towerType==='m_itil'||towerType==='m_vision'){
    // Cappello da mago (piccolo)
    pg.beginFill(0x4c1d95,.95);
    pg.drawPolygon([0,-r*1.2, -r*.25,-r*.8, r*.25,-r*.8]);
    pg.endFill();
    pg.beginFill(0x7c3aed,.7);
    pg.drawRoundedRect(-r*.28,-r*.82,r*.56,r*.1,r*.04);
    pg.endFill();
    // Stellina sul cappello
    pg.beginFill(0xfbbf24);
    pg.drawCircle(0,-r*.95,r*.08);
    pg.endFill();
  }

  g.addChild(pg);
  g._pg=pg;
}

function updateTowerGfx(t){
  if(!t.gfx) return;
  const g=t.gfx;
  // Livello badge
  if(g._lv) g._lv.text=t.level===5?'K':String(t.level);

  // Rotazione canna + operatore guarda nella direzione di fuoco
  if(t._targetAngle!==undefined){
    if(g._gun) g._gun.rotation=t._targetAngle;
    // Ribalta l'operatore a seconda del lato verso cui spara
    if(g._operator){
      g._operator.scale.x=Math.cos(t._targetAngle)<0?-1:1;
    }
  }

  // Bob idle operatore (respira)
  if(g._operator){
    const bob=Math.sin(Date.now()/700+t.x*.01)*.8;
    g._operator.y=-18+bob;
  }

  // CD bar
  if(g._cdbar && t.eRate){
    g._cdbar.clear();
    g._cdbar.beginFill(0x1e293b,.5);g._cdbar.drawRect(0,0,34,3);g._cdbar.endFill();
    g._cdbar.beginFill(0x22c55e);g._cdbar.drawRect(0,0,34*(1-Math.min(1,t.cd/t.eRate)),3);g._cdbar.endFill();
  }

  // HP bar
  if(g._hpfill){
    g._hpfill.clear();
    const r=Math.max(0,t.hp/t.maxHp);
    const c=r>.5?0x22c55e:r>.25?0xf59e0b:0xef4444;
    g._hpfill.beginFill(c);g._hpfill.drawRoundedRect(-17,-25,34*r,3,1);g._hpfill.endFill();
  }

  // Mago: opacità e glow
  if(t.def.magic){
    if(g._body) g._body.alpha=t.active?.95:.3;
    if(g._operator) g._operator.alpha=t.active?1:.4;
  }

  // Selezione highlight
  if(g._body) g._body.tint=t===G.selTower?0xffe066:0xffffff;
}

// ─── NEMICI ─────────────────────────────────────────────────────
// buildEnemyGfx — SINCRONO, omini veri con corpo/testa/gambe/braccia
function buildEnemyGfx(e){
  const g=new PIXI.Container();
  const {tmpl}=e;
  const r=tmpl.r;  // "raggio" usato come unità di scala

  if(tmpl.dragon && texCache[DRAGON_SPRITES[tmpl.elem]]){
    // ── DRAGHETTO CON SPRITE SVG ──
    const tex=texCache[DRAGON_SPRITES[tmpl.elem]];
    const sprite=new PIXI.Sprite(tex);
    const sz=r*3.2;
    sprite.width=sz; sprite.height=sz;
    sprite.anchor.set(.5,.7);
    g.addChild(sprite);
    g._sprite=sprite;
  } else if(tmpl.dragon){
    // ── DRAGHETTO FALLBACK (grafica procedurale) ──
    drawDragonGfx(g, r, tmpl.col);
  } else if(tmpl.isTroll){
    // ── TROLL DI MORDOR (grafica distintiva) ──
    drawTrollGfx(g, r, tmpl.col);
  } else {
    // ── OMINO CARTOON ──
    drawHumanGfx(g, r, tmpl.col, tmpl.eng, tmpl.r>34);
  }

  // Arma (top-right, oscillante)
  const wpnText=new PIXI.Text(tmpl.wpn,{fontSize:Math.max(10,r*.9),resolution:2});
  wpnText.anchor.set(.5);
  wpnText.position.set(r*1.1, -r*.5);
  g._wpn=wpnText;
  g.addChild(wpnText);

  // Badge melee/ranged
  const badge=new PIXI.Text(tmpl.type==='ranged'?'🏹':'⚔️',{fontSize:9,resolution:2});
  badge.anchor.set(.5);
  badge.position.set(-r*1.1,-r*.5);
  g.addChild(badge);

  // HP bar
  const bw=Math.max(r*2.4,36);
  const hpbg=new PIXI.Graphics();
  hpbg.beginFill(0x000000,.55);
  hpbg.drawRoundedRect(-bw/2-1,-r*1.8-1,bw+2,7,3);
  hpbg.endFill();
  hpbg.beginFill(0x1e293b);
  hpbg.drawRoundedRect(-bw/2,-r*1.8,bw,5,2);
  hpbg.endFill();
  g.addChild(hpbg);
  const hpfill=new PIXI.Graphics();
  g._hpfill=hpfill; g._hpbw=bw;
  g.addChild(hpfill);

  // Nome + corona boss
  if(r>34){
    const nm=new PIXI.Text(tmpl.n,{
      fontSize:10,fontWeight:'bold',fill:'#ffffff',
      stroke:'#000000',strokeThickness:3,resolution:2
    });
    nm.anchor.set(.5,1);
    nm.position.set(0,-r*1.9);
    g.addChild(nm);
    const crown=new PIXI.Text('👑',{fontSize:r*.55,resolution:2});
    crown.anchor.set(.5);
    crown.position.set(0,-r*1.55);
    g.addChild(crown);
  }

  // Scudo (draghetto acqua)
  if(e.shield){
    const sh=new PIXI.Graphics();
    sh.lineStyle(2.5,0x60a5fa,.75);
    sh.drawCircle(0,0,r*1.4);
    sh.lineStyle(0);
    g._shield=sh;
    g.addChild(sh);
  }

  g.position.set(e.x,e.y);
  L.enemies.addChild(g);
  e.gfx=g;
}
