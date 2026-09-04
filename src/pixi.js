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
// pixelArt=true forza NEAREST scaling (niente sfocatura su sprite pixel art)
function loadSVGTexture(url, pixelArt){
  if(texCache[url]) return Promise.resolve(texCache[url]);
  return new Promise((resolve)=>{
    const img=new Image();
    img.onload=()=>{
      const tex=PIXI.Texture.from(img);
      if(pixelArt && tex.baseTexture){
        tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      }
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
  // Pre-carica sprite umanoide grayscale (fallback tintabile)
  try{ await loadSVGTexture(WORKER_SPRITE); }
  catch(e){ console.warn('SVG load fail: worker'); }
  // Pre-carica personaggi Kenney (pixel art CC0) — NEAREST scaling per nitidezza
  for(const [name,frames] of Object.entries(KENNEY_CHARS)){
    for(const url of frames){
      try{ await loadSVGTexture(url, true); }
      catch(e){ console.warn('PNG load fail:',name); }
    }
  }

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
