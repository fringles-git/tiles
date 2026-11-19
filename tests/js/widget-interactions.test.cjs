const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../public/assets/js/widgets.js'),'utf8');
function harness(fail=false){
const listeners={},players=[],fetches=[],dialogs=new Map();
const window={addEventListener(){}},document={currentScript:{src:'https://example.test/assets/js/widgets.js'},addEventListener:(name,fn)=>listeners[name]=fn,hidden:false,getElementById:id=>dialogs.get(id)||null,querySelector:sel=>{const m=/data-widget-id="([^"]+)"/.exec(sel);return m&&cards.get(m[1])?cards.get(m[1]).c:null},createElement:()=>({style:{setProperty(){}},setAttribute(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false}}),body:{appendChild:d=>dialogs.set(d.id,d)}};
class Audio{constructor(){players.push(this)}async play(){this.started=true}pause(){this.paused=true}removeAttribute(){this.src=''}load(){this.released=true}addEventListener(){}}
const items=Array.from({length:12},(_,i)=>({name:'Station '+i,url:'https://example.test/'+i,country:'FR',codec:'MP3',bitrate:128}));
vm.runInNewContext(source,{window,document,URL,Map,Audio,AbortController,setTimeout,clearTimeout,location:{href:'https://example.test/'},fetch:async url=>{fetches.push(url);return {ok:!fail,json:async()=>fail?{ok:false,retryAfter:3600}:{ok:true,items:url.includes('f1-standings')?[{id:'a',code:'AAA',name:'A A',position:'1',points:'10',wins:'1',team:'T',teamId:'t'}]:url.includes('football-')?[{home:'Paris Saint-Germain',away:'Autre équipe',status:'SCHEDULED',date:'2099-01-01T20:00:00Z',homeScore:null,awayScore:null,competition:'Ligue 1'},{home:'France',away:'Autre équipe',status:'FINISHED',date:'2000-01-01T20:00:00Z',homeScore:null,awayScore:null,competition:'Coupe du monde'}]:items,source:'Fixture',updatedAt:'2026-11-06T12:00:00Z'}}}});
const cards=new Map();
window.TilesWidgets.bind(id=>cards.get(id).tile,()=>true);
function card(id,size='s',type='radio',follow='f1'){
const status={textContent:''},button={disabled:false},body={innerHTML:'',querySelector:()=>button};
const c={isConnected:true,dataset:{widget:type,widgetId:id,widgetSize:size},querySelector:s=>s==='.w-body'?body:status};
cards.set(id,{tile:{id,data:{genre:'gospel',follow}},c,status,body,button});return cards.get(id);
}
async function click(c,action,index,value){const b={dataset:{wAction:action,index:String(index),value},closest:()=>c.c};return listeners.click({target:{closest:()=>b}})}
return {card,click,fetches,players,listeners,document,dialogs,api:window.TilesWidgets};
}
test('concurrent cards share one fetch and render the correct item count',async()=>{
const h=harness(),a=h.card('a','s'),b=h.card('b','l');
assert.equal(h.fetches.length,0);
await Promise.all([h.click(a,'load'),h.click(b,'load')]);
assert.equal(h.fetches.length,1);assert.equal((a.body.innerHTML.match(/<li>/g)||[]).length,1);assert.equal((b.body.innerHTML.match(/<li>/g)||[]).length,8);assert.equal(h.players.length,0);
await h.click(a,'load');assert.equal(h.fetches.length,1);
});
test('one player at a time and hiding the page releases its stream',async()=>{
const h=harness(),a=h.card('a');await h.click(a,'load');await h.click(a,'play',0);await h.click(a,'play',1);
assert.equal(h.players.length,2);assert.equal(h.players[0].released,true);assert.equal(h.players[1].started,true);assert.equal(h.players[1].preload,'none');
h.document.hidden=true;h.listeners.visibilitychange();assert.equal(h.players[1].released,true);
});
test('failed requests back off instead of retrying on every click',async()=>{
const h=harness(true),a=h.card('a');await h.click(a,'load');await h.click(a,'load');
assert.equal(h.fetches.length,1);assert.equal(a.button.disabled,false);assert.ok(a.status.textContent.includes('indisponible'));assert.ok(!a.c.dataset.busy);
});
test('PSG views reuse the same snapshot, preserve null scores and label delay',async()=>{
const h=harness(),a=h.card('psg','w','sport','psg');await h.click(a,'load');assert.ok(h.fetches[0].includes('resource=football-psg'));assert.ok(a.body.innerHTML.includes('Paris Saint-Germain'));assert.ok(h.dialogs.get('sports-dialog').innerHTML.includes('Scores différés'));
await h.click(a,'view',null,'results');assert.equal(h.fetches.length,1);assert.ok(h.dialogs.get('sports-dialog').innerHTML.includes('<b>—</b>'));assert.ok(!a.body.innerHTML.includes('sports-summary'));
const b=h.card('france','w','sport','france');await h.click(b,'load');assert.ok(h.fetches[1].includes('resource=football-france'));
});

test('F1 views: one gateway resource per view, follow reuses standings, no ESPN outside a race weekend',async()=>{
const h=harness(),a=h.card('f','l','sport','f1');a.tile.data.view='standings';
await h.click(a,'load');
assert.ok(h.fetches[0].includes('resource=f1-standings'));assert.ok(a.body.innerHTML.includes('sports-glance'));
await h.click(a,'view',null,'follow');
assert.equal(h.fetches.filter(u=>u.includes('f1-standings')).length,1);assert.ok(h.fetches.some(u=>u.includes('f1-results')));
await h.click(a,'view',null,'calendar');
assert.ok(!h.fetches.some(u=>u.includes('f1-live')));
});

test('switching views in the dialog refreshes the original tile face and uses its own size',async()=>{
const h=harness(),home=h.card('f','t','sport','f1');home.tile.data.view='standings';
await h.click(home,'load');const before=home.body.innerHTML;assert.ok(before.includes('CLASSEMENT PILOTES'));
const dialogCopy={isConnected:true,dataset:{widget:'sport',widgetId:'f',widgetSize:'l'},querySelector:q=>q==='.w-body'?{innerHTML:'',querySelector:()=>null}:{textContent:''}};
await h.click({c:dialogCopy},'view',null,'teams');
assert.ok(home.body.innerHTML.includes('CLASSEMENT ÉCURIES'));assert.notEqual(home.body.innerHTML,before);
});
test('follow view waits out the shared Jolpica cooldown instead of racing the second request',async()=>{
const h=harness(),a=h.card('w','l','sport','f1');a.tile.data.view='follow';
await h.click(a,'load');
const order=h.fetches.map(u=>u.match(/resource=([a-z0-9-]+)/)[1]);
assert.deepEqual(order.slice(0,2),['f1-standings','f1-results']);
});
