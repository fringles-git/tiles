const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'assets/experience.js'),'utf8');
const window={};vm.runInNewContext(code,{window,document:{currentScript:{src:'https://example.test/assets/experience.js'}},location:{href:'https://example.test/'},URL});
const api=window.TilesExperience;
function definitions(){const prefix=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split('const CATS')[0];const T=vm.runInNewContext(prefix+'return T;})();',{document:{}});api.enhance(T,(k,l,t,o)=>({k,l,t,o}));return T;}
test('search is accent insensitive and removes empty section headings',()=>{
const tiles=[{id:'a',type:'section',data:{title:'Projects'}},{id:'b',type:'project',data:{title:'Église',tags:'React'}},{id:'c',type:'section',data:{title:'Personal'}},{id:'d',type:'sport',data:{title:'PSG'}}];
assert.deepEqual(Array.from(api.filter(tiles,'eglise','projects'),x=>x.id),['a','b']);assert.deepEqual(Array.from(api.filter(tiles,'','personal'),x=>x.id),['c','d']);assert.equal(api.filter(tiles,'missing').length,0);
});
test('employer logos use exact company names and official destinations',()=>{
const html=api.employerLinks('Action, Hugo Boss, Basic-Fit, 3Media (support EDF)');assert.match(html,/brands\/action.svg/);assert.match(html,/basic-fit.com/);assert.match(html,/hugoboss.com/);assert.match(html,/edf.fr/);assert.equal(api.employerLinks('Transaction'),'');
});
test('language levels and notes use native details and escaped content',()=>{
const html=definitions().languages.render({title:'Langues',items:'English | C2 | <script>alert(1)</script>'});assert.match(html,/<details>/);assert.match(html,/>EN</);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
});
test('piano uses native buttons and photo preview preserves its caption',()=>{
const T=definitions();assert.equal((T.instrument.render({name:'Piano'},{size:'s'}).match(/data-note=/g)||[]).length,4);assert.equal((T.instrument.render({name:'Piano'},{size:'l'}).match(/data-note=/g)||[]).length,8);
const html=T.image.render({image:'uploads/car-0.jpg',caption:'Photo <1>'},{id:'photo'});assert.match(html,/data-photo="photo"/);assert.match(html,/alt="Photo &lt;1&gt;"/);
});
test('Spotify iframe waits for activation',()=>{const T=definitions();const html=T.music.render({url:'https://open.spotify.com/track/123abc',service:'spotify',title:'Track'},{size:'l'});assert.ok(!html.includes('<iframe'));assert.match(html,/data-embed=/);});
test('branded assets contain no scripts or remote SVG references',()=>{for(const file of fs.readdirSync(path.join(root,'assets/brands')).filter(x=>x.endsWith('.svg'))){const svg=fs.readFileSync(path.join(root,'assets/brands',file),'utf8');assert.match(svg,/<svg/);assert.ok(!/<script|foreignObject|\son\w+=|<use/i.test(svg),file);}});
test('personal defaults are F1, PSG and France with separate declared language levels',()=>{const p=JSON.parse(fs.readFileSync(path.join(root,'seed/patches/004-sports-languages.json')));assert.equal(p.tiles['4j1ho8k'].data.follow,'f1');assert.equal(p.tiles['5h9duug'].data.follow,'psg');assert.equal(p.addTiles[0].tile.data.follow,'france');assert.equal(p.tiles.lang2026a.type,'languages');});
