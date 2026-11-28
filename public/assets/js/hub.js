(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Default universes; a page may replace them with its own list (setUniverses). Same rules as src/sections.php. */
const DEFAULTS=[{key:'humain',slug:'profil',label:'Profil',accent:'#9E5A3F',question:'Qui est vraiment la personne derrière le site et quelle est sa démarche ?'},{key:'pro',slug:'parcours',label:'Parcours',accent:'#0B3D91',question:'Quel est son cheminement, quelles sont ses compétences et qu’a-t-il concrètement accompli ?'},{key:'crea',slug:'creations',label:'Créations',accent:'#7946BC',question:'Qu’est-ce qu’il fabrique, conçoit ou produit concrètement ?'},{key:'lifestyle',slug:'passions',label:'Passions',accent:'#B51E27',question:'Qu’est-ce qui l’anime en dehors du cadre formel et nourrit sa curiosité ?'}];
const RESERVED=['admin','api','go','assets','uploads','media','widgets','seo','version','index','journal','robots','sitemap','llms','data','src','seed','config','public'];
const MAX_UNIVERSES=12,SLUG=/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/,KEY=/^[a-z][a-z0-9]{0,23}$/;
function validUniverses(list){
 if(!Array.isArray(list)||!list.length||list.length>MAX_UNIVERSES)return false;
 const keys=new Set(),slugs=new Set();
 for(const u of list){
  if(!u||typeof u!=='object'||!KEY.test(u.key||'')||keys.has(u.key))return false;
  if(typeof u.slug!=='string'||!SLUG.test(u.slug)||slugs.has(u.slug)||RESERVED.includes(u.slug)||u.slug.startsWith('journal-'))return false;
  if(typeof u.label!=='string'||!u.label.trim()||[...u.label].length>40)return false;
  if(u.question!==undefined&&(typeof u.question!=='string'||[...u.question].length>200))return false;
  if(u.accent!==undefined&&(typeof u.accent!=='string'||!/^(#[0-9A-Fa-f]{6})?$/.test(u.accent)))return false;
  keys.add(u.key);slugs.add(u.slug);
 }
 return true;
}
/* Live map key => {label,slug,accent,question}; replaced in place so references held elsewhere stay valid. */
const universes={};let bySlug={};
function setUniverses(list){
 const src=validUniverses(list)?list:DEFAULTS;
 for(const k of Object.keys(universes))delete universes[k];
 for(const u of src)universes[u.key]={label:u.label.trim(),slug:u.slug,accent:u.accent||'',question:u.question||''};
 bySlug=Object.fromEntries(Object.entries(universes).map(([k,v])=>[v.slug,k]));
 return Object.keys(universes);
}
setUniverses(DEFAULTS);
const keysOf=list=>(validUniverses(list)?list:DEFAULTS).map(u=>u.key);
function fromLocation(href){const u=new URL(href);const m=u.pathname.match(/\/([a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?)\/?$/);if(m&&bySlug[m[1]])return bySlug[m[1]];const k=u.searchParams.get('univers');return universes[k]?k:'all';}
function rootPath(pathname){return pathname.replace(/[^/]*$/,'')||'/';}
function sectionHref(pathname,key){return rootPath(pathname)+(universes[key]?universes[key].slug:'');}
const legacy={humain:['f4vi4kt','4mqulb4','sgl7x4k','x8yglf1','ylannek','uu48n57','hktzame'],pro:['h5wjvno','hvjxay8','kppny3l','8wfmcoj','o3c3tj4','dsu8mgy','1qjivdm','6p4sx89','edu2026a','lang2026a'],crea:['c7mleu5','dqbsdn1','u5p8z5b','xy6x628','gu7os67','0ry1y9r','n3q4pwv','o98bybn','01v9xrx','sezmm2a','kti0n15','go0rwep','tb3awaw','t45m79z','wlg7uyt','j8581xd','gc7otp1'],lifestyle:['wojpaqd','4j1ho8k','5h9duug']};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
/* Explicit field, then legacy id, then type; a guess outside the page's universes falls back to the first one. */
function universe(t){if(universes[t.universe])return t.universe;let g=null;for(const [k,ids] of Object.entries(legacy))if(ids.includes(t.id)){g=k;break;}g=g||(['faith','contact','map','social','atlas','clock'].includes(t.type)?'humain':['instrument','image','gallery','video','music','radio'].includes(t.type)?'crea':['team','sport','interest','media'].includes(t.type)?'lifestyle':'pro');return universes[g]?g:Object.keys(universes)[0];}
function grouped(tiles){const out=[],seen=new Set();for(const [k,v] of Object.entries(universes)){const part=filter(tiles,k);if(!part.some(t=>t.type!=='section'))continue;out.push({id:'u-'+v.slug,type:'universe',size:'full',data:{key:k,slug:v.slug,title:v.label,question:v.question,count:part.filter(t=>t.type!=='section').length}},...part.map(t=>{if(!seen.has(t.id)){seen.add(t.id);return t;}return {...t,id:t.id+'-'+v.slug};}));}return out;}
function filter(tiles,key){if(key==='all')return grouped(tiles);if(!universes[key])return tiles;let heading=null,shown=false;const out=[];for(const t of tiles){if(t.type==='section'){heading=t;shown=false;continue;}if(universe(t)!==key)continue;if(heading&&!shown){out.push(heading);shown=true;}out.push(t);}return out;}
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
function validJournal(journal,keys=Object.keys(universes)){return Array.isArray(journal)&&journal.length<=200&&new Set(journal.map(j=>j?.id)).size===journal.length&&journal.every(j=>j&&validId(j.id)&&keys.includes(j.universe)&&typeof j.title==='string'&&j.title.length<=200&&typeof j.content==='string'&&j.content.length<=100000&&typeof j.excerpt==='string'&&j.excerpt.length<=500&&typeof j.published==='boolean'&&/^\d{4}-\d{2}-\d{2}$/.test(j.date));}
/* Same contract as valid_page() in src/page-validation.php, including universe assignments. */
function validPage(p){if(!p||typeof p.profile!=='object'||!p.profile||Array.isArray(p.profile)||!Array.isArray(p.tiles)||p.tiles.length>500)return false;if(p.universes!==undefined&&!validUniverses(p.universes))return false;const keys=keysOf(p.universes);return new Set(p.tiles.map(t=>t?.id)).size===p.tiles.length&&p.tiles.every(t=>t&&validId(t.id)&&typeof t.type==='string'&&t.data&&typeof t.data==='object'&&(t.universe===undefined||keys.includes(t.universe)))&&(p.journal===undefined||validJournal(p.journal,keys));}
const inline=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
function markdown(text){const out=[];let list=false;for(const l of String(text||'').split('\n')){const s=l.trim();if(/^[-*] /.test(s)){if(!list){out.push('<ul>');list=true;}out.push('<li>'+inline(s.slice(2))+'</li>');continue;}if(list){out.push('</ul>');list=false;}const h=/^(#{1,3}) (.*)/.exec(s);if(h)out.push(`<h${h[1].length+1}>${inline(h[2])}</h${h[1].length+1}>`);else if(s.startsWith('> '))out.push('<blockquote>'+inline(s.slice(2))+'</blockquote>');else if(s)out.push('<p>'+inline(s)+'</p>');}if(list)out.push('</ul>');return out.join('');}
/** URL slug of a title; identical to journal_slug() in src/journal.php (tested for parity). */
function slug(title){return String(title||'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/ß/g,'ss').replace(/[’']/g,'-').normalize('NFD').replace(/\p{Mn}+/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80).replace(/-+$/,'');}
/** Published articles in page order with unique slugs; same rules as journal_published(). */
function withSlugs(journal){const used=new Set();return (Array.isArray(journal)?journal:[]).filter(j=>j&&j.published&&String(j.title||'').trim()&&String(j.content||'').trim()).map(j=>{let s=slug(j.title);if(!s||used.has(s))s=(s+'-'+String(j.id||'').replace(/[^A-Za-z0-9]/g,'').toLowerCase().slice(0,6)).replace(/^-+|-+$/g,'');for(let b=s,n=2;!s||used.has(s);n++)s=(b+'-'+n).replace(/^-+|-+$/g,'');used.add(s);return {...j,slug:s};});}
const minutes=text=>Math.max(1,Math.ceil(String(text||'').split(/\s+/).filter(Boolean).length/200));
function bind({getPage,getMode,save,openDrawer,dbody,render,toast,visible,getQuery,getDrawer=()=>null}){
 const ui=getDrawer;
 let active='all';const current=()=>{active=fromLocation(location.href);};current();
 const nav=document.createElement('nav');nav.className='hub-universes';nav.setAttribute('aria-label','Univers');let navSig='';
 /* Rebuilt only when the universes change (editor manager, import, undo). Labels are escaped: they are author data now. */
 const buildNav=()=>{const sig=JSON.stringify(universes);if(sig===navSig)return;navSig=sig;if(active!=='all'&&!universes[active])active='all';nav.innerHTML=`<a href="${esc(sectionHref(location.pathname,'all'))}" data-hub-universe="all">Tout voir</a>`+Object.entries(universes).map(([k,v])=>`<a href="${esc(sectionHref(location.pathname,k))}" data-hub-universe="${esc(k)}" title="${esc(v.question)}">${esc(v.label)}<small data-hub-count="${esc(k)}"></small></a>`).join('');};buildNav();
 document.querySelector('.explore-tools').before(nav);
 const journal=document.createElement('section');journal.className='hub-journal';journal.setAttribute('aria-label','Journal');document.getElementById('grid').after(journal);
 const button=document.createElement('button');button.className='btn';button.type='button';button.dataset.act='journal';button.innerHTML='<span class="i-doc"></span><span class="lbl">Journal</span>';document.querySelector('.acts').insertBefore(button,document.querySelector('[data-act="export"]'));
 const entries=()=>Array.isArray(getPage().journal)?getPage().journal:[];
 const published=()=>entries().filter(j=>j.published&&j.title&&j.content&&(active==='all'||j.universe===active)&&(!getQuery()||normalize(j.title+' '+j.content).includes(normalize(getQuery())))).sort((a,b)=>b.date.localeCompare(a.date));
 const date=s=>new Date(s+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
 function update(){buildNav();nav.hidden=getMode()!=='preview';const tiles=getPage().tiles.filter(t=>visible(t)&&t.type!=='section');for(const [k,v] of Object.entries(universes)){nav.querySelector(`[data-hub-count="${k}"]`).textContent=tiles.filter(t=>universe(t)===k).length;}for(const a of nav.querySelectorAll('a')){if(a.dataset.hubUniverse===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}nav.style.setProperty('--hub-accent',universes[active]?.accent||'var(--accent)');
  const articles=published();journal.hidden=getMode()!=='preview'||!articles.length;journal.innerHTML=journal.hidden?'':`<span class="eyebrow">Notes & réflexions</span><h2>Le journal${universes[active]?' · '+esc(universes[active].label):''}</h2><div class="hub-articles">${articles.map(j=>`<button type="button" data-journal-read="${esc(j.id)}"><small>${esc(universes[j.universe]?.label||'')} · ${esc(date(j.date))} · ${minutes(j.content)} min</small><h3>${esc(j.title)}</h3><p>${esc(j.excerpt||j.content.slice(0,150))}</p><span>Lire l’article ↗</span></button>`).join('')}</div>`;
 }
 nav.addEventListener('click',e=>{const a=e.target.closest('[data-hub-universe]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();active=a.dataset.hubUniverse;const u=new URL(location.href);u.searchParams.delete('univers');u.pathname=sectionHref(u.pathname,active);history.pushState({},'',u);render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
 window.addEventListener('popstate',()=>{current();render();const m=location.pathname.match(/\/journal-([a-z0-9-]+)$/),d=document.getElementById('journal-reader');if(m){const j=withSlugs(entries()).find(x=>x.slug===m[1]);if(j&&!(d&&d.open)){back=rootPath(location.pathname);stacked=true;reader(j.id);}}else if(d&&d.open){stacked=false;back=null;d.close();}});
 function manager(){openDrawer('Journal',`<p class="muted">Articles liés à tes univers. Les brouillons restent privés.</p><button type="button" class="btn pri" data-journal-new>Nouvel article</button><div class="journal-manager">${entries().map(j=>`<div><button type="button" class="btn ghost" data-journal-edit="${esc(j.id)}">${esc(j.title||'Sans titre')}<small>${j.published?'Publié':'Brouillon'}</small></button><button type="button" class="btn sm danger j-del" data-journal-delete="${esc(j.id)}" aria-label="Supprimer ${esc(j.title||'cet article')} (annulable)">Supprimer</button></div>`).join('')||'<p>Aucun article pour le moment.</p>'}</div>`,'journal');}
 function edit(id){const j=entries().find(j=>j.id===id);if(!j)return;openDrawer('Écrire un article',`<button type="button" class="btn sm" data-act="journal">← Journal</button><div class="journal-fields" data-journal-form="${esc(id)}"><label>Titre<input data-jfield="title" maxlength="200" value="${esc(j.title)}"></label><label>Univers<select data-jfield="universe">${Object.entries(universes).map(([k,v])=>`<option value="${esc(k)}"${j.universe===k?' selected':''}>${esc(v.label)}</option>`).join('')}</select></label><label>Date<input type="date" data-jfield="date" value="${esc(j.date)}"></label><label>Résumé<textarea maxlength="500" data-jfield="excerpt">${esc(j.excerpt)}</textarea></label><label>Article (Markdown)<textarea class="journal-text" maxlength="100000" data-jfield="content">${esc(j.content)}</textarea></label><label class="chk"><input type="checkbox" data-jfield="published"${j.published?' checked':''}>Publié dans le portfolio</label></div><button type="button" class="btn" data-journal-read="${esc(j.id)}">Aperçu de lecture</button><p class="hint">Sauvegarde automatique · temps de lecture calculé.</p>`,'journal-edit');}
 let back=null,stacked=false;
 /* ---------- Universes manager (Design drawer) ---------- */
 const own=()=>{const p=getPage();if(!validUniverses(p.universes))p.universes=DEFAULTS.map(u=>({...u}));return p.universes;};
 const newKey=list=>{let k;do{k='u'+Math.random().toString(36).slice(2,8).replace(/[^a-z0-9]/g,'a');}while(list.some(u=>u.key===k));return k;};
 const freeSlug=(base,list,self)=>{let b=slug(base).slice(0,40).replace(/-+$/,'')||'univers';if(RESERVED.includes(b)||b.startsWith('journal-'))b='u-'+b;b=b.slice(0,40).replace(/-+$/,'');let s=b;for(let n=2;list.some(u=>u!==self&&u.slug===s);n++)s=(b.slice(0,37)+'-'+n);return s;};
 const used=key=>getPage().tiles.filter(t=>t.universe===key).length+entries().filter(j=>j.universe===key).length;
 function universeManager(focusKey){
  const list=own();
  openDrawer('Univers',`<p class="muted">Les univers regroupent tes blocs et forment la navigation publique, dans cet ordre. Chaque univers a sa propre adresse.</p><div class="uni-list">${list.map((u,i)=>`<fieldset class="uni-row" data-uni="${esc(u.key)}"><legend>${esc(u.label)}</legend>
   <div class="fld"><label for="uni-label-${esc(u.key)}">Nom</label><input id="uni-label-${esc(u.key)}" data-ufield="label" maxlength="40" value="${esc(u.label)}"></div>
   <div class="fld"><label for="uni-slug-${esc(u.key)}">Adresse</label><input id="uni-slug-${esc(u.key)}" data-ufield="slug" maxlength="40" value="${esc(u.slug)}" spellcheck="false" autocomplete="off" aria-describedby="uni-msg-${esc(u.key)}"><small class="hint">/${esc(u.slug)} · changer l’adresse rend l’ancienne introuvable (404).</small></div>
   <div class="fld"><label for="uni-accent-${esc(u.key)}">Couleur</label><input id="uni-accent-${esc(u.key)}" type="color" data-ufield="accent" value="${esc(u.accent||'#0B7A75')}"></div>
   <div class="fld"><label for="uni-question-${esc(u.key)}">Question guide (facultative)</label><textarea id="uni-question-${esc(u.key)}" data-ufield="question" maxlength="200">${esc(u.question||'')}</textarea></div>
   <p class="uni-msg" id="uni-msg-${esc(u.key)}" role="status"></p>
   <div class="row"><button type="button" class="btn sm" data-umove="-1" ${i===0?'disabled':''} aria-label="Monter ${esc(u.label)}">↑</button><button type="button" class="btn sm" data-umove="1" ${i===list.length-1?'disabled':''} aria-label="Descendre ${esc(u.label)}">↓</button><small class="muted">${used(u.key)} bloc(s) ou article(s) assigné(s)</small><button type="button" class="btn sm ghost" data-udelete ${list.length<2?'disabled':''} aria-label="Supprimer ${esc(u.label)}">Supprimer</button></div></fieldset>`).join('')}</div>
   <button type="button" class="btn pri" data-uadd ${list.length>=MAX_UNIVERSES?'disabled':''}>Ajouter un univers</button><small class="hint">${list.length} sur ${MAX_UNIVERSES} au plus.</small>`,'universes');
  if(focusKey)dbody.querySelector(`[data-uni="${CSS.escape(focusKey)}"] input`)?.focus();
 }
 /* Apply one field change only when the whole list stays valid; otherwise say why and keep the saved value. */
 function setField(row,field,value){
  const list=own(),u=list.find(x=>x.key===row.dataset.uni),msg=row.querySelector('.uni-msg');if(!u)return;
  const next=list.map(x=>x===u?{...x,[field]:field==='slug'?value.trim().toLowerCase():value}:x);
  if(!validUniverses(next)){const v=next.find(x=>x.key===u.key);msg.textContent=field==='label'?'Le nom doit contenir 1 à 40 caractères.':field==='slug'?(RESERVED.includes(v.slug)||v.slug.startsWith('journal-')?'Cette adresse est réservée par le site.':next.some(x=>x!==v&&x.slug===v.slug)?'Un autre univers utilise déjà cette adresse.':'Adresse : lettres minuscules, chiffres et tirets, 40 caractères au plus.'):'Valeur refusée.';return;}
  msg.textContent='';Object.assign(u,next.find(x=>x.key===u.key));
  if(field==='label')row.querySelector('legend').textContent=u.label;
  setUniverses(list);save();render();
 }
 dbody.addEventListener('input',e=>{const row=e.target.closest('[data-uni]'),f=e.target.dataset.ufield;if(row&&f)setField(row,f,e.target.value);});
 dbody.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||ui()!=='universes')return;
  const list=own(),row=b.closest('[data-uni]'),i=row?list.findIndex(u=>u.key===row.dataset.uni):-1;
  if(b.hasAttribute('data-uadd')&&list.length<MAX_UNIVERSES){const key=newKey(list);list.push({key,slug:freeSlug('nouvel-univers',list),label:'Nouvel univers',accent:'',question:''});setUniverses(list);save();render();universeManager(key);toast('Univers ajouté');return;}
  if(b.dataset.umove&&i>=0){const j=i+(+b.dataset.umove);if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];setUniverses(list);save();render();universeManager(list[j].key);dbody.querySelector(`[data-uni="${CSS.escape(list[j].key)}"] [data-umove="${b.dataset.umove}"]`)?.focus();return;}
  if(b.hasAttribute('data-udelete')&&i>=0&&list.length>1){
   /* Blocks and articles explicitly in the removed universe move to the first remaining one; undo restores everything. */
   const [gone]=list.splice(i,1),to=list[0].key,moved=[];
   for(const t of getPage().tiles)if(t.universe===gone.key){t.universe=to;moved.push(t);}
   for(const j of entries())if(j.universe===gone.key){j.universe=to;moved.push(j);}
   setUniverses(list);save();render();universeManager();
   toast(`« ${gone.label} » supprimé${moved.length?` · ${moved.length} élément(s) déplacé(s) vers « ${list[0].label} »`:''}`,()=>{list.splice(i,0,gone);for(const x of moved)x.universe=gone.key;setUniverses(list);save();render();universeManager(gone.key);});
  }
 });
 function reader(id){const j=entries().find(j=>j.id===id);if(!j)return;const sl=withSlugs(entries()).find(x=>x.id===id)?.slug;if(sl&&getMode()==='preview'){const u=new URL(location.href);const target=rootPath(u.pathname)+'journal-'+sl;if(u.pathname!==target){back=back||u.pathname+u.search;history.pushState({journal:id},'',target);stacked=true;}document.title=j.title;}let d=document.getElementById('journal-reader');if(!d){d=document.createElement('dialog');d.id='journal-reader';d.className='explore-dialog';d.setAttribute('aria-labelledby','journal-reader-title');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-journal-close]'))d.close();});d.addEventListener('close',()=>{if(/\/journal-[a-z0-9-]+$/.test(location.pathname)){if(stacked)history.back();else if(back!==null)history.replaceState({},'',back);}back=null;stacked=false;});}const style=getComputedStyle(document.getElementById('page'));for(const k of ['--surface','--surface-2','--fg','--muted','--line','--accent'])d.style.setProperty(k,style.getPropertyValue(k));d.innerHTML=`<div class="explore-head"><h2 id="journal-reader-title">${esc(j.title||'Sans titre')}</h2><button type="button" data-journal-close aria-label="Fermer">×</button></div><p class="muted">${esc(universes[j.universe]?.label||'')} · ${minutes(j.content)} min</p><div class="journal-body">${markdown(j.content)}</div>`;d.showModal();}
 dbody.addEventListener('input',e=>{const f=e.target.closest('[data-journal-form]'),k=e.target.dataset.jfield;if(!f||!k)return;const j=entries().find(j=>j.id===f.dataset.journalForm);if(j){j[k]=e.target.type==='checkbox'?e.target.checked:e.target.value;save();update();}});
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-journal-new')){const j={id:crypto.randomUUID(),title:'',content:'',excerpt:'',date:new Date().toISOString().slice(0,10),universe:Object.keys(universes)[0],published:false};getPage().journal=entries();getPage().journal.push(j);save();edit(j.id);}if(b.dataset.journalEdit)edit(b.dataset.journalEdit);if(b.dataset.journalRead)reader(b.dataset.journalRead);if(b.dataset.journalDelete){const i=entries().findIndex(j=>j.id===b.dataset.journalDelete);if(i>=0){const [j]=getPage().journal.splice(i,1);save();manager();toast('Article supprimé',()=>{getPage().journal.splice(i,0,j);save();manager();});}}if(b.hasAttribute('data-download-page')){const p={...getPage()};delete p.stats;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));a.download='tiles-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}});
 const boot=window.TILES_BOOT?.article;if(boot&&getMode()==='preview')setTimeout(()=>{back=rootPath(location.pathname);reader(boot);},0);
 return {filter:tiles=>filter(tiles,active),update,manager,universeManager,universe,articleCount:()=>published().length,reset(){active='all';const u=new URL(location.href);u.searchParams.delete('univers');u.pathname=rootPath(u.pathname);history.replaceState({},'',u);}};
}
window.TilesHub={slug,withSlugs,fromLocation,rootPath,sectionHref,grouped,universes,setUniverses,validUniverses,DEFAULTS,RESERVED,MAX_UNIVERSES,universe,filter,validJournal,validPage,markdown,minutes,bind};
})();
