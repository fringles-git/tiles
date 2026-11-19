const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../..');
const code=fs.readFileSync(path.join(root,'public/assets/js/experience.js'),'utf8');
const window={};vm.runInNewContext(code,{window,document:{currentScript:{src:'https://example.test/assets/js/experience.js'}},location:{href:'https://example.test/'},URL});
const api=window.TilesExperience;
function definitions(){const prefix=fs.readFileSync(path.join(root,'public/assets/js/app.js'),'utf8').split('const CATS')[0];const T=vm.runInNewContext(prefix+'return T;})();',{document:{}});api.enhance(T,(k,l,t,o)=>({k,l,t,o}));return T;}
test('search is accent insensitive and removes empty section headings',()=>{
const tiles=[{id:'a',type:'section',data:{title:'Projects'}},{id:'b',type:'project',data:{title:'Église',tags:'React'}},{id:'c',type:'section',data:{title:'Personal'}},{id:'d',type:'sport',data:{title:'PSG'}}];
assert.deepEqual(Array.from(api.filter(tiles,'eglise','projects'),x=>x.id),['a','b']);assert.deepEqual(Array.from(api.filter(tiles,'','personal'),x=>x.id),['c','d']);assert.equal(api.filter(tiles,'missing').length,0);
});
test('employer logos use exact company names and official destinations',()=>{
const html=api.employerLinks('Action, Hugo Boss, Basic-Fit, 3Media (support EDF)');assert.match(html,/brands\/action.svg/);assert.match(html,/basic-fit.com/);assert.match(html,/hugoboss.com/);assert.match(html,/edf.fr/);assert.equal(api.employerLinks('Transaction'),'');
});
test('language levels and notes use native details and escaped content',()=>{
const html=definitions().languages.render({title:'Langues',items:'English | C2 | <script>alert(1)</script>'});assert.match(html,/<details>/);assert.match(html,/flags\/gb.svg/);assert.match(html,/English/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
});
test('piano uses native buttons and photo preview preserves its caption',()=>{
const T=definitions();for(const size of ['s','w','t','l','bar']){const keys=T.instrument.render({name:'Piano'},{size});assert.equal((keys.match(/data-note=/g)||[]).length,13);assert.equal((keys.match(/key white/g)||[]).length,8);assert.equal((keys.match(/key black/g)||[]).length,5);assert.ok(!keys.includes('piano-buttons'));}
const html=T.image.render({image:'uploads/car-0.jpg',caption:'Photo <1>'},{id:'photo'});assert.match(html,/data-photo="photo"/);assert.match(html,/alt="Photo &lt;1&gt;"/);
});
test('Spotify iframe waits for activation',()=>{const T=definitions();const html=T.music.render({url:'https://open.spotify.com/track/123abc',service:'spotify',title:'Track'},{size:'l'});assert.ok(!html.includes('<iframe'));assert.match(html,/data-embed=/);});
test('branded assets contain no scripts or remote SVG references',()=>{for(const file of fs.readdirSync(path.join(root,'public/assets/images/brands')).filter(x=>x.endsWith('.svg'))){const svg=fs.readFileSync(path.join(root,'public/assets/images/brands',file),'utf8');assert.match(svg,/<svg/);assert.ok(!/<script|foreignObject|\son\w+=|<use/i.test(svg),file);}});
test('personal defaults are F1, PSG and France with separate declared language levels',()=>{const p=JSON.parse(fs.readFileSync(path.join(root,'seed/data/patches/004-sports-languages.json')));assert.equal(p.tiles['4j1ho8k'].data.follow,'f1');assert.equal(p.tiles['5h9duug'].data.follow,'psg');assert.equal(p.addTiles[0].tile.data.follow,'france');assert.equal(p.tiles.lang2026a.type,'languages');});

test('vCard escapes fields and rejects injected contact properties',()=>{const card=api.vcard({name:'Bradley;Test\nEMAIL:evil@example.com',role:'Dev, design',email:'a@example.com\nTEL:123',phone:'+33 (0)1 23'},'https://example.com/profile');assert.ok(card.includes('FN:Bradley\\;Test\\nEMAIL:evil@example.com'));assert.ok(card.includes('TITLE:Dev\\, design'));assert.ok(!card.includes('\r\nEMAIL;'));assert.ok(card.includes('TEL;TYPE=VOICE:+330123'));assert.ok(card.includes('URL:https://example.com/profile'));assert.ok(card.endsWith('END:VCARD\r\n'));});
test('project subfilters keep section ownership and identify SaaS before app',()=>{const tiles=[{id:'heading',type:'section',data:{title:'Projets'}},{id:'a',type:'project',data:{title:'Application',role:'SaaS PHP'}},{id:'b',type:'project',data:{title:'Festival',role:'App React'}},{id:'c',type:'project',data:{title:'Site église',role:'Web'}}];assert.deepEqual(Array.from(api.filter(tiles,'','projects','saas'),t=>t.id),['heading','a']);assert.deepEqual(Array.from(api.filter(tiles,'','projects','app'),t=>t.id),['heading','b']);assert.equal(api.filter(tiles,'','projects','experiment').length,0);});
test('language segments never invent a score for unknown free text',()=>{assert.equal(api.languageSegments('Not assessed'),'');assert.equal((api.languageSegments('C2').match(/class="filled"/g)||[]).length,5);assert.equal((api.languageSegments('Notions').match(/class="filled"/g)||[]).length,1);assert.match(api.languageSegments('C2'),/aria-hidden="true"/);});
test('timeline: dates, duration, place, logo or initials for any organisation, escaped',()=>{
 assert.equal(api.span('2023 – 2026'),'3 ans');assert.equal(api.span('2025 – 2026'),'1 an');assert.equal(api.span('2022 et 2026'),'');assert.equal(api.span('2022'),'');assert.equal(api.span('2024 – now'),(new Date().getFullYear()-2024)+(new Date().getFullYear()-2024>1?' ans':' an'));
 const html=api.timeline({title:'Parcours',items:'Agent | Hugo Boss Retail | 2022 – 2024 | Troyes\nStagiaire <b> | Mairie & Co | 2020'});
 assert.match(html,/2022 – 2024 · 2 ans/);assert.match(html,/Hugo Boss Retail · Troyes/);assert.match(html,/<span>HB<\/span>/);
 assert.match(html,/<span>M&amp;<\/span>|<span>MC<\/span>/);assert.match(html,/Stagiaire &lt;b&gt;/);assert.doesNotMatch(html,/<b>Stagiaire <b>/);
});
test('skills: brand colour via CSS mask for other brands, deterministic monogram for unknown skills',()=>{
 const html=definitions().skills.render({title:'Outils',items:'HTML, CSS, PHP, Adobe Suite, SQL'});
 assert.match(html,/--mark:#777BB4/);
 assert.equal((html.match(/skill-mono/g)||[]).length,2);assert.equal(api.skillMark('SQL'),api.skillMark('SQL'));
 assert.doesNotMatch(html,/<img class="brand-icon/);
});
test('duration is not recomputed when the dates field already states one',()=>{assert.equal(api.span('2017 – 2025 · 4 mois'),'');assert.equal(api.span('2024 – 2025 · 1 semaine'),'');assert.equal(api.span('2022 – 2024 (6 mois)'),'');});
test('logo library: one upload is reused for every line of the same organisation',()=>{
 api.setLibrary([{id:'a',type:'experience',data:{logoFor:'Hugo Boss',logo:'uploads/hb_1.png'}},{id:'b',type:'education',data:{logoFor:'Lycée Chrestien',logo:'uploads/lyc-2.jpg'}},{id:'c',type:'experience',data:{logoFor:'X',logo:'https://evil.test/x.png'}},{id:'d',type:'experience',data:{logoFor:'',logo:'uploads/none.png'}}]);
 assert.equal(api.libraryLogo('Hugo Boss Retail').logo,'uploads/hb_1.png');assert.equal(api.libraryLogo('hugo  boss')?.logo,undefined);assert.equal(api.libraryLogo('Boss Hugo'),null);
 assert.equal(api.libraryLogo('Lycée Chrestien de Troyes').logo,'uploads/lyc-2.jpg');assert.equal(api.libraryLogo('X'),null);assert.equal(api.libraryLogo('Xavier'),null);
 const html=api.timeline({title:'Parcours',items:'Agent | Hugo Boss Retail | 2022 | Troyes\nCaissier | Hugo Boss | 2026'});
 assert.equal((html.match(/src="uploads\/hb_1.png"/g)||[]).length,2);
 api.setLibrary([]);assert.doesNotMatch(api.timeline({title:'P',items:'Agent | Hugo Boss | 2022'}),/uploads\/hb_1/);
});
test('library keys with regex characters cannot break matching',()=>{api.setLibrary([{id:'a',type:'experience',data:{logoFor:'A+B (C)',logo:'uploads/ab.png'}}]);assert.equal(api.libraryLogo('Agence A+B (C) SARL').logo,'uploads/ab.png');assert.equal(api.libraryLogo('AAB C'),null);api.setLibrary([]);});
test('HTML5 and CSS keep their official colours; the logo files carry no scripts',()=>{
 const html=definitions().skills.render({title:'Outils',items:'HTML, CSS, PHP'});
 assert.match(html,/class="skill-img" src="[^"]*brands\/html5-color.svg"/);assert.match(html,/brands\/css-color.svg/);assert.match(html,/--mark:#777BB4/);
 for(const f of ['html5-color.svg','css-color.svg']){const svg=fs.readFileSync(path.join(root,'public/assets/images/brands',f),'utf8');assert.ok(!/<script|href=|onload|https?:\/\/(?!www\.w3\.org)/i.test(svg),f);}
});
test('search keeps a section header only when its group still has matching tiles',()=>{
 const tiles=[{id:'u-parcours',type:'universe',data:{title:'Parcours',question:'Quel est son cheminement concrètement ?'}},{id:'s',type:'section',data:{title:'Projets'}},{id:'p',type:'project',data:{title:'EventFlow'}},{id:'u-passions',type:'universe',data:{title:'Passions',question:'Qu’est-ce qui l’anime ?'}},{id:'t',type:'team',data:{club:'PSG'}}];
 assert.deepEqual(Array.from(api.filter(tiles,'eventflow'),t=>t.id),['u-parcours','s','p']);
 assert.equal(api.filter(tiles,'concretement').length,0);
 assert.deepEqual(Array.from(api.filter(tiles,'psg'),t=>t.id),['u-passions','t']);
});
