const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process');
const root=path.join(__dirname,'../..'),php=process.env.PHP_BINARY||'php';
const available=process.env.TILES_SKIP_HTTP!=='1'&&spawnSync(php,['-v'],{stdio:'ignore'}).status===0;
test('PHP public boundary, legacy media URLs, login/CSRF, journal persistence and unchanged runtime', {skip:!available?'PHP CLI unavailable':false,timeout:30000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'tiles-http-')),data=path.join(tmp,'data'),uploads=path.join(tmp,'uploads');await fs.mkdir(data);await fs.mkdir(uploads);
 const env={...process.env,TILES_DATA_DIR:data,TILES_UPLOAD_DIR:uploads,TILES_WIDGETS_OFF:'1'};
 const password=crypto.randomBytes(24).toString('hex');
 let setup=spawnSync(php,['scripts/setup-admin.php'],{cwd:root,env,input:password+'\n',encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);const auth=await fs.readFile(path.join(data,'auth.json'),'utf8');
 setup=spawnSync(php,['scripts/setup-admin.php'],{cwd:root,env,input:'do-not-replace\n',encoding:'utf8'});assert.equal(setup.status,1);assert.equal(await fs.readFile(path.join(data,'auth.json'),'utf8'),auth);
 const page=JSON.parse(await fs.readFile(path.join(data,'page.json'),'utf8'));page.journal=[{id:'draft-1',title:'Private draft title',universe:'humain',content:'Draft content',excerpt:'',date:'2026-11-11',published:false},{id:'published-1',title:'Published article',universe:'crea',content:'# Hello\n**Markdown**',excerpt:'',date:'2026-11-11',published:true}];await fs.writeFile(path.join(data,'page.json'),JSON.stringify(page));
 await fs.writeFile(path.join(uploads,'malicious.php'),'<?php echo "should-not-execute";');await fs.writeFile(path.join(uploads,'malicious.jpg'),'<script>no</script>');await fs.symlink(path.join(data,'auth.json'),path.join(uploads,'escape.pdf'));
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});const origin='http://127.0.0.1:'+port;
 const server=spawn(php,['-S','127.0.0.1:'+port,'-t','public','scripts/dev-router.php'],{cwd:root,env,stdio:'ignore'});
 const request=async(url,opts={})=>{const response=await fetch(origin+url,opts);const bytes=await response.arrayBuffer();return new Response(opts.method==='HEAD'||[204,205,304].includes(response.status)?null:bytes,{status:response.status,headers:response.headers});};const boot=html=>JSON.parse(html.match(/window.TILES_BOOT=(.*?);<\/script>/s)[1]);
 try{
  let ready=false;for(let i=0;i<100;i++){try{await request('/');ready=true;break;}catch{await new Promise(r=>setTimeout(r,40));}}assert(ready,'PHP server started');
  const home=await request('/');assert.equal(home.status,200);const html=await home.text();const publicPage=boot(html).page;assert.equal(publicPage.journal.length,1);assert(!html.includes('Private draft title'));assert.equal(publicPage.tiles.length,page.tiles.length);
  for(const resource of ['/src/lib.php','/config/config.example.php','/config.local.php','/data/page.json','/seed/data/auth.json','/.git/config','/tests/php/football.test.php','/uploads/malicious.php','/uploads/malicious.jpg','/uploads/escape.pdf','/media.php?file=../data/auth.json','/media.php?file[]=car-0.jpg'])assert.equal((await request(resource)).status,404,resource);
  for(const asset of ['css/app.css','css/experience.css','css/widgets.css','css/hub.css','js/app.js','js/experience.js','js/widgets.js','js/hub.js','images/brands/react.svg','images/flags/fr.svg','vendor/qrcode.min.js'])assert.equal((await request('/assets/'+asset)).status,200,asset);
  let media=await request('/uploads/car-0.jpg');assert.equal(media.status,200);assert.equal(media.headers.get('content-type'),'image/jpeg');assert.equal(media.headers.get('x-content-type-options'),'nosniff');const etag=media.headers.get('etag');assert.equal((await request('/uploads/car-0.jpg',{headers:{'If-None-Match':etag}})).status,304);
  media=await request('/uploads/cv-brandon-lazarre.pdf',{method:'HEAD'});assert.equal(media.status,200);assert.equal(media.headers.get('content-type'),'application/pdf');assert(Number(media.headers.get('content-length'))>100);
  assert.equal((await request('/media.php?file=car-0.jpg',{method:'POST'})).status,405);
  assert.equal((await request('/api.php?action=save',{method:'POST',body:'{}'})).status,401);
  const login=await request('/admin.php');const loginHtml=await login.text(),csrf=loginHtml.match(/name="csrf" value="([^"]+)"/)[1];let cookie=login.headers.get('set-cookie').split(';')[0];
  const signed=await request('/admin.php',{method:'POST',redirect:'manual',headers:{cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf,password})});assert.equal(signed.status,302);if(signed.headers.get('set-cookie'))cookie=signed.headers.get('set-cookie').split(';')[0];
  let editor=boot(await(await request('/admin.php',{headers:{cookie}})).text());assert.equal(editor.page.journal.length,2);const api=(action,body,token=editor.csrf)=>request('/api.php?action='+action,{method:'POST',headers:{cookie,'X-CSRF':token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await api('save',{page:editor.page,base:editor.page.rev},'invalid')).status,403);
  let saved=structuredClone(editor.page);saved.profile.bio+=' — HTTP test';saved.journal[0].published=true;saved.tiles[0].universe='crea';let response=await api('save',{page:saved,base:saved.rev});assert.equal(response.status,200);const rev=(await response.json()).rev;assert.equal(rev,saved.rev+1);
  assert.equal((await api('save',{page:saved,base:saved.rev})).status,409);
  saved.rev=rev;saved.journal[0].published='yes';assert.equal((await api('save',{page:saved,base:rev})).status,400);
  const persisted=JSON.parse(await fs.readFile(path.join(data,'page.json'),'utf8'));assert.equal(persisted.journal[0].published,true);assert.equal(persisted.tiles[0].universe,'crea');assert.deepEqual(persisted.tiles.map(t=>t.id),page.tiles.map(t=>t.id));assert.equal(await fs.readFile(path.join(data,'auth.json'),'utf8'),auth);
  const gd=spawnSync(php,['-r','exit(extension_loaded("gd") ? 0 : 1);'],{env,stdio:'ignore'}).status===0;
  if(gd){const form=new FormData();form.set('file',new Blob([await fs.readFile(path.join(uploads,'car-0.jpg'))],{type:'image/jpeg'}),'photo.jpg');form.set('max','600');response=await request('/api.php?action=upload',{method:'POST',headers:{cookie,'X-CSRF':editor.csrf},body:form});assert.equal(response.status,200);const uploaded=await response.json();assert.match(uploaded.url,/^uploads\/[a-f0-9]+\.jpg$/);assert.equal((await request('/'+uploaded.url)).status,200);}
  response=await request('/widgets.php?resource=unknown');assert.equal(response.status,400);assert.equal(response.headers.get('content-type'),'application/json; charset=utf-8');
 }finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await fs.rm(tmp,{recursive:true,force:true});}
});
