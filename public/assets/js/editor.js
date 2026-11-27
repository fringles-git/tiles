/* Tiles · editor-only helpers, loaded on admin.php only.
 * history(): undo/redo of page snapshots, typing bursts merged into one step.
 * touchReorder(): long-press a tile, drag it, release to drop (touch and pen; mice keep native drag). */
(function(){
'use strict';

/* Snapshots are strings so equality is cheap and nothing aliases live state. */
function history({limit=80,merge=1000,now=()=>Date.now()}={}){
 let past=[],future=[],current=null,last=0;
 return {
  reset(state){current=state;past=[];future=[];last=0;},
  /* Returns true when a new undo step was created. */
  record(state){
   if(state===current)return false;
   if(current!==null&&now()-last<merge&&past.length){current=state;future=[];last=now();return false;}
   if(current!==null){past.push(current);if(past.length>limit)past.shift();}
   current=state;future=[];last=now();return current!==null&&past.length>0;
  },
  undo(){if(!past.length)return null;future.push(current);current=past.pop();last=0;return current;},
  redo(){if(!future.length)return null;past.push(current);current=future.pop();last=0;return current;},
  canUndo:()=>past.length>0,
  canRedo:()=>future.length>0,
  size:()=>({past:past.length,future:future.length})
 };
}

/* Where a drop lands relative to a target tile: after it when the pointer is past its horizontal
 * middle or in its lower quarter (same rule as the mouse drag in app.js). */
const dropAfter=(rect,x,y)=>(x-rect.left)>rect.width/2||(y-rect.top)>rect.height*.75;

/* Long-press reorder for touch. onDrop(fromId,toId,after) mutates and re-renders; onAnnounce(text). */
function touchReorder({grid,isEditing,onDrop,onAnnounce=()=>{},delay=420,slop=8}){
 let timer=0,start=null,drag=null,frame=0,suppressClick=false;
 const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clearMarkers=()=>grid.querySelectorAll('.tile.drop').forEach(t=>t.classList.remove('drop'));
 function cancelPress(){clearTimeout(timer);timer=0;start=null;}
 function end(commit){
  if(!drag)return;cancelAnimationFrame(frame);frame=0;
  const {tile,target,after,id}=drag;drag=null;
  tile.classList.remove('lifting');tile.style.translate='';tile.style.removeProperty('--lift-scroll');
  document.documentElement.classList.remove('is-reordering');clearMarkers();
  if(commit&&target&&target.dataset.id!==id){onDrop(id,target.dataset.id,after);}
  else if(!commit)onAnnounce('Déplacement annulé');
 }
 function pickTarget(x,y){
  const under=document.elementFromPoint(x,y);const t=under&&under.closest('.tile');
  clearMarkers();
  if(!t||!grid.contains(t)||t===drag.tile){drag.target=null;return;}
  drag.target=t;drag.after=dropAfter(t.getBoundingClientRect(),x,y);t.classList.add('drop');
 }
 function autoScroll(){
  if(!drag)return;const edge=72,h=innerHeight,y=drag.y;
  const v=y<edge?-(edge-y):y>h-edge?(y-(h-edge)):0;
  if(v){scrollBy(0,Math.max(-24,Math.min(24,v/3)));move(drag.x,drag.y);}
  frame=requestAnimationFrame(autoScroll);
 }
 function move(x,y){
  drag.x=x;drag.y=y;
  drag.tile.style.translate=`${x-drag.x0}px ${y-drag.y0+(scrollY-drag.s0)}px`;
  pickTarget(x,y);
 }
 grid.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'||!isEditing()||e.button!==0)return;
  const tile=e.target.closest('.tile');if(!tile||e.target.closest('.tb,button,a,input,textarea,select'))return;
  tile.draggable=false;/* Android Chrome would otherwise start a native drag on long press. */
  cancelPress();start={x:e.clientX,y:e.clientY,id:e.pointerId,tile};
  timer=setTimeout(()=>{
   if(!start)return;
   drag={tile:start.tile,id:start.tile.dataset.id,pointer:start.id,x0:start.x,y0:start.y,x:start.x,y:start.y,s0:scrollY,target:null,after:false};start=null;
   drag.tile.classList.add('lifting');document.documentElement.classList.add('is-reordering');
   if(navigator.vibrate&&!reducedMotion())navigator.vibrate(12);
   onAnnounce('Bloc saisi. Glisser puis relâcher pour le déposer.');
   frame=requestAnimationFrame(autoScroll);
  },delay);
 });
 /* Non-passive so the page does not scroll while a tile is lifted. */
 grid.addEventListener('touchmove',e=>{if(drag)e.preventDefault();},{passive:false});
 grid.addEventListener('contextmenu',e=>{if(isEditing()&&(drag||start))e.preventDefault();});
 document.addEventListener('pointermove',e=>{
  if(start&&e.pointerId===start.id&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>slop)cancelPress();
  if(drag&&e.pointerId===drag.pointer)move(e.clientX,e.clientY);
 });
 document.addEventListener('pointerup',e=>{if(start&&e.pointerId===start.id)cancelPress();if(drag&&e.pointerId===drag.pointer){suppressClick=true;end(true);setTimeout(()=>{suppressClick=false},400);}});
 document.addEventListener('pointercancel',e=>{if(start&&e.pointerId===start.id)cancelPress();if(drag&&e.pointerId===drag.pointer)end(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag)end(false);});
 /* The release must not also open the tile editor. */
 grid.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
}

window.TilesEditor={history,touchReorder,dropAfter};
})();
