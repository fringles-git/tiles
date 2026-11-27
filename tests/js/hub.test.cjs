const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../..'),window={};vm.runInNewContext(fs.readFileSync(path.join(root,'public/assets/js/hub.js'),'utf8'),{window,URL});const h=window.TilesHub;
test('universe filters retain original tile order, IDs and section ownership without mutation',()=>{const items=[{id:'h',type:'section',data:{title:'Work'}},{id:'a',type:'project',data:{title:'A'}},{id:'b',type:'image',data:{}},{id:'h2',type:'section',data:{title:'Personal'}},{id:'c',type:'sport',data:{}}];const before=JSON.stringify(items);assert.deepEqual(Array.from(h.filter(items,'crea'),t=>t.id),['h','b']);assert.deepEqual(Array.from(h.filter(items,'lifestyle'),t=>t.id),['h2','c']);assert.deepEqual(Array.from(h.filter(items,'all'),t=>t.id),['u-parcours','h','a','u-creations','h-creations','b','u-passions','h2','c']);assert.equal(JSON.stringify(items),before);});
test('explicit universe overrides inferred categories while legacy IDs retain assignments',()=>{assert.equal(h.universe({id:'gc7otp1',type:'instrument'}),'crea');assert.equal(h.universe({id:'new',type:'sport'}),'lifestyle');assert.equal(h.universe({id:'new',type:'image',universe:'pro'}),'pro');});
test('existing seed pages remain importable; malformed and duplicate IDs are rejected',()=>{const page=JSON.parse(fs.readFileSync(path.join(root,'seed/data/page.json'),'utf8'));assert(h.validPage(page));assert(!h.validPage({...page,tiles:[page.tiles[0],page.tiles[0]]}));assert(!h.validPage({...page,tiles:[{id:'" onload=x',type:'image',data:{}}]}));});
test('journal accepts explicit drafts and rejects malformed publication data',()=>{const j={id:'j1',title:'Titre',excerpt:'',content:'**Texte**',date:'2026-11-11',universe:'crea',published:false};assert(h.validJournal([j]));assert(!h.validJournal([j,j]));assert(!h.validJournal([{...j,published:'yes'}]));assert(!h.validJournal([{...j,universe:'unknown'}]));assert(!h.validJournal([{...j,title:'x'.repeat(201)}]));assert.equal(h.minutes('mot '.repeat(401)),3);});
test('Markdown renders editorial structure and never executable HTML',()=>{const result=h.markdown('# Titre\n\n**gras**\n- Item\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>');assert.match(result,/<h2>Titre<\/h2>/);assert.match(result,/<strong>gras<\/strong>/);assert.match(result,/<ul><li>Item<\/li><\/ul>/);assert(!result.includes('<script>'));assert(!result.includes('<img'));assert.match(result,/&lt;script&gt;/);});
test('public sections: path slugs, legacy query, root-relative links and guiding questions',()=>{
 assert.equal(h.fromLocation('https://x.fr/parcours'),'pro');assert.equal(h.fromLocation('https://x.fr/sub/creations'),'crea');assert.equal(h.fromLocation('https://x.fr/?univers=lifestyle'),'lifestyle');assert.equal(h.fromLocation('https://x.fr/'),'all');assert.equal(h.fromLocation('https://x.fr/inconnu'),'all');
 assert.equal(h.sectionHref('/parcours','humain'),'/profil');assert.equal(h.sectionHref('/sub/index.php','crea'),'/sub/creations');assert.equal(h.sectionHref('/sub/passions','all'),'/sub/');
 assert.deepEqual(Object.values(h.universes).map(u=>u.label),['Profil','Parcours','Créations','Passions']);for(const u of Object.values(h.universes))assert.match(u.question,/\?$/);
 const g=h.grouped([{id:'a',type:'project',data:{}}]);assert.equal(g[0].type,'universe');assert.equal(g[0].data.count,1);assert.equal(g.length,2);
});
test('server and browser assign every tile to the same section (PHP/JS parity)',()=>{
 const {spawnSync}=require('node:child_process');
 const page=JSON.parse(fs.readFileSync(path.join(root,'seed/data/page.json'),'utf8'));
 const tiles=[...page.tiles,{id:'n1',type:'sport',data:{}},{id:'n2',type:'image',universe:'pro',data:{}},{id:'n3',type:'project',data:{}},{id:'n4',type:'faith',data:{}},{id:'n5',type:'image',universe:'bogus',data:{}}];
 const php=spawnSync(process.env.PHP_BINARY||'php',['-r','require "src/sections.php";$t=json_decode(stream_get_contents(STDIN),true);echo json_encode(array_map("tile_universe",$t));foreach(["humain","pro","crea","lifestyle"] as $k){echo "\n",json_encode(array_column(section_tiles($t,$k),"id"));}'],{cwd:root,input:JSON.stringify(tiles),encoding:'utf8'});
 if(php.error){return;}assert.equal(php.status,0,php.stderr);
 const [kinds,...sections]=php.stdout.trim().split('\n').map(JSON.parse);
 assert.deepEqual(kinds,tiles.map(t=>h.universe(t)));
 ['humain','pro','crea','lifestyle'].forEach((k,i)=>assert.deepEqual(sections[i],Array.from(h.filter(tiles,k),t=>t.id)));
});
test('journal slugs and Markdown are identical in PHP and JS',()=>{
 const {spawnSync}=require('node:child_process');
 const titles=['Souveraineté & flat-file : l’œuvre','Même titre','Même titre','Même titre','Même titre id1abcdef','Ça marche ? Oui!','***','Straße Æsir','x'.repeat(120)];
 const journal=titles.map((t,i)=>({id:'id'+i+'abcdef',title:t,content:'# T\n**b** *i* `c`\n- l\n> q\n<b>x</b>',published:true,date:'2026-11-0'+(i%9+1),universe:'pro',excerpt:''}));
 const php=spawnSync(process.env.PHP_BINARY||'php',['-r','require "src/journal.php";$j=json_decode(stream_get_contents(STDIN),true);echo json_encode([array_column(journal_published(["journal"=>$j]),"slug"),journal_markdown($j[0]["content"])],JSON_UNESCAPED_UNICODE);'],{cwd:root,input:JSON.stringify(journal),encoding:'utf8'});
 if(php.error)return;assert.equal(php.status,0,php.stderr);const [slugs,md]=JSON.parse(php.stdout);
 assert.deepEqual(slugs,Array.from(h.withSlugs(journal),j=>j.slug));assert.equal(md,h.markdown(journal[0].content));
 assert.equal(h.rootPath('/journal-abc'),'/');assert.equal(h.rootPath('/sub/parcours'),'/sub/');assert.equal(h.sectionHref('/journal-abc','pro'),'/parcours');
});
test('custom universes: validation is identical in PHP and JS',()=>{
 const {spawnSync}=require('node:child_process');
 const ok={key:'engage',slug:'engagement',label:'Engagement',accent:'#123456',question:'TBD'};
 const cases=[[ok],[{...ok,question:undefined,accent:undefined}],[],[{...ok,key:'Bad'}],[{...ok,slug:'admin'}],[{...ok,slug:'journal-x'}],[{...ok,slug:'-x'}],[{...ok,label:'  '}],[{...ok,label:'x'.repeat(41)}],[{...ok,accent:'red'}],[ok,{...ok,key:'b'}],[ok,{...ok,slug:'other'}],Array.from({length:13},(_,i)=>({...ok,key:'k'+i,slug:'s'+i})),Array.from({length:12},(_,i)=>({...ok,key:'k'+i,slug:'s'+i}))];
 const js=cases.map(c=>h.validUniverses(JSON.parse(JSON.stringify(c))));
 assert.deepEqual(js,[true,true,false,false,false,false,false,false,false,false,false,false,false,true]);
 const php=spawnSync(process.env.PHP_BINARY||'php',['-r','require "src/sections.php";foreach(json_decode(stream_get_contents(STDIN),true) as $c){echo json_encode(valid_universes($c)),"\\n";}'],{cwd:root,input:JSON.stringify(cases),encoding:'utf8'});
 if(php.error)return;assert.equal(php.status,0,php.stderr);assert.deepEqual(php.stdout.trim().split('\n').map(JSON.parse),js);
});
test('custom universes: same section for every tile in PHP and JS, deleted defaults fall back to the first universe',()=>{
 const {spawnSync}=require('node:child_process');
 const list=[{key:'pro',slug:'parcours',label:'Parcours'},{key:'engage',slug:'engagement',label:'Engagement'},{key:'humain',slug:'profil',label:'Profil'}];
 const tiles=[{id:'a',type:'project',data:{}},{id:'b',type:'sport',data:{}},{id:'c',type:'link',universe:'engage',data:{}},{id:'d',type:'social',data:{}},{id:'s',type:'section',data:{}},{id:'e',type:'instrument',data:{}},{id:'f',type:'clock',data:{}},{id:'wojpaqd',type:'link',data:{}}];
 try{
  h.setUniverses(list);
  assert.deepEqual(tiles.map(t=>h.universe(t)),['pro','pro','engage','humain','pro','pro','humain','pro']);
  assert.equal(h.fromLocation('https://x.fr/engagement'),'engage');assert.equal(h.fromLocation('https://x.fr/passions'),'all');
  const php=spawnSync(process.env.PHP_BINARY||'php',['-r','require "src/sections.php";$in=json_decode(stream_get_contents(STDIN),true);$k=array_column(tiles_universes(["universes"=>$in[0]]),"key");echo json_encode(array_map(fn($t)=>tile_universe($t,$k),$in[1])),"\\n";foreach($k as $key){echo json_encode(array_column(section_tiles($in[1],$key,$k),"id")),"\\n";}echo json_encode(section_by_slug("engagement",["universes"=>$in[0]])["key"]),"\\n",json_encode(section_by_slug("passions",["universes"=>$in[0]]));'],{cwd:root,input:JSON.stringify([list,tiles]),encoding:'utf8'});
  if(php.error)return;assert.equal(php.status,0,php.stderr);
  const [kinds,...rest]=php.stdout.trim().split('\n').map(JSON.parse);
  assert.deepEqual(kinds,tiles.map(t=>h.universe(t)));
  list.forEach((u,i)=>assert.deepEqual(rest[i],Array.from(h.filter(tiles,u.key),t=>t.id)));
  assert.equal(rest[3],'engage');assert.equal(rest[4],null);
 }finally{h.setUniverses(h.DEFAULTS);}
 assert.deepEqual(Object.keys(h.universes),['humain','pro','crea','lifestyle']);
});
test('custom universes: page validation checks every assignment against the page list',()=>{
 const base={profile:{},tiles:[{id:'a',type:'link',universe:'engage',data:{}}],universes:[{key:'engage',slug:'engagement',label:'Engagement'}]};
 assert.equal(h.validPage(base),true);
 assert.equal(h.validPage({...base,universes:undefined}),false,'custom key without the list');
 assert.equal(h.validPage({...base,tiles:[{id:'a',type:'link',universe:'pro',data:{}}]}),false,'default key removed from the list');
 assert.equal(h.validPage({...base,journal:[{id:'j',title:'t',excerpt:'',content:'c',date:'2026-11-27',universe:'engage',published:false}]}),true);
 assert.equal(h.validPage({...base,universes:[{key:'engage',slug:'api',label:'X'}]}),false,'reserved slug');
});
