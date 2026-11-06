const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../assets/widgets.js'),'utf8');
const window={};
vm.runInNewContext(code,{window,document:{currentScript:{src:'https://example.test/assets/widgets.js'}},location:{href:'https://example.test/'},URL,Map});
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
