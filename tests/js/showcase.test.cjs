/* examples/showcase/page.json must show every capability of the editor, stay valid and contain no real data. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const page=JSON.parse(read('examples/showcase/page.json'));
const app=read('public/assets/js/app.js');
const keys=(src,re)=>[...src.matchAll(re)].map(m=>m[1]);
const types=[...new Set([...keys(app,/^ ([a-z0-9]+):\{label:'/gm),...keys(read('public/assets/js/widgets.js'),/^ ([a-z0-9]+):\{label:'/gm),...keys(read('public/assets/js/experience.js'),/T\.([a-z0-9]+)=\{label:/g),...keys(read('public/assets/js/bento.js'),/T\.([a-z0-9]+)=\{label:/g)])];
const platforms=keys(app.match(/const PLAT=\{.*\};/)[0],/([a-z]+):\['/g);
const sizes=keys(app.match(/const SIZES=\[.*\];/)[0],/\['([a-z]+)','/g);
const catalogue=Function('return '+app.match(/const CATALOGUE=(\{.*?\});/)[1])();

test('registry parsing still finds the block types, networks and sizes',()=>{
 assert.ok(types.length>=38,types.join());assert.equal(platforms.length,17);assert.deepEqual(sizes,['s','w','t','l','bar']);
});
test('the Add-block catalogue lists every block type exactly once',()=>{
 const listed=Object.values(catalogue).flat();assert.equal(new Set(listed).size,listed.length,'duplicate in CATALOGUE');
 assert.deepEqual([...listed].sort(),[...types].sort());
});
test('the showcase uses every block type, social network, size, display option and universe',()=>{
 const used=new Set(page.tiles.map(t=>t.type));for(const k of types)assert.ok(used.has(k),'missing block type '+k);
 const nets=new Set(page.tiles.filter(t=>t.type==='social').map(t=>t.data.platform));for(const p of platforms)assert.ok(nets.has(p),'missing network '+p);
 const sz=new Set(page.tiles.map(t=>t.size));for(const s of [...sizes,'full'])assert.ok(sz.has(s),'missing size '+s);
 for(const o of ['spot','hidden','start','end'])assert.ok(page.tiles.some(t=>t[o]!==undefined),'missing option '+o);
 const uni=new Set(page.tiles.map(t=>t.universe));for(const u of page.universes)assert.ok(uni.has(u.key),'empty universe '+u.key);
 assert.ok(page.universes.some(u=>!['humain','pro','crea','lifestyle'].includes(u.key)),'one custom universe');
 assert.ok(page.journal.some(j=>j.published)&&page.journal.some(j=>!j.published),'published and draft articles');
});
test('the showcase follows the catalogue order inside each universe section',()=>{
 const rank=Object.fromEntries(Object.values(catalogue).flat().map((k,i)=>[k,i]));
 let section=null,last=-1;
 for(const t of page.tiles){if(t.type==='section'){section=t.id;last=-1;continue;}if(section==='sc-s-sizes'||section==='sc-s-options')continue;assert.ok(rank[t.type]>=last,`${t.id} is out of catalogue order`);last=rank[t.type];}
});
test('the showcase is a valid page for the browser and the server',()=>{
 const w={};vm.runInNewContext(read('public/assets/js/hub.js'),{window:w,URL,document:undefined});assert.equal(w.TilesHub.validPage(page),true);
 const php=spawnSync(process.env.PHP_BINARY||'php',['-r','require "src/page-validation.php";echo valid_page(json_decode(stream_get_contents(STDIN),true))?"ok":"bad";'],{cwd:root,input:JSON.stringify(page),encoding:'utf8'});
 if(!php.error)assert.equal(php.stdout,'ok',php.stderr);
});
test('the showcase holds placeholders only: no personal data, no invented content',()=>{
 const json=JSON.stringify(page);
 assert.doesNotMatch(json,/brandon|lazarre|outlook|gmail|troyes|@|\+33|\b0[1-9](?:\s?\d{2}){4}\b|https?:\/\//i);
 const strings=[];const walk=v=>{if(typeof v==='string')strings.push(v);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};walk({profile:page.profile,tiles:page.tiles,journal:page.journal});
 for(const s of strings)assert.ok(s.length<=40,'long free text: '+s.slice(0,60));
 for(const u of page.universes)assert.equal(u.question,'TBD');
});
