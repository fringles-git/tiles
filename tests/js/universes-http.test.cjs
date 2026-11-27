const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),php=process.env.PHP_BINARY||'php';
const available=process.env.TILES_SKIP_HTTP!=='1'&&spawnSync(php,['-v'],{stdio:'ignore'}).status===0;
test('custom universes get their own URL, sitemap entry and 404 for removed or unknown slugs',{skip:!available?'PHP CLI unavailable':false,timeout:30000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'tiles-uni-')),data=path.join(tmp,'data'),uploads=path.join(tmp,'uploads');await fs.mkdir(data);await fs.mkdir(uploads);
 await fs.writeFile(path.join(data,'page.json'),JSON.stringify({v:1,profile:{name:'Jane Doe',role:'Designer',bio:'Bio'},universes:[{key:'engage',slug:'engagement',label:'Engagement',accent:'',question:'TBD'},{key:'pro',slug:'parcours',label:'Parcours'}],tiles:[{id:'a',type:'project',universe:'engage',data:{title:'Engaged project'}},{id:'b',type:'project',data:{title:'Career project'}}]}));
 const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const env={...process.env,TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_WIDGETS_OFF:'1',TILES_SITE_URL:'https://example.test'};
 const server=spawn(php,['-S','127.0.0.1:'+port,'-t','public','scripts/dev-router.php'],{cwd:root,env,stdio:'ignore'});
 const get=u=>fetch('http://127.0.0.1:'+port+u);
 try{
  let up=false;for(let i=0;i<100;i++){try{await get('/robots.txt');up=true;break}catch{await new Promise(r=>setTimeout(r,40))}}assert(up);
  const ns=h=>h.match(/<noscript>([\s\S]*?)<\/noscript>/)[1];
  const engage=await get('/engagement');assert.equal(engage.status,200);const eh=await engage.text();
  assert.match(ns(eh),/<h1>Engagement · Jane Doe<\/h1>/);assert(ns(eh).includes('Engaged project'));assert(!ns(eh).includes('Career project'));
  assert.match(eh,/canonical" href="https:\/\/example\.test\/engagement"/);assert.match(ns(eh),/href="https:\/\/example\.test\/parcours">Parcours</);
  for(const gone of ['/profil','/nope','/admin']){const r=await get(gone);assert.equal(r.status,404,gone);assert.match(await r.text(),/content="noindex"/,gone);}
  const xml=await(await get('/sitemap.xml')).text();assert(xml.includes('/engagement</loc>'));assert(!xml.includes('/profil</loc>'));
  assert.equal((await get('/version')).status,200,'fixed routes keep priority over universe slugs');
 }finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await fs.rm(tmp,{recursive:true,force:true})}
});
