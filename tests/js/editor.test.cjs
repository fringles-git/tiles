const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../public/assets/js/editor.js'),'utf8'),{window});const ed=window.TilesEditor;
const clock=()=>{let t=0;const f=()=>t;f.add=ms=>{t+=ms};return f;};

test('undo/redo walks back and forth through recorded states',()=>{
 const now=clock(),h=ed.history({now});h.reset('a');
 now.add(2000);assert.equal(h.record('b'),true);now.add(2000);h.record('c');
 assert.equal(h.undo(),'b');assert.equal(h.undo(),'a');assert.equal(h.undo(),null);assert.equal(h.canUndo(),false);
 assert.equal(h.redo(),'b');assert.equal(h.redo(),'c');assert.equal(h.redo(),null);
});
test('a typing burst in one field becomes one undo step',()=>{
 const now=clock(),h=ed.history({now,merge:1000});h.reset('');
 now.add(5000);h.record('H','f-title');for(const s of ['He','Hel','Hell','Hello']){now.add(200);h.record(s,'f-title');}
 assert.deepEqual({...h.size()},{past:1,future:0});assert.equal(h.undo(),'');
});
test('quick discrete actions or another field keep their own undo steps',()=>{
 const now=clock(),h=ed.history({now,merge:1000});h.reset('a');
 now.add(100);h.record('resized');now.add(100);h.record('moved');
 now.add(100);h.record('t1','f-title');now.add(100);h.record('d1','f-desc');
 assert.equal(h.size().past,4);assert.equal(h.undo(),'t1');assert.equal(h.undo(),'moved');assert.equal(h.undo(),'resized');
});
test('a new change after undo drops the redo branch; identical states are ignored',()=>{
 const now=clock(),h=ed.history({now});h.reset('a');now.add(2000);h.record('b');h.undo();
 assert.equal(h.record('a'),false,'same as current');assert.equal(h.canRedo(),true);
 now.add(2000);h.record('x');assert.equal(h.canRedo(),false);assert.equal(h.undo(),'a');
});
test('history is bounded',()=>{
 const now=clock(),h=ed.history({now,limit:3});h.reset('0');for(let i=1;i<=10;i++){now.add(2000);h.record(String(i));}
 assert.equal(h.size().past,3);assert.equal(h.undo(),'9');assert.equal(h.undo(),'8');assert.equal(h.undo(),'7');assert.equal(h.undo(),null);
});
test('drop lands after a tile past its middle or in its lower quarter',()=>{
 const r={left:0,top:0,width:100,height:100};
 assert.equal(ed.dropAfter(r,40,40),false);assert.equal(ed.dropAfter(r,60,10),true);assert.equal(ed.dropAfter(r,10,80),true);
});
