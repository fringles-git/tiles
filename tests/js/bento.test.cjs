const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../public/assets/js/bento.js'),'utf8'),{window,Intl,Date});const b=window.TilesBento;
const F=(k,l,t='text',o)=>({k,l,t,o});
const types=()=>{const T={};b.enhance(T,F);return T;};

test('rows: "label | value" per line, extra pipes stay in the value, blank labels dropped',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(b.rows('A | 1\n\n | x\nB|deux | trois\nC'))),[['A','1'],['B','deux | trois'],['C','']]);
});
test('pct clamps to 0..100 and accepts a French decimal comma',()=>{
 assert.equal(b.pct('72'),72);assert.equal(b.pct('72,6'),73);assert.equal(b.pct('140'),100);assert.equal(b.pct('-3'),0);assert.equal(b.pct('abc'),0);assert.equal(b.pct(undefined),0);
});
test('new blocks escape every author string',()=>{
 const T=types(),x='<img src=x onerror=alert(1)>';
 for(const [k,d] of Object.entries({faq:{title:x,items:`${x} | ${x}`},progress:{title:x,items:`${x} | 50`},steps:{title:x,items:`${x} | ${x}`},clock:{place:x,tz:'Europe/Paris'}})){
  assert.doesNotMatch(T[k].render(d),/<img/,k);
 }
});
test('FAQ uses native details/summary, never a heading inside summary',()=>{
 const html=types().faq.render({title:'FAQ',items:'Q1 | R1\nQ2 | R2'});
 assert.equal((html.match(/<details>/g)||[]).length,2);assert.match(html,/<summary>Q1<\/summary><p>R1<\/p>/);assert.doesNotMatch(html,/<summary><h\d/);
});
test('progress shows the percentage as text and hides the decorative bar',()=>{
 const html=types().progress.render({title:'Niveaux',items:'PHP | 80'});
 assert.match(html,/<b>80 %<\/b>/);assert.match(html,/class="pbar" aria-hidden="true"><i style="--p:0.8">/);
});
test('new block types register with a category, defaults and flow height',()=>{
 const T=types();for(const k of ['faq','progress','steps','clock']){assert.ok(T[k].label&&T[k].cat&&T[k].def&&T[k].fields.length,k);}
 for(const k of ['faq','progress','steps'])assert.equal(T[k].flow,true);
 assert.equal(T.faq.interactive,true,'FAQ is not a link so summaries stay clickable');
});
test('zone offsets follow DST and visitor-relative text is French',()=>{
 const winter=new Date('2026-01-15T12:00:00Z'),summer=new Date('2026-07-15T12:00:00Z');
 assert.equal(b.zoneOffset('Europe/Paris',winter),60);assert.equal(b.zoneOffset('Europe/Paris',summer),120);
 assert.equal(b.zoneOffset('America/Martinique',summer),-240);assert.equal(b.zoneOffset('UTC',summer),0);
 assert.equal(b.fmtOffset(60),'UTC+1');assert.equal(b.fmtOffset(-240),'UTC−4');assert.equal(b.fmtOffset(330),'UTC+5:30');
 assert.equal(b.relative(60,60),'Même heure que vous');assert.equal(b.relative(120,60),'1 h de plus que vous');assert.equal(b.relative(-240,60),'5 h de moins que vous');assert.equal(b.relative(90,60),'30 min de plus que vous');
});
test('clock falls back to Paris for an unknown zone and reports day or night',()=>{
 const c=b.clockParts({tz:'Mars/Olympus'},new Date('2026-07-15T12:00:00Z'),120);
 assert.equal(c.tz,'Europe/Paris');assert.equal(c.time,'14:00');assert.equal(c.day,true);assert.equal(c.relative,'Même heure que vous');
 assert.equal(b.clockParts({tz:'Europe/Paris'},new Date('2026-07-15T23:00:00Z'),120).day,false);
 for(const [tz] of b.ZONES)assert.ok(b.zoneTime(tz),tz);
});
test('figures: prefix, thousands separator, decimals and suffix survive the count-up',()=>{
 const f=b.parseFigure('1 200+');assert.equal(f.value,1200);assert.equal(b.formatFigure(f,1200),'1 200+');assert.equal(b.formatFigure(f,0),'0+');
 const g=b.parseFigure('3,5k');assert.equal(g.value,3.5);assert.equal(b.formatFigure(g,3.5),'3,5k');assert.equal(b.formatFigure(g,1),'1,0k');
 const h=b.parseFigure('≈ 95 %');assert.equal(h.prefix,'≈ ');assert.equal(b.formatFigure(h,95),'≈ 95 %');
 assert.equal(b.parseFigure('–'),null);assert.equal(b.parseFigure(''),null);
});
test('view-transition names are valid idents even for ids starting with a digit',()=>{
 assert.equal(b.tileName('0ry1y9r'),'tile-0ry1y9r');assert.equal(b.tileName('a"b c'),'tile-abc');
});
test('transition runs the update immediately when the API is missing',()=>{
 const w={};let ran=0;const document={getElementById:()=>null,body:{classList:{contains:()=>false}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../public/assets/js/bento.js'),'utf8'),{window:w,Intl,Date,document});
 w.TilesBento.transition(()=>ran++);assert.equal(ran,1);
});
const load=ctx=>{const w={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../public/assets/js/bento.js'),'utf8'),{window:w,Intl,Date,...ctx});return w.TilesBento;};
const fakeTile=(id,top)=>({dataset:{id},style:{},classList:new Set(),getBoundingClientRect:()=>({top,bottom:top+200}),_props:{},
 setProperty(){}});
test('view-transition names only go to tiles near the viewport',()=>{
 const m=load({innerHeight:800});const tiles=[fakeTile('a',0),fakeTile('b',1100),fakeTile('c',3000),fakeTile('d',-900)];
 m.nameTiles({querySelectorAll:()=>tiles},true);
 assert.deepEqual(tiles.map(t=>t.style.viewTransitionName),['tile-a','tile-b','','']);
 m.nameTiles({querySelectorAll:()=>tiles},false);assert.ok(tiles.every(t=>t.style.viewTransitionName===''));
});
test('intro: first screen only, once per session, never in the editor',()=>{
 const store={};const sessionStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}};
 const body={classList:{contains:c=>c==='is-public'}};
 const mk=()=>{const t=[0,300,900,1600].map((y,i)=>{const el=fakeTile('t'+i,y);el.classList={list:new Set(),add(c){this.list.add(c)},remove(c){this.list.delete(c)}};el.style={setProperty(k,v){el.style[k]=v}};return el});return t;};
 const m=load({innerHeight:800,sessionStorage,document:{body},setTimeout:()=>0,matchMedia:()=>({matches:false})});
 const a=mk();m.intro({querySelectorAll:()=>a});
 assert.deepEqual(a.map(t=>t.classList.list.has('rise')),[true,true,false,false]);assert.equal(a[1].style['--i'],1);
 const b=mk();m.intro({querySelectorAll:()=>b});assert.ok(b.every(t=>!t.classList.list.has('rise')),'second load of the session stays still');
 const e=load({innerHeight:800,sessionStorage:{getItem:()=>null,setItem(){}},document:{body:{classList:{contains:()=>false}}},matchMedia:()=>({matches:false})});
 const c=mk();e.intro({querySelectorAll:()=>c});assert.ok(c.every(t=>!t.classList.list.has('rise')));
});
test('tab indicator: no-op without observers, follows aria-current otherwise',()=>{
 load({}).tabIndicator({});
 let mo,ro,frames=[];const props={},cls=new Set();
 const a={offsetLeft:120,offsetTop:2,offsetWidth:90,offsetHeight:44};
 const nav={hidden:false,querySelector:()=>a,style:{setProperty:(k,v)=>{props[k]=v}},classList:{contains:c=>cls.has(c),add:c=>cls.add(c),remove:c=>cls.delete(c)}};
 const m=load({MutationObserver:class{constructor(f){mo=f}observe(){}},ResizeObserver:class{constructor(f){ro=f}observe(){}},requestAnimationFrame:f=>frames.push(f),document:{}});
 m.tabIndicator(nav);const flush=()=>{while(frames.length)frames.shift()()};flush();
 assert.deepEqual(props,{'--tab-x':'120px','--tab-y':'2px','--tab-w':'90px','--tab-h':'44px'});assert.ok(cls.has('has-ind'));
 nav.hidden=true;mo();flush();assert.ok(!cls.has('has-ind'),'hidden nav (editor) drops the indicator');
});
/* Prelude of the block that encloses position i (walks back over balanced braces). */
const enclosing=(css,i)=>{let d=0;for(let k=i;k>=0;k--){if(css[k]==='}')d++;else if(css[k]==='{'){if(d===0)return css.slice(css.lastIndexOf('}',k)+1,k);d--;}}return '';};
test('motion CSS: every animation is opt-in and the reveal is progressive',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../../public/assets/css/bento.css'),'utf8');
 assert.match(css,/@supports \(animation-timeline:view\(\)\)\{\s*@media screen and \(prefers-reduced-motion:no-preference\)/);
 for(const sel of ['.grid .tile.rise{animation','::backdrop{opacity:0;transition','.hub-universes.has-ind::before{transition']){
  const i=css.indexOf(sel);assert.ok(i>0,sel);assert.match(enclosing(css,i),/prefers-reduced-motion:no-preference/,sel);
 }
 assert.match(css,/@starting-style\{\s*:is\(\.project-dialog,\.explore-dialog,\.sports-dialog\)\[open\]/);
 assert.match(css,/forced-colors:active\)\{\.hub-universes::before\{display:none\}/);
});
