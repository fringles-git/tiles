(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const https=u=>{try{const v=new URL(u);return v.protocol==='https:'?v.href:''}catch{return ''}};
const sizeCount=s=>({bar:1,s:1,w:3,t:5,l:8}[s]||1);
const coord=(v,min,max,fallback)=>v!==''&&v!=null&&Number.isFinite(+v)&&+v>=min&&+v<=max?+v:fallback;
const state=new Map(),requests=new Map(),maps=new Set();
const gateway=new URL('../widgets.php',document.currentScript?.src||location.href).href;
let audio=null,playing=null,mapModule=null,enabled=false;
const catalogue=window.TILES_BOOT?.sports||[{key:'f1',name:'Formule 1',url:'https://www.formula1.com/'},{key:'psg',name:'Paris Saint-Germain',url:'https://www.psg.fr/'},{key:'france',name:'France · équipe masculine',url:'https://www.fff.fr/equipe-nationale/'}];
const followed=d=>catalogue.find(x=>x.key===(d.follow||'f1'))||catalogue[0];
const genres=[['gospel','Gospel'],['classical','Classique'],['jazz','Jazz']];
function get(id){if(!state.has(id))state.set(id,{view:'calendar'});return state.get(id)}
function shell(type,d,t){if(type==='sport')return sportsFace(d,t);return `<div class="w-card w-${type}" data-widget="${type}" data-widget-id="${esc(t.id)}" data-widget-size="${esc(t.size)}"><div class="w-heading"><span class="w-symbol" aria-hidden="true">${{radio:'♫',sport:(followed(d).key==='f1'?'🏁':'⚽'),atlas:'◎'}[type]}</span><div><small>${{radio:'La sélection musicale',sport:(followed(d).key==='f1'?'Le paddock':'Mon équipe'),atlas:'Sur la carte'}[type]}</small><b>${esc(d.title||d.place||{radio:'Radio',sport:followed(d).name,atlas:'Troyes'}[type])}</b></div></div><p class="w-intro">${esc(d.note||{radio:'Gospel, classique et découvertes.',sport:(followed(d).key==='f1'?'Calendrier et classement · données en cache.':'Calendrier et résultats · compétitions couvertes.'),atlas:'Déplacez la carte, zoomez et explorez.'}[type])}</p><div class="w-body"><button type="button" data-w-action="load">${{radio:'Choisir une radio',sport:'Explorer',atlas:'Activer la carte'}[type]}</button></div><p class="w-status" role="status" aria-live="polite"></p></div>`}
function definitions(F){return {
 radio:{label:'Radio interactive',cat:'Creative',hint:'Gospel, classique, jazz · lecture à la demande',size:'w',interactive:true,fields:[F('title','Titre'),F('genre','Sélection','select',genres),F('note','Description')],def:{title:'Dans mes oreilles',genre:'gospel',note:''},render:(d,t)=>shell('radio',d,t)},
 sport:{label:'Sport interactif',cat:'Personal',hint:'F1, PSG, France ou équipe configurée',size:'w',bleed:true,interactive:true,fields:[F('follow','Supporter de','select',catalogue.map(x=>[x.key,x.name])),F('title','Titre personnalisé (facultatif)'),F('note','Description')],def:{title:'',follow:'f1',note:''},render:(d,t)=>shell('sport',d,t)},
 atlas:{label:'Carte interactive',cat:'Essentials',hint:'OpenFreeMap · zoom, déplacement, itinéraire',size:'l',interactive:true,fields:[F('place','Lieu'),F('lat','Latitude'),F('lon','Longitude'),F('zoom','Zoom (3–16)'),F('note','Description')],def:{place:'Troyes',lat:'48.2973',lon:'4.0744',zoom:'12',note:'Basé à Troyes, France'},render:(d,t)=>shell('atlas',d,t)}
}}
function status(card,text){const el=card.querySelector('.w-status');if(el)el.textContent=text}
async function data(key){
 const old=requests.get(key);if(old&&(old.pending||old.until>Date.now()))return old.promise;
 const entry={pending:true,until:0};
 entry.promise=(async()=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
  try{
   const response=await fetch(gateway+'?resource='+encodeURIComponent(key),{signal:ctl.signal,credentials:'same-origin'});
   const body=await response.json();
   if(!response.ok||!body.ok){entry.until=Date.now()+Math.max(60,Math.min(86400,+body.retryAfter||60))*1000;throw Error('Données indisponibles. Réessayez plus tard.')}
   entry.until=Date.now()+300000;return body;
  }catch(e){entry.until=Math.max(entry.until,Date.now()+60000);throw e}
  finally{entry.pending=false;clearTimeout(timer)}
 })();requests.set(key,entry);return entry.promise;
}
function stamp(result){const when=new Date(result.updatedAt);return `${result.stale?'Cache ancien · ':''}Mis à jour ${Number.isNaN(+when)?'récemment':when.toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · ${result.source}`}
function sourceLink(url,label){return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`}
function drawRadio(card,d,result){
 const s=get(card.dataset.widgetId);s.radio=result;
 const max=sizeCount(card.dataset.widgetSize);
 const items=result.items.slice(0,max);
 card.querySelector('.w-body').innerHTML=`<div class="w-tabs" role="group" aria-label="Genre musical">${genres.map(([v,l])=>`<button type="button" data-w-action="genre" data-value="${v}" aria-pressed="${(s.genre||d.genre||'gospel')===v}">${l}</button>`).join('')}</div><ol class="w-list">${items.map((x,i)=>`<li><div><b>${esc(x.name)}</b><small>${esc(x.country)}${max>1?' · '+esc(x.codec)+' · '+esc(x.bitrate)+' kb/s':''}</small></div><button type="button" data-w-action="play" data-index="${i}" aria-label="Écouter ${esc(x.name)}">▶</button></li>`).join('')}</ol>${items.length?'<button type="button" data-w-action="stop">Arrêter la lecture</button>':'<p>Aucune station HTTPS disponible dans cette sélection.</p>'}${sourceLink('https://www.radio-browser.info/','Radio Browser')}`;
 status(card,stamp(result));
}
function nextSession(items,now=Date.now()){
 return items.flatMap(r=>(r.sessions||[{name:'Course',date:r.date,time:r.time}]).map(x=>({...x,race:r.name,at:Date.parse(x.date+'T'+(x.time||'23:59:59Z'))}))).filter(x=>Number.isFinite(x.at)&&x.at>now).sort((a,b)=>a.at-b.at)[0]||null;
}
function sportsFace(d,t){
 const team=followed(d),f1=team.key==='f1',fr=team.key==='france';
 return `<div class="w-card sports-card ${f1?'sports-f1':fr?'sports-france':'sports-psg'}" data-widget="sport" data-widget-id="${esc(t.id)}" data-widget-size="${esc(t.size)}"><div class="sports-decoration" aria-hidden="true">${f1?'<span class="racing-stripe"></span><span class="racing-checks"></span>':'<span class="club-circle"></span><span class="club-stripe"></span>'}</div><div class="sports-heading"><span class="sports-eyebrow">${f1?'FORMULE 1':fr?'LES BLEUS':'LIGUE 1 & UEFA'}</span><button class="sports-info" type="button" data-w-action="load" aria-label="Informations ${esc(team.name)}">⇄ Infos</button></div><div class="sports-title"><b>${esc(d.title||(f1?'Max Verstappen':team.name))}</b><small>${esc(f1?'Supporter de Max Verstappen':fr?'Équipe de France masculine':'Supporter Rouge & Bleu')}</small></div><div class="w-body"><p class="sports-motto">${f1?'La passion de la course.':fr?'Allez les Bleus.':'Ici, c’est Paris.'}</p></div><p class="w-status" role="status" aria-live="polite"></p></div>`;
}
function sportsBox(label,main,detail){return `<div class="sports-summary"><small>${label}</small><b>${esc(main)}</b>${detail?`<span>${esc(detail)}</span>`:''}</div>`}
function sportsDetails(card,d,html,result,brief){
 card.querySelector('.w-body').innerHTML=`<p class="sports-motto">${esc(brief)}</p>`;
 let dialog=document.getElementById('sports-dialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='sports-dialog';dialog.className='sports-dialog';dialog.setAttribute('aria-labelledby','sports-dialog-title');document.body.appendChild(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-close-sports]'))dialog.close()})}
 const page=document.getElementById('page');if(page){const theme=getComputedStyle(page);for(const key of ['--surface','--surface-2','--fg','--muted','--line','--accent'])dialog.style.setProperty(key,theme.getPropertyValue(key))}
 dialog.innerHTML=`<div class="sports-dialog-heading"><h2 id="sports-dialog-title">${esc(d.title||followed(d).name)}</h2><button type="button" data-close-sports aria-label="Fermer" autofocus>×</button></div><div data-widget="sport" data-widget-id="${esc(card.dataset.widgetId)}" data-widget-size="l"><div class="w-body">${html}</div><p class="w-status">${esc(stamp(result))}</p></div>`;
 if(!dialog.open)dialog.showModal();
}
function drawSport(card,result,d){
 if(followed(d).key!=='f1')return drawFootball(card,result,d);
 const s=get(card.dataset.widgetId);s[s.view]=result;
 let content='';
 if(s.view==='results'){
  const race=result.items[0],favorite=race?.results?.find(x=>x.driverId==='max_verstappen'),winner=race?.results?.find(x=>x.position==='1');
  content=sportsBox('DERNIER GRAND PRIX',race?.name||'Résultat indisponible',favorite?'Verstappen · P'+favorite.position+(winner?' · Vainqueur : '+winner.name:''):winner?'Vainqueur : '+winner.name:'');
 }else{
  const next=nextSession(result.items);
  content=sportsBox('PROCHAINE SESSION',next?next.name:'Calendrier à venir',next?next.race+' · '+new Date(next.at).toLocaleString('fr-FR',{day:'numeric',month:'short',...(next.time?{hour:'2-digit',minute:'2-digit'}:{})})+(next.time?'':' · horaire à confirmer'):'Aucune session future publiée dans ce calendrier.');
 }
 sportsDetails(card,d,content+`<div class="sports-links"><button type="button" data-w-action="view" data-value="calendar">Prochaine session</button><button type="button" data-w-action="view" data-value="results">Dernier GP</button></div>`,result,s.view==='results'?(result.items[0]?.name||'Dernier GP'):((nextSession(result.items)?.name||'À venir')+' · horaires locaux'));
 status(card,stamp(result));
}
function drawFootball(card,result,d){
 const last=result.items.filter(x=>x.status==='FINISHED').slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0];
 const next=result.items.filter(x=>['SCHEDULED','TIMED'].includes(x.status)&&Date.parse(x.date)>Date.now()).slice().sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))[0];
 const score=last&&last.homeScore!=null&&last.awayScore!=null?last.homeScore+' – '+last.awayScore:'—';
 const matchBox=(item,label,main)=>sportsBox(label,item?main:'Information indisponible',item?item.home+' / '+item.away+' · '+new Date(item.date).toLocaleString('fr-FR',{day:'numeric',month:'short',...(label==='PROCHAIN MATCH'?{hour:'2-digit',minute:'2-digit'}:{})}):'Consultez le calendrier officiel.');
 const content=matchBox(last,'DERNIER RÉSULTAT',score)+matchBox(next,'PROCHAIN MATCH',next?.home+' / '+next?.away);
 sportsDetails(card,d,content+`<div class="sports-links">${sourceLink(followed(d).url,'Site officiel')}</div><small>Scores différés · couverture partielle</small>`,result,(last?'Dernier score : '+score:'Dernier score indisponible')+(next?' · '+next.home+' / '+next.away:''));
 status(card,stamp(result)+' · Scores différés · couverture partielle');
}
async function load(card,d){
 const type=card.dataset.widget,id=card.dataset.widgetId,s=get(id),body=card.querySelector('.w-body');
 if(type==='atlas')return startMap(card,d);
 if(card.dataset.busy)return;card.dataset.busy='true';
 const button=body.querySelector('button');if(button)button.disabled=true;
 status(card,'Chargement…');
 try{
  const team=followed(d);
  if(type==='sport'&&team.key!=='f1'&&!['upcoming','results'].includes(s.view))s.view='upcoming';
  if(type==='sport'&&team.key==='f1'&&!['calendar','results'].includes(s.view))s.view='calendar';
  const key=type==='radio'?'radio-'+(s.genre||d.genre||'gospel'):team.key==='f1'?'f1-'+s.view:'football-'+team.key;
  const result=await data(key);
  if(!card.isConnected)return;
  if(type==='radio')drawRadio(card,d,result);else drawSport(card,result,d);
 }catch(e){if(card.isConnected){status(card,type==='sport'?'Données indisponibles pour le moment.':'Source momentanément indisponible. Vous pouvez réessayer.');if(button)button.disabled=false;if(type==='sport'&&followed(d).key!=='f1'&&!body.querySelector('a'))body.insertAdjacentHTML('beforeend',sourceLink(followed(d).url,'Calendrier officiel'))}}
 finally{delete card.dataset.busy}
}
function stop(){if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}if(playing?.isConnected)status(playing,'Lecture arrêtée.');playing=null}
async function play(card,index){
 const x=get(card.dataset.widgetId).radio?.items[index];if(!x||!https(x.url))return;
 stop();audio=new Audio();audio.preload='none';audio.src=https(x.url);const current=audio;playing=card;
 current.addEventListener('error',()=>{if(audio===current)status(card,'Cette station ne répond pas. Choisissez-en une autre.')});
 status(card,'Connexion à '+x.name+'…');
 try{await current.play();if(audio===current)status(card,'À l’écoute · '+x.name)}catch{if(audio===current)status(card,'Lecture indisponible. Essayez une autre station.')}
}
async function startMap(card,d){
 if(card.dataset.busy||card.dataset.mapActive)return;
 card.dataset.busy='true';const body=card.querySelector('.w-body');
 const lat=coord(d.lat,-85,85,48.2973),lon=coord(d.lon,-180,180,4.0744),zoom=coord(d.zoom,3,16,12);
 status(card,'Ouverture de la carte…');
 let map,record;
 try{
  if(!mapModule){
   const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.css';document.head.appendChild(css);
   mapModule=import('https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs').catch(e=>{mapModule=null;css.remove();throw e});
  }
  const gl=await mapModule;if(!card.isConnected||document.hidden)return;
  body.innerHTML=`<div class="w-map" role="region" aria-label="Carte de ${esc(d.place||'Troyes')}"></div><div class="w-map-actions"><button type="button" data-w-action="recenter">Recentrer</button><button type="button" data-w-action="close-map">Fermer la carte</button></div>${sourceLink('https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;'+lat+','+lon,'Itinéraire')}`;
  const container=body.querySelector('.w-map');
  map=new gl.Map({container,style:'https://tiles.openfreemap.org/styles/liberty',center:[lon,lat],zoom,attributionControl:true});
  card.dataset.mapActive='true';
  map.addControl(new gl.NavigationControl({showCompass:false}));
  new gl.Marker().setLngLat([lon,lat]).setPopup(new gl.Popup().setText(d.place||'Troyes')).addTo(map);
  map.scrollZoom.disable();
  const observer=new ResizeObserver(()=>map.resize());observer.observe(container);
  record={card,map,observer,center:[lon,lat],zoom};maps.add(record);
  map.on('load',()=>status(card,'Carte interactive · OpenFreeMap / OpenStreetMap · molette désactivée'));
  map.on('error',()=>status(card,'Fond de carte indisponible. Le lien itinéraire reste accessible.'));
 }catch{
  if(record){record.observer.disconnect();maps.delete(record)}if(map)map.remove();delete card.dataset.mapActive;
  status(card,'La carte est indisponible sur ce navigateur.');
  body.innerHTML=`<button type="button" data-w-action="load">Réessayer</button>${sourceLink('https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lon+'#map=12/'+lat+'/'+lon,'Ouvrir OpenStreetMap')}`;
 }finally{delete card.dataset.busy}
}
function dispose(){stop();for(const x of maps){x.observer.disconnect();x.map.remove();delete x.card.dataset.mapActive;if(x.card.isConnected){x.card.querySelector('.w-body').innerHTML='<button type="button" data-w-action="load">Activer la carte</button>';status(x.card,'Carte fermée.')}}maps.clear()}
function bind(lookup,isInteractive){
 if(enabled)return;enabled=true;
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-w-action]'),card=b?.closest('[data-widget]');
  if(!card||!isInteractive())return;
  const tile=lookup(card.dataset.widgetId);if(!tile)return;
  const s=get(tile.id),action=b.dataset.wAction;
  if(action==='load')return load(card,tile.data);
  if(action==='play')return play(card,+b.dataset.index);
  if(action==='stop')return stop();
  if(action==='genre'||action==='view'){
   if(card.dataset.busy)return;
   if(action==='genre'){stop();s.genre=b.dataset.value}else s.view=b.dataset.value;
   return load(card,tile.data);
  }
  for(const x of maps)if(x.card===card){
   if(action==='recenter')x.map.jumpTo({center:x.center,zoom:x.zoom});
   if(action==='close-map'){x.observer.disconnect();x.map.remove();maps.delete(x);delete card.dataset.mapActive;card.querySelector('.w-body').innerHTML='<button type="button" data-w-action="load">Activer la carte</button>';status(card,'Carte fermée.');}
  }
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)dispose()});
 window.addEventListener('pagehide',dispose);
}
window.TilesWidgets={definitions,bind,dispose,sizeCount,coord,https,nextSession};
})();
