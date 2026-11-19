const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),php=process.env.PHP_BINARY||'php';
const available=process.env.TILES_SKIP_HTTP!=='1'&&spawnSync(php,['-v'],{stdio:'ignore'}).status===0;
test('Leap links redirect only to stored visible URLs and count real visits',{skip:!available?'PHP CLI unavailable':false,timeout:30000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'tiles-leap-')),data=path.join(tmp,'data'),uploads=path.join(tmp,'uploads');await fs.mkdir(data);await fs.mkdir(uploads);
 const tile=(id,url,extra={})=>({id,type:'link',data:{title:id,url},...extra});
 await fs.writeFile(path.join(data,'page.json'),JSON.stringify({v:1,profile:{name:'T'},tiles:[tile('ok','https://example.test/dest?a=1'),tile('hid','https://example.test/h',{hidden:true}),tile('js','javascript:alert(1)')],journal:[]}));
 const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const env={...process.env,TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_WIDGETS_OFF:'1'};
 const server=spawn(php,['-S','127.0.0.1:'+port,'-t','public','scripts/dev-router.php'],{cwd:root,env,stdio:'ignore'});
 const get=(u,opts={})=>fetch('http://127.0.0.1:'+port+u,{redirect:'manual',...opts});
 try{
  let up=false;for(let i=0;i<100;i++){try{await get('/robots.txt');up=true;break}catch{await new Promise(r=>setTimeout(r,40))}}assert(up);
  const hit=await get('/go/ok',{headers:{'user-agent':'Mozilla/5.0 test'}});
  assert.equal(hit.status,302);assert.equal(hit.headers.get('location'),'https://example.test/dest?a=1');assert.equal(hit.headers.get('cache-control'),'no-store');assert.match(hit.headers.get('x-robots-tag'),/noindex/);
  await get('/go/ok',{method:'HEAD'});await get('/go/ok',{headers:{'user-agent':'facebookexternalhit/1.1'}});
  const stats=JSON.parse(await fs.readFile(path.join(data,'stats.json'),'utf8'));
  assert.equal(stats.clicks.ok,1);assert.equal(stats.go.ok,1);
  for(const id of ['hid','js','missing','..%2Fetc'])assert.equal((await get('/go/'+id)).status,404,id);
  assert.equal((await get('/go/ok',{method:'POST',body:'x'})).status,404);
  assert.equal((await get('/go/ok?url=https://evil.test')).headers.get('location'),'https://example.test/dest?a=1');
 }finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await fs.rm(tmp,{recursive:true,force:true})}
});
