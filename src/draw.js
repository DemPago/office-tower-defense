'use strict';
// DRAW.JS
// ================================================================
//  DISEGNO QUALITÀ PROFESSIONALE — gradiente, outline, ombre, occhi dettagliati
// ================================================================

function drawHumanGfx(g, r, col, isEng, isBoss){
  // g è un PIXI.Container — creiamo un Graphics interno
  const pg=new PIXI.Graphics();
  g.addChild(pg);
  g._body=pg; // ref per tinting

  // OMBRA PROIETTATA
  pg.beginFill(0x000000,.32);
  pg.drawEllipse(r*.08,r*.98,r*.85,r*.24);
  pg.endFill();

  // GAMBE con gradiente simulato
  const legDark=darkenC(col,.5), legMid=darkenC(col,.7);
  pg.lineStyle(1.5,0x000000,.6);
  pg.beginFill(legDark);pg.drawRoundedRect(-r*.3,r*.2,r*.26,r*.65,r*.1);pg.endFill();
  pg.beginFill(legDark);pg.drawRoundedRect(r*.04,r*.2,r*.26,r*.65,r*.1);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(legMid,.55);pg.drawRoundedRect(-r*.3,r*.2,r*.12,r*.65,r*.1);pg.endFill();
  pg.beginFill(legMid,.55);pg.drawRoundedRect(r*.04,r*.2,r*.12,r*.65,r*.1);pg.endFill();
  pg.lineStyle(1.5,0x000000,.75);
  pg.beginFill(0x1c1410);pg.drawEllipse(-r*.17,r*.9,r*.24,r*.11);pg.endFill();
  pg.beginFill(0x1c1410);pg.drawEllipse(r*.17,r*.9,r*.24,r*.11);pg.endFill();
  pg.lineStyle(0);

  // CORPO con gradiente e outline
  const bodyLight=col, bodyDark=darkenC(col,.6);
  pg.lineStyle(2.5,0x000000,.8);
  pg.beginFill(bodyDark);pg.drawRoundedRect(-r*.44,-r*.18,r*.88,r*.44,r*.12);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(bodyLight,.85);pg.drawRoundedRect(-r*.44,-r*.18,r*.44,r*.44,r*.12);pg.endFill();
  pg.beginFill(0xffffff,.18);pg.drawEllipse(-r*.12,-r*.08,r*.32,r*.14);pg.endFill();
  pg.beginFill(0xffffff,.5);pg.drawRoundedRect(-r*.14,-r*.18,r*.28,r*.1,r*.04);pg.endFill();
  if(isBoss){
    pg.lineStyle(1,0x7f0010,.8);
    pg.beginFill(0xef4444);
    pg.drawPolygon([-r*.05,-r*.12, r*.05,-r*.12, r*.04,r*.08, 0,r*.22, -r*.04,r*.08]);
    pg.endFill();pg.lineStyle(0);
    pg.beginFill(0xfbbf24,.9);pg.drawCircle(0,r*.06,r*.04);pg.endFill();
  } else {
    pg.beginFill(0xffffff,.4);
    pg.drawCircle(0,-r*.08,r*.03);pg.drawCircle(0,r*.04,r*.03);
    pg.endFill();
  }

  // BRACCIA con outline
  pg.lineStyle(2,0x000000,.75);
  pg.beginFill(bodyDark);pg.drawRoundedRect(-r*.74,-r*.14,r*.32,r*.5,r*.1);pg.endFill();
  pg.beginFill(bodyDark);pg.drawRoundedRect(r*.42,-r*.14,r*.32,r*.5,r*.1);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(bodyLight,.5);pg.drawRoundedRect(-r*.74,-r*.14,r*.14,r*.5,r*.1);pg.endFill();
  pg.beginFill(bodyLight,.5);pg.drawRoundedRect(r*.42,-r*.14,r*.14,r*.5,r*.1);pg.endFill();
  pg.lineStyle(1.5,0xb45309,.6);
  pg.beginFill(0xfde68a);pg.drawCircle(-r*.58,r*.38,r*.15);pg.endFill();
  pg.beginFill(0xfde68a);pg.drawCircle(r*.58,r*.38,r*.15);pg.endFill();
  pg.lineStyle(0);

  // COLLO
  pg.lineStyle(1,0xb45309,.5);
  pg.beginFill(0xfde68a);pg.drawRoundedRect(-r*.11,-r*.36,r*.22,r*.2,r*.05);pg.endFill();
  pg.lineStyle(0);

  // TESTA con gradiente
  pg.lineStyle(2.5,0xb45309,.65);
  pg.beginFill(0xfde68a);pg.drawCircle(0,-r*.65,r*.38);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(0xfef9c3,.5);pg.drawEllipse(-r*.1,-r*.82,r*.26,r*.18);pg.endFill();
  pg.beginFill(0xb45309,.14);pg.drawEllipse(r*.12,-r*.6,r*.18,r*.3);pg.endFill();

  // CAPELLI con volume
  const hairCol=isBoss?0x1c1917:0x451a03;
  pg.beginFill(hairCol);
  pg.drawEllipse(0,-r*.97,r*.4,r*.19);
  pg.drawEllipse(-r*.32,-r*.84,r*.15,r*.13);
  pg.drawEllipse(r*.32,-r*.84,r*.15,r*.13);
  pg.endFill();
  pg.beginFill(isBoss?0x374151:0x7c2d12,.7);
  pg.drawEllipse(-r*.05,-r*.98,r*.2,r*.1);
  pg.endFill();

  // OCCHI con profondità
  pg.beginFill(0xffffff);pg.drawCircle(-r*.14,-r*.68,r*.12);pg.drawCircle(r*.14,-r*.68,r*.12);pg.endFill();
  const irisCol=isBoss?0xef4444:0x1e40af;
  pg.beginFill(irisCol);pg.drawCircle(-r*.14,-r*.67,r*.08);pg.drawCircle(r*.14,-r*.67,r*.08);pg.endFill();
  pg.beginFill(0x000000);pg.drawCircle(-r*.12,-r*.66,r*.04);pg.drawCircle(r*.16,-r*.66,r*.04);pg.endFill();
  pg.beginFill(0xffffff,.95);pg.drawCircle(-r*.18,-r*.72,r*.025);pg.drawCircle(r*.1,-r*.72,r*.025);pg.endFill();

  pg.lineStyle(r*.07,hairCol,1);
  pg.moveTo(-r*.23,-r*.8);pg.lineTo(-r*.06,-r*.75);
  pg.moveTo(r*.23,-r*.8);pg.lineTo(r*.06,-r*.75);
  pg.lineStyle(0);

  pg.lineStyle(r*.055,0x92400e,1);
  if(isBoss){pg.moveTo(-r*.12,-r*.56);pg.lineTo(r*.12,-r*.52);}
  else{pg.moveTo(-r*.1,-r*.55);pg.lineTo(r*.1,-r*.52);}
  pg.lineStyle(0);

  // ELMETTO INGEGNERE
  if(isEng){
    pg.lineStyle(2,0x92400e,.8);
    pg.beginFill(0xd97706);pg.drawEllipse(0,-r*.9,r*.44,r*.22);pg.endFill();
    pg.beginFill(0xfbbf24,.65);pg.drawEllipse(-r*.08,-r*.98,r*.28,r*.1);pg.endFill();
    pg.beginFill(0x92400e);pg.drawRect(-r*.44,-r*.92,r*.88,r*.1);pg.endFill();
    pg.lineStyle(0);
    pg.beginFill(0xfef08a,.9);pg.drawCircle(-r*.3,-r*.88,r*.05);pg.endFill();
  }

  // STELLINA BOSS sul petto
  if(isBoss){
    pg.beginFill(0xfbbf24,.9);
    const bx2=r*.22, by2=-r*.02;
    pg.drawPolygon([
      bx2,by2-r*.1, bx2+r*.04,by2-r*.03, bx2+r*.1,by2-r*.03,
      bx2+r*.05,by2+r*.03, bx2+r*.07,by2+r*.1,
      bx2,by2+r*.06, bx2-r*.07,by2+r*.1,
      bx2-r*.05,by2+r*.03, bx2-r*.1,by2-r*.03, bx2-r*.04,by2-r*.03
    ]);
    pg.endFill();
  }
}

// Draghetto procedurale qualità alta
function drawDragonGfx(g, r, col){
  const pg=new PIXI.Graphics();
  g.addChild(pg);
  g._body=pg;
  const c2=darkenC(col,.55);

  pg.beginFill(0x000000,.3);pg.drawEllipse(r*.1,r*.85,r*.9,r*.28);pg.endFill();

  pg.lineStyle(r*.18,c2,1);pg.moveTo(-r*.6,r*.1);pg.bezierCurveTo(-r*1.1,r*.35,-r*1.0,-r*.45,-r*1.3,-r*.28);pg.lineStyle(0);
  pg.lineStyle(r*.1,col,.8);pg.moveTo(-r*.6,r*.1);pg.bezierCurveTo(-r*1.05,r*.3,-r*.95,-r*.38,-r*1.2,-r*.22);pg.lineStyle(0);

  pg.beginFill(c2,.75);
  pg.drawPolygon([-r*.15,-r*.2, -r*1.1,-r*.75, -r*.55,r*.05]);
  pg.drawPolygon([r*.15,-r*.2,  r*1.1,-r*.75,  r*.55,r*.05]);
  pg.endFill();
  pg.beginFill(col,.45);
  pg.drawPolygon([-r*.15,-r*.2, -r*1.0,-r*.65, -r*.5,r*.0]);
  pg.drawPolygon([r*.15,-r*.2,  r*1.0,-r*.65,  r*.5,r*.0]);
  pg.endFill();
  pg.lineStyle(1,c2,.4);
  [-.7,-.5,-.3].forEach(x=>{pg.moveTo(x*r,-r*.15);pg.lineTo(x*r*.6,-r*.55);});
  [.7,.5,.3].forEach(x=>{pg.moveTo(x*r,-r*.15);pg.lineTo(x*r*.6,-r*.55);});
  pg.lineStyle(0);

  pg.lineStyle(2,0x000000,.7);
  pg.beginFill(c2);pg.drawEllipse(0,0,r*.75,r*.55);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(col,.85);pg.drawEllipse(-r*.1,-r*.1,r*.62,r*.46);pg.endFill();
  pg.beginFill(0xfef9c3,.7);pg.drawEllipse(0,r*.12,r*.42,r*.28);pg.endFill();
  pg.beginFill(c2,.25);
  for(let i=0;i<3;i++) pg.drawCircle(-r*.3+i*r*.3,-r*.1,r*.1);
  pg.endFill();
  pg.beginFill(0xffffff,.12);pg.drawEllipse(-r*.2,-r*.2,r*.3,r*.18);pg.endFill();

  pg.lineStyle(2,0x000000,.7);
  pg.beginFill(c2);pg.drawEllipse(r*.5,-r*.06,r*.4,r*.3);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(col,.9);pg.drawEllipse(r*.42,-r*.1,r*.32,r*.24);pg.endFill();
  pg.beginFill(c2);pg.drawEllipse(r*.78,-r*.04,r*.2,r*.14);pg.endFill();
  pg.beginFill(0x000000,.6);pg.drawCircle(r*.76,r*.0,r*.04);pg.drawCircle(r*.82,-r*.04,r*.04);pg.endFill();

  pg.lineStyle(1.5,0x000000,.8);
  pg.beginFill(0xfef08a);pg.drawCircle(r*.56,-r*.16,r*.13);pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(0x000000);pg.drawEllipse(r*.58,-r*.16,r*.05,r*.1);pg.endFill();
  pg.beginFill(0xffffff,.7);pg.drawCircle(r*.52,-r*.2,r*.03);pg.endFill();

  pg.lineStyle(1.5,0x92400e,.7);
  pg.beginFill(0xd97706);pg.drawPolygon([r*.46,-r*.3, r*.38,-r*.58, r*.58,-r*.3]);pg.endFill();
  pg.beginFill(0xfbbf24,.5);pg.drawPolygon([r*.46,-r*.3, r*.44,-r*.48, r*.5,-r*.3]);pg.endFill();
  pg.lineStyle(0);
  g._body=pg;
}

// ── TROLL DI MORDOR — massiccio, curvo, clava, pelle verde-marrone ──
// Design distintivo: testa piccola incassata, spalle enormi, braccia lunghissime,
// postura curva in avanti, clava di legno, zanne sporgenti
function drawTrollGfx(g, r, col){
  const pg=new PIXI.Graphics();
  g.addChild(pg);
  g._body=pg;

  const skinDark=darkenC(col,.55);
  const skinLight=col;

  // OMBRA A TERRA (grande, ellittica)
  pg.beginFill(0x000000,.4);
  pg.drawEllipse(r*.1,r*1.05,r*1.1,r*.3);
  pg.endFill();

  // GAMBE MASSICCE (corte e larghe, tozze)
  pg.lineStyle(3,0x000000,.6);
  pg.beginFill(skinDark);
  pg.drawRoundedRect(-r*.42,r*.35,r*.36,r*.55,r*.12);
  pg.drawRoundedRect(r*.06,r*.35,r*.36,r*.55,r*.12);
  pg.endFill();
  pg.lineStyle(0);
  // Piedi enormi con artigli
  pg.beginFill(0x2d2416);
  pg.drawEllipse(-r*.24,r*.92,r*.32,r*.16);
  pg.drawEllipse(r*.24,r*.92,r*.32,r*.16);
  pg.endFill();
  pg.beginFill(0x1a1610);
  [-.4,-.22,-.05].forEach(dx=>{pg.drawEllipse(dx*r-r*.05,r*1.0,r*.05,r*.09);});
  [.05,.22,.4].forEach(dx=>{pg.drawEllipse(dx*r+r*.05,r*1.0,r*.05,r*.09);});
  pg.endFill();

  // TORSO MASSICCIO curvo in avanti (postura scimmiesca)
  pg.lineStyle(3,0x000000,.65);
  pg.beginFill(skinDark);
  pg.drawEllipse(r*.02,-r*.05,r*.75,r*.62);
  pg.endFill();
  pg.lineStyle(0);
  // Pancia sporgente chiara
  pg.beginFill(skinLight,.65);
  pg.drawEllipse(-r*.05,r*.12,r*.5,r*.42);
  pg.endFill();
  // Cicatrici/texture pelle
  pg.lineStyle(2,skinDark,.5);
  pg.moveTo(-r*.2,-r*.15);pg.lineTo(-r*.05,r*.05);
  pg.moveTo(r*.15,-r*.25);pg.lineTo(r*.28,-r*.05);
  pg.lineStyle(0);
  // Perizoma/cintura rozza
  pg.beginFill(0x4a3320);
  pg.drawRoundedRect(-r*.45,r*.28,r*.9,r*.16,r*.05);
  pg.endFill();
  pg.beginFill(0x2d2416);
  pg.drawRect(-r*.08,r*.3,r*.16,r*.12);
  pg.endFill();

  // BRACCIO SINISTRO enorme che regge la clava (dietro il corpo)
  pg.lineStyle(3,0x000000,.6);
  pg.beginFill(skinDark);
  pg.drawEllipse(-r*.78,-r*.05,r*.24,r*.5);
  pg.endFill();
  pg.lineStyle(0);
  // Avambraccio sx
  pg.beginFill(skinDark);
  pg.drawEllipse(-r*.95,r*.42,r*.22,r*.4);
  pg.endFill();
  // Pugno sx enorme
  pg.lineStyle(2,0x000000,.6);
  pg.beginFill(skinLight,.8);
  pg.drawCircle(-r*.95,r*.78,r*.26);
  pg.endFill();
  pg.lineStyle(0);
  // Nocche
  pg.beginFill(skinDark,.5);
  [-1.08,-.95,-.82].forEach(dx=>{pg.drawCircle(dx*r,r*.72,r*.06);});
  pg.endFill();

  // CLAVA DI LEGNO (nella mano sinistra)
  pg.lineStyle(2,0x2d1f0f,.8);
  pg.beginFill(0x5a3d1f);
  pg.drawPolygon([
    -r*1.15,r*.65,  -r*1.05,r*.5,
    -r*.75,-r*.55,  -r*.6,-r*.4,
    -r*.85,r*.55
  ]);
  pg.endFill();
  pg.lineStyle(0);
  // Nodi/chiodi sulla clava
  pg.beginFill(0x3d2a15);
  pg.drawCircle(-r*.7,-r*.35,r*.05);
  pg.drawCircle(-r*.85,-r*.05,r*.05);
  pg.drawCircle(-r*.95,r*.2,r*.05);
  pg.endFill();
  // Punte metalliche clava
  pg.beginFill(0x94a3b8);
  pg.drawPolygon([-r*.68,-r*.42,-r*.62,-r*.5,-r*.58,-r*.4]);
  pg.drawPolygon([-r*.9,r*.02,-r*.98,-r*.02,-r*.94,r*.1]);
  pg.endFill();

  // BRACCIO DESTRO (avanti, libero, minaccioso)
  pg.lineStyle(3,0x000000,.6);
  pg.beginFill(skinLight,.9);
  pg.drawEllipse(r*.68,r*.05,r*.24,r*.48);
  pg.endFill();
  pg.lineStyle(0);
  pg.beginFill(skinLight);
  pg.drawEllipse(r*.85,r*.5,r*.2,r*.36);
  pg.endFill();
  // Pugno dx
  pg.lineStyle(2,0x000000,.6);
  pg.beginFill(skinLight,.95);
  pg.drawCircle(r*.9,r*.82,r*.24);
  pg.endFill();
  pg.lineStyle(0);
  // Artigli pugno dx
  pg.beginFill(0x1a1610);
  [.78,.9,1.02].forEach(dx=>{pg.drawPolygon([dx*r,r*.95,dx*r-r*.03,r*1.08,dx*r+r*.03,r*1.08]);});
  pg.endFill();

  // TESTA PICCOLA incassata nelle spalle (tipico dei troll)
  pg.lineStyle(3,0x000000,.65);
  pg.beginFill(skinDark);
  pg.drawEllipse(r*.05,-r*.62,r*.34,r*.3);
  pg.endFill();
  pg.lineStyle(0);
  // Fronte sporgente
  pg.beginFill(skinLight,.7);
  pg.drawEllipse(r*.02,-r*.72,r*.28,r*.16);
  pg.endFill();

  // Orecchie a punta
  pg.beginFill(skinDark);
  pg.drawPolygon([-r*.22,-r*.68, -r*.36,-r*.82, -r*.2,-r*.55]);
  pg.drawPolygon([r*.32,-r*.68, r*.46,-r*.82, r*.3,-r*.55]);
  pg.endFill();

  // Sopracciglia foltissime e minacciose
  pg.beginFill(0x2d2416);
  pg.drawPolygon([-r*.24,-r*.68,-r*.02,-r*.62,-r*.2,-r*.58]);
  pg.drawPolygon([r*.3,-r*.68,r*.08,-r*.62,r*.26,-r*.58]);
  pg.endFill();

  // Occhi piccoli e cattivi (gialli)
  pg.beginFill(0xfef08a);
  pg.drawCircle(-r*.1,-r*.6,r*.07);
  pg.drawCircle(r*.18,-r*.6,r*.07);
  pg.endFill();
  pg.beginFill(0x7c2d12);
  pg.drawCircle(-r*.1,-r*.6,r*.04);
  pg.drawCircle(r*.18,-r*.6,r*.04);
  pg.endFill();
  pg.beginFill(0x000000);
  pg.drawCircle(-r*.1,-r*.6,r*.02);
  pg.drawCircle(r*.18,-r*.6,r*.02);
  pg.endFill();

  // Naso largo e schiacciato
  pg.beginFill(skinDark,.6);
  pg.drawEllipse(r*.04,-r*.5,r*.09,r*.06);
  pg.endFill();

  // Bocca enorme con zanne
  pg.beginFill(0x1a0a05);
  pg.drawEllipse(r*.03,-r*.4,r*.2,r*.1);
  pg.endFill();
  // Zanne inferiori
  pg.beginFill(0xf1f5f9);
  pg.drawPolygon([-r*.12,-r*.42,-r*.09,-r*.32,-r*.06,-r*.42]);
  pg.drawPolygon([r*.06,-r*.42,r*.09,-r*.3,r*.12,-r*.42]);
  pg.endFill();
  // Zanna superiore
  pg.drawPolygon([r*.16,-r*.44,r*.19,-r*.36,r*.13,-r*.4]);
  pg.endFill();

  // Bava/saliva (dettaglio disgustoso ma iconico)
  pg.beginFill(0x86efac,.4);
  pg.drawEllipse(r*.02,-r*.32,r*.04,r*.08);
  pg.endFill();

  // Muschio/licheni sulla schiena (texture troll)
  pg.beginFill(0x4d7c0f,.5);
  pg.drawCircle(-r*.3,-r*.1,r*.08);
  pg.drawCircle(r*.35,r*.15,r*.06);
  pg.endFill();

  // Rune tribali dipinte sul petto
  pg.lineStyle(2,0xdc2626,.6);
  pg.moveTo(-r*.15,-r*.05);pg.lineTo(r*.05,r*.15);
  pg.moveTo(r*.05,-r*.05);pg.lineTo(-r*.15,r*.15);
  pg.lineStyle(0);
}

function darkenC(col,f){
  const r=Math.round(((col>>16)&0xff)*f);
  const g2=Math.round(((col>>8)&0xff)*f);
  const b=Math.round((col&0xff)*f);
  return (r<<16)|(g2<<8)|b;
}

function updateEnemyGfx(e){
  if(!e.gfx||e.dead) return;
  const g=e.gfx, {tmpl}=e;
  g.position.set(e.x,e.y);

  // Ruota verso il centro (solo sprite drago)
  const cx=CW/2, cy=CH/2;
  if(g._sprite){
    const ang=Math.atan2(cy-e.y,cx-e.x);
    g._sprite.rotation=ang-Math.PI/2;
  }

  // Wobble arma
  if(g._wpn) g._wpn.rotation=Math.sin(Date.now()/180+e.x*.01)*.28;

  // Animazione camminata gambe (oscillazione)
  if(g._legs && !e.stunT){
    const walk=Math.sin(Date.now()/120+e.x*.02);
    g._legs.skew.x=walk*.08;
    g._legs.y=walk*1.5;
  }

  // Leggero bob testa
  if(g._head){
    g._head.y=Math.sin(Date.now()/120+e.x*.02)*1.2;
  }

  // HP bar
  if(g._hpfill){
    g._hpfill.clear();
    const ratio=Math.max(0,e.hp/e.maxHp);
    const c=ratio>.5?0x22c55e:ratio>.25?0xf59e0b:0xef4444;
    g._hpfill.beginFill(c);
    g._hpfill.drawRoundedRect(-g._hpbw/2,-tmpl.r*1.8,g._hpbw*ratio,5,2);
    g._hpfill.endFill();
  }

  // Tint stato
  if(g._body){
    if(e.stunT>0)      g._body.tint=0xfbbf24;
    else if(e.slowT>0) g._body.tint=0x93c5fd;
    else               g._body.tint=0xffffff;
  }

  // Scudo
  if(g._shield) g._shield.visible=!!e.shield;
}

// ─── PROIETTILI ─────────────────────────────────────────────────
function buildProjGfx(p){
  const g=new PIXI.Graphics();
  g.beginFill(p.col,.22);g.drawCircle(0,0,p.sz*2.8);g.endFill();
  g.beginFill(p.col);g.drawCircle(0,0,p.sz);g.endFill();
  // Niente BlurFilter per compatibilità
  g.position.set(p.x,p.y);
  L.projs.addChild(g);
  p.gfx=g;
}

function buildEProjGfx(p){
  const g=new PIXI.Text(p.ico,{fontSize:p.sz,resolution:2});
  g.anchor.set(.5);g.position.set(p.x,p.y);
  L.projs.addChild(g);
  p.gfx=g;
}

function floatText(txt,x,y,col='#ffffff',sz=13){
  const t=new PIXI.Text(txt,{fontSize:sz,fontWeight:'bold',fill:col,stroke:'#000000',strokeThickness:2,resolution:2});
  t.anchor.set(.5);t.position.set(x,y);t._vy=-1.1;t._life=1;t._decay=.018;
  L.hud2.addChild(t);
  G._floatTexts=G._floatTexts||[];G._floatTexts.push(t);
}

function burstParticles(x,y,col,n=8){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=50+Math.random()*100;
    const g=new PIXI.Graphics();
    g.beginFill(col);g.drawCircle(0,0,2+Math.random()*3);g.endFill();
    g.position.set(x,y);
    g._vx=Math.cos(a)*sp;g._vy=Math.sin(a)*sp;
    g._life=1;g._decay=.022+Math.random()*.018;
    L.fx.addChild(g);
    G._floatTexts=G._floatTexts||[];G._floatTexts.push({_isParticle:true,gfx:g,_life:1,_decay:g._decay});
  }
}
