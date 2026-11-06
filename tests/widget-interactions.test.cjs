const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/widgets.js'),'utf8');
function harness(fail=false){
const listeners={},players=[],fetches=[];
const window={addEventListener(){}},document={currentScript:{src:'https://example.test/assets/widgets.js'},addEventListener:(name,fn)=>listeners[name]=fn,hidden:false};
class Audio{constructor(){players.push(this)}async play(){this.started=true}pause(){this.paused=true}removeAttribute(){this.src=''}load(){this.released=true}addEventListener(){}}
const items=Array.from({length:12},(_,i)=>({name:'Station '+i,url:'https://example.test/'+i,country:'FR',codec:'MP3',bitrate:128}));
vm.runInNewContext(source,{window,document,URL,Map,Audio,AbortController,setTimeout,clearTimeout,location:{href:'https://example.test/'},fetch:async url=>{fetches.push(url);return {ok:!fail,json:async()=>fail?{ok:false,retryAfter:3600}:{ok:true,items,source:'Fixture',updatedAt:'2026-11-06T12:00:00Z'}}}});
const cards=new Map();
window.TilesWidgets.bind(id=>cards.get(id).tile,()=>true);
function card(id,size='s'){
const status={textContent:''},button={disabled:false},body={innerHTML:'',querySelector:()=>button};
const c={isConnected:true,dataset:{widget:'radio',widgetId:id,widgetSize:size},querySelector:s=>s==='.w-body'?body:status};
cards.set(id,{tile:{id,data:{genre:'gospel'}},c,status,body,button});return cards.get(id);
}
async function click(c,action,index){const b={dataset:{wAction:action,index:String(index)},closest:()=>c.c};return listeners.click({target:{closest:()=>b}})}
return {card,click,fetches,players,listeners,document,api:window.TilesWidgets};
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
