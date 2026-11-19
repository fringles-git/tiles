const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),php=process.env.PHP_BINARY||'php';
const available=process.env.TILES_SKIP_HTTP!=='1'&&spawnSync(php,['-v'],{stdio:'ignore'}).status===0;
test('SEO endpoints and head metadata use the configured canonical origin',{skip:!available?'PHP CLI unavailable':false,timeout:30000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'tiles-seo-')),data=path.join(tmp,'data'),uploads=path.join(tmp,'uploads');await fs.mkdir(data);await fs.mkdir(uploads);
 await fs.writeFile(path.join(data,'page.json'),JSON.stringify({v:1,profile:{name:'Jane Doe',role:'Designer',bio:'Bio text'},tiles:[{id:'a',type:'project',data:{title:'Visible project',desc:'Readable by crawlers',url:'https://example.test/p'}},{id:'b',type:'link',hidden:true,data:{title:'Secret hidden',url:'https://example.test/s'}}],journal:[]}));
 const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const env={...process.env,TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_WIDGETS_OFF:'1',TILES_SITE_URL:'https://brandonlazarre.fr'};
 const server=spawn(php,['-S','127.0.0.1:'+port,'-t','public','scripts/dev-router.php'],{cwd:root,env,stdio:'ignore'});
 const get=u=>fetch('http://127.0.0.1:'+port+u,{headers:{host:'evil.test'}});
 try{
  let up=false;for(let i=0;i<100;i++){try{await get('/robots.txt');up=true;break}catch{await new Promise(r=>setTimeout(r,40))}}assert(up);
  const robots=await get('/robots.txt');assert.match(robots.headers.get('content-type'),/^text\/plain/);assert.match(await robots.text(),/Sitemap: https:\/\/brandonlazarre\.fr\/sitemap\.xml/);
  const sitemap=await get('/sitemap.xml');assert.match(sitemap.headers.get('content-type'),/^application\/xml/);const xml=await sitemap.text();assert(xml.includes('<loc>https://brandonlazarre.fr/</loc>'));assert(!xml.includes('evil.test'));
  const llms=await(await get('/llms.txt')).text();assert(llms.startsWith('# Jane Doe'));assert(llms.includes('Visible project'));assert(!llms.includes('Secret hidden'));
  const parcours=await(await get('/parcours')).text(),passions=await(await get('/passions')).text();
  assert.match(parcours,/<link rel="canonical" href="https:\/\/brandonlazarre\.fr\/parcours">/);
  const ns=h=>h.match(/<noscript>([\s\S]*?)<\/noscript>/)[1];
  assert(ns(parcours).includes('Visible project'));assert(!ns(passions).includes('Visible project'));assert(!ns(parcours).includes('Secret hidden'));
  assert.match(ns(passions),/<h1>Passions · /);assert.match(ns(passions),/href="https:\/\/brandonlazarre\.fr\/parcours">Parcours</);
  const home=await(await get('/')).text();
  assert(home.includes('<link rel="canonical" href="https://brandonlazarre.fr/">'));assert(!home.includes('evil.test'));
  assert(home.includes('name="robots" content="index, follow, max-image-preview:large"'));assert(home.includes('application/ld+json'));
  assert(home.includes('Readable by crawlers'));assert(!home.includes('Secret hidden</h3>'));
  const admin=await get('/admin.php');assert.match(admin.headers.get('x-robots-tag')||'',/noindex/);
 }finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await fs.rm(tmp,{recursive:true,force:true})}
});
