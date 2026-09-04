'use strict';
// PIXI.JS
// ─── PIXI ───────────────────────────────────────────────────────
let app,CW,CH;
let bgGfx=null, roadGfx=null;
let mainGfx=null, gunGfx=null, mainHpGfx=null, mainHpFillGfx=null;
let slotGfx=null;
let gunAngle=0;
const L={}; // layer containers
let texCache={}; // texture cache per SVG

// Carica texture da data-URI senza PIXI.Assets (compat Pixi v7)
function loadSVGTexture(url){
  if(texCache[url]) return Promise.resolve(texCache[url]);
  return new Promise((resolve)=>{
    const img=new Image();
    img.onload=()=>{
      const tex=PIXI.Texture.from(img);
      texCache[url]=tex;
      resolve(tex);
    };
    img.onerror=()=>resolve(null);
    img.src=url;
  });
}

async function initPixi(){
  // Inizializza G subito prima di qualsiasi chiamata grafica
  resetG();
  G._floatTexts=[];

  const wrap=document.getElementById('cw');
  CW=wrap.clientWidth; CH=wrap.clientHeight;

  app=new PIXI.Application({
    width:CW,height:CH,
    antialias:true,
    resolution:window.devicePixelRatio||1,
    autoDensity:true,
    backgroundColor:0x080f1a,
  });
  wrap.appendChild(app.view);
  app.view.style.position='absolute';
  app.view.style.top='0';app.view.style.left='0';

  // Pre-carica sprite draghetti
  for(const [k,url] of Object.entries(DRAGON_SPRITES)){
    try{ await loadSVGTexture(url); }
    catch(e){ console.warn('SVG load fail:',url); }
  }
  // Pre-carica sprite umanoide grayscale (tintabile per ogni nemico/torre)
  try{ await loadSVGTexture(WORKER_SPRITE); }
  catch(e){ console.warn('SVG load fail: worker'); }

  // Layer stack
  ['bg','roads','walls','shadows','enemies','tower','projs','fx','hud2']
    .forEach(n=>{ L[n]=new PIXI.Container(); app.stage.addChild(L[n]); });

  window.addEventListener('resize',()=>{
    const w=wrap.clientWidth,h=wrap.clientHeight;
    CW=w;CH=h;app.renderer.resize(w,h);
    buildBG();buildMainTower();
  });

  buildBG();
  buildMainTower();
  buildSlotIndicators();
  app.ticker.add(dt=>tick(app.ticker.deltaMS));
}
