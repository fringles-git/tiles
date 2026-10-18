(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const ytId=u=>{const m=String(u||'').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);return m?m[1]:''};
const spotEmbed=u=>{const m=String(u||'').match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/);return m?`https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`:''};
const isDoc=u=>typeof u==='string'&&/^uploads\/[A-Za-z0-9_-]+\.pdf$/.test(u);
const safeHref=u=>isDoc(u)?u:safeUrl(u);
const domain=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u||''}};
const safeUrl=u=>/^https?:\/\//i.test(u||'')?u:'';
const col=c=>/^#[0-9a-f]{3,8}$/i.test(c||'')?c:'';
const isImg=s=>typeof s==='string'&&(/^uploads\/[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$/.test(s)||/^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(s));
const hash=s=>{let h=0;for(const c of String(s||'x'))h=(h*31+c.charCodeAt(0))>>>0;return h};
const grad=seed=>{const h=hash(seed)%360;return `linear-gradient(140deg,hsl(${h} 52% 66%),hsl(${(h+48)%360} 58% 40%))`};
const bg=(img,seed)=>isImg(img)?`background-image:url('${img}')`:`background-image:${grad(seed)}`;

/* icons */
const P={plus:'M12 5v14M5 12h14',x:'M6 6l12 12M18 6L6 18',edit:'M4 20h4L19 9l-4-4L4 16v4z',trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',copy:'M9 9h11v11H9zM5 15H4V4h11v1',left:'M15 6l-6 6 6 6',right:'M9 6l6 6-6 6',ext:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',pin:'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',play:'M8 5l11 7-11 7z',cal:'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',upload:'M12 16V4M7 9l5-5 5 5M4 20h16',check:'M5 12l5 5 9-10',chart:'M4 20V10M10 20V4M16 20v-7M22 20H2',pal:'M12 3a9 9 0 100 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.4-1-2.5s.9-1.5 2-1.5H17a4 4 0 004-4c0-4.7-4-8.5-9-8.5zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01',code:'M8 7l-5 5 5 5M16 7l5 5-5 5',doc:'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4',heart:'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',clock:'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',phone:'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',mail:'M4 6h16v12H4zM4 7l8 6 8-6'};
const ic=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
function paintIcons(root=document){$$('[class^="i-"],[class*=" i-"]',root).forEach(el=>{const m=el.className.match(/i-(\w+)/);if(m&&!el.firstChild)el.innerHTML=ic(m[1],16)})}

/* platforms */
const PLAT={instagram:['Instagram','#E1306C','IG','https://instagram.com/'],tiktok:['TikTok','#111318','TT','https://tiktok.com/@'],youtube:['YouTube','#FF0033','YT','https://youtube.com/@'],x:['X','#111318','X','https://x.com/'],linkedin:['LinkedIn','#0A66C2','in','https://linkedin.com/in/'],github:['GitHub','#24292F','GH','https://github.com/'],behance:['Behance','#1769FF','Bē','https://behance.net/'],dribbble:['Dribbble','#EA4C89','Dr','https://dribbble.com/'],twitch:['Twitch','#9146FF','Tw','https://twitch.tv/'],whatsapp:['WhatsApp','#25D366','WA','https://wa.me/'],threads:['Threads','#111318','@','https://threads.net/@'],facebook:['Facebook','#1877F2','f','https://facebook.com/'],vimeo:['Vimeo','#1AB7EA','Vi','https://vimeo.com/'],soundcloud:['SoundCloud','#FF5500','SC','https://soundcloud.com/'],pinterest:['Pinterest','#E60023','Pi','https://pinterest.com/'],discord:['Discord','#5865F2','Dc','https://discord.gg/'],snapchat:['Snapchat','#E8C800','Sn','https://snapchat.com/add/']};
const MUSIC={spotify:['Spotify','#1DB954'],apple:['Apple Music','#FA2D48'],deezer:['Deezer','#A238FF'],soundcloud:['SoundCloud','#FF5500'],youtube:['YouTube Music','#FF0033']};

/* fields */
const F=(k,l,t='text',o)=>({k,l,t,o});
const lines=s=>String(s||'').split('\n').map(x=>x.trim()).filter(Boolean);
const list=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
const fmtDate=(s,o)=>{const d=new Date(s+'T12:00:00');return isNaN(d)?'':d.toLocaleDateString('fr-FR',o)};
const daysTo=s=>{const d=new Date(s+'T00:00:00');if(isNaN(d))return null;const n=new Date();n.setHours(0,0,0,0);return Math.round((d-n)/864e5)};
const plusDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

/* ---------- Block registry ---------- */
const T={
 link:{label:'Link',cat:'Essentials',hint:'Any website or page',size:'w',
  fields:[F('title','Title'),F('url','URL','url'),F('desc','Short description'),F('color','Icon colour','color')],
  def:{title:'My website',url:'https://example.com',desc:'',color:''},
  href:d=>d.url,
  render:d=>`<div class="lk"><span class="glyph" style="${col(d.color)?`--c:${col(d.color)}`:''}">${esc(((d.title||'?').trim()[0]||'?').toUpperCase())}</span><div class="bottom grow"><b class="t-title clamp2">${esc(d.title)}</b>${domain(d.url).toLowerCase()!==(d.title||'').trim().toLowerCase()?`<small class="muted">${esc(domain(d.url))}</small>`:''}${d.desc?`<p class="clamp2">${esc(d.desc)}</p>`:''}</div><span class="go">${ic('ext',16)}</span></div>`},
 social:{label:'Social profile',cat:'Essentials',hint:'17 networks with brand colours',size:'s',
  fields:[F('platform','Network','select',Object.entries(PLAT).map(([k,v])=>[k,v[0]])),F('handle','Username'),F('url','Custom URL (optional)','url'),F('cta','Button label')],
  def:{platform:'instagram',handle:'yourname',url:'',cta:'Suivre'},
  tint:d=>(PLAT[d.platform]||PLAT.instagram)[1],
  href:d=>safeUrl(d.url)||((PLAT[d.platform]||PLAT.instagram)[3]+encodeURIComponent(d.handle||'')),
  render:d=>{const p=PLAT[d.platform]||PLAT.instagram;return `<div class="soc"><span class="glyph" style="--c:${p[1]}">${esc(p[2])}</span><div class="bottom grow"><b class="t-title">${esc(p[0])}</b><small class="muted">@${esc(d.handle)}</small></div>${d.cta?`<span class="pill" style="align-self:flex-start">${esc(d.cta)}</span>`:''}</div>`}},
 section:{label:'Section title',cat:'Essentials',hint:'Full-width heading',size:'full',sizes:['full'],bare:true,
  fields:[F('title','Heading')],def:{title:'New section'},
  render:d=>`<h2 class="sec">${esc(d.title)}</h2>`},
 text:{label:'Text note',cat:'Essentials',hint:'Paragraph or big statement',size:'w',
  fields:[F('text','Text','area'),F('style','Style','select',[['note','Paragraph'],['quote','Statement']])],
  def:{text:'Write something here.',style:'note'},
  render:d=>`<div class="tx ${d.style==='quote'?'quote':''}">${esc(d.text).replace(/\n/g,'<br>')}</div>`},
 image:{label:'Photo',cat:'Essentials',hint:'Single image, optional link',size:'s',bleed:true,
  fields:[F('image','Image','image'),F('caption','Caption'),F('url','Link (optional)','url')],
  def:{image:'',caption:'',url:''},href:d=>d.url,
  render:d=>`<div class="img ph" style="${bg(d.image,d.caption||'photo')}"></div>${d.caption?`<div class="cap"><span>${esc(d.caption)}</span></div>`:''}`},
 contact:{label:'Contact',cat:'Essentials',hint:'Email and phone with copy',size:'w',interactive:true,
  fields:[F('title','Title'),F('email','Email','email'),F('phone','Phone')],
  def:{title:'Get in touch',email:'hello@example.com',phone:''},
  render:d=>`<b class="t-title">${esc(d.title)}</b><div class="ct">${d.email?`<div class="ct-row"><span>${esc(d.email)}</span><button type="button" data-copy="${esc(d.email)}">Copier</button></div>`:''}${d.phone?`<div class="ct-row"><span>${esc(d.phone)}</span><button type="button" data-copy="${esc(d.phone)}">Copier</button></div>`:''}</div>`},
 map:{label:'Location',cat:'Essentials',hint:'Where you are based',size:'s',bleed:true,
  fields:[F('place','Place'),F('note','Note'),F('url','Map link','url')],
  def:{place:'Troyes',note:'France',url:''},
  href:d=>d.url||('https://www.openstreetmap.org/search?query='+encodeURIComponent(d.place||'')),
  render:d=>`<div class="map"><div class="river"></div></div><div class="pin"><span>${ic('pin',18)}</span></div><div class="map-lbl"><div><b>${esc(d.place)}</b><small>${esc(d.note)}</small></div></div>`},

 project:{label:'Project',cat:'Work',hint:'Case study with cover and tags',size:'l',bleed:true,
  fields:[F('title','Title'),F('role','Your role'),F('year','Year'),F('desc','Summary','area'),F('tags','Tags (comma separated)'),F('image','Cover image','image'),F('url','Link','url')],
  def:{title:'Project name',role:'Design & development',year:'2026',desc:'What it is and what you did.',tags:'Web, Design',image:'',url:''},
  href:d=>d.url,
  render:d=>`<div class="pj"><div class="pj-img ph" style="${bg(d.image,d.title)}"></div><div class="pj-t"><span class="eyebrow">${esc(d.role)}${d.year?' · '+esc(d.year):''}</span><b class="t-title">${esc(d.title)}</b><p class="clamp2">${esc(d.desc)}</p><div class="tags">${list(d.tags).slice(0,4).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></div>`},
 experience:{label:'Experience',cat:'Work',hint:'Roles as a timeline',size:'t',
  fields:[F('title','Title'),F('items','One per line: Role | Organisation | Years','area')],
  def:{title:'Experience',items:'Role | Organisation | 2024 – now'},
  render:d=>`<span class="eyebrow">${esc(d.title)}</span><ul class="tl">${lines(d.items).map(l=>{const [a,b,c]=l.split('|').map(x=>(x||'').trim());return `<li><div><b>${esc(a)}</b><small>${esc(b)}</small><div class="yrs">${esc(c)}</div></div></li>`}).join('')}</ul>`},
 education:{label:'Education',cat:'Work',hint:'Schools, degrees, certificates',size:'t',
  fields:[F('title','Title'),F('items','One per line: Degree | School | Years','area')],
  def:{title:'Education',items:'Degree or certificate | School | 2022 – 2025'},
  render:d=>T.experience.render(d)},
 skills:{label:'Skills',cat:'Work',hint:'Tools and abilities as chips',size:'w',
  fields:[F('title','Title'),F('items','Skills (comma separated)','area')],
  def:{title:'Skills',items:'Design, Development'},
  render:d=>`<span class="eyebrow">${esc(d.title)}</span><div class="cl">${list(d.items).map(s=>`<span>${esc(s)}</span>`).join('')}</div>`},
 cv:{label:'Résumé',cat:'Work',hint:'Upload your CV as a PDF',size:'s',
  fields:[F('title','Title'),F('updated','Detail'),F('file','CV file (PDF)','pdf'),F('url','Or a link to your CV','url')],
  def:{title:'Mon CV',updated:'PDF',file:'',url:''},href:d=>isDoc(d.file)?d.file:d.url,
  render:d=>`<div class="doc"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="row"><div class="grow"><b class="t-title">${esc(d.title)}</b><br><small class="muted">${esc(d.updated)}</small></div>${ic('doc',20)}</div>`},
 stat:{label:'Big number',cat:'Work',hint:'A figure that sums you up',size:'s',
  fields:[F('value','Number'),F('label','Label'),F('color','Tint','color')],
  def:{value:'40+',label:'events filmed',color:''},
  tint:d=>col(d.color),
  render:d=>`<span class="big">${esc(d.value)}</span><p class="bottom muted" style="font-weight:600">${esc(d.label)}</p>`},
 testimonial:{label:'Testimonial',cat:'Work',hint:'A client quote',size:'w',
  fields:[F('quote','Quote','area'),F('author','Name'),F('role','Role or company')],
  def:{quote:'Fast, thoughtful and easy to work with.',author:'Client name',role:'Organisation'},
  render:d=>`<div class="tx quote clamp3">“${esc(d.quote)}”</div><div class="bottom"><b>${esc(d.author)}</b><small class="muted">${esc(d.role)}</small></div>`},
 booking:{label:'Booking',cat:'Work',hint:'Calendly, Cal.com or similar',size:'w',
  fields:[F('title','Title'),F('duration','Duration'),F('url','Booking link','url')],
  def:{title:'Book a call',duration:'30 min · video',url:'https://cal.com/'},href:d=>d.url,
  render:d=>{const days=[1,2,3,4,5].map((n,i)=>{const x=new Date();x.setDate(x.getDate()+n);return `<div class="${i===1?'on':''}">${x.toLocaleDateString('fr-FR',{weekday:'short'})}<b>${x.getDate()}</b></div>`}).join('');return `<div class="row"><span class="glyph">${ic('cal',20)}</span><div class="grow"><b class="t-title">${esc(d.title)}</b><br><small class="muted">${esc(d.duration)}</small></div></div><div class="wk">${days}</div>`}},

 gallery:{label:'Gallery',cat:'Creative',hint:'Several photos in one tile',size:'l',bleed:true,
  fields:[F('title','Title'),F('images','Photos','images'),F('url','Link to full portfolio','url')],
  def:{title:'Gallery',images:[],url:''},href:d=>d.url,
  render:d=>{const im=(d.images||[]).filter(isImg);const cells=[0,1,2].map(i=>`<div class="ph" style="${bg(im[i],(d.title||'g')+i)}"></div>`).join('');return `<div class="gal">${cells}</div>${d.title?`<div class="cap"><span>${esc(d.title)}${im.length>3?` · +${im.length-3}`:''}</span></div>`:''}`}},
 video:{label:'Video',cat:'Creative',hint:'YouTube, Vimeo, reels',size:'w',bleed:true,
  fields:[F('title','Title'),F('platform','Platform'),F('url','Video link','url'),F('image','Thumbnail','image')],
  def:{title:'Showreel',platform:'YouTube',url:'',image:''},href:d=>d.url,
  render:d=>`<div class="vid"${ytId(d.url)?` data-yt="${ytId(d.url)}"`:''}><div class="ph" style="${isImg(d.image)?bg(d.image,''):(ytId(d.url)?`background-image:url('https://i.ytimg.com/vi/${ytId(d.url)}/hqdefault.jpg')`:bg('',d.title+'v'))}"></div></div><div class="play">${ic('play',22)}</div><div class="vid-meta"><b>${esc(d.title)}</b><small>${esc(d.platform)}</small></div>`},
 music:{label:'Music',cat:'Creative',hint:'Playlist, track or album',size:'s',
  fields:[F('title','Title'),F('artist','Artist or curator'),F('service','Service','select',Object.entries(MUSIC).map(([k,v])=>[k,v[0]])),F('url','Link','url'),F('image','Cover','image')],
  def:{title:'On repeat',artist:'Playlist',service:'spotify',url:'',image:''},
  tint:d=>(MUSIC[d.service]||MUSIC.spotify)[1],href:d=>d.url,
  interactive:(d,t)=>!!spotEmbed(d.url)&&t&&t.size!=='s'&&t.size!=='bar',
  render:(d,t)=>{const m=MUSIC[d.service]||MUSIC.spotify;if(spotEmbed(d.url)&&t&&t.size!=='s'&&t.size!=='bar')return `<iframe class="embed" src="${esc(spotEmbed(d.url))}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="${esc(d.title)}"></iframe>`;return `<div class="mu"><div class="cover ph" style="${bg(d.image,d.title+'m')}"></div><div class="bottom grow"><span class="row" style="gap:6px"><span class="eq" style="--x:${m[1]}"><i style="background:${m[1]}"></i><i style="background:${m[1]}"></i><i style="background:${m[1]}"></i><i style="background:${m[1]}"></i></span><small class="muted">${esc(m[0])}</small></span><b class="t-title clamp2">${esc(d.title)}</b><small class="muted">${esc(d.artist)}</small></div></div>`}},
 event:{label:'Event',cat:'Creative',hint:'Gig, show, talk or meetup',size:'w',
  fields:[F('title','Title'),F('date','Date','date'),F('place','Venue / city'),F('url','Tickets or info','url')],
  def:{title:'Event name',date:plusDays(21),place:'City',url:''},href:d=>d.url,
  render:d=>`<div class="ev"><div class="date"><small>${esc(fmtDate(d.date,{month:'short'}))}</small><b>${esc(fmtDate(d.date,{day:'numeric'}))}</b></div><div class="grow" style="display:flex;flex-direction:column;gap:3px;height:100%"><span class="eyebrow">${esc(fmtDate(d.date,{weekday:'long'}))}</span><b class="t-title clamp2">${esc(d.title)}</b><small class="muted">${esc(d.place)}</small>${d.url?'<span class="pill acc" style="align-self:flex-start;margin-top:auto">Détails</span>':''}</div></div>`},
 instrument:{label:'Instrument',cat:'Creative',hint:'What you play and for how long',size:'w',
  fields:[F('name','Instrument'),F('since','Playing since'),F('note','Note','area')],
  def:{name:'Piano',since:'Self-taught',note:''},
  render:d=>{const piano=/piano|clavier|keys|keyboard/i.test(d.name||'');const keys=piano?`<div class="keys">${Array.from({length:14},(_,i)=>`<div class="w ${[2,4,6].includes(i)?'hit':''}">${[0,1,3,4,5,7,8,10,11,12].includes(i)?'<span class="b"></span>':''}</div>`).join('')}</div>`:'';return `<span class="eyebrow">Je joue</span><b class="t-title" style="font-size:24px">${esc(d.name)}</b><small class="muted">${esc(d.since)}</small>${d.note?`<p class="muted clamp2" style="font-size:13px">${esc(d.note)}</p>`:''}${keys}`}},

 team:{label:'Football club',cat:'Personal',hint:'Your team in its colours',size:'s',bleed:true,
  fields:[F('club','Club'),F('league','League or note'),F('c1','Colour 1','color'),F('c2','Colour 2','color'),F('url','Club link','url')],
  def:{club:'Your club',league:'Supporter',c1:'#0B3D91',c2:'#D7263D',url:''},href:d=>d.url,
  render:d=>`<div class="club" style="--c1:${col(d.c1)||'#0B3D91'};--c2:${col(d.c2)||'#D7263D'}"></div><div class="club-card" style="--c1:${col(d.c1)||'#0B3D91'};--c2:${col(d.c2)||'#D7263D'}"><span class="crest"></span><div class="grow"><b class="clamp2" style="font-size:14px;line-height:1.15">${esc(d.club)}</b><small class="muted">${esc(d.league)}</small></div></div>`},
 faith:{label:'Faith',cat:'Personal',hint:'A verse, belief or community',size:'w',
  fields:[F('verse','Verse or words','area'),F('ref','Reference'),F('church','Community (optional)'),F('url','Link (optional)','url')],
  def:{verse:'Be still, and know that I am God.',ref:'Psalm 46:10',church:'',url:''},href:d=>d.url,
  render:d=>`<span class="eyebrow">Ma foi</span><div class="vs clamp3">${esc(d.verse)}</div><div class="bottom"><small style="font-weight:700">${esc(d.ref)}</small>${d.church?`<small class="muted">${esc(d.church)}</small>`:''}</div>`},
 now:{label:'Now',cat:'Personal',hint:'What you are up to lately',size:'w',
  fields:[F('text','What are you doing now?','area'),F('updated','Updated')],
  def:{text:'Building my own link-in-bio tool.',updated:'This week'},
  render:d=>`<span class="row" style="gap:7px"><span class="now-dot"></span><span class="eyebrow" style="color:var(--fg)">En ce moment</span><small class="muted" style="margin-left:auto">${esc(d.updated)}</small></span><div class="tx quote clamp3" style="margin-top:auto">${esc(d.text)}</div>`},
 countdown:{label:'Countdown',cat:'Personal',hint:'Days until a date',size:'s',
  fields:[F('title','What for?'),F('date','Date','date')],
  def:{title:'Days until launch',date:plusDays(40)},
  render:d=>{const n=daysTo(d.date);return `<span class="eyebrow">${n!=null&&n<0?'Jours depuis':'Compte à rebours'}</span><span class="big" style="margin-top:auto">${n==null?'–':Math.abs(n)}</span><small class="muted" style="font-weight:600">${esc(d.title)}</small>`}},
 media:{label:'Book / show / game',cat:'Personal',hint:'What you are reading or watching',size:'s',
  fields:[F('kind','Kind','select',[['Reading','Reading'],['Watching','Watching'],['Playing','Playing'],['Listening','Listening']]),F('title','Title'),F('by','By'),F('url','Link','url'),F('image','Cover','image')],
  def:{kind:'Reading',title:'Title',by:'Author',url:'',image:''},href:d=>d.url,
  render:d=>`<div class="mu"><div class="cover ph" style="${bg(d.image,d.title+'b')};aspect-ratio:3/4"></div><div class="bottom grow"><span class="eyebrow">${esc(d.kind)}</span><b class="t-title clamp2">${esc(d.title)}</b><small class="muted">${esc(d.by)}</small></div></div>`},
 interest:{label:'Interest',cat:'Personal',hint:'A passion, sport or hobby',size:'s',
  fields:[F('title','Title'),F('desc','Detail'),F('color','Colour','color'),F('url','Link (optional)','url')],
  def:{title:'Interest',desc:'',color:''},tint:d=>col(d.color),href:d=>d.url,
  render:d=>`<span class="glyph" style="${col(d.color)?`--c:${col(d.color)}`:''}">${esc((d.title||'?')[0].toUpperCase())}</span><div class="bottom"><b class="t-title">${esc(d.title)}</b><small class="muted clamp2">${esc(d.desc)}</small></div>`},

 tip:{label:'Tip jar',cat:'Earn',hint:'Support via PayPal, Stripe, Ko-fi',size:'w',interactive:true,
  fields:[F('title','Title'),F('desc','Message'),F('amounts','Amounts (comma separated)'),F('currency','Currency symbol'),F('url','Payment link','url')],
  def:{title:'Buy me a coffee',desc:'If my work helped you.',amounts:'3, 5, 10',currency:'€',url:''},
  render:d=>{const u=safeUrl(d.url);return `<div class="row"><span class="glyph">${ic('heart',20)}</span><div class="grow"><b class="t-title">${esc(d.title)}</b><br><small class="muted">${esc(d.desc)}</small></div></div><div class="amts">${list(d.amounts).map(a=>u?`<a href="${esc(u)}" target="_blank" rel="noopener" data-track>${esc(a)} ${esc(d.currency)}</a>`:`<span>${esc(a)} ${esc(d.currency)}</span>`).join('')}</div>`}},
 product:{label:'Product',cat:'Earn',hint:'Preset, print, service or merch',size:'s',bleed:true,
  fields:[F('name','Name'),F('price','Price'),F('desc','Detail'),F('image','Image','image'),F('url','Checkout link','url')],
  def:{name:'Lightroom presets',price:'15 €',desc:'',image:'',url:''},href:d=>d.url,
  render:d=>`<div class="pr"><div class="ph" style="${bg(d.image,d.name+'p')}"><span class="price">${esc(d.price)}</span></div><div class="pr-t"><div class="grow"><b class="clamp2" style="font-size:14px">${esc(d.name)}</b>${d.desc?`<small class="muted">${esc(d.desc)}</small>`:''}</div><span class="pill">Acheter</span></div></div>`},
 form:{label:'Email signup',cat:'Earn',hint:'Collect emails or leads',size:'w',interactive:true,
  fields:[F('title','Title'),F('desc','Description'),F('button','Button label')],
  def:{title:'Newsletter',desc:'New work, once a month.',button:'Subscribe'},
  render:(d,t)=>`<form class="lead" data-form="${t.id}"><b class="t-title">${esc(d.title)}</b><small class="muted">${esc(d.desc)}</small><div class="lead-row"><input id="lead-${t.id}" type="email" required placeholder="vous@email.fr" aria-label="Email address"><button type="submit">${esc(d.button)}</button></div></form>`}
};
const CATS=['Essentials','Work','Creative','Personal','Earn'];
const SIZES=[['s','Small',[1,0,0,0]],['w','Wide',[1,1,0,0]],['t','Tall',[1,0,1,0]],['l','Large',[1,1,1,1]],['bar','Strip',[1,1,0,0]]];

/* ---------- State ---------- */
const CARS={};
function seed(){
 const B=(type,size,data,extra)=>Object.assign({id:uid(),type,size,data:Object.assign({},T[type].def,data)},extra||{});
 const H={hidden:true};const IG='https://instagram.com/brandonlazarre';
 const tiles=[
  B('link','w',{title:'brandonlazarre.fr',url:'https://brandonlazarre.fr',desc:'Portfolio, services et contact'}),
  B('social','s',{platform:'instagram',handle:'brandonlazarre',cta:'Suivre'}),
  B('map','s',{place:'Troyes',note:'Aube, Grand Est'}),
  B('section','full',{title:'Projets'}),
  B('project','l',{title:'EventFlow',role:'SaaS · conception & dev',year:'2026',desc:'Plateforme de gestion d’événements : rôles et permissions sur trois niveaux (plateforme, événement, utilisateur) et facturation par modules.',tags:'SaaS, PHP, Architecture'},{spot:true}),
  B('project','t',{title:'IMPACT 2026',role:'App festival · React',year:'2026',desc:'L’app du festival IMPACT à Montluçon, thème UNBROKEN : programme personnalisé, mode live, plan SVG interactif, FR/EN.',tags:'React, Event tech, UX'}),
  B('skills','t',{title:'Boîte à outils',items:'HTML, CSS, JavaScript, React, PHP, Python, SQL, JSON, Flutter, Bootstrap, Adobe Suite, Canva, Photo, Vidéo, Retouche'}),
  B('section','full',{title:'Labo · essais récents'}),
  B('project','w',{title:'Tuile',role:'Outil perso · Vanilla JS + PHP',year:'2026',desc:'Mon link-in-bio façon bento, qui fait tourner cette page.',tags:'Vanilla JS, PHP'},{spot:true}),
  B('project','s',{title:'App de notes',role:'Mobile-first',year:'2026',desc:'Une interface pensée pour le pouce : trois îlots de navigation en bas d’écran.',tags:'UX, Mobile'}),
  B('project','s',{title:'Composants miuix',role:'Compose Multiplatform',year:'2026',desc:'FloatingNavigationBar et FloatingToolbar pour la bibliothèque miuix.',tags:'Kotlin, UI'}),
  B('project','s',{title:'Organiseur Spotify',role:'React · IA',year:'2026',desc:'Trie les titres likés et crée les playlists automatiquement.',tags:'React, API'}),
  B('project','s',{title:'F1 2026',role:'Projet perso · Vanilla JS',year:'2026',desc:'Galerie de livrées interactive : notes, badges, easter eggs et classement des sons moteur.',tags:'F1, Data, UI'}),
  B('now','w',{text:'Je construis Tuile, mon propre outil link-in-bio, pour héberger ce portfolio.',updated:'Oct. 2026'}),
  B('section','full',{title:'Église'}),
  B('project','w',{title:'Site de l’église de Troyes',role:'Site web · en cours',year:'2026',desc:'Pour les membres et les nouveaux visiteurs : première visite, programme du samedi, événements, médias.',tags:'Web, Vanilla',url:'https://troyes.adventiste.org'}),
  B('project','w',{title:'Charte graphique de Troyes',role:'Identité visuelle',year:'2026',desc:'« Lumière & Structure » : six motifs tirés du patrimoine troyen (vitrail, colombage, rosace), logo, ton, gabarits print et réseaux.',tags:'Branding, SVG'}),
  B('project','w',{title:'Plateforme adventiste',role:'PHP 8.5 · zéro dépendance',year:'2026',desc:'Plateforme multi-sites pour les églises, avec gestionnaire de fichiers en ligne.',tags:'PHP, Multi-tenant'}),
  B('faith','w',{church:'Église adventiste de Troyes',url:'https://troyes.adventiste.org'}),
  B('section','full',{title:'Parcours'}),
  B('experience','t',{title:'Création',items:'Développeur & designer web | Indépendant | Sites, apps, identités visuelles\nPhotographe & vidéaste | Événements et portraits | Tournage, montage, retouche'}),
  B('experience','l',{title:'Missions en intérim',items:'Employé de libre-service · Inventoriste | Action — Barberey-Saint-Sulpice, Rosières-près-Troyes, La Chapelle-Saint-Luc | 2023 – 2026\nAgent de magasinage · Gestionnaire de stock | Hugo Boss Retail | 2022 et 2026\nAgent d’accueil | Basic-Fit | 2022'}),
  B('stat','s',{value:'19',label:'missions d’intérim depuis 2022'}),
  B('stat','s',{value:'3',label:'enseignes : Action, Hugo Boss, Basic-Fit'}),
  B('section','full',{title:'Photo & vidéo'}),
  B('gallery','l',{title:'Photographie événementielle'}),
  B('video','l',{title:'Showreel 2026',platform:'YouTube'}),
  B('section','full',{title:'Car spotting'}),
  B('image','l',{image:CARS.rs6duo,caption:'Audi RS6 Avant & Porsche Cayenne · à la tombée de la nuit',url:IG}),
  B('image','t',{image:CARS.fiatrear,caption:'Fiat 1500 S Cabriolet · Troyes',url:IG}),
  B('image','s',{image:CARS.p911,caption:'Porsche 911',url:IG}),
  B('image','s',{image:CARS.m4light,caption:'BMW M4 Competition',url:IG}),
  B('image','w',{image:CARS.fiatfront,caption:'Fiat 1500 S · calandre chromée',url:IG}),
  B('image','s',{image:CARS.rs6front,caption:'Audi RS6',url:IG}),
  B('image','s',{image:CARS.m4side,caption:'M4 · peinture caméléon',url:IG}),
  B('image','w',{image:CARS.m4rear,caption:'BMW M4 Competition Cabriolet',url:IG}),
  B('text','w',{text:'Le car spotting, c’est mon terrain de jeu photo : lumière du soir, reflets, détails. Plus de spots sur Instagram @brandonlazarre.',style:'quote'}),
  B('section','full',{title:'En dehors du travail'}),
  B('instrument','l',{name:'Piano',since:'Aussi : chant, basse et saxophone',note:'Gospel et classique.'}),
  B('music','s',{title:'Gospel & classique',artist:'Ma playlist',service:'spotify'}),
  B('interest','s',{title:'Formule 1',desc:'Supporter de Max Verstappen',color:'#E10600'}),
  B('team','w',{club:'Paris Saint-Germain',league:'et l’Équipe de France',c1:'#004170',c2:'#DA291C'}),
  B('section','full',{title:'Contact'}),
  B('contact','w',{title:'Travaillons ensemble',email:'brandonlazarre@outlook.fr'}),
  B('booking','w',{title:'Réserver un shooting',duration:'Portrait ou événement · appel de 30 min'}),
  B('social','bar',{platform:'linkedin',handle:'à compléter',cta:'Voir'},H),
  B('social','bar',{platform:'github',handle:'à compléter',cta:''},H),
  B('social','bar',{platform:'youtube',handle:'à compléter',cta:'S’abonner'},H),
  B('form','w',{title:'Newsletter',desc:'Nouveaux projets, une fois par mois.',button:'S’abonner'},H),
  B('tip','w',{title:'M’offrir un café',desc:'Si mon travail t’a aidé.',amounts:'3, 5, 10'},H)
 ];
 const clicks={};tiles.forEach((t,i)=>{if(t.type!=='section')clicks[t.id]=Math.round(8+((hash(t.id)%90)*(1.4-i/40)))});
 const days=Array.from({length:14},(_,i)=>Math.round(60+40*Math.sin(i/2)+(hash('d'+i)%45)));
 return {v:1,sample:true,profile:{name:'Brandon Lazarre',role:'Développeur, designer & photographe',bio:'Je crée des sites et des apps événementielles, des identités visuelles, et je réalise photo et vidéo. Basé à Troyes.',location:'Troyes, France',status:'Disponible pour des projets',statusOn:true,avatar:''},
  theme:{skin:'auto',accent:'#0B7A75',radius:24,font:'grotesk',layout:'side',gap:14},
  tiles,stats:{sample:true,views:days.reduce((a,b)=>a+b,0),days,clicks,leads:[]}};
}
const BOOT=window.TILES_BOOT||{};
const PUBLIC=BOOT.mode==='public';
const CSRF=BOOT.csrf||'';
let S=BOOT.page&&Array.isArray(BOOT.page.tiles)?BOOT.page:seed();
S.stats=BOOT.stats||{sample:false,views:0,days:Array(14).fill(0),clicks:{},leads:[]};
const ui={mode:PUBLIC?'preview':'edit',sel:null,drawer:null};
/* profile defaults for fields added after the first version */
(function(){const p=S.profile=S.profile||{};
 if(p.email===undefined){const ct=(S.tiles||[]).find(t=>t.type==='contact'&&t.data&&t.data.email);p.email=ct?ct.data.email:''}
 if(p.phone===undefined)p.phone='';
 if(!p.hours||!Array.isArray(p.hours.days))p.hours={days:[0,0,0,0,0,0,0],from:'09:00',to:'18:00',note:''};
 if(p.showNav===undefined)p.showNav=true;
 if(p.cv===undefined)p.cv='';})();
const DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const DAYS_LONG=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const toMin=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(t||'');return m?(+m[1])*60+(+m[2]):null};
const fmtH=t=>{const m=toMin(t);if(m==null)return '';const h=Math.floor(m/60),mm=m%60;return h+'h'+(mm?String(mm).padStart(2,'0'):'')};
function daysLabel(d){const on=d.map(Boolean);if(!on.some(x=>x))return '';if(on.every(x=>x))return 'Tous les jours';
 const runs=[];let i=0;while(i<7){if(!on[i]){i++;continue}let j=i;while(j+1<7&&on[j+1])j++;runs.push(j>i+1?DAYS[i]+'–'+DAYS[j]:(j===i+1?DAYS[i]+', '+DAYS[j]:DAYS[i]));i=j+1}
 return runs.join(', ')}
function parisNow(){try{const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const g=k=>(f.find(x=>x.type===k)||{}).value;
 return {d:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(g('weekday')),m:(+g('hour'))*60+(+g('minute'))}}catch(e){const n=new Date();return {d:(n.getDay()+6)%7,m:n.getHours()*60+n.getMinutes()}}}
const isAllDay=h=>!!h.allDay||(h.from&&h.from===h.to);
function openState(h){if(!h.days.some(Boolean))return null;
 if(isAllDay(h)){const {d}=parisNow();if(h.days[d])return {open:true,text:'Disponible maintenant'};
  for(let k=1;k<8;k++){const dd=(d+k)%7;if(h.days[dd])return {open:false,text:'Indisponible aujourd’hui · reprend '+(k===1?'demain':DAYS_LONG[dd])}}return null}
 const a=toMin(h.from),b=toMin(h.to);if(a==null||b==null||b<=a)return null;
 const {d,m}=parisNow();if(h.days[d]&&m>=a&&m<b)return {open:true,text:'Disponible maintenant · jusqu’à '+fmtH(h.to)};
 for(let k=0;k<8;k++){const dd=(d+k)%7;if(!h.days[dd])continue;if(k===0&&m>=a)continue;
  return {open:false,text:'Indisponible · reprend '+(k===0?'aujourd’hui':k===1?'demain':DAYS_LONG[dd])+' à '+fmtH(h.from)}}
 return null}
const telHref=s=>{let n=String(s||'').replace(/[^\d+]/g,'');if(/^0\d{9}$/.test(n))n='+33'+n.slice(1);return n?'tel:'+n:''};
function navSections(){return S.tiles.filter(t=>t.type==='section'&&(ui.mode==='edit'||visible(t))&&(t.data.title||'').trim())}
function api(action,body,isForm){
 const opt={method:'POST',credentials:'same-origin',headers:{'X-CSRF':CSRF}};
 if(isForm)opt.body=body;else{opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body||{})}
 return fetch('api.php?action='+action,opt).then(r=>r.json().catch(()=>({ok:false,error:'Server error ('+r.status+')'})).then(j=>{if(!r.ok||!j.ok)throw new Error(j.error||('Server error ('+r.status+')'));return j}));
}
function beacon(payload){try{const b=new Blob([JSON.stringify(payload)],{type:'application/json'});if(navigator.sendBeacon&&navigator.sendBeacon('api.php?action=track',b))return}catch(e){}try{fetch('api.php?action=track',{method:'POST',body:JSON.stringify(payload),headers:{'Content-Type':'application/json'},keepalive:true})}catch(e){}}
let saveT,saving=false,dirty=false;
function setSaveState(t,cls){const el=document.getElementById('savestate');if(el){el.textContent=t;el.dataset.state=cls||''}}
function save(){if(PUBLIC)return;dirty=true;setSaveState('Unsaved changes','dirty');clearTimeout(saveT);saveT=setTimeout(flush,700)}
function flush(){if(PUBLIC||saving||!dirty)return;saving=true;dirty=false;setSaveState('Saving…','busy');
 const page=Object.assign({},S);delete page.stats;
 api('save',{page}).then(()=>{saving=false;setSaveState(dirty?'Unsaved changes':'Saved','ok');if(dirty)flush()})
 .catch(err=>{saving=false;dirty=true;setSaveState('Not saved','err');toast('Not saved: '+err.message+'. Retrying in 10 s.');clearTimeout(saveT);saveT=setTimeout(flush,10000)})}
window.addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue=''}});

/* ---------- Helpers ---------- */
const byId=id=>S.tiles.find(t=>t.id===id);
const inWindow=t=>{const now=new Date();if(t.start&&new Date(t.start+'T00:00:00')>now)return false;if(t.end&&new Date(t.end+'T23:59:59')<now)return false;return true};
const visible=t=>!t.hidden&&inWindow(t)&&T[t.type];
const tileName=t=>{const d=t.data||{};if(t.type==='stat')return (d.value+' '+(d.label||'')).trim();if(t.type==='social')return (PLAT[d.platform]||[''])[0]+(d.handle?' @'+d.handle:'');return d.title||d.name||d.club||d.caption||d.place||T[t.type].label};

/* ---------- Render ---------- */
const page=$('#page'),grid=$('#grid'),prof=$('#prof');
function applyTheme(){
 const th=S.theme;page.dataset.skin=th.skin;page.dataset.font=th.font;page.dataset.layout=th.layout;
 page.style.setProperty('--accent',col(th.accent)||'#0B7A75');page.style.setProperty('--r',(+th.radius||24)+'px');page.style.setProperty('--gap',(+th.gap||14)+'px');
 document.documentElement.style.setProperty('--accent',col(th.accent)||'#0B7A75');
}
function renderProfile(){
 const p=S.profile;const ini=(p.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
 prof.innerHTML=`<button class="avatar" type="button" data-act="profile" aria-label="Profile photo" ${ui.mode!=='edit'?'tabindex="-1"':''}>${isImg(p.avatar)?`<img src="${p.avatar}" alt="">`:esc(ini)}</button>
 <h1>${esc(p.name)}</h1>${p.role?`<p class="role">${esc(p.role)}</p>`:''}${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}
 <div class="chips">${p.location?`<span class="chip">${ic('pin',14)}${esc(p.location)}</span>`:''}${p.statusOn&&p.status?`<span class="chip live"><i></i>${esc(p.status)}</span>`:''}</div>
 ${profileExtras(p)}
 ${ui.mode==='edit'?`<div><button class="btn sm" data-act="profile">${ic('edit',14)}Edit profile</button></div>`:''}`;
 renderJumpbar();
}
function profileExtras(p){
 let h='';const edit=ui.mode==='edit';
 if(isDoc(p.cv))h+=`<a class="pcv" href="${esc(p.cv)}" target="_blank" rel="noopener" download="CV-${esc((p.name||'CV').replace(/\s+/g,'-'))}.pdf" data-pclick="p-cv">${ic('doc',18)}<span><b>Télécharger mon CV</b><small>PDF · ${esc(p.cvNote||'1 page')}</small></span>${ic('upload',16).replace('<path','<path transform="rotate(180 12 12)"')}</a>`;
 else if(edit)h+=`<button type="button" class="pempty" data-act="profile">${ic('doc',16)}Ajouter mon CV (PDF)</button>`;
 const rows=[];
 if((p.phone||'').trim())rows.push(`<div class="prow"><a href="${esc(telHref(p.phone))}" data-track-profile="phone">${ic('phone',16)}<span>${esc(p.phone)}</span></a><button type="button" class="pcopy" data-copy="${esc(p.phone)}" aria-label="Copier le numéro">Copier</button></div>`);
 if((p.email||'').trim())rows.push(`<div class="prow"><a href="mailto:${esc(p.email)}">${ic('mail',16)}<span>${esc(p.email)}</span></a><button type="button" class="pcopy" data-copy="${esc(p.email)}" aria-label="Copier l’adresse email">Copier</button></div>`);
 const hrs=p.hours||{};const dl=daysLabel(hrs.days||[]);const st=openState(hrs);
 const closed=DAYS_LONG.filter((x,i)=>!(hrs.days||[])[i]);
 if(dl&&(isAllDay(hrs)||(fmtH(hrs.from)&&fmtH(hrs.to))))rows.push(`<div class="prow hours">${ic('clock',16)}<div><b>${esc(dl)} · ${isAllDay(hrs)?'24h/24':fmtH(hrs.from)+'–'+fmtH(hrs.to)}</b>${isAllDay(hrs)&&closed.length&&closed.length<=2?`<small>Fermé le ${esc(closed.join(' et '))}</small>`:''}${st?`<span class="openst ${st.open?'on':'off'}"><i></i>${esc(st.text)}</span>`:''}${hrs.note?`<small>${esc(hrs.note)}</small>`:''}</div></div>`);
 if(rows.length)h+=`<div class="pcard">${rows.join('')}</div>`;
 else if(edit)h+=`<button type="button" class="pempty" data-act="profile">${ic('plus',16)}Ajouter téléphone, email et horaires</button>`;
 const secs=navSections();
 if(p.showNav!==false&&secs.length>=2)h+=`<nav class="jump" aria-label="Sur cette page"><span class="eyebrow">Sur cette page</span><ol>${secs.map((t,i)=>`<li><a href="#${t.id}" data-jump="${t.id}"><span class="jn">${String(i+1).padStart(2,'0')}</span>${esc(t.data.title)}</a></li>`).join('')}</ol></nav>`;
 return h}
function renderJumpbar(){const jb=document.getElementById('jumpbar');if(!jb)return;const secs=navSections();
 const show=S.profile.showNav!==false&&secs.length>=2;jb.hidden=!show;
 jb.innerHTML=show?secs.map(t=>`<a href="#${t.id}" data-jump="${t.id}">${esc(t.data.title)}</a>`).join(''):'';
 requestAnimationFrame(markActive)}
let activeId='';
function markActive(){const secs=navSections();if(!secs.length)return;let cur=secs[0].id;const lim=window.innerHeight*0.32;
 for(const t of secs){const el=grid.querySelector(`[data-id="${t.id}"]`);if(el&&el.getBoundingClientRect().top<=lim)cur=t.id}
 if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)cur=secs[secs.length-1].id;
 if(cur===activeId&&document.querySelector('[data-jump][aria-current]'))return;activeId=cur;
 document.querySelectorAll('[data-jump]').forEach(a=>{if(a.dataset.jump===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
 const jb=document.getElementById('jumpbar');const ac=jb&&jb.querySelector('[aria-current]');if(ac&&!jb.hidden){const l=ac.offsetLeft-16;if(l<jb.scrollLeft||ac.offsetLeft+ac.offsetWidth>jb.scrollLeft+jb.clientWidth)jb.scrollTo({left:Math.max(0,l),behavior:'smooth'})}}
let scrollRaf=0;window.addEventListener('scroll',()=>{if(scrollRaf)return;scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;markActive()})},{passive:true});
window.addEventListener('resize',()=>requestAnimationFrame(markActive));
setInterval(()=>{if(!ui.drawer||ui.drawer!=='profile')renderProfile()},60000);
document.addEventListener('click',e=>{
 const j=e.target.closest('[data-jump]');
 if(j){e.preventDefault();const el=grid.querySelector(`[data-id="${j.dataset.jump}"]`);if(el){const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});activeId='';setTimeout(markActive,reduce?0:600)}return}
 const pc=e.target.closest('#prof [data-pclick]');if(pc&&PUBLIC)beacon({type:'click',id:pc.dataset.pclick});
 if(e.target.closest('#prof a[href^="tel:"]')&&PUBLIC)beacon({type:'click',id:'p-phone'});
 const cp=e.target.closest('#prof [data-copy]');if(cp){e.preventDefault();copyText(cp.dataset.copy,cp.previousElementSibling&&cp.previousElementSibling.querySelector('span'));return}
});
function sizeIcon(cells){return `<span class="sz-ico">${cells.map(c=>`<i class="${c?'f':''}"></i>`).join('')}</span>`}
function toolbar(t){
 const def=T[t.type];const sizes=def.sizes?[]:SIZES;
 return `<div class="tb" role="toolbar" aria-label="Block tools">${sizes.map(([k,l])=>`<button type="button" data-tb="size" data-v="${k}" aria-pressed="${t.size===k}" aria-label="${l}" title="${l}">${k==='bar'?'▭':k.toUpperCase()}</button>`).join('')}${sizes.length?'<span class="sep"></span>':''}<button type="button" data-tb="left" aria-label="Move earlier">${ic('left',15)}</button><button type="button" data-tb="right" aria-label="Move later">${ic('right',15)}</button><button type="button" data-tb="edit" aria-label="Edit">${ic('edit',15)}</button><button type="button" data-tb="del" aria-label="Delete">${ic('trash',15)}</button></div>`;
}
function tileHTML(t){
 const def=T[t.type];if(!def)return '';
 const mode=ui.mode;const href=def.href?safeHref(def.href(t.data)):'';
 const tint=def.tint?def.tint(t.data):'';
 const flag=t.hidden?'Hidden':(!inWindow(t)?'Scheduled':'');
 const inter=typeof def.interactive==='function'?def.interactive(t.data,t):def.interactive;
 const asLink=mode!=='edit'&&href&&!inter;
 const tag=asLink?'a':'div';
 const cls=['tile','sz-'+t.size,'ty-'+t.type,def.bleed?'bleed':'',def.bare?'bare':'',t.spot?'spot':'',ui.sel===t.id&&mode==='edit'?'is-sel':'',flag&&mode==='edit'?'dim':''].filter(Boolean).join(' ');
 const c=(S.stats.clicks[t.id]||0);
 return `<article class="${cls}" data-id="${t.id}"${mode==='edit'?' draggable="true" tabindex="0"':''}${tint?` style="--tint:${tint}"`:''}><${tag} class="ti"${asLink?` href="${esc(href)}" target="_blank" rel="noopener" data-track`:''}>${def.render(t.data,t)}</${tag}>${flag&&mode==='edit'?`<span class="flag">${flag}</span>`:''}${mode==='stats'&&t.type!=='section'?`<span class="cnt">${c} clics</span>`:''}${mode==='edit'?toolbar(t):''}</article>`;
}
function statsHTML(){
 const st=S.stats;const days=st.days.slice(-14);const max=Math.max(...days,1);
 const W=600,H=90,pad=4;const pts=days.map((v,i)=>[pad+i*(W-2*pad)/(days.length-1),H-14-(v/max)*(H-24)]);
 const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const area=path+` L${pts[pts.length-1][0].toFixed(1)} ${H-14} L${pts[0][0].toFixed(1)} ${H-14} Z`;
 const last=pts[pts.length-1];
 const totalClicks=Object.values(st.clicks).reduce((a,b)=>a+b,0);
 const ctr=st.views?Math.round(totalClicks/st.views*100):0;
 const tops=S.tiles.filter(t=>t.type!=='section').map(t=>[t,st.clicks[t.id]||0]).concat([[{type:'x',data:{title:'Téléphone (appel)'}},st.clicks['p-phone']||0]]).sort((a,b)=>b[1]-a[1]).slice(0,6);
 const tmax=Math.max(1,...tops.map(x=>x[1]));
 return `<section class="stats" aria-label="Page statistics"><div class="stats-head"><h2>14 derniers jours</h2>${st.sample?'<span class="samp">Inclut des chiffres d’exemple</span>':''}<button class="btn sm" data-act="reset-stats">Réinitialiser</button></div>
 <div class="kpis"><div class="kpi"><small>Vues</small><b>${st.views.toLocaleString('en-GB')}</b></div><div class="kpi"><small>Clics</small><b>${totalClicks.toLocaleString('en-GB')}</b></div><div class="kpi"><small>Taux de clic</small><b>${ctr}%</b></div><div class="kpi"><small>CV téléchargé</small><b>${(st.clicks['p-cv']||0).toLocaleString('fr-FR')}</b></div></div>
 <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Vues par jour, 14 derniers jours"><line class="gd" x1="0" x2="${W}" y1="${H-14}" y2="${H-14}"/><path class="ar" d="${area}"/><path class="ln" d="${path}" vector-effect="non-scaling-stroke"/><circle class="dt" cx="${last[0]}" cy="${last[1]}" r="4" vector-effect="non-scaling-stroke"/></svg>
 <div class="tops">${tops.map(([t,v])=>`<div class="top"><span>${esc(tileName(t))}</span><span class="barx"><i style="width:${(v/tmax*100).toFixed(1)}%"></i></span><b>${v}</b></div>`).join('')}</div>
 ${st.leads.length?`<div><span class="eyebrow">Inscriptions</span><div class="leads" style="margin-top:6px">${st.leads.slice(-12).map(l=>`<span>${esc(l)}</span>`).join('')}</div></div>`:''}
 <small class="muted">Visites et clics de la page publique, enregistrés sur ton serveur.</small></section>`;
}
function renderGrid(){
 const mode=ui.mode;
 const tiles=S.tiles.filter(t=>T[t.type]&&(mode==='edit'||visible(t)));
 document.getElementById('statsbox').innerHTML=mode==='stats'?statsHTML():'';
 grid.innerHTML=tiles.map(tileHTML).join('')+(mode==='edit'?`<button class="add-tile" type="button" data-act="add">${ic('plus',22)}Add block</button>`:'')+(mode==='preview'?`<p class="footer-note">Fait avec Tiles</p>`:'');
}
function render(){
 document.body.className='mode-'+ui.mode+(PUBLIC?' is-public':'');page.className='page mode-'+ui.mode;
 $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===ui.mode));
 $('#fab').hidden=PUBLIC||ui.mode!=='preview';
 $('#banner').hidden=PUBLIC||!(S.sample&&ui.mode==='edit');
 applyTheme();renderGrid();renderProfile();
}

/* ---------- Toast ---------- */
let toastT,undoFn=null;
function toast(msg,undo){const el=$('#toast');$('#tmsg').textContent=msg;undoFn=undo||null;$('#tbtn').hidden=!undo;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),undo?5000:2400)}
$('#tbtn').addEventListener('click',()=>{if(undoFn){undoFn();undoFn=null}$('#toast').classList.remove('on')});

/* ---------- Drawer ---------- */
const drawer=$('#drawer'),dbody=$('#dbody');
function openDrawer(title,html,kind){$('#dtitle').textContent=title;dbody.innerHTML=html;paintIcons(dbody);drawer.classList.add('on');drawer.setAttribute('aria-hidden','false');$('#scrim').classList.add('on');ui.drawer=kind;dbody.scrollTop=0}
function closeDrawer(){drawer.classList.remove('on');drawer.setAttribute('aria-hidden','true');$('#scrim').classList.remove('on');ui.drawer=null;if(ui.sel){ui.sel=null;renderGrid()}}
$('#scrim').addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.drawer)closeDrawer()});

function fieldHTML(f,val,prefix){
 const id=`${prefix}-${f.k}`;
 if(f.t==='area')return `<div class="fld"><label for="${id}">${esc(f.l)}</label><textarea id="${id}" data-k="${f.k}">${esc(val)}</textarea></div>`;
 if(f.t==='select')return `<div class="fld"><label for="${id}">${esc(f.l)}</label><select id="${id}" data-k="${f.k}">${f.o.map(([v,l])=>`<option value="${esc(v)}"${v===val?' selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
 if(f.t==='color')return `<div class="fld"><label for="${id}">${esc(f.l)}</label><div class="row"><input id="${id}" type="color" data-k="${f.k}" value="${col(val)||'#0B7A75'}" style="width:44px;height:36px;border:0;background:none;padding:0"><button type="button" class="btn sm ghost" data-clear="${f.k}">Use accent</button></div></div>`;
 if(f.t==='image')return `<div class="fld"><span class="lb">${esc(f.l)}</span><div class="drop-img"><div class="thumb" style="${isImg(val)?`background-image:url('${val}')`:''}"></div><span class="btn sm file-btn">${ic('upload',14)}Upload<input id="${id}" type="file" accept="image/*" data-img="${f.k}" aria-label="${esc(f.l)}"></span>${isImg(val)?`<button type="button" class="btn sm ghost" data-clear="${f.k}">Remove</button>`:''}</div><span class="hint">Images are resized to 1200px and stored with the page.</span></div>`;
 if(f.t==='pdf'){const ok=isDoc(val);return `<div class="fld"><span class="lb">${esc(f.l)}</span><div class="drop-img"><div class="thumb doc-thumb">${ic('doc',22)}</div><span class="btn sm file-btn">${ic('upload',14)}${ok?'Replace':'Upload'} PDF<input id="${id}" type="file" accept="application/pdf,.pdf" data-pdf="${f.k}" aria-label="${esc(f.l)}"></span>${ok?`<a class="btn sm ghost" href="${esc(val)}" target="_blank" rel="noopener">Open</a><button type="button" class="btn sm ghost" data-clear="${f.k}">Remove</button>`:''}</div><span class="hint">${ok?'A PDF is online.':'PDF up to 15 MB.'}</span></div>`}
 if(f.t==='images'){const im=(val||[]).filter(isImg);return `<div class="fld"><span class="lb">${esc(f.l)}</span><div class="thumbs">${im.map((s,i)=>`<div><div class="thumb" style="background-image:url('${s}')"></div><button type="button" data-rmimg="${i}" aria-label="Remove photo">${ic('x',12)}</button></div>`).join('')}</div><span class="btn sm file-btn" style="align-self:flex-start">${ic('upload',14)}Add photos<input id="${id}" type="file" accept="image/*" multiple data-imgs="${f.k}" aria-label="${esc(f.l)}"></span></div>`}
 const type=f.t==='url'?'url':f.t==='email'?'email':f.t==='date'?'date':f.t==='tel'?'tel':'text';
 return `<div class="fld"><label for="${id}">${esc(f.l)}</label><input id="${id}" type="${type}" data-k="${f.k}" value="${esc(val)}"${type==='url'?' placeholder="https://"':''}></div>`;
}
function openTile(id){
 const t=byId(id);if(!t)return;const def=T[t.type];ui.sel=id;renderGrid();
 const sizes=def.sizes?'':`<div class="fld"><span class="lb">Size</span><div class="sizes">${SIZES.map(([k,l,c])=>`<button type="button" data-size="${k}" aria-pressed="${t.size===k}">${k==='bar'?'<span class="sz-ico"><i class="f"></i><i class="f"></i></span>':sizeIcon(c)}${l}</button>`).join('')}</div></div>`;
 openDrawer(def.label,`<div id="tile-form" data-id="${id}" style="display:flex;flex-direction:column;gap:14px">${def.fields.map(f=>fieldHTML(f,t.data[f.k],'f-'+id)).join('')}</div>
 <div class="grp"><h4>Display</h4>${sizes}
  <label class="chk"><input type="checkbox" id="opt-spot" data-opt="spot"${t.spot?' checked':''}>Spotlight (highlight and gentle wiggle)</label>
  <label class="chk"><input type="checkbox" id="opt-hidden" data-opt="hidden"${t.hidden?' checked':''}>Hide from public page</label>
  <div class="two"><div class="fld"><label for="opt-start">Show from</label><input type="date" id="opt-start" data-opt="start" value="${esc(t.start||'')}"></div><div class="fld"><label for="opt-end">Show until</label><input type="date" id="opt-end" data-opt="end" value="${esc(t.end||'')}"></div></div>
 </div>
 <div class="row-btns"><button class="btn sm" type="button" data-tact="dup">${ic('copy',14)}Duplicate</button><button class="btn sm danger" type="button" data-tact="del">${ic('trash',14)}Delete</button></div>`,'tile');
}
function openAdd(){
 openDrawer('Add a block',CATS.map(c=>`<div class="cat"><h4>${c}</h4><div class="blocks">${Object.entries(T).filter(([,d])=>d.cat===c).map(([k,d])=>`<button class="blk" type="button" data-addtype="${k}"><b>${esc(d.label)}</b><small>${esc(d.hint)}</small></button>`).join('')}</div></div>`).join(''),'add');
}
function openProfile(){
 const p=S.profile;
 openDrawer('Profile',`<div id="prof-form" style="display:flex;flex-direction:column;gap:14px">${fieldHTML(F('avatar','Photo','image'),p.avatar,'p')}${[F('name','Name'),F('role','Headline'),F('bio','Bio','area'),F('location','Location'),F('status','Status')].map(f=>fieldHTML(f,p[f.k],'p')).join('')}<label class="chk"><input type="checkbox" id="p-statusOn" data-pk="statusOn"${p.statusOn?' checked':''}>Show status badge</label>
 <div class="grp"><h4>CV</h4>${fieldHTML(F('cv','CV (PDF)','pdf'),p.cv,'p')}${fieldHTML(F('cvNote','Détail sous le bouton'),p.cvNote||'1 page','p')}</div>
 <div class="grp"><h4>Coordonnées</h4>${fieldHTML(F('phone','Téléphone','tel'),p.phone,'p')}${fieldHTML(F('email','Email','email'),p.email,'p')}<span class="hint">Affichés dans la colonne de gauche avec un bouton Copier. Laisse vide pour masquer.</span></div>
 <div class="grp"><h4>Horaires de disponibilité</h4>
  <div class="fld"><span class="lb">Jours</span><div class="sizes days">${DAYS.map((d,i)=>`<button type="button" data-day="${i}" aria-pressed="${!!p.hours.days[i]}">${d}</button>`).join('')}</div></div>
  <label class="chk"><input type="checkbox" id="p-h-allday" data-hk="allDay"${p.hours.allDay?' checked':''}>24h/24 les jours cochés</label>
  <div class="two"${p.hours.allDay?' hidden':''} id="p-h-times"><div class="fld"><label for="p-h-from">De</label><input type="time" id="p-h-from" data-hk="from" value="${esc(p.hours.from)}"></div><div class="fld"><label for="p-h-to">À</label><input type="time" id="p-h-to" data-hk="to" value="${esc(p.hours.to)}"></div></div>
  <div class="fld"><label for="p-h-note">Note (facultatif)</label><input type="text" id="p-h-note" data-hk="note" value="${esc(p.hours.note||'')}" placeholder="Réponse sous 24 h"></div>
  <span class="hint">Le statut « Disponible maintenant » suit l’heure de Paris. Aucun jour coché = horaires masqués.</span></div>
 <div class="grp"><h4>Menu</h4><label class="chk"><input type="checkbox" id="p-showNav" data-pk="showNav"${p.showNav!==false?' checked':''}>Afficher le menu « Sur cette page »</label><span class="hint">Liste tes blocs « Section title » pour aller directement à une partie.</span></div></div>`,'profile');
}
const SKINS=[['auto','Auto',['#ECEEF1','#FFFFFF','#171A1F']],['porcelain','Porcelain',['#ECEEF1','#FFFFFF','#DADDE2']],['graphite','Graphite',['#0E1013','#171A1F','#2A2F37']],['sage','Sage',['#E3EAE4','#F7FAF7','#C8D5CA']],['midnight','Midnight',['#0B1020','#141B31','#26315A']],['paper','Paper',['#F3F2EF','#FFFFFF','#E2E0DA']]];
const ACCENTS=['#0B7A75','#2E5BFF','#E5484D','#D97706','#7C5CFF','#14161A','#DB2777','#16A34A'];
function openDesign(){
 const th=S.theme;
 openDrawer('Design',`<div class="fld"><span class="lb">Theme</span><div class="skins">${SKINS.map(([k,l,c])=>`<button type="button" class="skin" data-skin="${k}" aria-pressed="${th.skin===k}"><span class="pv" style="background:${c[0]}"><i style="background:${c[1]}"></i><i style="background:${c[2]}"></i></span>${l}</button>`).join('')}</div><span class="hint">Auto follows each visitor's light or dark setting.</span></div>
 <div class="fld"><span class="lb">Accent</span><div class="sw">${ACCENTS.map(a=>`<button type="button" data-accent="${a}" aria-pressed="${th.accent.toLowerCase()===a.toLowerCase()}" style="background:${a}" aria-label="Accent ${a}"></button>`).join('')}<input type="color" id="d-accent" value="${col(th.accent)||'#0B7A75'}" aria-label="Custom accent" style="width:34px;height:34px;border:0;background:none;padding:0"></div></div>
 <div class="fld"><span class="lb">Typeface</span><div class="sizes">${[['grotesk','Grotesk'],['editorial','Editorial'],['mono','Mono']].map(([k,l])=>`<button type="button" data-font="${k}" aria-pressed="${th.font===k}">${l}</button>`).join('')}</div></div>
 <div class="fld"><span class="lb">Profile position</span><div class="sizes">${[['side','Beside the grid'],['top','Above the grid']].map(([k,l])=>`<button type="button" data-layout="${k}" aria-pressed="${th.layout===k}">${l}</button>`).join('')}</div></div>
 <div class="fld"><label for="d-radius">Corner radius · <span id="rv">${th.radius}</span>px</label><input type="range" id="d-radius" min="6" max="36" value="${th.radius}"></div>
 <div class="fld"><label for="d-gap">Spacing · <span id="gv">${th.gap}</span>px</label><input type="range" id="d-gap" min="6" max="24" value="${th.gap}"></div>`,'design');
}
function openExport(){
 openDrawer('Export & import',`<p class="muted" style="font-size:13px">This JSON is your whole page. The PHP version stores exactly this in <code>data/page.json</code>, so you can design here and drop it into your site.</p>
 <div class="fld"><label for="x-out">Your page</label><textarea id="x-out" class="code" readonly>${esc(JSON.stringify(S,null,2))}</textarea></div>
 <div class="row-btns"><button class="btn sm pri" type="button" data-xact="copy">${ic('copy',14)}Copy JSON</button></div>
 <div class="grp"><h4>Import</h4><div class="fld"><label for="x-in">Paste a page JSON</label><textarea id="x-in" class="code" placeholder='{"profile":{...},"tiles":[...]}'></textarea></div><div class="row-btns"><button class="btn sm" type="button" data-xact="import">Replace page</button></div><span class="hint" id="x-msg"></span></div>
 <div class="grp"><h4>Account</h4><form id="pw-form" style="display:flex;flex-direction:column;gap:10px"><div class="fld"><label for="pw-cur">Current password</label><input type="password" id="pw-cur" autocomplete="current-password" required></div><div class="fld"><label for="pw-new">New password (10+ characters)</label><input type="password" id="pw-new" autocomplete="new-password" minlength="10" required></div><div class="row-btns"><button class="btn sm" type="submit">Change password</button><button class="btn sm ghost" type="button" data-act="logout">Log out</button></div><span class="hint" id="pw-msg"></span></form></div>`,'export');
}

/* drawer input handling */
function readImage(file,max=1600){const fd=new FormData();fd.append('file',file);fd.append('max',String(max));return api('upload',fd,true).then(j=>j.url)}
function readImageLocal(file,max=1200){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const img=new Image();img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.84))};img.onerror=rej;img.src=r.result};r.readAsDataURL(file)})}
dbody.addEventListener('input',async e=>{
 const el=e.target;
 const tf=el.closest('#tile-form');
 if(tf&&el.dataset.k){const t=byId(tf.dataset.id);t.data[el.dataset.k]=el.value;renderGrid();save();return}
 if(el.dataset.opt){const t=byId(ui.sel);if(!t)return;t[el.dataset.opt]=el.type==='checkbox'?el.checked:el.value;renderGrid();save();return}
 if(el.closest('#prof-form')&&el.dataset.k){S.profile[el.dataset.k]=el.value;renderProfile();save();return}
 if(el.dataset.pk){S.profile[el.dataset.pk]=el.checked;renderProfile();save();return}
 if(el.dataset.hk){S.profile.hours[el.dataset.hk]=el.type==='checkbox'?el.checked:el.value;if(el.dataset.hk==='allDay'){const t=document.getElementById('p-h-times');if(t)t.hidden=el.checked}renderProfile();save();return}
 if(el.id==='d-accent'){S.theme.accent=el.value;applyTheme();$$('[data-accent]',dbody).forEach(b=>b.setAttribute('aria-pressed','false'));save();return}
 if(el.id==='d-radius'){S.theme.radius=+el.value;$('#rv').textContent=el.value;applyTheme();save();return}
 if(el.id==='d-gap'){S.theme.gap=+el.value;$('#gv').textContent=el.value;applyTheme();save();return}
});
dbody.addEventListener('change',async e=>{
 const el=e.target;
 if(el.dataset.pdf&&el.files&&el.files[0]){
  const fd=new FormData();fd.append('file',el.files[0]);toast('Uploading PDF…');
  try{const j=await api('upload-doc',fd,true);if(ui.drawer==='profile'){S.profile[el.dataset.pdf]=j.url;renderProfile();openProfile()}else{const t=byId(ui.sel);t.data[el.dataset.pdf]=j.url;renderGrid();openTile(t.id)}save();toast('PDF uploaded')}
  catch(err){toast('Upload failed: '+err.message)}
  return}
 if(el.dataset.img&&el.files&&el.files[0]){
  try{const url=await readImage(el.files[0],el.dataset.img==='avatar'?600:1200);
   if(ui.drawer==='profile'){S.profile.avatar=url;renderProfile();openProfile()}else{const t=byId(ui.sel);t.data[el.dataset.img]=url;renderGrid();openTile(t.id)}save()}catch(err){toast('Upload failed: '+(err&&err.message||'not an image'))}
 }
 if(el.dataset.imgs&&el.files&&el.files.length){
  const t=byId(ui.sel);const arr=(t.data[el.dataset.imgs]||[]).slice();
  for(const f of Array.from(el.files).slice(0,12)){try{arr.push(await readImage(f))}catch(err){}}
  t.data[el.dataset.imgs]=arr;renderGrid();openTile(t.id);save();
 }
});
dbody.addEventListener('submit',e=>{if(e.target.id!=='pw-form')return;e.preventDefault();const m=$('#pw-msg');m.textContent='Saving…';api('password',{current:$('#pw-cur').value,next:$('#pw-new').value}).then(()=>{m.textContent='Password changed.';e.target.reset()}).catch(err=>{m.textContent=err.message})});
dbody.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.addtype){addTile(b.dataset.addtype);return}
 if(b.dataset.day!=null){const i=+b.dataset.day;S.profile.hours.days[i]=S.profile.hours.days[i]?0:1;b.setAttribute('aria-pressed',!!S.profile.hours.days[i]);renderProfile();save();return}
 if(b.dataset.size){const t=byId(ui.sel);t.size=b.dataset.size;$$('[data-size]',dbody).forEach(x=>x.setAttribute('aria-pressed',x===b));renderGrid();save();return}
 if(b.dataset.clear){if(ui.drawer==='profile'){S.profile[b.dataset.clear]='';renderProfile();openProfile()}else{const t=byId(ui.sel);t.data[b.dataset.clear]='';renderGrid();openTile(t.id)}save();return}
 if(b.dataset.rmimg!=null){const t=byId(ui.sel);const k=T[t.type].fields.find(f=>f.t==='images').k;t.data[k].splice(+b.dataset.rmimg,1);renderGrid();openTile(t.id);save();return}
 if(b.dataset.tact==='dup'){dupTile(ui.sel);return}
 if(b.dataset.tact==='del'){delTile(ui.sel);return}
 if(b.dataset.skin){S.theme.skin=b.dataset.skin;$$('[data-skin]',dbody).forEach(x=>x.setAttribute('aria-pressed',x===b));applyTheme();save();return}
 if(b.dataset.accent){S.theme.accent=b.dataset.accent;$$('[data-accent]',dbody).forEach(x=>x.setAttribute('aria-pressed',x===b));$('#d-accent').value=b.dataset.accent;applyTheme();save();return}
 if(b.dataset.font){S.theme.font=b.dataset.font;$$('[data-font]',dbody).forEach(x=>x.setAttribute('aria-pressed',x===b));applyTheme();save();return}
 if(b.dataset.layout){S.theme.layout=b.dataset.layout;$$('[data-layout]',dbody).forEach(x=>x.setAttribute('aria-pressed',x===b));applyTheme();save();return}
 if(b.dataset.xact==='copy'){const ta=$('#x-out');copyText(ta.value,ta);return}
 if(b.dataset.xact==='import'){try{const o=JSON.parse($('#x-in').value);if(!o||!Array.isArray(o.tiles)||!o.profile)throw new Error('shape');o.theme=Object.assign({},seed().theme,o.theme||{});o.stats=Object.assign({sample:false,views:0,days:Array(14).fill(0),clicks:{},leads:[]},o.stats||{});S=o;save();render();openExport();toast('Page imported')}catch(err){$('#x-msg').textContent='That is not a valid page JSON. It needs "profile" and "tiles".'}return}
 if(b.dataset.xact==='reset'){const old=S;S=seed();save();render();openExport();toast('Sample page restored',()=>{S=old;save();render()});return}
});

/* ---------- Tile operations ---------- */
function addTile(type){
 const def=T[type];const t={id:uid(),type,size:def.size,data:JSON.parse(JSON.stringify(def.def))};
 const i=ui.sel?S.tiles.findIndex(x=>x.id===ui.sel):-1;
 if(i>=0)S.tiles.splice(i+1,0,t);else S.tiles.push(t);
 save();if(ui.mode!=='edit'){ui.mode='edit';render()}openTile(t.id);
 requestAnimationFrame(()=>{const el=grid.querySelector(`[data-id="${t.id}"]`);if(el)el.scrollIntoView({block:'nearest',behavior:'smooth'})});
}
function dupTile(id){const i=S.tiles.findIndex(t=>t.id===id);if(i<0)return;const c=JSON.parse(JSON.stringify(S.tiles[i]));c.id=uid();S.tiles.splice(i+1,0,c);save();openTile(c.id);toast('Block duplicated')}
function delTile(id){const i=S.tiles.findIndex(t=>t.id===id);if(i<0)return;const [t]=S.tiles.splice(i,1);closeDrawer();ui.sel=null;renderGrid();save();toast('Block deleted',()=>{S.tiles.splice(i,0,t);renderGrid();save()})}
function moveTile(id,dir){const i=S.tiles.findIndex(t=>t.id===id);const j=i+dir;if(i<0||j<0||j>=S.tiles.length)return;[S.tiles[i],S.tiles[j]]=[S.tiles[j],S.tiles[i]];renderGrid();save();const el=grid.querySelector(`[data-id="${id}"] [data-tb="${dir<0?'left':'right'}"]`);if(el)el.focus()}

function copyText(text,fallbackEl){
 const done=()=>toast('Copié');
 try{navigator.clipboard.writeText(text).then(done,()=>{sel(fallbackEl)})}catch(e){sel(fallbackEl)}
 function sel(el){if(!el)return;if(el.select){el.focus();el.select()}else{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}toast('Selected. Press Ctrl+C to copy.')}
}

/* ---------- Grid events ---------- */
grid.addEventListener('click',e=>{
 const act=e.target.closest('[data-act]');if(act&&grid.contains(act)){handleAct(act.dataset.act);return}
 const tile=e.target.closest('.tile');if(!tile)return;const id=tile.dataset.id;
 if(ui.mode==='edit'){
  e.preventDefault();
  const tb=e.target.closest('[data-tb]');
  if(tb){const k=tb.dataset.tb;const t=byId(id);
   if(k==='size'){t.size=tb.dataset.v;renderGrid();save();if(ui.drawer==='tile'&&ui.sel===id)openTile(id)}
   else if(k==='left')moveTile(id,-1);else if(k==='right')moveTile(id,1);else if(k==='edit')openTile(id);else if(k==='del')delTile(id);
   return}
  openTile(id);return;
 }
 const yt=e.target.closest('.tile') && tile.querySelector('[data-yt]');
 if(yt&&!e.target.closest('[data-copy]')){e.preventDefault();count(id);const v=yt.dataset.yt;const box=tile.querySelector('.ti');box.outerHTML=`<div class="ti" style="padding:0"><iframe class="embed" style="border-radius:inherit" src="https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe></div>`;return}
 const cp=e.target.closest('[data-copy]');if(cp){copyText(cp.dataset.copy,cp.previousElementSibling);count(id);return}
 if(e.target.closest('[data-track]'))count(id);
});
grid.addEventListener('keydown',e=>{
 if(ui.mode!=='edit')return;const tile=e.target.closest('.tile');if(!tile||e.target!==tile)return;
 if(e.key==='Enter'||e.key===' '){e.preventDefault();openTile(tile.dataset.id)}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();delTile(tile.dataset.id)}
});
grid.addEventListener('submit',e=>{
 const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();
 if(ui.mode==='edit')return;const inp=f.querySelector('input');const v=(inp.value||'').trim();if(!v)return;
 if(PUBLIC){api('lead',{email:v,id:f.dataset.form}).catch(()=>{})}
 const ft=byId(f.dataset.form);
 f.innerHTML=`<b class="t-title">${esc(ft?ft.data.title:'')}</b><div class="thanks">${ic('check',18)}Inscription confirmée.</div>`;
});
function count(id){if(!id||!PUBLIC)return;beacon({type:'click',id})}

/* drag & drop reorder */
let dragId=null;
grid.addEventListener('dragstart',e=>{const t=e.target.closest('.tile');if(!t||ui.mode!=='edit')return;dragId=t.dataset.id;t.classList.add('dragging');try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move'}catch(err){}});
grid.addEventListener('dragover',e=>{if(!dragId)return;const t=e.target.closest('.tile');if(!t||t.dataset.id===dragId)return;e.preventDefault();$$('.tile.drop',grid).forEach(x=>x!==t&&x.classList.remove('drop'));t.classList.add('drop')});
grid.addEventListener('dragleave',e=>{const t=e.target.closest('.tile');if(t&&!t.contains(e.relatedTarget))t.classList.remove('drop')});
grid.addEventListener('drop',e=>{const t=e.target.closest('.tile');if(!dragId||!t)return;e.preventDefault();
 const from=S.tiles.findIndex(x=>x.id===dragId);const [m]=S.tiles.splice(from,1);let to=S.tiles.findIndex(x=>x.id===t.dataset.id);
 const r=t.getBoundingClientRect();if((e.clientX-r.left)>r.width/2||(e.clientY-r.top)>r.height*.75)to++;
 S.tiles.splice(to,0,m);dragId=null;renderGrid();save()});
grid.addEventListener('dragend',()=>{dragId=null;$$('.tile.drop,.tile.dragging',grid).forEach(x=>x.classList.remove('drop','dragging'))});

/* ---------- Global actions ---------- */
function setMode(m){
 if(m===ui.mode)return;
 if(ui.drawer)closeDrawer();
  ui.mode=m;ui.sel=null;render();window.scrollTo({top:0});
}
function handleAct(a){
 if(a==='add')return openAdd();
 if(a==='design')return openDesign();
 if(a==='export')return openExport();
 if(a==='profile'){if(ui.mode==='edit')openProfile();return}
 if(a==='close')return closeDrawer();
 if(a==='hide-banner'){S.sample=false;save();render();return}
 if(a==='empty'){const old=JSON.parse(JSON.stringify(S));S.tiles=[];S.sample=false;S.stats={sample:false,views:0,days:Array(14).fill(0),clicks:{},leads:[]};save();render();toast('Page cleared',()=>{S=old;save();render()});return}
 if(a==='reset-stats'){api('reset-stats',{}).then(()=>{S.stats={sample:false,views:0,days:Array(14).fill(0),clicks:{},leads:S.stats.leads||[]};render();toast('Chiffres réinitialisés')}).catch(e=>toast(e.message));return}
 if(a==='logout'){flush();api('logout',{}).finally(()=>{location.href='admin.php'});return}
}
document.addEventListener('click',e=>{
 const m=e.target.closest('[data-mode]');if(m){setMode(m.dataset.mode);return}
 const a=e.target.closest('[data-act]');if(a&&!grid.contains(a))handleAct(a.dataset.act);
});

paintIcons();render();
if(PUBLIC)beacon({type:'view'});
})();
