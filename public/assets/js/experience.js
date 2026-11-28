(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=new URL('../images/',document.currentScript?.src||location.href).href;
const qrSrc=document.currentScript?.dataset?.qr?new URL(document.currentScript.dataset.qr,location.href).href:'';
const image=s=>typeof s==='string'&&(/^uploads\/[A-Za-z0-9_-]+\.(png|jpe?g|webp|gif)$/.test(s)||/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s));
const url=u=>{try{const x=new URL(u);return ['https:','http:'].includes(x.protocol)&&!x.username?x.href:''}catch{return ''}};
const brands={
 action:{match:'action',name:'Action',url:'https://www.action.com/fr-fr/',logo:base+'brands/action.svg'},
 basicfit:{match:'basic[ -]?fit',name:'Basic-Fit',url:'https://www.basic-fit.com/fr-fr/',logo:'https://www.basic-fit.com/on/demandware.static/Sites-BFE-Site/-/default/dwfd1a63b5/img/svg/logo-bf-orange.svg'},
 hugoboss:{match:'hugo[ -]?boss',name:'Hugo Boss',url:'https://www.hugoboss.com/fr/fr/'},
 edf:{match:'edf',name:'EDF',url:'https://www.edf.fr/'},
 github:{match:'github',name:'GitHub',url:'https://github.com/',logo:base+'brands/github.svg'},
 spotify:{match:'spotify',name:'Spotify',url:'https://open.spotify.com/',logo:base+'brands/spotify.svg'}
};
// Authored outline controls share one 24px grid and stroke; brand marks keep their identities.
const controlPaths={instagram:'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17.5 6.5h.01',search:'M21 21l-5-5M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15',globe:'M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',share:'M12 16V3M7 8l5-5 5 5M5 13v7h14v-7',qr:'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM21 15v6h-6M18 12h3M12 3v3M12 12v9',download:'M12 3v12M7 10l5 5 5-5M4 17v4h16v-4',sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1',moon:'M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10',monitor:'M3 4h18v13H3zM8 21h8M12 17v4',code:'M8 7l-5 5 5 5M16 7l5 5-5 5',zoom:'M21 21l-5-5M7 10h6M10 7v6M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15',mail:'M4 6h16v12H4zM4 7l8 6 8-6',phone:'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',ext:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',plus:'M12 5v14M5 12h14',play:'M8 5l11 7-11 7z'};
function uiIcon(name,size=20,fallback){return `<svg class="ui-icon" data-css="--icon-size:${Number(size)||20}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${controlPaths[name]||fallback||controlPaths.code}"/></svg>`;}
function logoMarkup(name,src){const initials=name.split(/[ -]/).map(x=>x[0]).join('').slice(0,2);return `<span class="company-logo" aria-hidden="true"><span>${esc(initials)}</span>${src?`<img src="${esc(src)}" alt="" loading="lazy" decoding="async" data-company-logo>`:''}</span>`;}
function languageSegments(level){const key=normalize(level).trim(),scores={a1:1,a2:2,b1:3,b2:4,'b2+':4,c1:5,c2:5,natif:5,bilingue:5,courant:4,notions:1};const n=scores[key];return n?`<span class="language-segments" aria-hidden="true">${[1,2,3,4,5].map(i=>`<i${i<=n?' class="filled"':''}></i>`).join('')}</span>`:'';}
const tech={html:'html5',html5:'html5',css:'css',javascript:'javascript',react:'react',php:'php',python:'python',bootstrap:'bootstrap',flutter:'flutter',github:'github'};
const icon=(name,cls='')=>`<img class="brand-icon ${cls}" src="${esc(base+'brands/'+name+'.svg')}" alt="" loading="lazy" decoding="async">`;
const techColors={html5:'#E34F26',css:'#1572B6',javascript:'#F7DF1E',react:'#61DAFB',php:'#777BB4',python:'#3776AB',bootstrap:'#7952B3',flutter:'#02569B',spotify:'#1DB954',github:'currentColor'};
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h%360};
const colorLogos={html5:'html5-color',css:'css-color'};
function skillMark(name){
 const key=tech[normalize(name)];
 if(colorLogos[key])return `<img class="skill-img" src="${esc(base+'brands/'+colorLogos[key]+'.svg')}" alt="" loading="lazy" decoding="async">`;
 if(key)return `<span class="skill-mark" data-css="--mark:${techColors[key]||'currentColor'};--mark-url:url('${esc(base+'brands/'+key+'.svg')}')" aria-hidden="true"></span>`;
 const letters=String(name).trim().split(/[\s-]+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase();
 return `<span class="skill-mono" data-css="--h:${hue(normalize(name))}" aria-hidden="true">${esc(letters)}</span>`;
}
let library=[];
let employers=[];
function setLibrary(tiles,shown=tiles){
 employers=organisations(shown);
 library=(tiles||[]).filter(t=>t&&t.data&&image(t.data.logo)&&String(t.data.logoFor||'').trim()).map(t=>({key:normalize(t.data.logoFor).trim(),name:String(t.data.logoFor).trim(),logo:t.data.logo})).sort((a,b)=>b.key.length-a.key.length);
}
/** Every organisation named in experience tiles, first mention first, deduplicated (accents and case ignored). */
function organisations(tiles){
 const seen=new Set(),out=[];
 for(const t of tiles||[]){if(t?.type!=='experience')continue;
  for(const line of String(t.data?.items||'').split('\n')){const org=(line.split('|')[1]||'');
   for(let name of org.split(/,|\set\s/)){name=name.replace(/\(.*?\)/g,'').trim();const k=normalize(name);if(name.length<2||!/^[\p{Lu}\d]/u.test(name)||/^(independant|freelance|evenements|sites?)\b/.test(k)||seen.has(k))continue;seen.add(k);out.push(name);}}}
 return out;
}
function employerStrip(max=7){
 if(!employers.length)return '';
 const logoOf=name=>{const lib=libraryLogo(name);return lib?lib.logo:Object.values(brands).find(b=>b.logo&&new RegExp('\\b(?:'+(b.match||'')+')\\b').test(normalize(name)))?.logo||'';};
 const ranked=employers.map((name,i)=>({name,logo:logoOf(name),i})).sort((a,b)=>(!a.logo)-(!b.logo)||a.i-b.i);
 const shown=ranked.slice(0,max).reverse(),rest=employers.length-shown.length;
 return `<div class="stat-logos" data-css="--count:${shown.length+(rest>0?1:0)}" aria-label="Entreprises : ${esc(employers.join(', '))}">${shown.map((e,i)=>`<span class="stat-logo" data-css="--i:${i};--n:${shown.length}" title="${esc(e.name)}">${logoMarkup(e.name,e.logo)}</span>`).join('')}${rest>0?`<span class="stat-logo more" data-css="--i:${shown.length};--n:${shown.length}">+${rest}</span>`:''}</div>`;
}
function libraryLogo(org){const t=normalize(org);return library.find(x=>x.key&&new RegExp('(?:^|[^a-z0-9])'+x.key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-z0-9])').test(t))||null}
function span(dates){
 const t=normalize(dates);if(/\d\s*(?:mois|semaine|jour|an|ans)\b|·/.test(t))return '';if(!/\d{4}\s*(?:-|–|—|a|au|to)\s*(?:\d{4}|now|present|presente|aujourd|en cours|ce jour)/.test(t))return '';
 const years=(t.match(/\d{4}/g)||[]).map(Number),start=years[0],end=years[1]??new Date().getFullYear();
 const n=end-start;return n>0?n+(n>1?' ans':' an'):'';
}
function timeline(d){
 return `<span class="eyebrow">${esc(d.title)}</span><ul class="tl">${String(d.items||'').split('\n').filter(Boolean).map(line=>{
  const [role,org,dates,place]=line.split('|').map(x=>(x||'').trim());
  const lib=libraryLogo(org),brand=lib?{name:lib.name,logo:lib.logo}:Object.values(brands).find(b=>b.logo&&new RegExp('\\b(?:'+(b.match||'')+')\\b').test(normalize(org)));
  const meta=[dates,span(dates)].filter(Boolean).map(esc).join(' · ');
  return `<li><div class="tl-row">${org?logoMarkup(brand?.name||org,brand?.logo):''}<div><b>${esc(role)}</b><small>${esc([org,place].filter(Boolean).join(' · '))}</small><div class="yrs">${meta}</div><div class="employers">${employerLinks(org)}</div></div></div></li>`}).join('')}</ul>`;
}
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function employerLinks(text){
 return Object.entries(brands).filter(([key])=>new RegExp('\\b(?:'+(brands[key].match||key)+')\\b').test(normalize(text))).map(([,b])=>`<a class="employer" href="${b.url}" target="_blank" rel="noopener noreferrer" aria-label="${esc(b.name)} · site officiel">${logoMarkup(b.name,b.logo)}<span>${esc(b.name)}</span>${uiIcon('ext',16)}</a>`).join('');
}
function projectKind(d){const text=normalize([d.role,d.tags,d.title].join(' '));return /saas/.test(text)?'saas':/\bapp\b|mobile|flutter/.test(text)?'app':/site|plateforme|web/.test(text)?'site':'experiment';}
function filter(tiles,query='',category='all',kind='all'){
 const groups={projects:['project'],photos:['image','gallery','video'],career:['experience','education','skills','languages','company','cv'],personal:['sport','team','radio','music','instrument','faith','interest','now','atlas','map']};
 const q=normalize(query),output=[];let heading=null,shown=false,group=null,groupShown=false;
 for(const t of tiles){
  if(t.type==='universe'){group=t;groupShown=false;heading=null;shown=false;continue}
  if(t.type==='section'){heading=t;shown=false;continue}
  const text=normalize(JSON.stringify(t.data||{})+' '+(/paris saint.germain/i.test(t.data.club||t.data.title||'')?'PSG ':'')+(/formule 1|formula 1/i.test(t.data.title||'')?'F1 ':''));
  if(q&&!text.includes(q))continue;
  if(kind!=='all'&&(t.type!=='project'||projectKind(t.data)!==kind))continue;
  if(category!=='all'&&!(groups[category]||[]).includes(t.type))continue;
  if(group&&!groupShown){output.push(group);groupShown=true}
  if(heading&&!shown){output.push(heading);shown=true}output.push(t);
 }
 return output;
}
const KINDS={piano:{label:'Piano / clavier'},bass:{label:'Basse'},sax:{label:'Saxophone'},voice:{label:'Chant'},other:{label:'Autre (sans son)'}};
function instrumentKind(v){const t=normalize(v);if(KINDS[t])return t;return /piano|clavier|keys|keyboard|synth/.test(t)?'piano':/basse|bass/.test(t)?'bass':/sax/.test(t)?'sax':/chant|voix|voice|vocal/.test(t)?'voice':'other';}
const hz=(base,semi)=>Math.round(base*2**(semi/12)*100)/100;
const NAMES=['Do','Ré♭','Ré','Mi♭','Mi','Fa','Sol♭','Sol','La♭','La','Si♭','Si'];
function pads(kind){
 if(kind==='piano'){const whites=[['Do',261.63],['Ré',293.66],['Mi',329.63],['Fa',349.23],['Sol',392],['La',440],['Si',493.88],['Do aigu',523.25]],blacks=[['Do dièse',277.18,12.5],['Ré dièse',311.13,25],['Fa dièse',369.99,50],['Sol dièse',415.3,62.5],['La dièse',466.16,75]];
  return `<div class="piano-keys" role="group" aria-label="Clavier de piano">${whites.map(([n,f])=>`<button type="button" class="key white" data-note="${f}" aria-label="Jouer ${n}"></button>`).join('')}${blacks.map(([n,f,l])=>`<button type="button" class="key black" data-note="${f}" data-css="left:${l}%" aria-label="Jouer ${n}"></button>`).join('')}</div>`;}
 if(kind==='bass'){const strings=[['Sol',98],['Ré',73.42],['La',55],['Mi',41.2]];
  return `<div class="bass-neck" role="group" aria-label="Manche de basse, 4 cordes, 5 cases">${strings.map(([n,b],si)=>`<div class="string" data-css="--w:${1+si*.6}px">${[0,1,2,3,4].map(f=>`<button type="button" data-note="${hz(b,f)}" aria-label="Corde ${n}, ${f?'case '+f:'à vide'}"><i></i></button>`).join('')}</div>`).join('')}</div>`;}
 if(kind==='sax'||kind==='voice'){const base=kind==='sax'?233.08:261.63,start=kind==='sax'?10:0,steps=[0,2,4,5,7,9,11,12];
  return `<div class="note-pads" role="group" aria-label="${kind==='sax'?'Saxophone':'Chant'} : notes">${steps.map(st=>`<button type="button" data-note="${hz(base,st)}">${NAMES[(start+st)%12]}</button>`).join('')}</div>`;}
 return '';
}
function instrumentPanel(kind,kinds,tile=''){
 const playable=kinds.filter(k=>k!=='other');
 const tabs=playable.length>1?`<div class="instrument-tabs" role="group" aria-label="Choisir l’instrument">${playable.map(k=>`<button type="button" data-instrument-switch="${k}" aria-pressed="${k===kind}">${esc(KINDS[k].label.split(' /')[0])}</button>`).join('')}</div>`:'';
 const body=pads(kind);
 const hint=body?`<small class="piano-hint">${kind==='sax'||kind==='voice'?'Maintenez une note pour la tenir':'Touchez pour jouer'} · clavier : A W S E D F…</small>${typeof navigator!=='undefined'&&navigator.requestMIDIAccess?`<button type="button" class="midi-btn" data-midi aria-pressed="${midiCount>0}">${midiLabel()}</button>`:''}`:'';
 return `<div class="instrument" data-kind="${kind}" data-kinds="${esc(kinds.join(','))}" data-tile="${esc(tile)}" tabindex="-1">${tabs}${body}${hint}</div>`;
}
function instrumentCard(d,tile=''){
 const base=KINDS[d.kind]?d.kind:instrumentKind(d.name);
 const extra=String(d.also||'').trim()?String(d.also).split(',').map(x=>x.trim()).filter(Boolean).map(instrumentKind):['piano','bass','sax','voice'].filter(k=>k!==base&&instrumentKind(normalize(d.since+' '+d.note).match({piano:/piano|clavier/,bass:/bass/,sax:/sax/,voice:/chant|voix/}[k])?.[0]||'')===k);
 const pick=chosen.get(tile),kinds=[...new Set([base,...extra])],main=pick&&kinds.includes(pick)?pick:base;
 if(midiCount&&tile===(midiOwner||''))midiKind=main;
 return `<span class="eyebrow">Je joue</span><b class="t-title">${esc(d.name)}</b>${d.since?`<small class="muted">${esc(d.since)}</small>`:''}${d.note?`<p class="muted clamp2">${esc(d.note)}</p>`:''}${instrumentPanel(main,kinds,tile)}`;
}
function enhance(T,F){
 T.languages={label:'Langues',cat:'Work',hint:'Icônes, niveaux et précisions dépliables',size:'w',interactive:true,fields:[F('title','Titre'),F('items','Une ligne : langue | niveau | précision','area')],def:{title:'Langues',items:'Français | C2 | Bilingue · niveau déclaré\nEnglish | C2 | Bilingual · self-reported level'},render:d=>`<span class="eyebrow">${esc(d.title)}</span><div class="language-list">${String(d.items||'').split('\n').filter(Boolean).map(line=>{const [name,level,note]=line.split('|').map(x=>x.trim());const code=/fran|french/i.test(name)?'fr':/english|anglais/i.test(name)?'gb':/esp|spanish|español/i.test(name)?'es':'';return `<details><summary><span class="language-icon" aria-hidden="true">${code?`<img src="${esc(base+'flags/'+code+'.svg')}" alt="">`:uiIcon('globe',20)}</span><b>${esc(name)}</b><span class="language-level">${esc(level||'')}${languageSegments(level||'')}</span></summary><p>${esc(note||'')}</p></details>`}).join('')}</div>`};
 T.company={label:'Entreprise',cat:'Work',hint:'Logo, expérience et site officiel',size:'w',interactive:true,fields:[F('brand','Entreprise','select',Object.entries(brands).map(([key,b])=>[key,b.name])),F('title','Votre rôle'),F('desc','Votre contribution','area'),F('image','Logo personnalisé (facultatif)','image')],def:{brand:'action',title:'Mon expérience',desc:'',image:''},render:d=>{const b=brands[d.brand]||brands.action;const logo=image(d.image)?d.image:b.logo;return `<div class="company-head">${logoMarkup(b.name,logo)}</div><b class="t-title">${esc(d.title)}</b><p>${esc(d.desc)}</p><a class="company-link" href="${b.url}" target="_blank" rel="noopener noreferrer">${esc(b.name)} · site officiel ↗</a>`}};
 const oldExperience=T.experience;
 T.experience={...oldExperience,interactive:true,fields:[F('title','Titre'),F('items','Une ligne : Rôle | Organisation | Dates | Lieu (facultatif)','area'),F('logoFor','Organisation du logo (ex. Hugo Boss)'),F('logo','Logo de cette organisation (réutilisé partout)','image')],render:timeline};
 T.education={...T.education,interactive:true,fields:[F('title','Titre'),F('items','Une ligne : Diplôme | École | Dates | Lieu (facultatif)','area'),F('logoFor','Établissement du logo'),F('logo','Logo de cet établissement (réutilisé partout)','image')],render:timeline};
 T.skills={...T.skills,interactive:true,render:d=>`<span class="eyebrow">${esc(d.title)}</span><div class="cl skill-buttons">${String(d.items||'').split(',').map(x=>x.trim()).filter(Boolean).map(s=>`<button type="button" data-skill="${esc(s)}">${skillMark(s)}${esc(s)}</button>`).join('')}</div>`};
 T.image={...T.image,interactive:true,render:(d,t)=>image(d.image)?`<button type="button" class="photo-open" data-photo="${esc(t.id)}" data-index="0" aria-label="Agrandir : ${esc(d.caption||'Photo')}"><img src="${esc(d.image)}" alt="${esc(d.caption||'')}" loading="lazy" decoding="async"><span class="photo-zoom" aria-hidden="true">${uiIcon('zoom',20)}</span></button>${d.caption?`<div class="cap"><span>${esc(d.caption)}</span></div>`:''}`:`<div class="photo-open">${esc(d.caption||'Photo à ajouter')}</div>`};
 T.gallery={...T.gallery,interactive:true,render:(d,t)=>{const images=(d.images||[]).filter(image);return `<div class="gallery-buttons">${images.slice(0,3).map((src,i)=>`<button type="button" data-photo="${esc(t.id)}" data-index="${i}" aria-label="${esc(d.title||'Galerie')} · photo ${i+1}"><img src="${esc(src)}" alt="${esc(d.title||'')} · ${i+1}" loading="lazy" decoding="async"></button>`).join('')}</div><div class="cap">${esc(d.title)}${images.length?' · '+images.length+' photos':''}</div>`}};
 T.instrument={...T.instrument,interactive:true,
  fields:[F('name','Instrument'),F('kind','Type (son et interaction)','select',Object.entries(KINDS).map(([k,v])=>[k,v.label])),F('since','Depuis / détail'),F('also','Autres instruments joués (séparés par des virgules)'),F('note','Note','area')],
  def:{name:'Piano',kind:'piano',since:'Autodidacte',also:'',note:''},
  render:(d,t)=>instrumentCard(d,t?.id||'')};
 const oldStat=T.stat;
 T.stat={...oldStat,fields:[...oldStat.fields,F('logos','Sous le chiffre','select',[['','Rien'],['employers','Logos des entreprises du parcours']])],render:(d,t)=>oldStat.render(d,t)+(d.logos==='employers'?employerStrip():'')};
 const oldSocial=T.social;
 T.social={...oldSocial,render:d=>{let html=oldSocial.render(d);if(d.platform==='instagram')html=html.replace('>IG</span>','>'+uiIcon('instagram',24)+'</span>');if(brands[d.platform]?.logo)html=html.replace(esc((d.platform==='github'?'GH':'Spotify')),icon(d.platform));return html}};
 const oldMusic=T.music;
 T.music={...oldMusic,render:(d,t)=>{const html=oldMusic.render(d,t);const embed=html.match(/^<iframe[^>]+src="([^"]+)"/);if(!embed)return html;return `<b class="t-title">${esc(d.title)}</b><small class="muted">${esc(d.artist)}</small><button type="button" class="embed-activate" data-embed="${embed[1]}">${uiIcon('play',20)} Ouvrir le lecteur Spotify</button>`}};
 T.contact={...T.contact,render:d=>`<b class="t-title">${esc(d.title)}</b><div class="ct">${d.email?`<div class="ct-row"><a href="mailto:${esc(d.email)}">${uiIcon('mail',20)} ${esc(d.email)}</a><button type="button" data-copy="${esc(d.email)}" aria-label="Copier l’adresse email">Copier</button></div>`:''}${d.phone?`<div class="ct-row"><a href="tel:${esc(d.phone.replace(/[^+0-9]/g,''))}">${uiIcon('phone',20)} ${esc(d.phone)}</a><button type="button" data-copy="${esc(d.phone)}" aria-label="Copier le téléphone">Copier</button></div>`:''}</div>`};
}
let lookup,interactive,search,getProfile=()=>({}),context=null,lastVoice=0;
function publicUrl(){const configured=window.TILES_BOOT?.publicUrl;return url(configured)||url(new URL('../../',base).href)}
function vcard(profile={},link){
 const text=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r/g,'').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const rows=['BEGIN:VCARD','VERSION:3.0','FN:'+text(profile.name),'TITLE:'+text(profile.role)];
 if(/^[^\s@;:,]+@[^\s@;:,]+\.[^\s@;:,]+$/.test(profile.email||''))rows.push('EMAIL;TYPE=INTERNET:'+profile.email);
 const phone=String(profile.phone||'').replace(/[^+0-9]/g,'');if(phone)rows.push('TEL;TYPE=VOICE:'+phone);
 if(url(link))rows.push('URL:'+url(link));rows.push('END:VCARD');return rows.join('\r\n')+'\r\n';
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function openQR(){
 const link=publicUrl();if(!link)return;
 show('Partager mon profil',`<p>Scannez ce code pour ouvrir mon profil.</p><div class="qr-frame" id="profile-qr" role="img" aria-label="QR code de mon profil"></div><div class="qr-download"><button type="button" data-qr-download>Télécharger le QR</button><button type="button" data-share>Copier / partager le lien</button></div>`);
 const target=document.getElementById('profile-qr');target.textContent='Chargement du QR…';
 loadQR().then(()=>{if(!target.isConnected)return;target.textContent='';new window.QRCode(target,{text:link,width:256,height:256,colorDark:'#111111',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M})}).catch(()=>{target.textContent='QR indisponible. Utilisez le partage du lien.'});
}
// The QR library (20 KB) loads on the first "QR" click only; the shell passes its versioned URL.
let qrLoad=null;
function loadQR(){
 if(window.QRCode)return Promise.resolve();
 return qrLoad||(qrLoad=new Promise((resolve,reject)=>{if(!qrSrc)return reject(Error('QR unavailable'));const s=document.createElement('script');s.src=qrSrc;s.async=true;s.onload=()=>window.QRCode?resolve():reject(Error('QR unavailable'));s.onerror=()=>{qrLoad=null;s.remove();reject(Error('QR unavailable'))};document.head.appendChild(s)}));
}
function show(title,html,photo){
 let dialog=document.getElementById('explore-dialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='explore-dialog';dialog.className='explore-dialog';dialog.setAttribute('aria-labelledby','explore-title');document.body.appendChild(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-explore-close]'))dialog.close();if(e.target.closest('[data-photo-step]'))move(+e.target.closest('[data-photo-step]').dataset.photoStep)});dialog.addEventListener('keydown',e=>{if(context&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});dialog.addEventListener('close',()=>context=null)}
 const theme=document.getElementById('page');if(theme){const style=getComputedStyle(theme);for(const key of ['--surface','--surface-2','--fg','--muted','--line','--accent'])dialog.style.setProperty(key,style.getPropertyValue(key))}
 context=photo||null;dialog.innerHTML=`<div class="explore-head"><h2 id="explore-title">${esc(title)}</h2><button type="button" data-explore-close aria-label="Fermer" autofocus>×</button></div>${html}`;if(!dialog.open)dialog.showModal();dialog.querySelector('[data-explore-close]').focus();
}
function photo(id,index){
 const t=lookup(id);if(!t)return;const images=(t.type==='gallery'?t.data.images||[]:[t.data.image]).filter(image);if(!images.length)return;
 const n=(index+images.length)%images.length,link=url(t.data.url);
 show(t.data.caption||t.data.title||'Photo',`<img class="lightbox-image" src="${esc(images[n])}" alt="${esc(t.data.caption||t.data.title||'Photo')} ${n+1}"><div class="photo-controls">${images.length>1?'<button type="button" data-photo-step="-1" aria-label="Photo précédente">←</button>':''}<span role="status">${n+1} / ${images.length}</span>${images.length>1?'<button type="button" data-photo-step="1" aria-label="Photo suivante">→</button>':''}</div>${link?`<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">Voir la publication ↗</a>`:''}`,{id,index:n});
}
function move(step){if(context)photo(context.id,context.index+step)}
const voices=new Map();let midi=null,midiKind='piano',midiCount=0,midiOwner=null;const chosen=new Map();
function audio(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;if(!audio.ctx||audio.ctx.state==='closed')audio.ctx=new AC();audio.ctx.resume?.().catch(()=>{});return audio.ctx;}
/** Starts one synthesised note and returns its release function. Sustained kinds (sax, voix) hold until release. */
function start(kind,freq){
 if(!Number.isFinite(freq)||freq<25||freq>2100)return ()=>{};
 if(voices.size>=8){const [k,stop]=voices.entries().next().value;stop();voices.delete(k);}
 try{const ctx=audio();if(!ctx)return ()=>{};const t=ctx.currentTime,out=ctx.createGain(),osc=ctx.createOscillator();let tail=out;
  const k=KINDS[kind]?kind:'piano',sustain=k==='sax'||k==='voice';
  if(k==='piano'){osc.type='triangle';out.gain.setValueAtTime(.16,t);out.gain.exponentialRampToValueAtTime(.0001,t+1.4);}
  else if(k==='bass'){osc.type='sawtooth';const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(1200,t);f.frequency.exponentialRampToValueAtTime(220,t+.6);osc.connect(f);tail=f;out.gain.setValueAtTime(.22,t);out.gain.exponentialRampToValueAtTime(.0001,t+1.1);}
  else{osc.type='sawtooth';const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=5.2;depth.gain.value=freq*.006;lfo.connect(depth);depth.connect(osc.frequency);lfo.start(t);osc.onended=()=>lfo.stop();
   const f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter();f1.type='bandpass';f2.type='bandpass';f1.Q.value=f2.Q.value=k==='voice'?6:1.4;f1.frequency.value=k==='voice'?750:1300;f2.frequency.value=k==='voice'?1150:2600;
   const mix=ctx.createGain();osc.connect(f1);osc.connect(f2);f1.connect(mix);f2.connect(mix);tail=mix;out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(k==='voice'?.5:.28,t+.05);}
  if(tail!==out)tail.connect(out);else osc.connect(out);out.connect(ctx.destination);osc.frequency.setValueAtTime(freq,t);osc.start(t);
  if(!sustain){osc.stop(t+1.5);return ()=>{};}
  let done=false;const stop=()=>{if(done)return;done=true;const n=ctx.currentTime;out.gain.cancelScheduledValues(n);out.gain.setValueAtTime(Math.max(out.gain.value,.0001),n);out.gain.exponentialRampToValueAtTime(.0001,n+.18);osc.stop(n+.2);};
  setTimeout(stop,8000);return stop;
 }catch{return ()=>{};}
}
function press(id,kind,freq){release(id);voices.set(id,start(kind,freq));}
function release(id){const stop=voices.get(id);if(stop){stop();voices.delete(id);}}
function dispose(){for(const id of [...voices.keys()])release(id);if(audio.ctx&&audio.ctx.state!=='closed')audio.ctx.suspend().catch(()=>{});}
function unplug(){if(midi)for(const input of midi.inputs.values())input.onmidimessage=null;midi=null;midiCount=0;}
function midiLabel(){return midiCount?'Clavier MIDI connecté ('+midiCount+')':'Brancher un clavier MIDI';}
const KEYS='awsedftgyhujk';
function panelNotes(panel){return [...new Set([...panel.querySelectorAll('[data-note]')].map(b=>+b.dataset.note))].sort((a,b)=>a-b);}
async function connectMidi(panel,button){
 if(!navigator.requestMIDIAccess){button.textContent='MIDI non pris en charge par ce navigateur';return;}
 try{midi=midi||await navigator.requestMIDIAccess();const inputs=[...midi.inputs.values()];
  midiKind=panel.dataset.kind;midiOwner=panel.dataset.tile||null;midiCount=inputs.length;
  for(const input of inputs)input.onmidimessage=e=>{const [st,note,vel]=e.data,cmd=st&0xf0,kind=midiKind,id='midi'+note;if(cmd===0x90&&vel>0){if(document.hidden)return;press(id,kind,440*2**((note-69)/12));}else if(cmd===0x80||cmd===0x90)release(id);};
  button.textContent=inputs.length?midiLabel():'Aucun clavier MIDI détecté';button.setAttribute('aria-pressed',String(inputs.length>0));
 }catch{button.textContent='Accès MIDI refusé';}
}
function bind(getTile,isInteractive,applySearch,profile){
 lookup=getTile;interactive=isInteractive;search=applySearch;getProfile=profile||getProfile;
 document.addEventListener('error',e=>{if(e.target.matches?.('[data-company-logo]'))e.target.remove();},true);
 document.addEventListener('click',async e=>{
 if(!interactive())return;
 if(e.target.closest('[data-profile-qr]'))return openQR();
 if(e.target.closest('[data-contact-download]'))return download(new Blob([vcard(getProfile(),publicUrl())],{type:'text/vcard;charset=utf-8'}),'contact.vcf');
 if(e.target.closest('[data-qr-download]')){const source=document.querySelector('#profile-qr canvas');if(!source)return;const canvas=document.createElement('canvas');canvas.width=source.width+40;canvas.height=source.height+40;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,20,20);canvas.toBlob(blob=>{if(blob)download(blob,'profil-qr.png')},'image/png');return}
 const p=e.target.closest('[data-photo]');if(p){e.preventDefault();photo(p.dataset.photo,+p.dataset.index||0);return}
 const note=e.target.closest('[data-note]');if(note){if(e.detail===0){const kind=note.closest('.instrument')?.dataset.kind;press('k'+note.dataset.note,kind,+note.dataset.note);setTimeout(()=>release('k'+note.dataset.note),400);}return}
 const sw=e.target.closest('[data-instrument-switch]');if(sw){const card=sw.closest('.instrument'),kind=sw.dataset.instrumentSwitch,tile=card.dataset.tile||'';chosen.set(tile,kind);if(midiCount&&tile===(midiOwner||''))midiKind=kind;card.outerHTML=instrumentPanel(kind,card.dataset.kinds.split(','),tile);return}
 const mb=e.target.closest('[data-midi]');if(mb){connectMidi(mb.closest('.instrument'),mb);return}
 const embed=e.target.closest('[data-embed]');if(embed){const src=new URL(embed.dataset.embed);if(src.origin!=='https://open.spotify.com'||!src.pathname.startsWith('/embed/'))return;const frame=document.createElement('iframe');frame.className='embed';frame.title='Lecteur Spotify';frame.src=src.href;frame.allow='encrypted-media; fullscreen; picture-in-picture';embed.replaceWith(frame);return}
 const skill=e.target.closest('[data-skill]');if(skill){search(skill.dataset.skill,'projects');document.getElementById('explore-search')?.focus();return}
 const share=e.target.closest('[data-share]');if(share){const link=publicUrl();if(!link)return;try{if(navigator.share)await navigator.share({title:document.title,url:link});else{await navigator.clipboard.writeText(link);share.textContent='Lien copié ✓'}}catch(e){if(e.name!=='AbortError')share.textContent='Le partage est indisponible dans ce navigateur.'}return}
 });
 document.addEventListener('pointerdown',e=>{if(!interactive())return;const n=e.target.closest('[data-note]');if(!n)return;e.preventDefault();n.setPointerCapture?.(e.pointerId);n.classList.add('on');press('p'+e.pointerId,n.closest('.instrument')?.dataset.kind,+n.dataset.note);});
 const up=e=>{release('p'+e.pointerId);document.querySelectorAll('.instrument [data-note].on').forEach(b=>b.classList.remove('on'));};
 document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
 document.addEventListener('keydown',e=>{const panel=e.target.closest?.('.instrument');if(!panel||!interactive()||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;const i=KEYS.indexOf(e.key.toLowerCase());if(i<0)return;const f=panelNotes(panel)[i];if(f===undefined)return;e.preventDefault();press('key'+e.key,panel.dataset.kind,f);});
 document.addEventListener('keyup',e=>release('key'+e.key));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)dispose()});window.addEventListener('pagehide',()=>{dispose();unplug();});
}
window.TilesExperience={organisations,employerStrip,choose:(k,tile='')=>{if(k)chosen.set(tile,k);else chosen.delete(tile);},connectMidiOwner:(tile,kind)=>{midiOwner=tile;midiKind=kind;midiCount=1;},midiState:()=>({kind:midiKind,count:midiCount}),instrumentKind,instrumentCard,instrumentPanel,panelNotes,setLibrary,libraryLogo,skillMark,span,timeline,enhance,filter,bind,dispose,employerLinks,brands,vcard,publicUrl,uiIcon,languageSegments,projectKind};
})();
