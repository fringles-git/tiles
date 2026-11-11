(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=new URL('../images/',document.currentScript?.src||location.href).href;
const image=s=>typeof s==='string'&&(/^uploads\/[A-Za-z0-9_-]+\.(png|jpe?g|webp|gif)$/.test(s)||/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s));
const url=u=>{try{const x=new URL(u);return ['https:','http:'].includes(x.protocol)&&!x.username?x.href:''}catch{return ''}};
const brands={
 action:{name:'Action',url:'https://www.action.com/fr-fr/',logo:base+'brands/action.svg'},
 basicfit:{name:'Basic-Fit',url:'https://www.basic-fit.com/fr-fr/',logo:'https://www.basic-fit.com/on/demandware.static/Sites-BFE-Site/-/default/dwfd1a63b5/img/svg/logo-bf-orange.svg'},
 hugoboss:{name:'Hugo Boss',url:'https://www.hugoboss.com/fr/fr/'},
 edf:{name:'EDF',url:'https://www.edf.fr/'},
 github:{name:'GitHub',url:'https://github.com/',logo:base+'brands/github.svg'},
 spotify:{name:'Spotify',url:'https://open.spotify.com/',logo:base+'brands/spotify.svg'}
};
const tech={html:'html5',html5:'html5',css:'css',javascript:'javascript',react:'react',php:'php',python:'python',bootstrap:'bootstrap',flutter:'flutter',github:'github'};
const icon=(name,cls='')=>`<img class="brand-icon ${cls}" src="${esc(base+'brands/'+name+'.svg')}" alt="" loading="lazy" decoding="async">`;
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function employerLinks(text){
 return Object.entries(brands).filter(([key])=>new RegExp('\\b'+({basicfit:'basic[ -]?fit',hugoboss:'hugo[ -]?boss'}[key]||key)+'\\b').test(normalize(text))).map(([,b])=>`<a class="employer" href="${b.url}" target="_blank" rel="noopener noreferrer" aria-label="${esc(b.name)} · site officiel">${b.logo?`<img src="${esc(b.logo)}" alt="" loading="lazy" decoding="async">`:`<span aria-hidden="true">${esc(b.name.split(/[ -]/).map(x=>x[0]).join('').slice(0,2))}</span>`}<span>${esc(b.name)}</span><span aria-hidden="true">↗</span></a>`).join('');
}
function filter(tiles,query='',category='all'){
 const groups={projects:['project'],photos:['image','gallery','video'],career:['experience','education','skills','languages','company','cv'],personal:['sport','team','radio','music','instrument','faith','interest','now','atlas','map']};
 const q=normalize(query),output=[];let heading=null,shown=false;
 for(const t of tiles){
  if(t.type==='section'){heading=t;shown=false;continue}
  const text=normalize(JSON.stringify(t.data||{})+' '+(/paris saint.germain/i.test(t.data.club||t.data.title||'')?'PSG ':'')+(/formule 1|formula 1/i.test(t.data.title||'')?'F1 ':''));
  if(q&&!text.includes(q))continue;
  if(category!=='all'&&!(groups[category]||[]).includes(t.type))continue;
  if(heading&&!shown){output.push(heading);shown=true}output.push(t);
 }
 return output;
}
function enhance(T,F){
 T.languages={label:'Langues',cat:'Work',hint:'Icônes, niveaux et précisions dépliables',size:'w',interactive:true,fields:[F('title','Titre'),F('items','Une ligne : langue | niveau | précision','area')],def:{title:'Langues',items:'Français | C2 | Bilingue · niveau déclaré\nEnglish | C2 | Bilingual · self-reported level'},render:d=>`<span class="eyebrow">${esc(d.title)}</span><div class="language-list">${String(d.items||'').split('\n').filter(Boolean).map(line=>{const [name,level,note]=line.split('|').map(x=>x.trim());const code=/fran|french/i.test(name)?'fr':/english|anglais/i.test(name)?'gb':/esp|spanish|español/i.test(name)?'es':'';return `<details><summary><span class="language-icon" aria-hidden="true">${code?`<img src="${esc(base+'flags/'+code+'.svg')}" alt="">`:'🌐'}</span><b>${esc(name)}</b><span class="language-level">${esc(level||'')}</span></summary><p>${esc(note||'')}</p></details>`}).join('')}</div>`};
 T.company={label:'Entreprise',cat:'Work',hint:'Logo, expérience et site officiel',size:'w',interactive:true,fields:[F('brand','Entreprise','select',Object.entries(brands).map(([key,b])=>[key,b.name])),F('title','Votre rôle'),F('desc','Votre contribution','area'),F('image','Logo personnalisé (facultatif)','image')],def:{brand:'action',title:'Mon expérience',desc:'',image:''},render:d=>{const b=brands[d.brand]||brands.action;const logo=image(d.image)?d.image:b.logo;return `<div class="company-head">${logo?`<img src="${esc(logo)}" alt="${esc(b.name)}" loading="lazy" decoding="async">`:`<b>${esc(b.name)}</b>`}</div><b class="t-title">${esc(d.title)}</b><p>${esc(d.desc)}</p><a class="company-link" href="${b.url}" target="_blank" rel="noopener noreferrer">${esc(b.name)} · site officiel ↗</a>`}};
 const oldExperience=T.experience;
 T.experience={...oldExperience,interactive:true,render:d=>`<span class="eyebrow">${esc(d.title)}</span><ul class="tl">${String(d.items||'').split('\n').filter(Boolean).map(line=>{const [role,org,years]=line.split('|').map(x=>(x||'').trim());return `<li><div><b>${esc(role)}</b><small>${esc(org)}</small><div class="yrs">${esc(years)}</div><div class="employers">${employerLinks(org)}</div></div></li>`}).join('')}</ul>`};
 T.skills={...T.skills,interactive:true,render:d=>`<span class="eyebrow">${esc(d.title)}</span><div class="cl skill-buttons">${String(d.items||'').split(',').map(x=>x.trim()).filter(Boolean).map(s=>`<button type="button" data-skill="${esc(s)}">${tech[normalize(s)]?icon(tech[normalize(s)]):'<span aria-hidden="true">✦</span>'}${esc(s)}</button>`).join('')}</div>`};
 T.image={...T.image,interactive:true,render:(d,t)=>image(d.image)?`<button type="button" class="photo-open" data-photo="${esc(t.id)}" data-index="0" aria-label="Agrandir : ${esc(d.caption||'Photo')}"><img src="${esc(d.image)}" alt="${esc(d.caption||'')}" loading="lazy" decoding="async"><span class="photo-zoom" aria-hidden="true">⤢</span></button>${d.caption?`<div class="cap"><span>${esc(d.caption)}</span></div>`:''}`:`<div class="photo-open">${esc(d.caption||'Photo à ajouter')}</div>`};
 T.gallery={...T.gallery,interactive:true,render:(d,t)=>{const images=(d.images||[]).filter(image);return `<div class="gallery-buttons">${images.slice(0,3).map((src,i)=>`<button type="button" data-photo="${esc(t.id)}" data-index="${i}" aria-label="${esc(d.title||'Galerie')} · photo ${i+1}"><img src="${esc(src)}" alt="${esc(d.title||'')} · ${i+1}" loading="lazy" decoding="async"></button>`).join('')}</div><div class="cap">${esc(d.title)}${images.length?' · '+images.length+' photos':''}</div>`}};
 const oldInstrument=T.instrument;
 T.instrument={...oldInstrument,interactive:true,render:(d,t)=>{
  if(!/piano|clavier|keys|keyboard/i.test(d.name||''))return oldInstrument.render(d,t);
  const whites=[['Do',261.63],['Ré',293.66],['Mi',329.63],['Fa',349.23],['Sol',392],['La',440],['Si',493.88],['Do aigu',523.25]];
  const blacks=[['Do dièse',277.18,12.5],['Ré dièse',311.13,25],['Fa dièse',369.99,50],['Sol dièse',415.3,62.5],['La dièse',466.16,75]];
  return `<span class="eyebrow">Je joue</span><b class="t-title">${esc(d.name)}</b><small class="muted">${esc(d.since)}</small>${d.note?`<p class="muted clamp2">${esc(d.note)}</p>`:''}<div class="piano-keys" role="group" aria-label="Clavier de piano">${whites.map(([name,f])=>`<button type="button" class="key white" data-note="${f}" aria-label="Jouer ${name}"></button>`).join('')}${blacks.map(([name,f,left])=>`<button type="button" class="key black" data-note="${f}" style="left:${left}%" aria-label="Jouer ${name}"></button>`).join('')}</div><small class="piano-hint">Touchez les touches pour jouer</small>`;
 }};
 const oldSocial=T.social;
 T.social={...oldSocial,render:d=>{let html=oldSocial.render(d);if(brands[d.platform]?.logo)html=html.replace(esc((d.platform==='github'?'GH':'Spotify')),icon(d.platform));return html}};
 const oldMusic=T.music;
 T.music={...oldMusic,render:(d,t)=>{const html=oldMusic.render(d,t);const embed=html.match(/^<iframe[^>]+src="([^"]+)"/);if(!embed)return html;return `<b class="t-title">${esc(d.title)}</b><small class="muted">${esc(d.artist)}</small><button type="button" class="embed-activate" data-embed="${embed[1]}">▶ Ouvrir le lecteur Spotify</button>`}};
 T.contact={...T.contact,render:d=>`<b class="t-title">${esc(d.title)}</b><div class="ct">${d.email?`<div class="ct-row"><a href="mailto:${esc(d.email)}">✉ ${esc(d.email)}</a><button type="button" data-copy="${esc(d.email)}" aria-label="Copier l’adresse email">Copier</button></div>`:''}${d.phone?`<div class="ct-row"><a href="tel:${esc(d.phone.replace(/[^+0-9]/g,''))}">☎ ${esc(d.phone)}</a><button type="button" data-copy="${esc(d.phone)}" aria-label="Copier le téléphone">Copier</button></div>`:''}</div>`};
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
 const target=document.getElementById('profile-qr');
 try{if(!window.QRCode)throw Error('QR unavailable');new window.QRCode(target,{text:link,width:256,height:256,colorDark:'#111111',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M})}catch{target.textContent='QR indisponible. Utilisez le partage du lien.'}
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
function sound(freq){
 if(!Number.isFinite(freq)||freq<100||freq>1200||Date.now()-lastVoice<70)return;lastVoice=Date.now();
 try{const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
 if(!sound.ctx||sound.ctx.state==='closed')sound.ctx=new AudioContext();const ctx=sound.ctx;ctx.resume().catch(()=>{});
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='triangle';oscillator.frequency.value=freq;gain.gain.setValueAtTime(.12,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.65);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.65);
 }catch{}
}
function dispose(){if(sound.ctx&&sound.ctx.state!=='closed')sound.ctx.suspend().catch(()=>{})}
function bind(getTile,isInteractive,applySearch,profile){
 lookup=getTile;interactive=isInteractive;search=applySearch;getProfile=profile||getProfile;
 document.addEventListener('click',async e=>{
 if(!interactive())return;
 if(e.target.closest('[data-profile-qr]'))return openQR();
 if(e.target.closest('[data-contact-download]'))return download(new Blob([vcard(getProfile(),publicUrl())],{type:'text/vcard;charset=utf-8'}),'contact.vcf');
 if(e.target.closest('[data-qr-download]')){const source=document.querySelector('#profile-qr canvas');if(!source)return;const canvas=document.createElement('canvas');canvas.width=source.width+40;canvas.height=source.height+40;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,20,20);canvas.toBlob(blob=>{if(blob)download(blob,'profil-qr.png')},'image/png');return}
 const p=e.target.closest('[data-photo]');if(p){e.preventDefault();photo(p.dataset.photo,+p.dataset.index||0);return}
 const note=e.target.closest('[data-note]');if(note){sound(+note.dataset.note);return}
 const embed=e.target.closest('[data-embed]');if(embed){const src=new URL(embed.dataset.embed);if(src.origin!=='https://open.spotify.com'||!src.pathname.startsWith('/embed/'))return;const frame=document.createElement('iframe');frame.className='embed';frame.title='Lecteur Spotify';frame.src=src.href;frame.allow='encrypted-media; fullscreen; picture-in-picture';embed.replaceWith(frame);return}
 const skill=e.target.closest('[data-skill]');if(skill){search(skill.dataset.skill,'projects');document.getElementById('explore-search')?.focus();return}
 const share=e.target.closest('[data-share]');if(share){const link=publicUrl();if(!link)return;try{if(navigator.share)await navigator.share({title:document.title,url:link});else{await navigator.clipboard.writeText(link);share.textContent='Lien copié ✓'}}catch(e){if(e.name!=='AbortError')share.textContent='Le partage est indisponible dans ce navigateur.'}return}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)dispose()});window.addEventListener('pagehide',dispose);
}
window.TilesExperience={enhance,filter,bind,dispose,employerLinks,brands,vcard,publicUrl};
})();
