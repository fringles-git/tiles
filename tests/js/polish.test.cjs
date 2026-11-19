const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../public/assets/js/polish.js'),'utf8'),{window,URL});const p=window.TilesPolish;
test('contact CTA uses the saved email, existing tracking IDs and safe booking fallback',()=>{assert.equal(p.contact({email:'hello@example.com'}).track,'p-mail');assert.match(p.contact({email:'hello@example.com'}).href,/^mailto:hello@example.com\?subject=/);assert.equal(p.contact({email:'bad\nemail',booking:'javascript:alert(1)'}),null);assert.equal(p.contact({booking:'https://cal.example/test'}).track,'p-rdv');assert.equal(p.contact({booking:'https://secret:password@example.com'}),null);});
test('CTA text meets AA across every author accent, including light custom accents',()=>{for(const bg of ['#0B7A75','#2E5BFF','#E5484D','#D97706','#7C5CFF','#14161A','#DB2777','#16A34A','#FFF','#FFEFAA'])assert(p.contrast(bg,p.ink(bg))>=4.5,bg);});
test('secondary text tokens meet AA on every plain skin background and surface',()=>{for(const [fg,bg,surface]of [['#59616B','#ECEEF1','#FFFFFF'],['#99A0AA','#0E1013','#171A1F'],['#52635A','#E3EAE4','#F7FAF7'],['#9AA4C2','#0B1020','#141B31'],['#625E58','#F3F2EF','#FFFFFF']]){assert(p.contrast(fg,bg)>=4.5,fg+' on '+bg);assert(p.contrast(fg,surface)>=4.5,fg+' on '+surface);}});
test('visitor preference is bounded and tolerates storage denial',()=>{assert.equal(p.preference({getItem:()=> 'dark'}),'dark');assert.equal(p.preference({getItem:()=> 'light'}),'light');assert.equal(p.preference({getItem:()=> 'invalid'}),'site');assert.equal(p.preference({getItem(){throw Error('blocked')}}),'site');});
test('search highlighting preserves accents and escapes untrusted titles and queries',()=>{assert.equal(p.marked('Église <React>','eglise'),'<mark>Église</mark> &lt;React&gt;');assert.equal(p.marked('<script>','<script>'),'<mark>&lt;script&gt;</mark>');assert.equal(p.marked('React React','react'),'<mark>React</mark> <mark>React</mark>');assert.equal(p.marked('Photos','missing'),'Photos');});
test('contact block: clickable text, small copy buttons, booking only with a real link',()=>{
 const env={esc:s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),ic:n=>'<svg data-i="'+n+'"></svg>',telHref:n=>'tel:'+String(n).replace(/\s/g,''),safeUrl:u=>/^https?:\/\//.test(u||'')?u:''};
 const html=p.contactRows({phone:'+33 7 69 20 78 36',email:'a@b.fr',booking:''},env).join('');
 assert.match(html,/<a class="pl" href="tel:\+33769207836"><span>\+33 7 69 20 78 36<\/span><\/a>/);
 assert.match(html,/<a class="pl" href="mailto:a@b\.fr" data-pclick="p-mail">/);
 assert.doesNotMatch(html,/Appeler|Prendre rendez-vous|>Copier</);
 assert.equal((html.match(/data-copy=/g)||[]).length,2);assert.equal((html.match(/aria-label="Copier/g)||[]).length,2);
 const withBook=p.contactRows({phone:'',email:'a@b.fr',booking:'https://cal.com/x'},env).join('');
 assert.match(withBook,/href="https:\/\/cal\.com\/x"[^>]*rel="noopener"[^>]*data-pclick="p-rdv"/);
 assert.doesNotMatch(p.contactRows({email:'a@b.fr',booking:'javascript:alert(1)'},env).join(''),/Prendre rendez-vous/);
 const closed=p.contactRows({phone:'0102030405'},{...env,canCall:false}).join('');assert.doesNotMatch(closed,/href="tel:/);assert.match(closed,/0102030405/);
 assert.match(p.contactRows({email:'a"<b>@x.fr'},env).join(''),/a&quot;&lt;b>@x\.fr/);
 assert.deepEqual([...p.contactRows({},env)],[]);
});
test('bio drops a closing "Basé à <ville>" sentence already shown by the location chip',()=>{
 assert.equal(p.dedupeBio('Je crée des sites. Basé à Troyes.','Troyes, France'),'Je crée des sites.');
 assert.equal(p.dedupeBio('Je crée des sites. Basée à Troyes, France.','Troyes, France'),'Je crée des sites.');assert.equal(p.dedupeBio('Je crée des sites. Basé à Troyes, je travaille aussi à distance.','Troyes'),'Je crée des sites. Basé à Troyes, je travaille aussi à distance.');assert.equal(p.dedupeBio('Je crée des sites. Basé à Parisot.','Paris'),'Je crée des sites. Basé à Parisot.');
 assert.equal(p.dedupeBio('Je crée des sites. Basé à Paris.','Troyes, France'),'Je crée des sites. Basé à Paris.');
 assert.equal(p.dedupeBio('Basé à Troyes.','Troyes'),'Basé à Troyes.');
 assert.equal(p.dedupeBio('Je crée des sites. Basé à Troyes.',''),'Je crée des sites. Basé à Troyes.');
});
test('stats summary: period totals, every clicked block, per-channel aggregation and /go/ counts',()=>{
 const tiles=[{id:'ig',type:'social',data:{platform:'instagram'}},{id:'gh',type:'social',data:{platform:'github'}},{id:'ln',type:'link',data:{title:'Site'}}];
 const st={days:[5,5,10,20],clicks:{ig:99,ln:1},go:{ln:3},clickDays:[{ig:50},{},{ig:2,gh:1},{ln:4,'p-cv':1,old:2}]};
 const s=p.statsSummary(st,tiles,2);
 assert.equal(s.views,30);assert.equal(s.clicks,10);assert.equal(s.ctr,33);assert.equal(s.cv,1);assert.ok(s.exact);
 assert.deepEqual([...s.rows].map(r=>[r.id,r.clicks]),[['ln',4],['ig',2],['old',2],['gh',1],['p-cv',1]]);
 assert.equal(s.rows[0].go,3);assert.equal(s.rows[0].share,40);assert.equal(s.rows.find(r=>r.id==='old').channel,'deleted');
 assert.deepEqual([...s.channels].map(c=>c[0]),['link','instagram','deleted','github','cv']);
 const legacy=p.statsSummary({days:[1],clicks:{ig:3}},tiles,7);assert.equal(legacy.exact,false);assert.equal(legacy.clicks,3);
 assert.equal(p.statsSummary({},[],7).ctr,0);
});
