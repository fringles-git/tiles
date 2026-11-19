const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../../public/assets/js/widgets.js'),'utf8');
const window={};
vm.runInNewContext(code,{window,document:{currentScript:{src:'https://example.test/assets/js/widgets.js'}},location:{href:'https://example.test/'},URL,Map});
const api=window.TilesWidgets;
const F=(k,l,t,o)=>({k,l,t,o});
test('three editable types with every existing size',()=>{
const defs=api.definitions(F);assert.deepEqual(Object.keys(defs),['radio','sport','atlas']);
for(const [type,def] of Object.entries(defs))for(const size of ['s','w','t','l','bar']){
const html=def.render(def.def,{id:'demo',size});assert.ok(html.includes('data-widget="'+type+'"'));assert.ok(html.includes('data-widget-size="'+size+'"'));assert.ok(!html.includes('<iframe'));assert.ok(!html.includes('<audio'));assert.ok(!html.includes('<script'));assert.equal(def.interactive,true);
}});
test('size controls detail, never API request size',()=>assert.deepEqual(['bar','s','w','t','l'].map(api.sizeCount),[1,1,3,5,8]));
test('titles are escaped',()=>{const html=api.definitions(F).radio.render({title:'<img onerror=alert(1)>'},{id:'test',size:'s'});assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));});
test('coordinates and media protocols validated',()=>{assert.equal(api.coord('999',-85,85,48),48);assert.equal(api.coord('',-85,85,48),48);assert.equal(api.coord('0',-85,85,48),0);assert.equal(api.https('javascript:alert(1)'), '');assert.equal(api.https('http://example.test/'), '');});

test('next session selects published practice before race and ignores past dates',()=>{const races=[{name:'Test GP',sessions:[{name:'Past',date:'2000-01-01',time:'12:00:00Z'},{name:'Course',date:'2099-01-03',time:'12:00:00Z'},{name:'Essais 1',date:'2099-01-01',time:'09:00:00Z'}]}];const next=api.nextSession(races,Date.parse('2098-12-31T00:00:00Z'));assert.equal(next.name,'Essais 1');assert.equal(next.race,'Test GP');assert.equal(api.nextSession(races,Date.parse('2100-01-01T00:00:00Z')),null);const unknown=api.nextSession([{name:'GP',sessions:[{name:'Qualifying',date:'2099-01-02',time:''}]}],0);assert.equal(unknown.time,'');});

test('F1 follow parsing rejects malformed ids and keeps the previous default',()=>{
assert.deepEqual({...api.parseFollow('team:mercedes')},{type:'team',id:'mercedes'});
assert.deepEqual({...api.parseFollow('driver:../x')},{type:'driver',id:'max_verstappen'});
assert.deepEqual({...api.parseFollow('')},{type:'driver',id:'max_verstappen'});
});
test('ESPN is only relevant inside a race weekend window',()=>{
const races=[{name:'GP',sessions:[{date:'2026-11-20',time:'00:30:00Z'},{date:'2026-11-22',time:'04:00:00Z'}]}];
const at=s=>Date.parse(s);
assert.equal(api.f1Weekend(races,at('2026-11-19T00:00:00Z')),null);
assert.ok(api.f1Weekend(races,at('2026-11-19T23:00:00Z')));
assert.ok(api.f1Weekend(races,at('2026-11-22T06:00:00Z')));
assert.equal(api.f1Weekend(races,at('2026-11-22T08:00:00Z')),null);
});
test('F1 rows scale with the size count and never build markup',()=>{
const items=Array.from({length:12},(_,i)=>({position:String(i+1),code:'<b>'+i,name:'N'+i,points:String(100-i)}));
const rows=api.f1Rows({view:'standings',items},8);
assert.equal(rows.length,8);assert.equal(api.f1Rows({view:'standings',items},1).length,1);
assert.equal(rows[0][0],'P1');
const follow=api.f1Rows({view:'follow',follow:{type:'driver',id:'d1'},items:[{id:'d0',position:'1',points:'100',wins:'3'},{id:'d1',position:'2',code:'D1',name:'D',points:'90',wins:'1',team:'T'}],last:{items:[{results:[{driverId:'d1',position:'4'}]}]}},6);
assert.deepEqual([...follow.map(r=>r[1])],['D1','Victoires','Écart leader','Devant','Dernier GP','Écurie']);
assert.equal(follow[2][2],'−10');assert.equal(follow[4][2],'P4');
assert.equal(api.f1Rows({view:'follow',follow:{type:'team',id:'zz'},items:[{id:'a',points:'1'}]},1)[0][1],'Suivi introuvable');
});
test('live session row appears only when ESPN reports an in-progress session',()=>{
const items=[{name:'GP',sessions:[{name:'Essais 1',date:'2099-01-01',time:'09:00:00Z'}]}];
const idle=api.f1Rows({view:'calendar',items,live:{items:[{name:'FP1',state:'pre'}],updatedAt:'2099-01-01T09:00:00Z'}},3);
assert.ok(!idle.some(r=>r[0]==='●'));
const live=api.f1Rows({view:'calendar',items,live:{items:[{name:'FP1',state:'in'}],updatedAt:'2099-01-01T09:00:00Z'}},3);
assert.equal(live[0][0],'●');assert.ok(live[0][1].includes('FP1'));
});

test('stale or old ESPN snapshots never produce an in-progress row',()=>{
const items=[{name:'GP',sessions:[{name:'Essais 1',date:'2099-01-01',time:'09:00:00Z'}]}];
const rows=live=>api.f1Rows({view:'calendar',items,live},3).some(r=>r[0]==='●');
assert.equal(rows({items:[{name:'FP1',state:'in'}],updatedAt:'2099-01-01T09:00:00Z'}),true);
assert.equal(rows({stale:true,items:[{name:'FP1',state:'in'}],updatedAt:'2099-01-01T09:00:00Z'}),false);
assert.equal(rows({items:[{name:'FP1',state:'in'}],updatedAt:'2020-01-01T09:00:00Z'}),false);
assert.equal(rows({items:[{name:'FP1',state:'in'}],updatedAt:'not a date'}),false);
});
