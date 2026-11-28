/* Tiles · Bento cards: FAQ, progress bars, process steps, local clock, animated figures.
 * Pure helpers are exported on window.TilesBento for tests; enhance(T,F) registers the block types. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=s=>String(s||'').split('\n').map(x=>x.trim()).filter(Boolean);
/* "Label | value" per line. The value keeps any further "|" so answers may contain one. */
const rows=s=>lines(s).map(l=>{const [a,...b]=l.split('|');return [a.trim(),b.join('|').trim()]}).filter(([a])=>a);
const pct=v=>{const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0};

/* ---------- Local time ---------- */
const ZONES=[['Europe/Paris','Paris (France)'],['Europe/London','Londres'],['Europe/Lisbon','Lisbonne'],['Indian/Reunion','La Réunion'],['America/Martinique','Martinique'],['America/Guadeloupe','Guadeloupe'],['America/Cayenne','Guyane'],['Pacific/Noumea','Nouméa'],['Pacific/Tahiti','Tahiti'],['America/Toronto','Montréal · Toronto'],['America/New_York','New York'],['America/Los_Angeles','Los Angeles'],['Africa/Abidjan','Abidjan'],['Africa/Dakar','Dakar'],['Africa/Casablanca','Casablanca'],['Asia/Dubai','Dubaï'],['Asia/Tokyo','Tokyo'],['Australia/Sydney','Sydney'],['UTC','UTC']];
const validZone=tz=>{try{new Intl.DateTimeFormat('en',{timeZone:tz});return true}catch{return false}};
/* Minutes east of UTC for a zone at a given instant (DST-aware, no library). */
function zoneOffset(tz,now=new Date()){
 try{const p=new Intl.DateTimeFormat('en-GB',{timeZone:tz,timeZoneName:'longOffset'}).formatToParts(now).find(x=>x.type==='timeZoneName')?.value||'';
  const m=/GMT([+-])(\d{2}):?(\d{2})?/.exec(p);return m?(m[1]==='-'?-1:1)*((+m[2])*60+(+(m[3]||0))):0}catch{return 0}
}
const zoneTime=(tz,now=new Date())=>{try{return new Intl.DateTimeFormat('fr-FR',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)}catch{return ''}};
const fmtOffset=m=>'UTC'+(m<0?'−':'+')+Math.floor(Math.abs(m)/60)+(Math.abs(m)%60?':'+String(Math.abs(m)%60).padStart(2,'0'):'');
/* Visitor-relative phrase: "Même heure que vous", "1 h de plus que vous"… */
function relative(zoneMin,visitorMin){
 const d=zoneMin-visitorMin;if(d===0)return 'Même heure que vous';
 const a=Math.abs(d),h=Math.floor(a/60),m=a%60,txt=(h?h+' h':'')+(m?(h?' ':'')+m+' min':'');
 return txt+(d>0?' de plus que vous':' de moins que vous');
}
const hourIn=(tz,now)=>+zoneTime(tz,now).slice(0,2);
const isDay=h=>h>=7&&h<20;
function clockParts(d,now=new Date(),visitorMin=-now.getTimezoneOffset()){
 const tz=validZone(d.tz)?d.tz:'Europe/Paris',off=zoneOffset(tz,now);
 return {tz,time:zoneTime(tz,now),offset:fmtOffset(off),relative:relative(off,visitorMin),day:isDay(hourIn(tz,now))};
}

/* ---------- Animated figures ---------- */
/* Splits "1 200+", "95 %", "3,5k" into prefix / number / suffix; null when there is nothing to count. */
function parseFigure(text){
 const m=/^(\D*?)(\d{1,3}(?:[\s  ]\d{3})+|\d+)(?:([.,])(\d+))?(.*)$/s.exec(String(text||'').trim());
 if(!m)return null;
 const sep=(m[2].match(/[\s  ]/)||[''])[0];
 return {prefix:m[1],value:+(m[2].replace(/\D/g,'')+(m[4]?'.'+m[4]:'')),decimals:m[4]?m[4].length:0,mark:m[3]||'',sep,suffix:m[5]};
}
function formatFigure(f,v){
 let [int,dec]=v.toFixed(f.decimals).split('.');
 if(f.sep)int=int.replace(/\B(?=(\d{3})+(?!\d))/g,f.sep);
 return f.prefix+int+(dec?f.mark+dec:'')+f.suffix;
}
const ease=t=>1-Math.pow(1-t,3);
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* The real value stays readable by assistive tech; only an aria-hidden copy counts up. */
function countUp(el,ms=900){
 if(el.dataset.counted)return;el.dataset.counted='1';
 const text=el.textContent,f=parseFigure(text);if(!f||f.value===0||reduced())return;
 el.innerHTML=`<span aria-hidden="true" class="count-up">${esc(formatFigure(f,0))}</span><span class="sr-only">${esc(text)}</span>`;
 const out=el.firstChild,t0=performance.now();
 const step=t=>{const k=Math.min(1,(t-t0)/ms);out.textContent=k<1?formatFigure(f,f.value*ease(k)):text;if(k<1)requestAnimationFrame(step)};
 requestAnimationFrame(step);
}

/* ---------- Block types ---------- */
function enhance(T,F){
 T.faq={label:'FAQ',cat:'Work',hint:'Questions fréquentes dépliables',size:'w',flow:true,interactive:true,
  fields:[F('title','Titre'),F('items','Une par ligne : Question | Réponse','area')],
  def:{title:'Questions fréquentes',items:'Quels sont tes délais ? | Deux à six semaines selon le projet.\nTravailles-tu à distance ? | Oui, partout en France.'},
  render:d=>`<b class="t-title">${esc(d.title)}</b><div class="faq">${rows(d.items).map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`};
 T.progress={label:'Progress',cat:'Work',hint:'Barres de niveau ou d’avancement',size:'w',flow:true,
  fields:[F('title','Titre'),F('items','Une par ligne : Libellé | pourcentage','area'),F('color','Couleur','color')],
  def:{title:'Niveaux',items:'Design UI | 85\nPHP | 80\nJavaScript | 75',color:''},
  tint:d=>/^#[0-9a-f]{3,8}$/i.test(d.color||'')?d.color:'',
  render:d=>`<span class="eyebrow">${esc(d.title)}</span><ul class="pbars">${rows(d.items).map(([l,v])=>{const p=pct(v);return `<li><span class="pbar-h"><span>${esc(l)}</span><b>${p} %</b></span><span class="pbar" aria-hidden="true"><i style="--p:${p/100}"></i></span></li>`}).join('')}</ul>`};
 T.steps={label:'Process',cat:'Work',hint:'Étapes numérotées de ta méthode',size:'w',flow:true,
  fields:[F('title','Titre'),F('items','Une par ligne : Étape | Détail','area')],
  def:{title:'Ma méthode',items:'Écoute | On cadre le besoin et le budget.\nMaquette | Une proposition visuelle à valider.\nLivraison | Mise en ligne, tests et passation.'},
  render:d=>`<span class="eyebrow">${esc(d.title)}</span><ol class="steps">${rows(d.items).map(([s,x])=>`<li><b>${esc(s)}</b>${x?`<small class="muted">${esc(x)}</small>`:''}</li>`).join('')}</ol>`};
 T.clock={label:'Local time',cat:'Personal',hint:'Ton heure et le décalage du visiteur',size:'s',
  fields:[F('place','Lieu affiché'),F('tz','Fuseau horaire','select',ZONES)],
  def:{place:'Troyes',tz:'Europe/Paris'},
  render:d=>{const c=clockParts(d);return `<span class="eyebrow">Heure locale</span><span class="big clock-time" data-clock="${esc(c.tz)}"><time>${esc(c.time)}</time></span><span class="bottom"><b>${esc(d.place)}</b> <small class="muted">${esc(c.offset)}</small><small class="muted clock-rel" data-clock-rel>${esc(c.relative)}</small></span><span class="clock-sky ${c.day?'day':'night'}" aria-hidden="true"></span>`}};
}

/* ---------- Motion: view transitions, pointer spotlight, intro, tab indicator ---------- */
let running=null;
const tileName=id=>'tile-'+String(id).replace(/[^A-Za-z0-9_-]/g,'');
const vh=()=>globalThis.innerHeight||800;
/* Only tiles within half a screen of the viewport get a name: off-screen ones join the root crossfade,
 * so a long page never captures dozens of snapshots. A tile leaving the viewport fades out, one arriving fades in. */
const near=el=>{const r=el.getBoundingClientRect(),h=vh();return r.bottom>-h/2&&r.top<h*1.5};
function nameTiles(grid,on){for(const el of grid.querySelectorAll('.tile')){const id=el.dataset&&el.dataset.id;if(!id)continue;const n=on&&near(el);el.style.viewTransitionName=n?tileName(id):'';el.style.viewTransitionClass=n?'tile':'';}}
/* Animate a grid re-render (filter, search, section). Falls back to an instant update when the API,
 * the grid or the motion preference says no, in the editor, or while another transition runs. */
function transition(update){
 const grid=document.getElementById('grid');
 if(running||!grid||typeof document.startViewTransition!=='function'||reduced()||document.body.classList.contains('mode-edit')){update();return;}
 nameTiles(grid,true);
 try{running=document.startViewTransition(()=>{update();nameTiles(grid,true);});}catch{running=null;nameTiles(grid,false);update();return;}
 running.finished.catch(()=>{}).finally(()=>{nameTiles(grid,false);running=null;});
}
/* Soft light under the pointer: precise pointers with hover only; touch keeps the press feedback. */
function spotlight(grid){
 if(typeof matchMedia!=='function'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
 let frame=0,last=null;
 grid.addEventListener('pointermove',e=>{last=e;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const t=last.target.closest&&last.target.closest('.tile');if(!t)return;const r=t.getBoundingClientRect();t.style.setProperty('--mx',Math.round(last.clientX-r.left)+'px');t.style.setProperty('--my',Math.round(last.clientY-r.top)+'px');});},{passive:true});
}
/* First paint of the session only: tiles in the first screen rise in order, capped so the last ones never wait.
 * Tiles below the fold are left to the CSS scroll reveal (view() timeline) instead. */
function intro(grid){
 if(reduced()||!document.body.classList.contains('is-public'))return;
 try{if(sessionStorage.getItem('tiles-intro'))return;sessionStorage.setItem('tiles-intro','1')}catch{}
 const h=vh();let i=0;
 for(const el of grid.querySelectorAll('.tile')){if(el.getBoundingClientRect().top>=h)continue;el.classList.add('rise');el.style.setProperty('--i',Math.min(i++,12));}
 setTimeout(()=>{for(const el of grid.querySelectorAll('.rise'))el.classList.remove('rise')},1400);
}
/* Sliding indicator under the universe tabs: follows aria-current, survives nav rebuilds, resizes and late fonts. */
function tabIndicator(nav){
 if(!nav||typeof ResizeObserver!=='function'||typeof MutationObserver!=='function')return;
 let raf=0;
 const place=()=>{raf=0;const a=nav.querySelector('[aria-current]');
  if(nav.hidden||!a||!a.offsetWidth){nav.classList.remove('has-ind');return;}
  const st=nav.style;st.setProperty('--tab-x',a.offsetLeft+'px');st.setProperty('--tab-y',a.offsetTop+'px');st.setProperty('--tab-w',a.offsetWidth+'px');st.setProperty('--tab-h',a.offsetHeight+'px');
  /* Shown one frame after the first placement, so it never slides in from the left edge. */
  if(!nav.classList.contains('has-ind'))requestAnimationFrame(()=>nav.classList.add('has-ind'));};
 const queue=()=>{if(!raf)raf=requestAnimationFrame(place)};
 new MutationObserver(queue).observe(nav,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-current','hidden']});
 new ResizeObserver(queue).observe(nav);document.fonts?.ready?.then(queue);queue();
}

/* ---------- Runtime: clocks and figures, public view only ---------- */
let clockTimer=0,figures=null;
function tickClocks(root=document){
 for(const el of root.querySelectorAll('[data-clock]')){const c=clockParts({tz:el.dataset.clock});const t=el.querySelector('time');if(t&&t.textContent!==c.time)t.textContent=c.time;const tile=el.closest('.ti');const rel=tile?.querySelector('[data-clock-rel]');if(rel)rel.textContent=c.relative;tile?.querySelector('.clock-sky')?.classList.toggle('day',c.day);tile?.querySelector('.clock-sky')?.classList.toggle('night',!c.day);}
}
function observeFigures(grid,isPublic){
 if(!grid||typeof IntersectionObserver!=='function')return;
 figures?.disconnect();
 figures=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){figures.unobserve(e.target);countUp(e.target)}},{threshold:.6});
 const scan=()=>{if(!isPublic())return;for(const el of grid.querySelectorAll('.ty-stat .big:not([data-counted]),.ty-countdown .big:not([data-counted])'))figures.observe(el)};
 new MutationObserver(scan).observe(grid,{childList:true});scan();
}
function bind({grid,isPublic}){
 observeFigures(grid,isPublic);
 spotlight(grid);
 tabIndicator(document.querySelector('.hub-universes'));
 const start=()=>{clearInterval(clockTimer);clockTimer=0;if(document.visibilityState==='visible'){tickClocks();clockTimer=setInterval(tickClocks,20000)}};
 document.addEventListener('visibilitychange',start);start();
}

window.TilesBento={enhance,bind,intro,transition,tileName,nameTiles,tabIndicator,rows,pct,zoneOffset,zoneTime,fmtOffset,relative,clockParts,parseFigure,formatFigure,countUp,ZONES,tickClocks};
})();
