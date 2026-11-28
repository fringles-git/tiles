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
test('the showcase is a realistic demo: no placeholder, no personal data, fictional contacts only',()=>{
 const json=JSON.stringify(page);
 assert.doesNotMatch(json,/\bTBD\b/,'no placeholder left: empty fields are hidden, placeholders are not');
 assert.doesNotMatch(json,/brandon|lazarre|outlook|gmail|troyes/i,'no real personal data');
 // Contacts and links are fictional: reserved example domains, fiction phone range (+33 1 99 00).
 for(const m of json.matchAll(/[\w.+-]+@([\w.-]+)/g))assert.match(m[1],/^example\.(com|org|net)$/,'e-mail on a reserved domain: '+m[0]);
 const urls=[...json.matchAll(/https?:\/\/([^\/\s"]+)/g)].map(m=>m[1]);
 for(const host of urls)assert.ok(/^example\.(com|org|net)$/.test(host)||host==='www.youtube.com','link on a reserved domain: '+host);
 for(const m of json.matchAll(/\+33[\d\s]+/g))assert.match(m[0].replace(/\s/g,''),/^\+33199/,'fiction phone number: '+m[0]);
 for(const u of page.universes)assert.ok(u.question&&u.question!=='TBD','each universe has its question');
});
