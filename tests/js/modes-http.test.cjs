const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),php=process.env.PHP_BINARY||'php';
const available=process.env.TILES_SKIP_HTTP!=='1'&&spawnSync(php,['-v'],{stdio:'ignore'}).status===0;
async function serve(env){
 const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const server=spawn(php,['-S','127.0.0.1:'+port,'-t','public','scripts/dev-router.php'],{cwd:root,env:{...process.env,TILES_WIDGETS_OFF:'1',...env},stdio:'ignore'});
 const get=(u,opts={})=>fetch('http://127.0.0.1:'+port+u,{redirect:'manual',...opts});
 for(let i=0;i<100;i++){try{await get('/robots.txt');break}catch{await new Promise(r=>setTimeout(r,40))}}
 return {get,stop:()=>server.kill()};
}
test('deployment modes: public serves the page without admin, admin redirects public pages to site_url',{skip:!available?'PHP CLI unavailable':false,timeout:30000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'tiles-modes-')),data=path.join(tmp,'data'),uploads=path.join(tmp,'uploads');await fs.mkdir(data);await fs.mkdir(uploads);
 await fs.writeFile(path.join(data,'page.json'),JSON.stringify({v:1,profile:{name:'Jane'},tiles:[{id:'a',type:'link',data:{title:'A',url:'https://example.test/a'}}],journal:[]}));
 const pub=await serve({TILES_MODE:'public',TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_SITE_URL:'https://brandonlazarre.fr'});
 try{
  assert.equal((await pub.get('/')).status,200);
  assert.equal((await pub.get('/parcours')).status,200);
  assert.equal((await pub.get('/admin.php')).status,404);
  assert.equal((await pub.get('/api.php?action=save',{method:'POST',body:'{}'})).status,404);
  const track=await pub.get('/api.php?action=track',{method:'POST',body:JSON.stringify({type:'view'})});assert.equal(track.status,200);
  const stats=JSON.parse(await fs.readFile(path.join(data,'stats.json'),'utf8'));assert.equal(stats.views,1,'public visits are counted in the shared data directory');
  assert.equal((await pub.get('/go/a')).status,302);
 }finally{pub.stop()}
 const adm=await serve({TILES_MODE:'admin',TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_SITE_URL:'https://brandonlazarre.fr'});
 try{
  const home=await adm.get('/');assert.equal(home.status,301);assert.equal(home.headers.get('location'),'https://brandonlazarre.fr/');
  assert.equal((await adm.get('/parcours?x=1')).headers.get('location'),'https://brandonlazarre.fr/parcours');
  assert.equal((await adm.get('/sitemap.xml')).headers.get('location'),'https://brandonlazarre.fr/sitemap.xml');
  assert.match(await(await adm.get('/robots.txt')).text(),/Disallow: \//);
  assert.equal((await adm.get('/admin.php')).status,200);
  assert.equal((await adm.get('/go/a')).status,302,'existing short links keep working on the admin domain');
 }finally{adm.stop()}
 const noSite=await serve({TILES_MODE:'admin',TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_SITE_URL:''});
 try{assert.equal((await noSite.get('/')).status,200,'admin mode without site_url never redirects')}finally{noSite.stop()}
 await fs.rm(tmp,{recursive:true,force:true});
});
